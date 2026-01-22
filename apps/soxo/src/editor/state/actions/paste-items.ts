import useUIStore from '../../../zustand/ui-store';
import {EditorStarterItem} from '../../items/item-type';
import {generateRandomId} from '../../utils/generate-random-id';
import {EditorState} from '../types';
import {addItem} from './add-item';

// Immer version - mutates state directly
export const pasteItems = ({
	state,
	copiedItems,
	from,
	position,
}: {
	state: EditorState;
	copiedItems: EditorStarterItem[];
	from: number;
	position: null | {x: number; y: number};
}): void => {
	const idsToSelect = [];

	// If we are adding multiple items, they should have the same horizontal offset
	// leftmost item as when they were copied.
	// But we insert where the playhead is, therefore we need to recalculate the offset
	const minFrom = Math.min(...copiedItems.map((item) => item.from));
	const offsetFrames = from - minFrom;

	// since we're adding items to the top of the timeline (position: { type: 'front' })
	// we need to reverse the order of the copied items
	// to maintain the correct layer order
	for (const copiedItem of [...copiedItems].reverse()) {
		console.log(
			'Pasting item:',
			copiedItem,
			' with offsetFrames:',
			offsetFrames,
		);

		// Preserve original from value but add offset
		const finalItem: EditorStarterItem = {
			...copiedItem,
			id: generateRandomId(copiedItem.type),
			from: copiedItem.from + offsetFrames,
		};

		// If position is provided, update the left and top coordinates
		// Subtract half width/height to center the item at the clicked position
		if (position) {
			finalItem.left = position.x - finalItem.width / 2;
			finalItem.top = position.y - finalItem.height / 2;
		}

		// Add item directly (mutates state)
		addItem({
			state,
			item: finalItem,
			position: {type: 'front'},
		});

		idsToSelect.push(finalItem.id);
	}

	// Update selection (side effect)
	useUIStore.getState().setSelectedItems(idsToSelect);
};
