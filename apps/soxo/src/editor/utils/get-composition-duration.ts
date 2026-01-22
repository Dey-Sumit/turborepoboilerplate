import {EditorStarterItem} from '../items/item-type';
import {TrackType} from '../state/types';

export const getCompositionDuration = (
	items: Record<string, EditorStarterItem>,
	tracks: TrackType[],
) => {
	let maxEndFrame = 0;

	// Find the maximum end frame across all items in all tracks
	for (const track of tracks) {
		if (track.hidden) continue;

		for (const itemId of track.items) {
			const item = items[itemId];
			if (item) {
				const endFrame = item.from + item.durationInFrames;
				maxEndFrame = Math.max(maxEndFrame, endFrame);
			}
		}
	}

	return maxEndFrame;
};
