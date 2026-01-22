/**
 * Selector infrastructure for performance optimization
 *
 * Provides "virtual slices" of state to prevent unnecessary re-renders:
 * - Timeline slice: Only 6 properties per item
 * - Canvas slice: Only 10 visual properties per item
 * - Selection Set: O(1) lookups instead of O(n)
 */

// Types
export type {TimelineItemData} from './types';

// Base selectors
export {
	selectAllItems,
	selectAllTracks,
	selectItemIds,
	selectCompositionState,
	selectCurrentTimeline,
} from './base-selectors';

// Selection set selectors
export {
	selectSelectedItemsSet,
	createIsItemSelectedSelector,
} from './selection-set-selector';

// Timeline selectors
export {
	selectTimelineItems,
	createSelectTimelineItem,
	selectTimelineItemsArray,
	createSelectTimelineItemsByTrack,
	selectTimelineItemCount,
	selectTimelineItemsSortedByFrame,
} from './timeline-selectors';


// React hooks - Timeline
export {
	useTimelineItems,
	useTimelineItem,
	useTimelineItemsArray,
	useTimelineItemsByTrack,
	useTimelineItemCount,
	useTimelineItemsSortedByFrame,
	useFullItem,
} from './hooks';


