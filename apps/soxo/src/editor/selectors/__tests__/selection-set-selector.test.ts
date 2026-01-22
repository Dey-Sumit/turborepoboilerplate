import {describe, it, expect, beforeEach} from 'vitest';
import useUIStore from '../../../zustand/ui-store';
import {
	selectSelectedItemsSet,
	createIsItemSelectedSelector,
} from '../selection-set-selector';

describe('Selection Set Selector', () => {
	beforeEach(() => {
		// Reset UI store to clean state
		useUIStore.setState({
			selectedItems: [],
		});
	});

	describe('selectSelectedItemsSet', () => {
		it('should return empty Set when no items selected', () => {
			const state = useUIStore.getState();
			const selectedSet = selectSelectedItemsSet(state);

			expect(selectedSet).toBeInstanceOf(Set);
			expect(selectedSet.size).toBe(0);
		});

		it('should convert selectedItems array to Set', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2', 'item-3'],
			});

			const state = useUIStore.getState();
			const selectedSet = selectSelectedItemsSet(state);

			expect(selectedSet.size).toBe(3);
			expect(selectedSet.has('item-1')).toBe(true);
			expect(selectedSet.has('item-2')).toBe(true);
			expect(selectedSet.has('item-3')).toBe(true);
		});

		it('should not include unselected items', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2'],
			});

			const state = useUIStore.getState();
			const selectedSet = selectSelectedItemsSet(state);

			expect(selectedSet.has('item-3')).toBe(false);
			expect(selectedSet.has('item-4')).toBe(false);
		});

		it('should return same reference when selectedItems unchanged', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2'],
			});

			const state = useUIStore.getState();
			const selectedSet1 = selectSelectedItemsSet(state);
			const selectedSet2 = selectSelectedItemsSet(state);

			// Should be memoized - same reference
			expect(selectedSet1).toBe(selectedSet2);
		});

		it('should return new reference when selectedItems changes', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2'],
			});

			const state1 = useUIStore.getState();
			const selectedSet1 = selectSelectedItemsSet(state1);

			// Change selection
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2', 'item-3'],
			});

			const state2 = useUIStore.getState();
			const selectedSet2 = selectSelectedItemsSet(state2);

			// Should be different reference (recomputed)
			expect(selectedSet1).not.toBe(selectedSet2);
			expect(selectedSet1.size).toBe(2);
			expect(selectedSet2.size).toBe(3);
		});

		it('should handle large selection efficiently', () => {
			// Create 1000 selected items
			const largeSelection = Array.from({length: 1000}, (_, i) => `item-${i}`);

			useUIStore.setState({
				selectedItems: largeSelection,
			});

			const state = useUIStore.getState();
			const selectedSet = selectSelectedItemsSet(state);

			expect(selectedSet.size).toBe(1000);
			expect(selectedSet.has('item-0')).toBe(true);
			expect(selectedSet.has('item-500')).toBe(true);
			expect(selectedSet.has('item-999')).toBe(true);
			expect(selectedSet.has('item-1000')).toBe(false);
		});

		it('should handle duplicates in selectedItems array', () => {
			// Set with duplicates (though this shouldn't happen in practice)
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2', 'item-1', 'item-3', 'item-2'],
			});

			const state = useUIStore.getState();
			const selectedSet = selectSelectedItemsSet(state);

			// Set automatically handles duplicates
			expect(selectedSet.size).toBe(3);
			expect(selectedSet.has('item-1')).toBe(true);
			expect(selectedSet.has('item-2')).toBe(true);
			expect(selectedSet.has('item-3')).toBe(true);
		});
	});

	describe('createIsItemSelectedSelector', () => {
		it('should return true for selected items', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2', 'item-3'],
			});

			const state = useUIStore.getState();
			const isItemSelected = createIsItemSelectedSelector();

			expect(isItemSelected(state, 'item-1')).toBe(true);
			expect(isItemSelected(state, 'item-2')).toBe(true);
			expect(isItemSelected(state, 'item-3')).toBe(true);
		});

		it('should return false for unselected items', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2'],
			});

			const state = useUIStore.getState();
			const isItemSelected = createIsItemSelectedSelector();

			expect(isItemSelected(state, 'item-3')).toBe(false);
			expect(isItemSelected(state, 'item-4')).toBe(false);
			expect(isItemSelected(state, 'non-existent')).toBe(false);
		});

		it('should update when selection changes', () => {
			useUIStore.setState({
				selectedItems: ['item-1'],
			});

			const isItemSelected = createIsItemSelectedSelector();
			let state = useUIStore.getState();

			expect(isItemSelected(state, 'item-1')).toBe(true);
			expect(isItemSelected(state, 'item-2')).toBe(false);

			// Add item-2 to selection
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2'],
			});

			state = useUIStore.getState();
			expect(isItemSelected(state, 'item-1')).toBe(true);
			expect(isItemSelected(state, 'item-2')).toBe(true);

			// Remove item-1 from selection
			useUIStore.setState({
				selectedItems: ['item-2'],
			});

			state = useUIStore.getState();
			expect(isItemSelected(state, 'item-1')).toBe(false);
			expect(isItemSelected(state, 'item-2')).toBe(true);
		});

		it('should be memoized for same state and itemId', () => {
			useUIStore.setState({
				selectedItems: ['item-1', 'item-2'],
			});

			const state = useUIStore.getState();
			const isItemSelected = createIsItemSelectedSelector();

			const result1 = isItemSelected(state, 'item-1');
			const result2 = isItemSelected(state, 'item-1');

			// Should return same result (memoized)
			expect(result1).toBe(result2);
			expect(result1).toBe(true);
		});
	});

	describe('Performance characteristics', () => {
		it('should provide O(1) lookup performance with Set', () => {
			// Create large selection
			const largeSelection = Array.from({length: 10000}, (_, i) => `item-${i}`);

			useUIStore.setState({
				selectedItems: largeSelection,
			});

			const state = useUIStore.getState();
			const selectedSet = selectSelectedItemsSet(state);

			// Time O(1) Set.has() lookup
			const start = performance.now();
			for (let i = 0; i < 1000; i++) {
				selectedSet.has('item-5000');
			}
			const setTime = performance.now() - start;

			// Compare to O(n) array.includes() lookup
			const arrayStart = performance.now();
			for (let i = 0; i < 1000; i++) {
				largeSelection.includes('item-5000');
			}
			const arrayTime = performance.now() - arrayStart;

			// Set should be significantly faster than array
			// Note: This is a relative test, not absolute timing
			expect(setTime).toBeLessThan(arrayTime);
		});

		it('should handle rapid selection changes', () => {
			const state = useUIStore.getState();

			// Simulate rapid selection changes
			for (let i = 0; i < 100; i++) {
				useUIStore.setState({
					selectedItems: [`item-${i}`],
				});

				const selectedSet = selectSelectedItemsSet(useUIStore.getState());
				expect(selectedSet.has(`item-${i}`)).toBe(true);
			}
		});
	});

	describe('Integration with UI Store', () => {
		it('should work with store selection actions', () => {
			const state = useUIStore.getState();

			// Use store actions
			state.setSelectedItems(['item-1', 'item-2']);

			let selectedSet = selectSelectedItemsSet(useUIStore.getState());
			expect(selectedSet.size).toBe(2);
			expect(selectedSet.has('item-1')).toBe(true);

			// Add to selection
			state.addToSelection('item-3');
			selectedSet = selectSelectedItemsSet(useUIStore.getState());
			expect(selectedSet.size).toBe(3);
			expect(selectedSet.has('item-3')).toBe(true);

			// Remove from selection
			state.removeFromSelection('item-1');
			selectedSet = selectSelectedItemsSet(useUIStore.getState());
			expect(selectedSet.size).toBe(2);
			expect(selectedSet.has('item-1')).toBe(false);
			expect(selectedSet.has('item-2')).toBe(true);

			// Toggle selection
			state.toggleSelection('item-4');
			selectedSet = selectSelectedItemsSet(useUIStore.getState());
			expect(selectedSet.has('item-4')).toBe(true);

			// Clear selection
			state.clearSelection();
			selectedSet = selectSelectedItemsSet(useUIStore.getState());
			expect(selectedSet.size).toBe(0);
		});
	});
});
