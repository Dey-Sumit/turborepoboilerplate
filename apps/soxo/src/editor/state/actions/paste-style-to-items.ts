import {EditorState} from '../types';

export const pasteStyleToItems = (
	state: EditorState,
	params: {
		targetItemIds: string[];
		properties: Record<string, unknown>;
	},
): EditorState => {
	const updatedItems = {...state.compositionState.items};

	params.targetItemIds.forEach((itemId) => {
		const item = updatedItems[itemId];
		if (!item) {
			return;
		}

		// Apply selected properties to the item
		updatedItems[itemId] = {
			...item,
			...params.properties,
		};
	});

	return {
		...state,
		compositionState: {
			...state.compositionState,
			items: updatedItems,
		},
	};
};
