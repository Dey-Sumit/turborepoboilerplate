import {useRef} from 'react';
import {temporal} from 'zundo';
import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import {immer} from 'zustand/middleware/immer';
import {compositionState as CompositionState} from '../editor/state/types';
import {EditorStarterItem} from '../editor/items/item-type';
import {changeItem} from '../editor/state/actions/change-item';
import {
	findCompositeInHierarchy,
	getCurrentCompositeId,
	getCurrentTimeline,
} from '../editor/state/helpers/get-current-timeline';
// Commented out - projects now load from Dexie IndexedDB
// import {loadState} from '../editor/state/persistance';
import {EditorState} from '../editor/state/types';
import {getCompositionDuration} from '../editor/utils/get-composition-duration';
import useUIStore from './ui-store';

/**
 * Deep equality check for compositionState to prevent spurious undo points.
 * Zundo uses this to determine if state actually changed.
 */
const isCompositionStateEqual = (
	a: {compositionState: CompositionState} | null,
	b: {compositionState: CompositionState} | null,
): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;

	const stateA = a.compositionState;
	const stateB = b.compositionState;

	// Quick reference check
	if (stateA === stateB) return true;

	// Compare primitive values first (fast checks)
	if (
		stateA.fps !== stateB.fps ||
		stateA.compositionWidth !== stateB.compositionWidth ||
		stateA.compositionHeight !== stateB.compositionHeight
	) {
		return false;
	}

	// Compare tracks length
	if (stateA.tracks.length !== stateB.tracks.length) {
		return false;
	}

	// Compare items count
	const itemKeysA = Object.keys(stateA.items);
	const itemKeysB = Object.keys(stateB.items);
	if (itemKeysA.length !== itemKeysB.length) {
		return false;
	}

	// Compare assets count
	const assetKeysA = Object.keys(stateA.assets);
	const assetKeysB = Object.keys(stateB.assets);
	if (assetKeysA.length !== assetKeysB.length) {
		return false;
	}

	// Deep compare using JSON stringify (simple but effective for our use case)
	// This handles nested objects, arrays, and all item properties
	try {
		return JSON.stringify(stateA) === JSON.stringify(stateB);
	} catch {
		// Fallback to false if stringify fails (shouldn't happen)
		return false;
	}
};

type EditorActions = {
	// Immer-pattern state updater - for actions that mutate directly
	// Use temporal.pause()/resume() to control undo tracking
	// Optional actionName parameter for devtools labeling
	setState: (updater: (draft: EditorState) => void, actionName?: string) => void;
	// Specific actions - Zustand best practice

	updateItem: (
		itemId: string,
		updater: (item: EditorStarterItem) => EditorStarterItem,
		actionName?: string,
	) => void;
};

type EditorStore = EditorState & EditorActions;

/**
 * Default navigation stack - always start at root timeline
 */
const DEFAULT_TIMELINE_VIEW_STACK = [{type: 'ROOT' as const}];

/**
 * Get initial editor state with defaults
 * Project data is loaded from Dexie IndexedDB via the editor route,
 * which sets compositionState via setState before the editor mounts.
 */
const getInitialEditorState = (): Omit<EditorState, keyof EditorActions> => {
	// Commented out localStorage loading - projects now load from Dexie
	// const loadedState = loadState();
	// if (loadedState) { ... }

	// Default empty state - will be populated by editor route when loading a project
	return {
		compositionState: {
			tracks: [],
			items: {},
			assets: {},
			fps: 30,
			compositionWidth: 1080,
			compositionHeight: 1920,
			deletedAssets: [],
			timelineViewStack: DEFAULT_TIMELINE_VIEW_STACK,
		},
		// textItemEditing: MIGRATED TO ZUSTAND UI STORE
		// textItemHoverPreview: MIGRATED TO ZUSTAND UI STORE
		renderingTasks: [],
		captioningTasks: [],
		sceneCaptioningTasks: [],
		initialized: false,
		assetStatus: {},
	};
};

const useEditorStore = create<EditorStore>()(
	devtools(
		immer(
			temporal(
				(set) => ({
					// ============================================
					// STATE - Initialized from localStorage or defaults
					// ============================================
					...getInitialEditorState(),

					// ============================================
					// ACTIONS
					// ============================================

					/**
					 * setState - for Immer-pattern actions (direct mutation)
					 * Actions should mutate the draft directly and NOT return anything
					 * Use temporal.pause()/resume() to control undo tracking
					 *
					 * @param updater - Function that mutates the draft state
					 * @param actionName - Optional name for devtools (e.g., 'addItem', 'deleteItems')
					 */
					setState: (
						updater: (draft: EditorState) => void,
						actionName?: string,
					) => {
						set(
							(draft) => {
								updater(draft);
							},
							undefined,
							actionName ?? 'EditorStore.setState',
						);
					},

					/**
					 * Update a specific item by ID
					 * Use temporal.pause()/resume() to control undo tracking
					 *
					 * @param itemId - ID of the item to update
					 * @param updater - Function that returns the updated item
					 * @param actionName - Optional name for devtools (e.g., 'updateOpacity', 'updatePosition')
					 */
					updateItem: (
						itemId: string,
						updater: (item: EditorStarterItem) => EditorStarterItem,
						actionName?: string,
					) => {
						set(
							(draft) => {
								changeItem(draft, itemId, updater);
							},
							undefined,
							actionName ?? 'EditorStore.updateItem',
						);
					},
				}),
				{
					// Temporal options - only track compositionState for undo/redo
					// This excludes UI state (migrated to ui-store) and task state like renderingTasks, etc.
					partialize: (state) => ({
						compositionState: state.compositionState,
					}),
					// Deep equality check to prevent spurious undo points
					// Without this, Immer creates new objects on every set() call
					equality: isCompositionStateEqual,
					// Limit undo history to 50 steps to prevent memory issues
					limit: 50,
					// Wrap temporal store with devtools for debugging undo/redo/pause/resume
					wrapTemporal: (storeInitializer) =>
						devtools(storeInitializer, {name: 'EditorTemporal'}),
				},
			),
		),
		{name: 'EditorStore'},
	),
);

// ============================================
// CLEANUP AFTER UNDO/REDO
// ============================================

/**
 * Subscribe to temporal state changes to clean up stale references.
 * When undo/redo removes an item, we need to clear UI state
 * (textItemEditing, selectedItems, etc.) if they reference deleted items.
 */
useEditorStore.temporal.subscribe((temporalState, prevTemporalState) => {
	// Only run cleanup when pastStates or futureStates change (undo/redo happened)
	if (
		temporalState.pastStates.length === prevTemporalState.pastStates.length &&
		temporalState.futureStates.length === prevTemporalState.futureStates.length
	) {
		return;
	}

	const currentState = useEditorStore.getState();
	const items = getCurrentTimeline(currentState.compositionState).items;

	// Cache ui-store state to avoid multiple getState() calls
	const uiState = useUIStore.getState();

	// Clean up textItemEditing if the item no longer exists (UI store)
	const textItemEditing = uiState.textItemEditing;
	if (textItemEditing && !items[textItemEditing]) {
		uiState.setTextItemEditing(null);
	}

	// Clean up selectedItems if any items no longer exist
	const selectedItems = uiState.selectedItems;
	const validSelectedItems = selectedItems.filter((id) => items[id]);
	if (validSelectedItems.length !== selectedItems.length) {
		uiState.setSelectedItems(validSelectedItems);
	}

	// Clean up itemSelectedForCrop if the item no longer exists
	const itemSelectedForCrop = uiState.itemSelectedForCrop;
	if (itemSelectedForCrop && !items[itemSelectedForCrop]) {
		uiState.setItemSelectedForCrop(null);
	}

	// Clean up isDraggingInTimeline for all items after undo/redo
	// This UI state should always be false after undo/redo operations
	const itemsWithDragging = Object.values(items).filter(
		(item) => item.isDraggingInTimeline,
	);
	if (itemsWithDragging.length > 0) {
		console.log(
			'[UNDO/REDO CLEANUP] Resetting isDraggingInTimeline for items:',
			itemsWithDragging.map((i) => i.id),
		);
		useEditorStore.temporal.getState().pause();
		useEditorStore.setState((draft) => {
			const timeline = getCurrentTimeline(draft.compositionState);
			Object.values(timeline.items).forEach((item) => {
				if (item.isDraggingInTimeline) {
					item.isDraggingInTimeline = false;
				}
			});
		});
		useEditorStore.temporal.getState().resume();
	}
});

// ============================================
// SELECTORS
// ============================================

/**
 * Get the duration of the composition in frames
 * Computed from all items in the timeline
 * Note: This freezes the duration during trim operations to prevent timeline jumping
 */
export const useDurationInFrames = () => {
	const isItemBeingTrimmed = useUIStore(
		(uiState) => uiState.itemsBeingTrimmed.length > 0,
	);

	// Get duration from current timeline context (could be inside a composite)
	const durationInFrames = useEditorStore((state) => {
		// If inside a composite, use the composite's durationInFrames
		const compositeId = getCurrentCompositeId(state.compositionState);
		if (compositeId) {
			const composite = findCompositeInHierarchy(state, compositeId);
			if (composite) {
				return composite.durationInFrames;
			}
		}

		// At root level, calculate from items
		const timeline = getCurrentTimeline(state.compositionState);
		return getCompositionDuration(timeline.items, timeline.tracks);
	});

	const lastDurationWhileNotTrimming = useRef(durationInFrames);
	if (!isItemBeingTrimmed) {
		lastDurationWhileNotTrimming.current = durationInFrames;
	}

	return lastDurationWhileNotTrimming.current;
};

export default useEditorStore;
