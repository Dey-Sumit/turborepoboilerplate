import {describe, it, expect, vi, beforeEach} from 'vitest';
import {deleteItems} from '../delete-items';
import {
	createMockEditorState,
	createMockSolidItem,
	createMockTextItem,
	createMockTrack,
	createMockStateWithItems,
} from '../../../../test/test-helpers';

// Mock UI store
vi.mock('../../../../zustand/ui-store', () => ({
	default: {
		getState: vi.fn(() => ({
			selectedItems: [],
			itemsBeingTrimmed: [],
			itemSelectedForCrop: null,
			setSelectedItems: vi.fn(),
			setItemsBeingTrimmed: vi.fn(),
			setItemSelectedForCrop: vi.fn(),
		})),
	},
}));

// Mock getCurrentTimeline helper
vi.mock('../../helpers/get-current-timeline', () => ({
	getCurrentTimeline: vi.fn((compositionState) => ({
		tracks: compositionState.tracks,
		items: compositionState.items,
	})),
}));

// Mock getOrphanedAssetIds
vi.mock('../../get-orphaned-asset', () => ({
	getOrphanedAssetIds: vi.fn(() => []),
}));

// Mock resetItemCropToNonNegative
vi.mock('../item-cropping', () => ({
	resetItemCropToNonNegative: vi.fn(),
}));

describe('deleteItems', () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		const useUIStore = (await import('../../../../zustand/ui-store')).default;
		vi.mocked(useUIStore.getState).mockReturnValue({
			selectedItems: [],
			itemsBeingTrimmed: [],
			itemSelectedForCrop: null,
			setSelectedItems: vi.fn(),
			setItemsBeingTrimmed: vi.fn(),
			setItemSelectedForCrop: vi.fn(),
		} as any);
	});

	describe('Basic deletion', () => {
		it('should delete a single item from state.items', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			deleteItems(state, ['item-1']);

			expect(state.compositionState.items['item-1']).toBeUndefined();
			expect(state.compositionState.items['item-2']).toBeDefined();
		});

		it('should delete multiple items at once', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			deleteItems(state, ['item-1', 'item-3']);

			expect(state.compositionState.items['item-1']).toBeUndefined();
			expect(state.compositionState.items['item-2']).toBeDefined();
			expect(state.compositionState.items['item-3']).toBeUndefined();
		});

		it('should handle deleting non-existent items gracefully', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			// Should not throw error when deleting non-existent item
			expect(() => {
				deleteItems(state, ['non-existent-item']);
			}).not.toThrow();

			expect(state.compositionState.items['item-1']).toBeDefined();
		});

		it('should handle empty deletion array', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			deleteItems(state, []);

			expect(state.compositionState.items['item-1']).toBeDefined();
		});
	});

	describe('Track management', () => {
		it('should remove item from track', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			deleteItems(state, ['item-1']);

			const track = state.compositionState.tracks.find(
				(t) => t.id === 'track-1',
			);
			expect(track?.items).toEqual(['item-2']);
		});

		it('should remove empty tracks after deletion', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2]);

			expect(state.compositionState.tracks).toHaveLength(2);

			deleteItems(state, ['item-1']);

			// Track-1 should be removed as it's empty
			expect(state.compositionState.tracks).toHaveLength(1);
			expect(state.compositionState.tracks[0].id).toBe('track-2');
		});

		it('should keep non-empty tracks', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			deleteItems(state, ['item-1']);

			// Both tracks should remain (track-1 still has item-2)
			expect(state.compositionState.tracks).toHaveLength(2);
		});

		it('should handle deleting all items from multiple tracks', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-3'});
			const state = createMockStateWithItems([item1, item2, item3]);

			deleteItems(state, ['item-1', 'item-2', 'item-3']);

			// All tracks should be removed
			expect(state.compositionState.tracks).toHaveLength(0);
		});
	});

	describe('UI store integration', () => {
		it('should update selected items in UI store when deleted items are selected', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();
			const mockSetItemsBeingTrimmed = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: ['item-1', 'item-2', 'item-3'],
				itemsBeingTrimmed: [],
				itemSelectedForCrop: null,
				setSelectedItems: mockSetSelectedItems,
				setItemsBeingTrimmed: mockSetItemsBeingTrimmed,
				setItemSelectedForCrop: vi.fn(),
			} as any);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const item3 = createMockTextItem({id: 'item-3', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2, item3]);

			deleteItems(state, ['item-1']);

			// Should update selection to exclude deleted item
			expect(mockSetSelectedItems).toHaveBeenCalledWith(['item-2', 'item-3']);
		});

		it('should not change selection if deleted items were not selected', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();
			const mockSetItemsBeingTrimmed = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: ['item-2'],
				itemsBeingTrimmed: [],
				itemSelectedForCrop: null,
				setSelectedItems: mockSetSelectedItems,
				setItemsBeingTrimmed: mockSetItemsBeingTrimmed,
				setItemSelectedForCrop: vi.fn(),
			} as any);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			deleteItems(state, ['item-1']);

			// Selection should remain unchanged
			expect(mockSetSelectedItems).toHaveBeenCalledWith(['item-2']);
		});

		it('should update itemsBeingTrimmed in UI store', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();
			const mockSetItemsBeingTrimmed = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: [],
				itemsBeingTrimmed: [
					{itemId: 'item-1', side: 'left'},
					{itemId: 'item-2', side: 'right'},
				],
				itemSelectedForCrop: null,
				setSelectedItems: mockSetSelectedItems,
				setItemsBeingTrimmed: mockSetItemsBeingTrimmed,
				setItemSelectedForCrop: vi.fn(),
			} as any);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			deleteItems(state, ['item-1']);

			// Should remove deleted item from itemsBeingTrimmed
			expect(mockSetItemsBeingTrimmed).toHaveBeenCalledWith([
				{itemId: 'item-2', side: 'right'},
			]);
		});

		it('should clear selection when all selected items are deleted', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();
			const mockSetItemsBeingTrimmed = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: ['item-1', 'item-2'],
				itemsBeingTrimmed: [],
				itemSelectedForCrop: null,
				setSelectedItems: mockSetSelectedItems,
				setItemsBeingTrimmed: mockSetItemsBeingTrimmed,
				setItemSelectedForCrop: vi.fn(),
			} as any);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			deleteItems(state, ['item-1', 'item-2']);

			expect(mockSetSelectedItems).toHaveBeenCalledWith([]);
		});
	});

	describe('Item crop handling', () => {
		it('should reset crop and clear itemSelectedForCrop when deleting cropped item', async () => {
			const {resetItemCropToNonNegative} = await import('../item-cropping');
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetItemSelectedForCrop = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: [],
				itemsBeingTrimmed: [],
				itemSelectedForCrop: 'item-1',
				setSelectedItems: vi.fn(),
				setItemsBeingTrimmed: vi.fn(),
				setItemSelectedForCrop: mockSetItemSelectedForCrop,
			} as any);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			deleteItems(state, ['item-1']);

			expect(resetItemCropToNonNegative).toHaveBeenCalledWith(state);
			expect(mockSetItemSelectedForCrop).toHaveBeenCalledWith(null);
		});

		it('should not reset crop when deleting non-cropped items', async () => {
			const {resetItemCropToNonNegative} = await import('../item-cropping');
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetItemSelectedForCrop = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				selectedItems: [],
				itemsBeingTrimmed: [],
				itemSelectedForCrop: 'item-2',
				setSelectedItems: vi.fn(),
				setItemsBeingTrimmed: vi.fn(),
				setItemSelectedForCrop: mockSetItemSelectedForCrop,
			} as any);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			deleteItems(state, ['item-1']);

			expect(resetItemCropToNonNegative).not.toHaveBeenCalled();
			expect(mockSetItemSelectedForCrop).not.toHaveBeenCalled();
		});
	});

	describe('Asset cleanup', () => {
		it('should track deleted assets when items are deleted', async () => {
			const {getOrphanedAssetIds} = await import('../../get-orphaned-asset');

			// Mock orphaned assets
			vi.mocked(getOrphanedAssetIds).mockReturnValue([
				{id: 'asset-1', reason: 'orphaned'} as any,
			]);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			// Add asset to state
			state.compositionState.assets['asset-1'] = {
				id: 'asset-1',
				remoteUrl: 'https://example.com/asset-1.jpg',
				remoteFileKey: 'asset-1.jpg',
			} as any;

			state.assetStatus['asset-1'] = 'ready';

			deleteItems(state, ['item-1']);

			// Asset should be deleted
			expect(state.compositionState.assets['asset-1']).toBeUndefined();

			// Asset should be tracked in deletedAssets
			expect(state.compositionState.deletedAssets).toHaveLength(1);
			expect(state.compositionState.deletedAssets[0]).toEqual({
				assetId: 'asset-1',
				remoteUrl: 'https://example.com/asset-1.jpg',
				remoteFileKey: 'asset-1.jpg',
				statusAtDeletion: 'ready',
			});
		});

		it('should not add duplicate entries to deletedAssets', async () => {
			const {getOrphanedAssetIds} = await import('../../get-orphaned-asset');

			vi.mocked(getOrphanedAssetIds).mockReturnValue([
				{id: 'asset-1', reason: 'orphaned'} as any,
			]);

			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			state.compositionState.assets['asset-1'] = {
				id: 'asset-1',
				remoteUrl: 'https://example.com/asset-1.jpg',
				remoteFileKey: 'asset-1.jpg',
			} as any;

			// Pre-populate deletedAssets
			state.compositionState.deletedAssets.push({
				assetId: 'asset-1',
				remoteUrl: 'https://example.com/asset-1.jpg',
				remoteFileKey: 'asset-1.jpg',
				statusAtDeletion: 'ready',
			});

			deleteItems(state, ['item-1']);

			// Should still have only 1 entry
			expect(state.compositionState.deletedAssets).toHaveLength(1);
		});
	});
});
