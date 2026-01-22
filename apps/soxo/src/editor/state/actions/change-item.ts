import {EditorStarterItem} from '../../items/item-type';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState} from '../types';

/**
 * Find and update an item in the hierarchy.
 * Returns true if the item was found and updated.
 */
function updateItemInHierarchy(
	items: Record<string, EditorStarterItem>,
	itemId: string,
	updater: (item: EditorStarterItem) => EditorStarterItem,
): boolean {
	// Check if item exists at this level
	if (items[itemId]) {
		const existingItem = items[itemId];
		const updatedItem = updater(existingItem);
		if (updatedItem !== existingItem) {
			items[itemId] = updatedItem;
		}
		return true;
	}

	// Search in composite children
	for (const item of Object.values(items)) {
		if (item.type === 'composite') {
			const found = updateItemInHierarchy(
				item.childTimeline.items,
				itemId,
				updater,
			);
			if (found) return true;
		}
	}

	return false;
}

/**
 * Change an item's properties using an updater function.
 *
 * This action is context-aware:
 * - First tries to find the item in the current timeline context
 * - Falls back to searching the entire hierarchy
 *
 * @param state - The editor state to mutate
 * @param itemId - The ID of the item to change
 * @param updater - Function that receives the item and returns the updated item
 */
export const changeItem = (
	state: EditorState,
	itemId: string,
	updater: (item: EditorStarterItem) => EditorStarterItem,
): void => {
	// First, try the current timeline context (handles both root and composite)
	const currentTimeline = getCurrentTimeline(state.compositionState);
	if (currentTimeline.items[itemId]) {
		const existingItem = currentTimeline.items[itemId];
		const updatedItem = updater(existingItem);
		if (updatedItem !== existingItem) {
			currentTimeline.items[itemId] = updatedItem;
		}
		return;
	}

	// Fall back to root items
	if (state.compositionState.items[itemId]) {
		const existingItem = state.compositionState.items[itemId];
		const updatedItem = updater(existingItem);
		if (updatedItem !== existingItem) {
			state.compositionState.items[itemId] = updatedItem;
		}
		return;
	}

	// Search entire hierarchy as last resort
	updateItemInHierarchy(state.compositionState.items, itemId, updater);
};
