import {EditorState} from '../state/types';
import {LastAddedItemInfo} from '../../zustand/ui-store';
import {getCurrentTracks} from '../state/helpers/get-current-timeline';

/**
 * Utility to find a track using last added item information
 * Useful for sequential item placement on the same track
 */
export const getTrackFromLastAddedItem = (
	state: EditorState,
	lastAddedItem: LastAddedItemInfo,
): {
	trackId: string;
	track: ReturnType<typeof getCurrentTracks>[number] | null;
	lastItemEndFrame: number;
} | null => {
	if (!lastAddedItem || !lastAddedItem.trackId) {
		return null;
	}

	const tracks = getCurrentTracks(state);

	// Find the track by ID
	const track = tracks.find((t) => t.id === lastAddedItem.trackId);

	if (!track) {
		return null;
	}

	// Calculate where the last item ends
	const lastItemEndFrame =
		lastAddedItem.from + lastAddedItem.durationInFrames;

	return {
		trackId: lastAddedItem.trackId,
		track,
		lastItemEndFrame,
	};
};

/**
 * Get the position where the next code item should be placed
 * Based on the last added item
 */
export const getNextCodeItemPosition = (
	state: EditorState,
	lastAddedItem: LastAddedItemInfo,
): number => {
	const trackInfo = getTrackFromLastAddedItem(state, lastAddedItem);

	// If we have track info and last item was a code item, position after it
	if (trackInfo && lastAddedItem?.type === 'code') {
		return trackInfo.lastItemEndFrame;
	}

	// Otherwise start at frame 0
	return 0;
};
