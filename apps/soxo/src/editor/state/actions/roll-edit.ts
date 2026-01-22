import {EditorStarterAsset} from '../../assets/assets';
import {ItemSide} from '../../items/trim-indicator';
import {TimelineItemAdjacency} from '../../timeline/timeline-track/timeline-track-rolling-edit';
import {clamp} from '../../utils/clamp';
import {getCurrentItems} from '../helpers/get-current-timeline';
import {EditorState} from '../types';
import {changeItem} from './change-item';
import {
	extendLeft,
	getMinimumFromWhenExtendingLeftBasedOnAsset,
} from './extend-left';
import {
	extendRight,
	getMaximumDurationWhenExtendingRightBasedOnAsset,
} from './extend-right';

// Shift both items at the same time.

export const rollEdit = ({
	state,
	adjacency,
	firstItemInitialFrom,
	firstItemInitialDurationInFrames,
	firstItemIndex,
	trackItemsSorted,
	offsetInFrames,
	firstItemAsset,
	secondItemIndex,
	secondItemInitialDurationInFrames,
	secondItemInitialFrom,
	draggingDirection,
	timelineWidth,
	visibleFrames,
}: {
	state: EditorState;
	adjacency: TimelineItemAdjacency;
	firstItemInitialFrom: number;
	firstItemInitialDurationInFrames: number;
	firstItemIndex: number;
	secondItemInitialFrom: number;
	secondItemInitialDurationInFrames: number;
	secondItemIndex: number;
	firstItemAsset: EditorStarterAsset | null;
	trackItemsSorted: string[];
	offsetInFrames: number;
	draggingDirection: ItemSide;
	timelineWidth: number;
	visibleFrames: number;
}): void => {
	// Get the current timeline items
	const items = getCurrentItems(state);

	const minimumFrom = getMinimumFromWhenExtendingLeftBasedOnAsset({
		fps: state.compositionState.fps,
		prevItem: items[adjacency.next],
	});

	const maxDuration = getMaximumDurationWhenExtendingRightBasedOnAsset({
		asset: firstItemAsset,
		fps: state.compositionState.fps,
		prevItem: items[adjacency.previous],
	});

	const pixelsPerFrame = timelineWidth / visibleFrames;

	const clampedOffsetInFrames = clamp({
		value: offsetInFrames,
		min: (minimumFrom ?? 0) - secondItemInitialFrom,
		max: maxDuration - firstItemInitialDurationInFrames,
	});

	// A shift might not be possible initially because items block each other in the timeline.
	// Therefore we apply both edits after each other
	// 1. If dragging to the left, first shrink the first item, then expand the second item
	// 2. If drgging to the right, first shrink the second item, then expand the first item
	if (draggingDirection === 'left') {
		// ✅ First edit: extend right on the previous item
		changeItem(state, adjacency.previous, (prevItem) => {
			return extendRight({
				prevItem,
				fps: state.compositionState.fps,
				initialFrom: firstItemInitialFrom,
				initialDurationInFrames: firstItemInitialDurationInFrames,
				itemIndex: firstItemIndex,
				trackItemsSorted,
				items,
				offsetInFrames: clampedOffsetInFrames,
				asset: firstItemAsset,
				pixelsPerFrame,
				visibleFrames,
			});
		});

		// ✅ Second edit: extend left on the next item
		changeItem(state, adjacency.next, (prevItem) => {
			return extendLeft({
				prevItem,
				fps: state.compositionState.fps,
				initialFrom: secondItemInitialFrom,
				initialDurationInFrames: secondItemInitialDurationInFrames,
				itemIndex: secondItemIndex,
				trackItemsSorted,
				items,
				offsetInFrames: clampedOffsetInFrames,
				pixelsPerFrame,
			});
		});
	} else {
		// ✅ First edit: extend left on the next item
		changeItem(state, adjacency.next, (prevItem) => {
			return extendLeft({
				prevItem,
				fps: state.compositionState.fps,
				initialFrom: secondItemInitialFrom,
				initialDurationInFrames: secondItemInitialDurationInFrames,
				itemIndex: secondItemIndex,
				items,
				offsetInFrames: clampedOffsetInFrames,
				trackItemsSorted,
				pixelsPerFrame,
			});
		});

		// ✅ Second edit: extend right on the previous item
		changeItem(state, adjacency.previous, (prevItem) => {
			return extendRight({
				prevItem,
				fps: state.compositionState.fps,
				initialFrom: firstItemInitialFrom,
				asset: firstItemAsset,
				offsetInFrames: clampedOffsetInFrames,
				trackItemsSorted,
				itemIndex: firstItemIndex,
				initialDurationInFrames: firstItemInitialDurationInFrames,
				items,
				pixelsPerFrame,
				visibleFrames,
			});
		});
	}
	// ✅ No return needed
};
