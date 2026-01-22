import {flushSync} from 'react-dom';
import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import {immer} from 'zustand/middleware/immer';
import {CanvasSnapPoint} from '../editor/canvas/snap/canvas-snap-types';
import {ItemMeta} from '../editor/drag-overlay-provider';
import {EditorStarterItem} from '../editor/items/item-type';
import {TextItemHoverPreview} from '../editor/items/text/override-text-item-with-hover-preview';
import {ItemBeingTrimmed} from '../editor/items/trim-indicator';
import {
	DEFAULT_FAVORITE_FONTS,
	loadFavoriteFonts,
	saveFavoriteFonts,
} from '../editor/state/favorite-fonts-persistence';
import {
	DEFAULT_LOOP,
	loadLoop,
	saveLoop,
} from '../editor/state/loop-persistance';
import {
	DEFAULT_TIMELINE_HEIGHT,
	loadTimelineHeight,
	saveTimelineHeight,
} from '../editor/state/timeline-height-persistance';
import {
	DEFAULT_ZOOM,
	loadZoom,
	saveZoom,
} from '../editor/state/zoom-persistence';
import {
	DEFAULT_SNAPPING_ENABLED,
	loadSnappingEnabled,
	saveSnappingEnabled,
} from '../editor/state/snapping-persistance';
import {TrackType} from '../editor/state/types';
import {DragPreviewState} from '../editor/timeline/drag-preview-provider';
import {SnapPoint} from '../editor/timeline/utils/snap-points';
import {restoreScrollAfterZoom} from '../editor/utils/restore-scroll-after-zoom';

export type EditMode = 'select' | 'draw-solid' | 'create-text';

// Store the entire item for last added item info
export type LastAddedItemInfo = EditorStarterItem | null;

export type UIState = {
	// Selection state
	selectedItems: string[];

	// Timeline panel height (persisted to localStorage)
	timelineHeight: number;

	// Items currently being trimmed/extended
	itemsBeingTrimmed: ItemBeingTrimmed[];

	// Playback loop enabled (persisted to localStorage)
	loop: boolean;

	// Active snap point during timeline dragging/trimming
	activeSnapPoint: SnapPoint | null;

	// Active canvas snap points during canvas item dragging
	activeCanvasSnapPoints: CanvasSnapPoint[];

	// Edit mode for canvas tools
	editMode: EditMode;

	// Drag preview state for timeline dragging
	dragPreview: DragPreviewState | null;

	// Timeline zoom level
	zoom: number;

	// Last added item info (NOT affected by undo/redo)
	lastAddedItem: LastAddedItemInfo;

	// Code editor dialog state - stores the item ID of the code item being edited
	codeEditorOpenForItemId: string | null;

	// Templates dialog open state
	isTemplatesDialogOpen: boolean;

	// Favorite fonts (persisted to localStorage)
	favoriteFonts: string[];

	// Snapping enabled preference (persisted to localStorage)
	isSnappingEnabled: boolean;

	// Crop mode state - which item is being cropped
	itemSelectedForCrop: string | null;

	// Text hover preview - temporary preview of font changes
	textItemHoverPreview: TextItemHoverPreview | null;

	// Text item editing - which text item is currently being edited
	textItemEditing: string | null;

	// Drag overlay state (migrated from Context for performance)
	// When null, no drag is active
	dragOverlay: {
		isDragging: boolean;
		draggedItemIds: string[];
		itemsMeta: ItemMeta[];
		cursorPosition: {x: number; y: number} | null;
		timelineWidth: number;
		visibleFrames: number;
		tracks: TrackType[] | null;
		snappedPositions: Record<string, number> | null;
	} | null;

	// Timeline container width (from ResizeObserver, used for size calculations)
	timelineContainerWidth: number | null;

	// Actions
	setSelectedItems: (ids: string[]) => void;
	clearSelection: () => void;
	addToSelection: (id: string) => void;
	removeFromSelection: (id: string) => void;
	toggleSelection: (id: string) => void;

	setTimelineHeight: (height: number) => void;
	setItemsBeingTrimmed: (items: ItemBeingTrimmed[]) => void;
	setLoop: (loop: boolean) => void;
	setActiveSnapPoint: (snapPoint: SnapPoint | null) => void;
	setActiveCanvasSnapPoints: (snapPoints: CanvasSnapPoint[]) => void;
	setEditMode: (mode: EditMode) => void;
	setDragPreview: (preview: DragPreviewState | null) => void;
	setZoom: (zoom: number | ((prev: number) => number)) => void;
	setLastAddedItem: (info: LastAddedItemInfo) => void;
	setCodeEditorOpenForItemId: (itemId: string | null) => void;
	setTemplatesDialogOpen: (open: boolean) => void;
	toggleFavoriteFont: (fontFamily: string) => void;
	setIsSnappingEnabled: (enabled: boolean) => void;
	setItemSelectedForCrop: (itemId: string | null) => void;
	setTextItemHoverPreview: (preview: TextItemHoverPreview | null) => void;
	setTextItemEditing: (itemId: string | null) => void;

	// Drag overlay actions (migrated from Context)
	setDragOverlay: (
		dragOverlay: UIState['dragOverlay'] | ((prev: UIState['dragOverlay']) => UIState['dragOverlay']),
	) => void;

	// Timeline size actions (migrated from Context)
	setTimelineContainerWidth: (width: number | null) => void;
};

const useUIStore = create<UIState>()(
	devtools(
		immer((set) => ({
			// Initial state
			selectedItems: [],
			timelineHeight: loadTimelineHeight() ?? DEFAULT_TIMELINE_HEIGHT,
			itemsBeingTrimmed: [],
			loop: loadLoop() ?? DEFAULT_LOOP,
			activeSnapPoint: null,
			activeCanvasSnapPoints: [],
			editMode: 'select' as EditMode,
			dragPreview: null,
			zoom: loadZoom() ?? DEFAULT_ZOOM,
			lastAddedItem: null,
			codeEditorOpenForItemId: null,
			isTemplatesDialogOpen: false,
			favoriteFonts: loadFavoriteFonts() ?? DEFAULT_FAVORITE_FONTS,
			isSnappingEnabled: loadSnappingEnabled() ?? DEFAULT_SNAPPING_ENABLED,
			itemSelectedForCrop: null,
			textItemHoverPreview: null,
			textItemEditing: null,
			dragOverlay: null, // Drag overlay state (migrated from Context)
			timelineContainerWidth: null, // Timeline container width (migrated from Context)

			// Selection actions
			setSelectedItems: (ids) =>
				set((draft) => {
					draft.selectedItems = ids;
				}),

			clearSelection: () =>
				set((draft) => {
					draft.selectedItems = [];
				}),

			addToSelection: (id) =>
				set((draft) => {
					if (!draft.selectedItems.includes(id)) {
						draft.selectedItems.push(id);
					}
				}),

			removeFromSelection: (id) =>
				set((draft) => {
					draft.selectedItems = draft.selectedItems.filter((i) => i !== id);
				}),

			toggleSelection: (id) =>
				set((draft) => {
					const index = draft.selectedItems.indexOf(id);
					if (index === -1) {
						draft.selectedItems.push(id);
					} else {
						draft.selectedItems.splice(index, 1);
					}
				}),

			// Timeline height action
			setTimelineHeight: (height) =>
				set((draft) => {
					draft.timelineHeight = height;
					saveTimelineHeight(height);
				}),

			// Items being trimmed action
			setItemsBeingTrimmed: (items) =>
				set((draft) => {
					draft.itemsBeingTrimmed = items;
				}),

			// Loop action
			setLoop: (loop) =>
				set((draft) => {
					draft.loop = loop;
					saveLoop(loop);
				}),

			// Active snap point actions
			setActiveSnapPoint: (snapPoint) =>
				set((draft) => {
					draft.activeSnapPoint = snapPoint;
				}),

			setActiveCanvasSnapPoints: (snapPoints) =>
				set((draft) => {
					draft.activeCanvasSnapPoints = snapPoints;
				}),

			// Edit mode action
			setEditMode: (mode) =>
				set((draft) => {
					draft.editMode = mode;
				}),

			// Drag preview action
			setDragPreview: (preview) =>
				set((draft) => {
					draft.dragPreview = preview;
				}),

			// Zoom action with scroll restoration (persisted to localStorage)
			setZoom: (newZoom) => {
				const restore = restoreScrollAfterZoom();
				let finalZoom!: number;
				flushSync(() => {
					set((draft) => {
						draft.zoom =
							typeof newZoom === 'function' ? newZoom(draft.zoom) : newZoom;
						finalZoom = draft.zoom;
					});
				});
				restore.restore();
				saveZoom(finalZoom);
			},

			// Last added item action
			setLastAddedItem: (info) =>
				set((draft) => {
					draft.lastAddedItem = info;
				}),

			// Code editor dialog action
			setCodeEditorOpenForItemId: (itemId) =>
				set((draft) => {
					draft.codeEditorOpenForItemId = itemId;
				}),

			// Templates dialog action
			setTemplatesDialogOpen: (open) =>
				set((draft) => {
					draft.isTemplatesDialogOpen = open;
				}),

			// Favorite fonts action
			toggleFavoriteFont: (fontFamily) =>
				set((draft) => {
					const index = draft.favoriteFonts.indexOf(fontFamily);
					if (index === -1) {
						draft.favoriteFonts.push(fontFamily);
					} else {
						draft.favoriteFonts.splice(index, 1);
					}
					saveFavoriteFonts(draft.favoriteFonts);
				}),

			// Snapping enabled action
			setIsSnappingEnabled: (enabled) =>
				set((draft) => {
					draft.isSnappingEnabled = enabled;
					saveSnappingEnabled(enabled);
				}),

			// Crop mode action
			setItemSelectedForCrop: (itemId) =>
				set((draft) => {
					draft.itemSelectedForCrop = itemId;
				}),

			// Text item hover preview action
			setTextItemHoverPreview: (preview) =>
				set((draft) => {
					draft.textItemHoverPreview = preview;
				}),

			// Text item editing action
			setTextItemEditing: (itemId) =>
				set((draft) => {
					draft.textItemEditing = itemId;
				}),

			// Drag overlay action (migrated from Context for performance)
			setDragOverlay: (dragOverlay) =>
				set((draft) => {
					draft.dragOverlay =
						typeof dragOverlay === 'function'
							? dragOverlay(draft.dragOverlay)
							: dragOverlay;
				}),

			setTimelineContainerWidth: (width) =>
				set((draft) => {
					draft.timelineContainerWidth = width;
				}),
		})),
		{name: 'UIStore'},
	),
);

// Import selection set selector for performance optimization
import {selectSelectedItemsSet} from '../editor/selectors/selection-set-selector';

// Custom hooks for compatibility with existing context API
export const useSelectedItems = () =>
	useUIStore((state) => state.selectedItems);

/**
 * Optimized hook for checking if items are selected.
 * Returns a Set instead of array for O(1) lookups instead of O(n).
 *
 * Use this when you need to check "is this item selected?" frequently,
 * such as in canvas rendering or timeline item components.
 *
 * Example:
 * ```tsx
 * const selectedSet = useSelectedItemsSet();
 * const isSelected = selectedSet.has(itemId); // O(1) instead of selectedItems.includes(itemId) O(n)
 * ```
 */
export const useSelectedItemsSet = () =>
	useUIStore((state) => selectSelectedItemsSet(state));

export const useTimelineHeight = () =>
	useUIStore((state) => state.timelineHeight);

export const useItemsBeingTrimmed = () =>
	useUIStore((state) => state.itemsBeingTrimmed);

export const useLoop = () => useUIStore((state) => state.loop);

export const useActiveSnapPoint = () =>
	useUIStore((state) => state.activeSnapPoint);

export const useActiveCanvasSnapPoints = () =>
	useUIStore((state) => state.activeCanvasSnapPoints);

export const useEditMode = () => useUIStore((state) => state.editMode);

export const useSetEditMode = () => useUIStore((state) => state.setEditMode);

export const useDragPreview = () => useUIStore((state) => state.dragPreview);

export const useSetDragPreview = () =>
	useUIStore((state) => state.setDragPreview);

export const useZoom = () => useUIStore((state) => state.zoom);

export const useSetZoom = () => useUIStore((state) => state.setZoom);

export const useLastAddedItem = () =>
	useUIStore((state) => state.lastAddedItem);

export const useSetLastAddedItem = () =>
	useUIStore((state) => state.setLastAddedItem);

export const useCodeEditorOpenForItemId = () =>
	useUIStore((state) => state.codeEditorOpenForItemId);

export const useSetCodeEditorOpenForItemId = () =>
	useUIStore((state) => state.setCodeEditorOpenForItemId);

export const useFavoriteFonts = () =>
	useUIStore((state) => state.favoriteFonts);

export const useToggleFavoriteFont = () =>
	useUIStore((state) => state.toggleFavoriteFont);

export const useIsSnappingEnabled = () =>
	useUIStore((state) => state.isSnappingEnabled);

export const useSetIsSnappingEnabled = () =>
	useUIStore((state) => state.setIsSnappingEnabled);

export const useItemSelectedForCrop = () =>
	useUIStore((state) => state.itemSelectedForCrop);

export const useSetItemSelectedForCrop = () =>
	useUIStore((state) => state.setItemSelectedForCrop);

export const useTextItemHoverPreview = () =>
	useUIStore((state) => state.textItemHoverPreview);

export const useSetTextItemHoverPreview = () =>
	useUIStore((state) => state.setTextItemHoverPreview);

export const useTextItemEditing = () =>
	useUIStore((state) => state.textItemEditing);

export const useSetTextItemEditing = () =>
	useUIStore((state) => state.setTextItemEditing);

// Export store for direct access if needed
export default useUIStore;
