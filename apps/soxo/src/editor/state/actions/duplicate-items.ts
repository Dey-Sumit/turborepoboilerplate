import {EditorStarterItem} from '../../items/item-type';
import {findSpaceForItem} from '../../utils/find-space-for-item';
import {generateRandomId} from '../../utils/generate-random-id';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState} from '../types';
import {addItemInSpace} from './add-item';

/**
 * Duplicates multiple timeline items and places them directly above their originals.
 * Each duplicate is placed on a new track above its source item.
 *
 * Key implementation details:
 * - Items are added to state.items BEFORE finding space (so collision detection works)
 * - Uses live mutated state for each iteration (not snapshots)
 * - Each iteration sees track changes from previous iterations
 * - Empty tracks are automatically cleaned up by addItemInSpace
 * - Works in both root and composite contexts
 *
 * @param state - The editor state to mutate
 * @param itemIds - Array of item IDs to duplicate
 * @returns Array of newly created duplicate item IDs
 */
export const duplicateItems = (
	state: EditorState,
	itemIds: string[],
): string[] => {
	const ids = new Array(itemIds.length)
		.fill(0)
		.map(() => generateRandomId('misc'));

	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	for (let i = 0; i < itemIds.length; i++) {
		const itemId = itemIds[i];
		const trackIndex = currentTimeline.tracks.findIndex((track) =>
			track.items.includes(itemId),
		);

		const duplicatedItem: EditorStarterItem = {
			...currentTimeline.items[itemId],
			id: ids[i],
		};

		// IMPORTANT: Add item to items object FIRST, before finding space
		// This ensures findSpaceForItem can see the duplicated item for collision detection
		currentTimeline.items[duplicatedItem.id] = duplicatedItem;

		// Use current mutated state for space calculation
		// Each iteration sees the effects of previous iterations (critical for correctness)
		const space = findSpaceForItem({
			durationInFrames: duplicatedItem.durationInFrames,
			startAt: duplicatedItem.from,
			tracks: currentTimeline.tracks, // Use current mutated state
			startPosition: {type: 'directly-above', trackIndex},
			stopOnFirstFound: false,
			items: currentTimeline.items, // Use current mutated state
		});

		// Add item to tracks (mutate directly)
		addItemInSpace({
			tracks: currentTimeline.tracks,
			item: duplicatedItem,
			space,
		});
	}

	return ids;
};
