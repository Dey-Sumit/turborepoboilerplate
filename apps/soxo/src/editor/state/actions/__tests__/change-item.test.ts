import {describe, it, expect, vi, beforeEach} from 'vitest';
import {changeItem} from '../change-item';
import {
	createMockEditorState,
	createMockSolidItem,
	createMockTextItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';

// Mock getCurrentTimeline helper
vi.mock('../../helpers/get-current-timeline', () => ({
	getCurrentTimeline: vi.fn((compositionState) => ({
		tracks: compositionState.tracks,
		items: compositionState.items,
	})),
}));

describe('changeItem', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic item updates', () => {
		it('should update item properties using updater function', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#00ff00',
			}));

			expect(state.compositionState.items['item-1'].color).toBe('#00ff00');
		});

		it('should update text item properties', () => {
			const item1 = createMockTextItem({
				id: 'item-1',
				trackId: 'track-1',
				text: 'Hello',
				fontSize: 48,
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				text: 'World',
				fontSize: 64,
			}));

			const updated = state.compositionState.items['item-1'] as any;
			expect(updated.text).toBe('World');
			expect(updated.fontSize).toBe(64);
		});

		it('should update multiple properties at once', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
				opacity: 1,
				rotation: 0,
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#0000ff',
				opacity: 0.5,
				rotation: 45,
			}));

			const updated = state.compositionState.items['item-1'];
			expect(updated.color).toBe('#0000ff');
			expect(updated.opacity).toBe(0.5);
			expect(updated.rotation).toBe(45);
		});
	});

	describe('Updater function behavior', () => {
		it('should receive the current item as argument', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			const updater = vi.fn((item) => item);

			changeItem(state, 'item-1', updater);

			expect(updater).toHaveBeenCalledWith(item1);
		});

		it('should only update if updater returns different object', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			// Updater returns same item reference
			changeItem(state, 'item-1', (item) => item);

			// Item should remain the same reference
			expect(state.compositionState.items['item-1']).toBe(item1);
		});

		it('should update when updater returns new object', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#00ff00',
			}));

			// Item should be updated
			expect(state.compositionState.items['item-1']).not.toBe(item1);
			expect(state.compositionState.items['item-1'].color).toBe('#00ff00');
		});
	});

	describe('Context-aware search', () => {
		it('should find item in current timeline context', async () => {
			const {getCurrentTimeline} = await import(
				'../../helpers/get-current-timeline'
			);
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#00ff00',
			}));

			// Should call getCurrentTimeline to get context
			expect(getCurrentTimeline).toHaveBeenCalled();
		});

		it('should update item in state when found in current timeline', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#0000ff',
			}));

			expect(state.compositionState.items['item-1'].color).toBe('#0000ff');
		});

		it('should fall back to root items if not in current timeline', async () => {
			const state = createMockEditorState();

			// Add item directly to root items, bypassing timeline
			state.compositionState.items['item-1'] = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});

			// Mock getCurrentTimeline to return empty timeline
			vi.mocked(
				(await import('../../helpers/get-current-timeline')).getCurrentTimeline,
			).mockReturnValue({
				tracks: [],
				items: {},
			});

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#00ff00',
			}));

			expect(state.compositionState.items['item-1'].color).toBe('#00ff00');
		});
	});

	describe('Non-existent items', () => {
		it('should handle updating non-existent item gracefully', () => {
			const item1 = createMockSolidItem({id: 'item-1', trackId: 'track-1'});
			const state = createMockStateWithItems([item1]);

			// Should not throw when item doesn't exist
			expect(() => {
				changeItem(state, 'non-existent', (item) => ({
					...item,
					color: '#00ff00',
				}));
			}).not.toThrow();
		});

		it('should not modify state when item not found', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'non-existent', (item) => ({
				...item,
				color: '#00ff00',
			}));

			// Original item should remain unchanged
			expect(state.compositionState.items['item-1'].color).toBe('#ff0000');
		});
	});

	describe('Different update scenarios', () => {
		it('should update position properties', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				top: 0,
				left: 0,
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				top: 100,
				left: 200,
			}));

			expect(state.compositionState.items['item-1'].top).toBe(100);
			expect(state.compositionState.items['item-1'].left).toBe(200);
		});

		it('should update size properties', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				width: 1080,
				height: 1920,
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				width: 500,
				height: 500,
			}));

			expect(state.compositionState.items['item-1'].width).toBe(500);
			expect(state.compositionState.items['item-1'].height).toBe(500);
		});

		it('should update timing properties', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				durationInFrames: 90,
				from: 0,
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				durationInFrames: 120,
				from: 30,
			}));

			expect(state.compositionState.items['item-1'].durationInFrames).toBe(
				120,
			);
			expect(state.compositionState.items['item-1'].from).toBe(30);
		});

		it('should update transition properties', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				transition: {},
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				transition: {
					toNext: {type: 'fade', durationInFrames: 10},
				},
			}));

			expect(state.compositionState.items['item-1'].transition).toEqual({
				toNext: {type: 'fade', durationInFrames: 10},
			});
		});

		it('should update animation config', () => {
			const item1 = createMockTextItem({
				id: 'item-1',
				trackId: 'track-1',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				animation: {
					type: 'fade-in',
					delay: 0,
					duration: 1,
					target: 'container',
					stagger: 0,
				},
			}));

			expect(state.compositionState.items['item-1'].animation).toEqual({
				type: 'fade-in',
				delay: 0,
				duration: 1,
				target: 'container',
				stagger: 0,
			});
		});
	});

	describe('Batch updates', () => {
		it('should handle multiple sequential updates to same item', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
				opacity: 1,
			});
			const state = createMockStateWithItems([item1]);

			// First update
			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#00ff00',
			}));

			// Second update
			changeItem(state, 'item-1', (item) => ({
				...item,
				opacity: 0.5,
			}));

			expect(state.compositionState.items['item-1'].color).toBe('#00ff00');
			expect(state.compositionState.items['item-1'].opacity).toBe(0.5);
		});

		it('should handle updates to different items', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const item2 = createMockSolidItem({
				id: 'item-2',
				trackId: 'track-1',
				color: '#00ff00',
			});
			const state = createMockStateWithItems([item1, item2]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#0000ff',
			}));
			changeItem(state, 'item-2', (item) => ({
				...item,
				color: '#ff00ff',
			}));

			expect(state.compositionState.items['item-1'].color).toBe('#0000ff');
			expect(state.compositionState.items['item-2'].color).toBe('#ff00ff');
		});
	});

	describe('Edge cases', () => {
		it('should handle empty state', () => {
			const state = createMockEditorState();

			expect(() => {
				changeItem(state, 'item-1', (item) => ({
					...item,
					color: '#00ff00',
				}));
			}).not.toThrow();
		});

		it('should preserve item type', () => {
			const item1 = createMockTextItem({
				id: 'item-1',
				trackId: 'track-1',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				fontSize: 64,
			}));

			expect(state.compositionState.items['item-1'].type).toBe('text');
		});

		it('should not change item ID', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
			});
			const state = createMockStateWithItems([item1]);

			changeItem(state, 'item-1', (item) => ({
				...item,
				color: '#00ff00',
			}));

			expect(state.compositionState.items['item-1'].id).toBe('item-1');
		});

		it('should work with complex updater logic', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				opacity: 0.5,
			});
			const state = createMockStateWithItems([item1]);

			// Complex updater with conditional logic
			changeItem(state, 'item-1', (item) => ({
				...item,
				opacity: item.opacity < 1 ? 1 : 0,
			}));

			expect(state.compositionState.items['item-1'].opacity).toBe(1);
		});
	});

	describe('Performance optimization', () => {
		it('should not create new object when updater returns same reference', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			const originalItem = state.compositionState.items['item-1'];

			changeItem(state, 'item-1', (item) => item);

			// Should be same reference
			expect(state.compositionState.items['item-1']).toBe(originalItem);
		});

		it('should create new object when updater returns different reference', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				color: '#ff0000',
			});
			const state = createMockStateWithItems([item1]);

			const originalItem = state.compositionState.items['item-1'];

			changeItem(state, 'item-1', (item) => ({
				...item,
			}));

			// Should be different reference even if values are same
			expect(state.compositionState.items['item-1']).not.toBe(originalItem);
		});
	});
});
