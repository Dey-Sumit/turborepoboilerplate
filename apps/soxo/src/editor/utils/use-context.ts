import {useRef} from 'react';
import useEditorStore from '../../zustand/editor-store';
import useUIStore, {
	useActiveCanvasSnapPoints as useActiveCanvasSnapPointsFromStore,
	useItemSelectedForCrop as useItemSelectedForCropFromStore,
	useLoop as useLoopFromStore,
	useSelectedItems as useSelectedItemsFromStore,
	useTimelineHeight as useTimelineHeightFromStore,
} from '../../zustand/ui-store';
import {EditorStarterAsset} from '../assets/assets';
import {getAssetFromItem} from '../assets/utils';
import {
	getCurrentCompositeId,
	getCurrentTimeline,
} from '../state/helpers/get-current-timeline';
import {getCompositionDuration} from './get-composition-duration';

import {EditorStarterItem} from '../items/item-type';
import {findAssetById} from './find-asset-by-id';
import type {TimelineItemData} from '../selectors/types';

// Migrated to Zustand Editor Store
export const useTimelineContext = () => {
	const isItemBeingTrimmed = useUIStore(
		(uiState) => uiState.itemsBeingTrimmed.length > 0,
	);

	const durationInFrames = useEditorStore((state) => {
		// Get items and tracks from current timeline context (could be inside a composite)
		const timeline = getCurrentTimeline(state.compositionState);
		return getCompositionDuration(timeline.items, timeline.tracks);
	});

	const lastDurationWhileNotTrimming = useRef(durationInFrames);
	if (!isItemBeingTrimmed) {
		lastDurationWhileNotTrimming.current = durationInFrames;
	}

	return {durationInFrames: lastDurationWhileNotTrimming.current};
};

// Migrated to Zustand Editor Store
export const useFps = () => {
	const fps = useEditorStore((state) => state.compositionState.fps);
	return {fps};
};

// Migrated to Zustand UI Store
export const useLoop = () => {
	return useLoopFromStore();
};

// Migrated to Zustand UI Store
export const useTimelineHeight = () => {
	return useTimelineHeightFromStore();
};

/**
 * Returns canvas dimensions for the current navigation context.
 * - At root level: returns the composition dimensions
 * - Inside a composite: returns the composite's original dimensions
 *
 * This ensures items render at the correct positions when editing inside a composite.
 */
export const useDimensions = () => {
	const compositionWidth = useEditorStore(
		(state) => state.compositionState.compositionWidth,
	);
	const compositionHeight = useEditorStore(
		(state) => state.compositionState.compositionHeight,
	);
	return {compositionWidth, compositionHeight};
};

// Migrated to Zustand UI Store
export const useSelectedItems = () => {
	const selectedItems = useSelectedItemsFromStore();
	return {selectedItems};
};

export const useAssets = () => {
	const assets = useEditorStore((state) => state.compositionState.assets);
	return {assets};
};

// Migrated to Zustand Editor Store
export const useAssetStatus = () => {
	const assetStatus = useEditorStore((state) => state.assetStatus);
	return {assetStatus};
};

/**
 * Returns tracks from the current navigation context.
 * - At root level: returns root tracks
 * - Inside a composite: returns that composite's childTimeline tracks
 *
 * This is the primary hook for timeline UI components.
 */
export const useTracks = () => {
	const tracks = useEditorStore((state) => {
		const timeline = getCurrentTimeline(state.compositionState);
		return timeline.tracks;
	});
	return {tracks};
};

/**
 * Returns items from the current navigation context.
 * - At root level: returns root items
 * - Inside a composite: returns that composite's childTimeline items
 *
 * This is the primary hook for timeline UI components.
 */
export const useAllItems = () => {
	const items = useEditorStore((state) => {
		const timeline = getCurrentTimeline(state.compositionState);
		return timeline.items;
	});
	return {items};
};

/**
 * Returns the current composite ID if inside a composite, null if at root.
 */
export const useCurrentCompositeId = () => {
	return useEditorStore((state) =>
		getCurrentCompositeId(state.compositionState),
	);
};

/**
 * Returns a specific item by ID.
 * First checks the current timeline context, then searches the entire hierarchy.
 */
export const useItem = (itemId: string) => {
	const item = useEditorStore((state) => {
		// First try current timeline context
		const timeline = getCurrentTimeline(state.compositionState);
		if (timeline.items[itemId]) {
			return timeline.items[itemId];
		}

		// Fall back to root items (for cases like canvas rendering)
		if (state.compositionState.items[itemId]) {
			return state.compositionState.items[itemId];
		}

		// Search in composite hierarchies
		return findItemInHierarchy(state.compositionState.items, itemId);
	});

	if (!item) {
		throw new Error(`item ${itemId} not found`);
	}

	return item;
};

/**
 * Recursively search for an item in the hierarchy.
 */
function findItemInHierarchy(
	items: Record<string, EditorStarterItem>,
	itemId: string,
): EditorStarterItem | null {
	// Check current level
	if (items[itemId]) {
		return items[itemId];
	}

	// Search in composite children
	for (const item of Object.values(items)) {
		if (item.type === 'composite') {
			const found = findItemInHierarchy(item.childTimeline.items, itemId);
			if (found) return found;
		}
	}

	return null;
}

// Migrated to Zustand Editor Store
export const useCaptionState = () => {
	const captioningTasks = useEditorStore((state) => state.captioningTasks);
	return captioningTasks;
};

// Migrated to Zustand Editor Store
export const useSceneCaptionState = () => {
	const sceneCaptioningTasks = useEditorStore(
		(state) => state.sceneCaptioningTasks,
	);
	return sceneCaptioningTasks;
};

// Migrated to Zustand Editor Store
export const useFullState = () => {
	// Get the entire editor state (compositionState + other state like assetStatus)
	const state = useEditorStore((state) => state);
	return state;
};

// Migrated to Zustand Editor Store
export const useRendering = () => {
	const renderingTasks = useEditorStore((state) => state.renderingTasks);
	return renderingTasks;
};

export const useAssetFromAssetId = (assetId: string): EditorStarterAsset => {
	const {assets} = useAssets();
	const asset = findAssetById(assets, assetId);
	if (!asset) {
		throw new Error('Asset not found');
	}
	return asset;
};

export const useOptionalAssetFromAssetId = (
	assetId: string,
): EditorStarterAsset | null => {
	const {assets} = useAssets();
	const asset = findAssetById(assets, assetId);
	return asset ?? null;
};

export const useAssetIfApplicable = (
	item: EditorStarterItem | TimelineItemData,
): EditorStarterAsset | null => {
	const {assets} = useAssets();

	// TimelineItemData doesn't have assetId, so we need to cast to EditorStarterItem
	// Only EditorStarterItem can have assetId property
	const asset = getAssetFromItem({item: item as EditorStarterItem, assets});

	return asset;
};

export const useAssetFromItem = (
	item: EditorStarterItem,
): EditorStarterAsset => {
	const asset = useAssetIfApplicable(item);
	if (!asset) {
		throw new Error('Asset not found');
	}
	return asset;
};

// Migrated to Zustand UI Store
export const useActiveCanvasSnapPoints = () => {
	const activeCanvasSnapPoints = useActiveCanvasSnapPointsFromStore();
	return {activeCanvasSnapPoints};
};

// Migrated to Zustand UI Store
export const useItemSelectedForCrop = () => {
	return useItemSelectedForCropFromStore();
};
