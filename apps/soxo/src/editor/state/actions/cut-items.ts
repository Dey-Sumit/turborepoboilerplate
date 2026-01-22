import useUIStore from '../../../zustand/ui-store';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState} from '../types';

// like deleteItems, but doesn't remove assets to preserve them for potential paste operations
// Immer version - mutates draft directly
export const cutItems = (state: EditorState, idsToCut: string[]): void => {
	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// Filter items out of tracks directly
	currentTimeline.tracks.forEach((track) => {
		track.items = track.items.filter((itemId) => !idsToCut.includes(itemId));
	});

	// Remove empty tracks (mutate in place for composites)
	const tracksToKeep = currentTimeline.tracks.filter(
		(track) => track.items.length > 0,
	);
	currentTimeline.tracks.splice(
		0,
		currentTimeline.tracks.length,
		...tracksToKeep,
	);

	// Delete items directly from the items object
	for (const id of idsToCut) {
		delete currentTimeline.items[id];
	}

	// Get current selection from Zustand store and filter out cut items
	const currentSelectedItems = useUIStore.getState().selectedItems;
	const newSelectedItems = currentSelectedItems.filter(
		(id: string) => !idsToCut.includes(id),
	);

	// Update selection directly (side effect)
	useUIStore.getState().setSelectedItems(newSelectedItems);
};
