import React from 'react';
import {Sequence} from 'remotion';
import {useEditMode, useTextItemEditing} from '../../zustand/ui-store';
import {EditorStarterItem} from '../items/item-type';
import {useAllItems, useSelectedItems, useTracks} from '../utils/use-context';
import {SelectionOutline} from './selection-outline';

const hideOutlinesForItemTypes: EditorStarterItem['type'][] = ['audio'];

export const SortedOutlines: React.FC = () => {
	const {tracks} = useTracks();
	const {selectedItems: selectedItemIds} = useSelectedItems();
	const {items} = useAllItems();

	const allItems = React.useMemo(
		() =>
			tracks
				.filter((t) => !t.hidden)
				.map((t) => t.items)
				.flat(1)
				.filter((item) => !hideOutlinesForItemTypes.includes(items[item].type)),
		[items, tracks],
	);

	const selectedItems = React.useMemo(
		() => allItems.filter((item) => selectedItemIds.includes(item)),
		[allItems, selectedItemIds],
	);

	const editMode = useEditMode();
	const textItemEditing = useTextItemEditing();

	const itemsToDisplay = React.useMemo(() => {
		if (textItemEditing) {
			return [textItemEditing];
		}

		if (editMode === 'draw-solid') {
			return selectedItems;
		}

		return allItems;
	}, [editMode, selectedItems, allItems, textItemEditing]);

	return itemsToDisplay
		.slice()
		.reverse()
		.map((itemId) => {
			const item = items[itemId];
			return (
				<Sequence
					key={item.id}
					from={item.from}
					durationInFrames={item.durationInFrames}
					layout="none"
				>
					<SelectionOutline item={item} />
				</Sequence>
			);
		});
};
