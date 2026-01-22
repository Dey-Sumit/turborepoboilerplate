import {createSelector} from 'reselect';
import {getCurrentTimeline} from '../state/helpers/get-current-timeline';
import type {EditorState, TrackType} from '../state/types';
import type {EditorStarterItem} from '../items/item-type';

/**
 * Base selectors - extract raw state without transformation
 *
 * These are the foundation for all derived selectors.
 * They simply extract data from the store without any computation.
 */

// Get all items from current timeline
export const selectAllItems = (
	state: EditorState,
): Record<string, EditorStarterItem> => {
	const timeline = getCurrentTimeline(state.compositionState);
	return timeline.items;
};

// Get all tracks from current timeline
export const selectAllTracks = (state: EditorState): TrackType[] => {
	const timeline = getCurrentTimeline(state.compositionState);
	return timeline.tracks;
};

// Get array of all item IDs (memoized to prevent infinite loops)
export const selectItemIds = createSelector(
	[selectAllItems],
	(items): string[] => {
		return Object.keys(items);
	},
);

// Get composition state (useful as input selector)
export const selectCompositionState = (state: EditorState) => {
	return state.compositionState;
};

// Get current timeline (useful as input selector)
export const selectCurrentTimeline = (state: EditorState) => {
	return getCurrentTimeline(state.compositionState);
};
