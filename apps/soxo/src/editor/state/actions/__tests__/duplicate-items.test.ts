import {describe, it, expect, vi, beforeEach} from 'vitest';
import {duplicateItems} from '../duplicate-items';
import {
	createMockSolidItem,
	createMockTextItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';

// Mock dependencies
vi.mock('../../../utils/generate-random-id', () => ({
	generateRandomId: vi.fn(),
}));

vi.mock('../../../utils/find-space-for-item', () => ({
	findSpaceForItem: vi.fn(() => ({
		trackIndex: 0,
		forceCreateNewTrack: false,
	})),
}));

vi.mock('../../helpers/get-current-timeline', () => ({
	getCurrentTimeline: vi.fn((compositionState) => ({
		tracks: compositionState.tracks,
		items: compositionState.items,
	})),
}));

describe('duplicateItems', () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock generateRandomId to return predictable IDs
		let counter = 0;
		vi.mocked(
			(await import('../../../utils/generate-random-id')).generateRandomId,
		).mockImplementation(() => {
			counter++;
			return `duplicate-${counter}`;
		});
	});

	describe('Basic duplication', () => {
		it('should duplicate a single item', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			const duplicateIds = duplicateItems(state, ['item-1']);

			expect(duplicateIds).toHaveLength(1);
			expect(duplicateIds[0]).toBe('duplicate-1');
			expect(state.compositionState.items['duplicate-1']).toBeDefined();
		});

		it('should duplicate multiple items', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockTextItem({id: 'item-2', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2]);

			const duplicateIds = duplicateItems(state, ['item-1', 'item-2']);

			expect(duplicateIds).toHaveLength(2);
			expect(duplicateIds[0]).toBe('duplicate-1');
			expect(duplicateIds[1]).toBe('duplicate-2');
			expect(state.compositionState.items['duplicate-1']).toBeDefined();
			expect(state.compositionState.items['duplicate-2']).toBeDefined();
		});

		it('should return empty array when duplicating empty array', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			const duplicateIds = duplicateItems(state, []);

			expect(duplicateIds).toHaveLength(0);
		});
	});

	describe('Property preservation', () => {
		it('should copy all properties from original item', () => {
			const item1 = createMockTextItem({
				id: 'item-1',
				trackId: 'track-1',
				text: 'Hello World',
				fontSize: 64,
				color: '#00ff00',
				durationInFrames: 120,
				from: 30,
			});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			const duplicate = state.compositionState.items['duplicate-1'];
			expect(duplicate.type).toBe('text');
			expect((duplicate as any).text).toBe('Hello World');
			expect((duplicate as any).fontSize).toBe(64);
			expect((duplicate as any).color).toBe('#00ff00');
			expect(duplicate.durationInFrames).toBe(120);
			expect(duplicate.from).toBe(30);
		});

		it('should preserve nested properties like transition', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				transition: {
					toNext: {type: 'fade', durationInFrames: 10},
				},
			});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			const duplicate = state.compositionState.items['duplicate-1'];
			expect(duplicate.transition).toEqual({
				toNext: {type: 'fade', durationInFrames: 10},
			});
		});

		it('should preserve animation config', () => {
			const item1 = createMockTextItem({
				id: 'item-1',
				trackId: 'track-1',
				animation: {
					type: 'fade-in',
					delay: 0,
					duration: 1,
					target: 'container',
					stagger: 0,
				},
			});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			const duplicate = state.compositionState.items['duplicate-1'];
			expect(duplicate.animation).toEqual({
				type: 'fade-in',
				delay: 0,
				duration: 1,
				target: 'container',
				stagger: 0,
			});
		});
	});

	describe('ID generation', () => {
		it('should generate unique IDs for duplicates', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			const duplicateIds = duplicateItems(state, ['item-1', 'item-2']);

			expect(duplicateIds[0]).not.toBe('item-1');
			expect(duplicateIds[1]).not.toBe('item-2');
			expect(duplicateIds[0]).not.toBe(duplicateIds[1]);
		});

		it('should not overwrite original items', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			// Original item should still exist and be unchanged
			expect(state.compositionState.items['item-1']).toBeDefined();
			expect(state.compositionState.items['item-1'].color).toBe('#ff0000');
		});
	});

	describe('Track assignment', () => {
		it('should add duplicated item to state.items before finding space', async () => {
			const {findSpaceForItem} = await import(
				'../../../utils/find-space-for-item'
			);
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			// findSpaceForItem should be called with items that includes the duplicate
			expect(findSpaceForItem).toHaveBeenCalled();
			const callArgs = vi.mocked(findSpaceForItem).mock.calls[0][0];
			expect(callArgs.items['duplicate-1']).toBeDefined();
		});

		it('should set trackId on duplicated items', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			const duplicate = state.compositionState.items['duplicate-1'];
			expect(duplicate.trackId).toBeDefined();
		});
	});

	describe('Multiple duplications', () => {
		it('should handle sequential duplications correctly', async () => {
			const {findSpaceForItem} = await import(
				'../../../utils/find-space-for-item'
			);
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2]);

			// Mock findSpaceForItem to return different track indices
			vi.mocked(findSpaceForItem).mockReturnValueOnce({
				trackIndex: 0,
				forceCreateNewTrack: false,
			});
			vi.mocked(findSpaceForItem).mockReturnValueOnce({
				trackIndex: 1,
				forceCreateNewTrack: false,
			});

			duplicateItems(state, ['item-1', 'item-2']);

			// Both duplicates should be in state
			expect(state.compositionState.items['duplicate-1']).toBeDefined();
			expect(state.compositionState.items['duplicate-2']).toBeDefined();

			// findSpaceForItem should be called for each item
			expect(findSpaceForItem).toHaveBeenCalledTimes(2);
		});

		it('should use mutated state for each iteration', async () => {
			const {findSpaceForItem} = await import(
				'../../../utils/find-space-for-item'
			);
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-1'});
			const state = createMockStateWithItems([item1, item2]);

			duplicateItems(state, ['item-1', 'item-2']);

			// Second call to findSpaceForItem should see the first duplicate
			const secondCallArgs = vi.mocked(findSpaceForItem).mock.calls[1][0];
			expect(secondCallArgs.items['duplicate-1']).toBeDefined();
		});
	});

	describe('Edge cases', () => {
		it('should handle duplicating items with trackId set', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			const duplicate = state.compositionState.items['duplicate-1'];
			expect(duplicate).toBeDefined();
			// trackId should be set by addItemInSpace
			expect(duplicate.trackId).toBeDefined();
		});

		it('should handle duplicating same item multiple times in one call', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			// Duplicate the same item twice
			const duplicateIds = duplicateItems(state, ['item-1', 'item-1']);

			expect(duplicateIds).toHaveLength(2);
			expect(duplicateIds[0]).toBe('duplicate-1');
			expect(duplicateIds[1]).toBe('duplicate-2');
			expect(state.compositionState.items['duplicate-1']).toBeDefined();
			expect(state.compositionState.items['duplicate-2']).toBeDefined();
		});

		it('should preserve all BaseItem properties', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				top: 100,
				left: 200,
				width: 500,
				height: 300,
				opacity: 0.75,
			});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			const duplicate = state.compositionState.items['duplicate-1'];
			expect(duplicate.top).toBe(100);
			expect(duplicate.left).toBe(200);
			expect(duplicate.width).toBe(500);
			expect(duplicate.height).toBe(300);
			expect(duplicate.opacity).toBe(0.75);
		});
	});

	describe('Return value', () => {
		it('should return array of new item IDs in same order as input', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockTextItem({id: 'item-2', trackId: 'track-2'});
			const item3 = createMockSolidItem({id: 'item-3', trackId: 'track-3'});
			const state = createMockStateWithItems([item1, item2, item3]);

			const duplicateIds = duplicateItems(state, [
				'item-1',
				'item-2',
				'item-3',
			]);

			expect(duplicateIds).toHaveLength(3);
			expect(duplicateIds[0]).toBe('duplicate-1');
			expect(duplicateIds[1]).toBe('duplicate-2');
			expect(duplicateIds[2]).toBe('duplicate-3');
		});

		it('should return IDs that exist in state.items', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			const duplicateIds = duplicateItems(state, ['item-1']);

			duplicateIds.forEach((id) => {
				expect(state.compositionState.items[id]).toBeDefined();
			});
		});
	});

	describe('findSpaceForItem integration', () => {
		it('should call findSpaceForItem with correct parameters', async () => {
			const {findSpaceForItem} = await import(
				'../../../utils/find-space-for-item'
			);
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				durationInFrames: 90,
				from: 30,
			});
			const state = createMockStateWithItems([item1]);

			duplicateItems(state, ['item-1']);

			expect(findSpaceForItem).toHaveBeenCalledWith({
				durationInFrames: 90,
				startAt: 30,
				tracks: state.compositionState.tracks,
				startPosition: {type: 'directly-above', trackIndex: 0},
				stopOnFirstFound: false,
				items: expect.any(Object),
			});
		});

		it('should pass correct trackIndex to findSpaceForItem', async () => {
			const {findSpaceForItem} = await import(
				'../../../utils/find-space-for-item'
			);
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const item2 = createMockSolidItem({id: 'item-2', trackId: 'track-2'});
			const state = createMockStateWithItems([item1, item2]);

			duplicateItems(state, ['item-2']);

			// Should find track-2 at index 1
			const callArgs = vi.mocked(findSpaceForItem).mock.calls[0][0];
			expect(callArgs.startPosition).toEqual({
				type: 'directly-above',
				trackIndex: 1,
			});
		});
	});
});
