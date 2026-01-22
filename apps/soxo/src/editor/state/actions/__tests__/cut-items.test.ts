import {describe, it, expect, vi, beforeEach} from 'vitest';
import {cutItems} from '../cut-items';
import {
	createMockSolidItem,
	createMockTextItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';

// Mock dependencies
vi.mock('../../../../zustand/ui-store', () => ({
	default: {
		getState: vi.fn(() => ({
			selectedItems: [],
			setSelectedItems: vi.fn(),
		})),
	},
}));

// Don't mock getCurrentTimeline - use the real implementation
// The test helpers create proper state with timelineViewStack that works with the real function

describe('cutItems', () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		const useUIStore = (await import('../../../../zustand/ui-store')).default;
		vi.mocked(useUIStore.getState).mockReturnValue({
			selectedItems: [],
			setSelectedItems: vi.fn(),
		});
	});

	describe('Basic cutting', () => {
		it('should cut a single item from state.items', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			cutItems(state, ['item-1']);

			expect(state.compositionState.items['item-1']).toBeUndefined();
			expect(state.compositionState.items['item-2']).toBeDefined();
		});

		it('should cut multiple items at once', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-1', 'item-3']);

			expect(state.compositionState.items['item-1']).toBeUndefined();
			expect(state.compositionState.items['item-2']).toBeDefined();
			expect(state.compositionState.items['item-3']).toBeUndefined();
		});

		it('should handle cutting non-existent items gracefully', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			expect(() => {
				cutItems(state, ['non-existent-item']);
			}).not.toThrow();

			expect(state.compositionState.items['item-1']).toBeDefined();
		});

		it('should handle empty cut array', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			cutItems(state, []);

			expect(state.compositionState.items['item-1']).toBeDefined();
		});
	});

	describe('Track management', () => {
		it('should remove item from track', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			cutItems(state, ['item-1']);

			const track = state.compositionState.tracks.find(
				(t) => t.id === 'track-1',
			);
			expect(track?.items).toEqual(['item-2']);
		});

		it('should remove empty tracks after cutting', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2]);

			expect(state.compositionState.tracks).toHaveLength(2);

			cutItems(state, ['item-1']);

			// Track-1 should be removed as it's empty
			expect(state.compositionState.tracks).toHaveLength(1);
			expect(state.compositionState.tracks[0].id).toBe('track-2');
		});

		it('should keep non-empty tracks', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-1']);

			// Both tracks should remain (track-1 still has item-2)
			expect(state.compositionState.tracks).toHaveLength(2);
		});

		it('should handle cutting all items from multiple tracks', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-3'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-1', 'item-2', 'item-3']);

			// All tracks should be removed
			expect(state.compositionState.tracks).toHaveLength(0);
		});
	});

	describe('UI store integration', () => {
		it('should update selected items when cut items are selected', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: ['item-1', 'item-2', 'item-3'],
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-1']);

			// Should update selection to exclude cut item
			expect(mockSetSelectedItems).toHaveBeenCalledWith(['item-2', 'item-3']);
		});

		it('should not change selection if cut items were not selected', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: ['item-2'],
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			cutItems(state, ['item-1']);

			// Selection should remain unchanged
			expect(mockSetSelectedItems).toHaveBeenCalledWith(['item-2']);
		});

		it('should clear selection when all selected items are cut', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: ['item-1', 'item-2'],
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			cutItems(state, ['item-1', 'item-2']);

			expect(mockSetSelectedItems).toHaveBeenCalledWith([]);
		});

		it('should handle empty selection', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: [],
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			cutItems(state, ['item-1']);

			expect(mockSetSelectedItems).toHaveBeenCalledWith([]);
		});
	});

	describe('Asset preservation', () => {
		it('should NOT remove assets when cutting items', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			// Add asset to state
			state.compositionState.assets['asset-1'] = {
				id: 'asset-1',
				remoteUrl: 'https://example.com/asset-1.jpg',
				remoteFileKey: 'asset-1.jpg',
			} as any;

			cutItems(state, ['item-1']);

			// Asset should still exist (for potential paste operation)
			expect(state.compositionState.assets['asset-1']).toBeDefined();
		});

		it('should NOT add to deletedAssets array', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			state.compositionState.assets['asset-1'] = {
				id: 'asset-1',
				remoteUrl: 'https://example.com/asset-1.jpg',
			} as any;

			const initialDeletedAssets = state.compositionState.deletedAssets.length;

			cutItems(state, ['item-1']);

			// deletedAssets should remain unchanged
			expect(state.compositionState.deletedAssets).toHaveLength(
				initialDeletedAssets,
			);
		});
	});

	describe('Context-aware cutting', () => {
		it('should cut items from current timeline context', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			cutItems(state, ['item-1']);

			// Items should be cut from the state
			expect(state.compositionState.items['item-1']).toBeUndefined();
		});
	});

	describe('Multiple operations', () => {
		it('should handle cutting items from different tracks', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-3'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-1', 'item-3']);

			// Track-1 and track-3 should be removed
			expect(state.compositionState.tracks).toHaveLength(1);
			expect(state.compositionState.tracks[0].id).toBe('track-2');
		});

		it('should handle cutting some items from a track', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockSolidItem({id: 'item-3', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-1', 'item-3']);

			const track = state.compositionState.tracks[0];
			expect(track.items).toEqual(['item-2']);
			expect(track.items).toHaveLength(1);
		});

		it('should handle sequential cut operations', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			// First cut
			cutItems(state, ['item-1']);
			expect(state.compositionState.items['item-1']).toBeUndefined();
			expect(state.compositionState.tracks).toHaveLength(2);

			// Second cut
			cutItems(state, ['item-2']);
			expect(state.compositionState.items['item-2']).toBeUndefined();
			expect(state.compositionState.tracks).toHaveLength(1);
		});
	});

	describe('Edge cases', () => {
		it('should handle cutting same item multiple times', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			// First cut
			cutItems(state, ['item-1']);
			expect(state.compositionState.items['item-1']).toBeUndefined();

			// Second cut (item already gone)
			expect(() => {
				cutItems(state, ['item-1']);
			}).not.toThrow();
		});

		it('should handle cutting with mixed valid and invalid IDs', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			cutItems(state, ['item-1', 'non-existent', 'item-2']);

			expect(state.compositionState.items['item-1']).toBeUndefined();
			expect(state.compositionState.items['item-2']).toBeUndefined();
			expect(state.compositionState.tracks).toHaveLength(0);
		});

		it('should preserve track order after cutting', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-3'});
			const state = createMockStateWithItems([item1, item2, item3]);

			cutItems(state, ['item-2']);

			// Track-1 and track-3 should remain in order
			expect(state.compositionState.tracks).toHaveLength(2);
			expect(state.compositionState.tracks[0].id).toBe('track-1');
			expect(state.compositionState.tracks[1].id).toBe('track-3');
		});

		it('should handle cutting from empty state', () => {
			const state = createMockStateWithItems([]);

			expect(() => {
				cutItems(state, ['item-1']);
			}).not.toThrow();

			expect(state.compositionState.tracks).toHaveLength(0);
		});
	});

	describe('Different item types', () => {
		it('should cut text items', () => {
			const textItem = createMockTextItem({
				id: 'text-1',
				trackId: 'track-1',
			});
			const state = createMockStateWithItems([textItem]);

			cutItems(state, ['text-1']);

			expect(state.compositionState.items['text-1']).toBeUndefined();
		});

		it('should cut solid items', () => {
			const solidItem = createMockSolidItem({
				id: 'solid-1',
				trackId: 'track-1',
			});
			const state = createMockStateWithItems([solidItem]);

			cutItems(state, ['solid-1']);

			expect(state.compositionState.items['solid-1']).toBeUndefined();
		});

		it('should cut mixed item types', () => {
			const solidItem = createMockSolidItem({
				id: 'solid-1',
				trackId: 'track-1',
			});
			const textItem = createMockTextItem({
				id: 'text-1',
				trackId: 'track-2',
			});
			const state = createMockStateWithItems([solidItem, textItem]);

			cutItems(state, ['solid-1', 'text-1']);

			expect(state.compositionState.items['solid-1']).toBeUndefined();
			expect(state.compositionState.items['text-1']).toBeUndefined();
		});
	});
});
