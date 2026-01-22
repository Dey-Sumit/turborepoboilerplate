import useUIStore from '../../../zustand/ui-store';
import {AudioItem} from '../../items/audio/audio-item-type';
import {CaptionsItem} from '../../items/captions/captions-item-type';
import {GifItem} from '../../items/gif/gif-item-type';
import {EditorStarterItem} from '../../items/item-type';
import {VideoItem} from '../../items/video/video-item-type';
import {
	AudioFadableItem,
	getCanFadeAudio,
	getCanFadeVisual,
	VisuallyFadableItem,
} from '../../utils/fade';
import {generateRandomId} from '../../utils/generate-random-id';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState, TrackType} from '../types';

// Immer version - mutates draft directly
export const splitItem = ({
	state,
	idToSplit,
	framePosition,
}: {
	state: EditorState;
	idToSplit: string;
	framePosition: number;
}): void => {
	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// Find the track and item to split
	let targetTrack: TrackType | undefined;
	const targetItem: EditorStarterItem = currentTimeline.items[idToSplit];
	let targetTrackIndex = -1;

	for (let i = 0; i < currentTimeline.tracks.length; i++) {
		const track = currentTimeline.tracks[i];
		if (track.items.includes(idToSplit)) {
			targetTrack = track;
			targetTrackIndex = i;
			break;
		}
	}

	if (!targetTrack || !targetItem || targetTrackIndex === -1) {
		return;
	}

	// Calculate the relative split position within the item
	const itemStart = targetItem.from;
	const itemEnd = itemStart + targetItem.durationInFrames;

	// Only split if the frame position is within the item bounds and not at the edges
	if (framePosition <= itemStart || framePosition >= itemEnd) {
		return;
	}

	// Create the two new items
	const firstItemDuration = framePosition - itemStart;
	const secondItemDuration = itemEnd - framePosition;

	const firstItem: EditorStarterItem = {
		...targetItem,
		id: generateRandomId(targetItem.type),
		durationInFrames: firstItemDuration,
	};

	const secondItem: EditorStarterItem = {
		...targetItem,
		id: generateRandomId(targetItem.type),
		from: framePosition,
		durationInFrames: secondItemDuration,
	};

	// Handle special case for video - adjust videoStartFromInSeconds for the second item
	if (targetItem.type === 'video') {
		const firstItemDurationInSeconds =
			firstItemDuration / state.compositionState.fps;
		(secondItem as VideoItem).videoStartFromInSeconds =
			(targetItem.videoStartFromInSeconds || 0) + firstItemDurationInSeconds;
	}

	// Handle special case for audio - adjust audioStartFromInSeconds for the second item
	if (targetItem.type === 'audio') {
		const firstItemDurationInSeconds =
			firstItemDuration / state.compositionState.fps;
		(secondItem as AudioItem).audioStartFromInSeconds =
			(targetItem.audioStartFromInSeconds || 0) + firstItemDurationInSeconds;
	}

	// Handle special case for gif - adjust gifStartFromInSeconds for the second item
	if (targetItem.type === 'gif') {
		const firstItemDurationInSeconds =
			firstItemDuration / state.compositionState.fps;
		(secondItem as GifItem).gifStartFromInSeconds =
			(targetItem.gifStartFromInSeconds || 0) + firstItemDurationInSeconds;
	}

	// Handle special case for captions - adjust captionStartInSeconds for the second item
	if (targetItem.type === 'captions') {
		const firstItemDurationInSeconds =
			firstItemDuration / state.compositionState.fps;
		(secondItem as CaptionsItem).captionStartInSeconds =
			(targetItem.captionStartInSeconds || 0) + firstItemDurationInSeconds;
	}

	// Special case for fadable items - keep fade-in for first item and fade-out for second item
	if (getCanFadeVisual(targetItem)) {
		// First item keeps fade-in, loses fade-out
		(firstItem as VisuallyFadableItem).fadeOutDurationInSeconds = 0;
		(firstItem as VisuallyFadableItem).fadeInDurationInSeconds = Math.min(
			(firstItem as VisuallyFadableItem).fadeInDurationInSeconds,
			firstItemDuration / state.compositionState.fps,
		);

		// Second item keeps fade-out, loses fade-in
		(secondItem as VisuallyFadableItem).fadeInDurationInSeconds = 0;
		(secondItem as VisuallyFadableItem).fadeOutDurationInSeconds = Math.min(
			(secondItem as VisuallyFadableItem).fadeOutDurationInSeconds,
			secondItemDuration / state.compositionState.fps,
		);
	}

	// Special case for audio and video - keep audio fade-in for first item and fade-out for second item
	if (getCanFadeAudio(targetItem)) {
		// First item keeps audio fade-in, loses audio fade-out
		(firstItem as AudioFadableItem).audioFadeOutDurationInSeconds = 0;
		(firstItem as AudioFadableItem).audioFadeInDurationInSeconds = Math.min(
			(firstItem as AudioFadableItem).audioFadeInDurationInSeconds,
			firstItemDuration / state.compositionState.fps,
		);

		// Second item keeps audio fade-out, loses audio fade-in
		(secondItem as AudioFadableItem).audioFadeInDurationInSeconds = 0;
		(secondItem as AudioFadableItem).audioFadeOutDurationInSeconds = Math.min(
			(secondItem as AudioFadableItem).audioFadeOutDurationInSeconds,
			secondItemDuration / state.compositionState.fps,
		);
	}

	// ✅ Mutate tracks directly - update the target track's items array
	const targetTrackItems = currentTimeline.tracks[targetTrackIndex].items;
	currentTimeline.tracks[targetTrackIndex].items = [
		...targetTrackItems.filter((item) => item !== idToSplit),
		firstItem.id,
		secondItem.id,
	];

	// ✅ Add new items directly to the items object
	currentTimeline.items[firstItem.id] = firstItem;
	currentTimeline.items[secondItem.id] = secondItem;

	// ✅ Delete old item directly
	delete currentTimeline.items[idToSplit];

	// Update selection in Zustand store to select the second (right) split item (side effect)
	useUIStore.getState().setSelectedItems([secondItem.id]);
};
