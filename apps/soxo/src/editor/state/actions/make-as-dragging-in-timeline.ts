import {EditorState} from '../types';
import {changeItem} from './change-item';

// Immer versions - mutate state directly
export const markMultipleAsDraggingInTimeline = (
	state: EditorState,
	itemIds: string[],
): void => {
	for (const itemId of itemIds) {
		changeItem(state, itemId, (item) => {
			if (item.isDraggingInTimeline) {
				return item;
			}
			return {
				...item,
				isDraggingInTimeline: true,
			};
		});
	}
};

export const unmarkMultipleAsDraggingInTimeline = (
	state: EditorState,
	itemIds: string[],
): void => {
	for (const itemId of itemIds) {
		changeItem(state, itemId, (item) => {
			if (!item.isDraggingInTimeline) {
				return item;
			}
			return {
				...item,
				isDraggingInTimeline: false,
			};
		});
	}
};
