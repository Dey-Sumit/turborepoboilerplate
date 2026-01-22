import {EditorStarterItem} from '../../items/item-type';
import {
	findSpaceForItem,
	FindSpaceStartPosition,
	Space,
} from '../../utils/find-space-for-item';
import {generateRandomId} from '../../utils/generate-random-id';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState, TrackType} from '../types';

// Immer version - mutates tracks array directly
// Also sets item.trackId to the track it lands on
export const addItemInSpace = ({
	tracks,
	item,
	space,
}: {
	tracks: TrackType[];
	item: EditorStarterItem;
	space: Space;
}): void => {
	// Remove item from tracks if it exists (mutate directly)
	for (const track of tracks) {
		track.items = track.items.filter((id) => id !== item.id);
	}

	// Variable to track which trackId the item ends up on
	let targetTrackId: string;

	// Handle different cases for adding the item
	if (!tracks[space.trackIndex]) {
		// Track doesn't exist, create new track
		const newTrackId = generateRandomId('track');
		const newTrack: TrackType = {
			id: newTrackId,
			items: [item.id],
			hidden: false,
			muted: false,
		};

		if (space.trackIndex === -1) {
			// Add to front
			tracks.unshift(newTrack);
		} else {
			// Add to end
			tracks.push(newTrack);
		}

		targetTrackId = newTrackId;
	} else if (space.forceCreateNewTrack) {
		// Force create new track at specific position
		const previousTracks = tracks.slice(0, space.trackIndex);
		const tracksAfter = tracks.slice(space.trackIndex);

		const newTrackId = generateRandomId('track');
		const newTrack = {
			id: newTrackId,
			items: [item.id],
			hidden: false,
			muted: false,
		};

		// Clear tracks array and rebuild
		tracks.splice(0, tracks.length);
		tracks.push(...previousTracks, newTrack, ...tracksAfter);

		targetTrackId = newTrackId;
	} else {
		// Add to existing track
		tracks[space.trackIndex].items.push(item.id);
		targetTrackId = tracks[space.trackIndex].id;
	}

	// Set the trackId on the item
	item.trackId = targetTrackId;

	// Remove empty tracks (mutate tracks array directly)
	for (let i = tracks.length - 1; i >= 0; i--) {
		if (tracks[i].items.length === 0) {
			tracks.splice(i, 1);
		}
	}
};

/**
 * Add an item to the timeline.
 *
 * IMPORTANT: This function no longer handles selection as a side effect.
 * If you need to select the item after adding, call useUIStore.getState().setSelectedItems()
 * AFTER the setState callback completes.
 *
 * @returns The item ID for use in post-add operations (like selection)
 */
export const addItem = ({
	state,
	item,
	position,
}: {
	state: EditorState;
	item: EditorStarterItem;
	position: FindSpaceStartPosition;
}): string => {
	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// For text items, always create a new track to avoid overlapping
	const space = findSpaceForItem({
		durationInFrames: item.durationInFrames,
		startAt: item.from,
		tracks: currentTimeline.tracks,
		startPosition: position,
		stopOnFirstFound: false,
		items: currentTimeline.items,
	});

	// Add item to tracks (mutate tracks directly)
	addItemInSpace({
		tracks: currentTimeline.tracks,
		item,
		space,
	});

	// Add item to items object directly
	currentTimeline.items[item.id] = item;

	return item.id;
};
