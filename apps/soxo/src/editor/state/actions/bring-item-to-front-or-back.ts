import {findItemById} from '../../utils/find-item-by-id';
import {findSpaceForItem} from '../../utils/find-space-for-item';
import {generateRandomId} from '../../utils/generate-random-id';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState} from '../types';

interface BringToFrontOrBackProps {
	state: EditorState;
	itemId: string;
	position: 'front' | 'back';
}

// Immer version - mutates draft directly
export const bringToFrontOrBack = ({
	state,
	itemId,
	position,
}: BringToFrontOrBackProps): void => {
	// Get items and tracks from current timeline context (could be inside a composite)
	const timeline = getCurrentTimeline(state.compositionState);
	const {items, tracks} = timeline;
	const current = items[itemId];

	if (!current) {
		throw new Error('Item not found');
	}

	// Find the current track index
	const {trackIndex: currentTrackIndex} = findItemById(tracks, itemId);

	// Find space for the item in the new position (front/back)
	// Create a temporary view of tracks without this item to find the target position
	const tracksWithoutItem = tracks.map((t) => ({
		...t,
		items: t.items.filter((i) => i !== itemId),
	}));

	const space = findSpaceForItem({
		durationInFrames: current.durationInFrames,
		startAt: current.from,
		tracks: tracksWithoutItem,
		startPosition: {type: position},
		stopOnFirstFound: true,
		items,
	});

	// If target track is the same as current, no change needed
	// IMPORTANT: Check this BEFORE removing the item from its current track
	if (space.trackIndex === currentTrackIndex) {
		return;
	}

	// Remove item from current track
	// Only do this after we've confirmed the item needs to move
	if (currentTrackIndex !== -1) {
		timeline.tracks[currentTrackIndex].items = timeline.tracks[
			currentTrackIndex
		].items.filter((i) => i !== itemId);
	}

	// Add item to the target track and update trackId
	if (space.trackIndex >= 0 && space.trackIndex < timeline.tracks.length) {
		// Add to existing track
		timeline.tracks[space.trackIndex].items.push(itemId);
		current.trackId = timeline.tracks[space.trackIndex].id;
	} else if (space.trackIndex === -1) {
		// Add to front (new track at index 0)
		const newTrackId = generateRandomId('track');
		const newTrack = {
			id: newTrackId,
			items: [itemId],
			hidden: false,
			muted: false,
		};
		timeline.tracks.unshift(newTrack);
		current.trackId = newTrackId;
	} else {
		// Add to back (new track at end)
		const newTrackId = generateRandomId('track');
		const newTrack = {
			id: newTrackId,
			items: [itemId],
			hidden: false,
			muted: false,
		};
		timeline.tracks.push(newTrack);
		current.trackId = newTrackId;
	}

	// Remove empty tracks (if the item was the only one on its previous track)
	const nonEmptyTracks = timeline.tracks.filter(
		(track) => track.items.length > 0,
	);
	timeline.tracks.splice(0, timeline.tracks.length, ...nonEmptyTracks);
};
