import {createSelector} from 'reselect';
import type {UIState} from '../../zustand/ui-store';

/**
 * Selection Set Selector - Optimizes selection checks from O(n) to O(1)
 *
 * Problem: Checking if an item is selected with array.includes() is O(n).
 * With hundreds of items, this causes performance issues on canvas rendering.
 *
 * Solution: Convert selectedItems array to Set for O(1) has() lookups.
 *
 * Reselect v5 best practices followed:
 * - Simple input selector (field accessor only)
 * - Computation in result function
 * - Uses default weakMapMemoize for better performance
 */

// Input selector - just extract selectedItems array
const selectSelectedItemsArray = (state: UIState) => state.selectedItems;

// Memoized selector - converts array to Set
export const selectSelectedItemsSet = createSelector(
	[selectSelectedItemsArray],
	(selectedItems): Set<string> => {
		return new Set(selectedItems);
	},
);

/**
 * Helper function to check if an item is selected
 * Uses the memoized Set for O(1) lookups
 */
export const createIsItemSelectedSelector = () => {
	return createSelector(
		[selectSelectedItemsSet, (_state: UIState, itemId: string) => itemId],
		(selectedSet, itemId): boolean => {
			return selectedSet.has(itemId);
		},
	);
};
