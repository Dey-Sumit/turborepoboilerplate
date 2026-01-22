import {describe, it, expect, vi, beforeEach} from 'vitest';
import {pasteItems} from '../paste-items';
import {
	createMockSolidItem,
	createMockTextItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';

// Mock dependencies
vi.mock('../../../utils/generate-random-id', () => ({
	generateRandomId: vi.fn(),
}));

vi.mock('../../../../zustand/ui-store', () => ({
	default: {
		getState: vi.fn(() => ({
			setSelectedItems: vi.fn(),
		})),
	},
}));

vi.mock('../add-item', () => ({
	addItem: vi.fn(),
}));

describe('pasteItems', () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock console.log to suppress output during tests
		vi.spyOn(console, 'log').mockImplementation(() => {});

		// Mock generateRandomId to return predictable IDs
		let counter = 0;
		vi.mocked(
			(await import('../../../utils/generate-random-id')).generateRandomId,
		).mockImplementation(() => {
			counter++;
			return `paste-${counter}`;
		});
	});

	describe('Basic pasting', () => {
		it('should paste a single item with offset', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 50,
				durationInFrames: 90,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 100, // Paste at frame 100
				position: null,
			});

			// Should call addItem with new ID and offset from
			expect(addItem).toHaveBeenCalledWith({
				state,
				item: expect.objectContaining({
					id: 'paste-1',
					from: 100, // 50 + (100 - 50) offset
					durationInFrames: 90,
				}),
				position: {type: 'front'},
			});
		});

		it('should paste multiple items maintaining relative positions', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({
				id: 'item-1',
				from: 0,
				durationInFrames: 30,
			});
			const item2 = createMockSolidItem({
				id: 'item-2',
				from: 50,
				durationInFrames: 40,
			});
			const item3 = createMockTextItem({
				id: 'item-3',
				from: 100,
				durationInFrames: 50,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2, item3],
				from: 200, // Paste at frame 200
				position: null,
			});

			// Min from is 0, offset is 200 - 0 = 200
			expect(addItem).toHaveBeenCalledTimes(3);

			// Check each item's from value (note: items are reversed before processing)
			const calls = vi.mocked(addItem).mock.calls;

			// Item 3 added first (reversed) - gets ID paste-1
			expect(calls[0][0].item.from).toBe(300); // 100 + 200 offset

			// Item 2 added second - gets ID paste-2
			expect(calls[1][0].item.from).toBe(250); // 50 + 200 offset

			// Item 1 added last - gets ID paste-3
			expect(calls[2][0].item.from).toBe(200); // 0 + 200 offset
		});

		it('should generate new IDs for pasted items', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'original-1',
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 0,
				position: null,
			});

			// Should have new ID
			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						id: 'paste-1',
					}),
				}),
			);
		});

		it('should preserve all item properties except id and from', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockTextItem({
				id: 'item-1',
				from: 0,
				durationInFrames: 90,
				text: 'Hello World',
				fontSize: 64,
				color: '#ff0000',
				opacity: 0.8,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 100,
				position: null,
			});

			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						durationInFrames: 90,
						text: 'Hello World',
						fontSize: 64,
						color: '#ff0000',
						opacity: 0.8,
					}),
				}),
			);
		});
	});

	describe('Offset calculation', () => {
		it('should calculate offset based on leftmost item', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({id: 'item-1', from: 100});
			const item2 = createMockSolidItem({id: 'item-2', from: 50}); // Leftmost
			const item3 = createMockSolidItem({id: 'item-3', from: 150});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2, item3],
				from: 200, // Paste at 200
				position: null,
			});

			// Min from is 50, offset is 200 - 50 = 150
			// Items are reversed: [item3, item2, item1]
			const calls = vi.mocked(addItem).mock.calls;

			expect(calls[0][0].item.from).toBe(300); // item3: 150 + 150
			expect(calls[1][0].item.from).toBe(200); // item2: 50 + 150
			expect(calls[2][0].item.from).toBe(250); // item1: 100 + 150
		});

		it('should handle negative offset when pasting before original position', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				from: 100,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 50, // Paste before original
				position: null,
			});

			// Offset: 50 - 100 = -50
			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						from: 50, // 100 + (-50)
					}),
				}),
			);
		});

		it('should handle zero offset when pasting at same position', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				from: 100,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 100, // Same position
				position: null,
			});

			// Offset: 100 - 100 = 0
			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						from: 100,
					}),
				}),
			);
		});
	});

	describe('Position override', () => {
		it('should center item at provided position', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				from: 0,
				width: 200,
				height: 100,
				left: 0,
				top: 0,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 0,
				position: {x: 500, y: 300},
			});

			// Should center: x - width/2, y - height/2
			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						left: 400, // 500 - 200/2
						top: 250, // 300 - 100/2
					}),
				}),
			);
		});

		it('should not modify position when position is null', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				from: 0,
				left: 100,
				top: 200,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 0,
				position: null,
			});

			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						left: 100, // Original value
						top: 200, // Original value
					}),
				}),
			);
		});

		it('should apply position to all pasted items', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({
				id: 'item-1',
				from: 0,
				width: 100,
				height: 100,
			});
			const item2 = createMockSolidItem({
				id: 'item-2',
				from: 50,
				width: 200,
				height: 150,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2],
				from: 0,
				position: {x: 400, y: 300},
			});

			const calls = vi.mocked(addItem).mock.calls;

			// Item 1
			expect(calls[1][0].item.left).toBe(350); // 400 - 100/2
			expect(calls[1][0].item.top).toBe(250); // 300 - 100/2

			// Item 2
			expect(calls[0][0].item.left).toBe(300); // 400 - 200/2
			expect(calls[0][0].item.top).toBe(225); // 300 - 150/2
		});
	});

	describe('Layer order', () => {
		it('should reverse order when adding items to front', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({id: 'item-1', from: 0});
			const item2 = createMockSolidItem({id: 'item-2', from: 0});
			const item3 = createMockSolidItem({id: 'item-3', from: 0});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2, item3],
				from: 0,
				position: null,
			});

			const calls = vi.mocked(addItem).mock.calls;

			// Items are reversed before processing, so:
			// item3 is processed first and gets ID paste-1
			// item2 is processed second and gets ID paste-2
			// item1 is processed third and gets ID paste-3
			expect(calls[0][0].item.id).toBe('paste-1'); // item3
			expect(calls[1][0].item.id).toBe('paste-2'); // item2
			expect(calls[2][0].item.id).toBe('paste-3'); // item1
		});

		it('should add all items to front position', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({id: 'item-1'});
			const item2 = createMockSolidItem({id: 'item-2'});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2],
				from: 0,
				position: null,
			});

			const calls = vi.mocked(addItem).mock.calls;

			// All should use front position
			expect(calls[0][0].position).toEqual({type: 'front'});
			expect(calls[1][0].position).toEqual({type: 'front'});
		});
	});

	describe('Selection update', () => {
		it('should select all pasted items', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({id: 'item-1'});
			const item2 = createMockSolidItem({id: 'item-2'});
			const item3 = createMockTextItem({id: 'item-3'});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2, item3],
				from: 0,
				position: null,
			});

			// Items are processed in reverse order:
			// item3 gets ID paste-1, item2 gets paste-2, item1 gets paste-3
			// idsToSelect array is built in that order
			expect(mockSetSelectedItems).toHaveBeenCalledWith([
				'paste-1',
				'paste-2',
				'paste-3',
			]);
		});

		it('should select single pasted item', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				setSelectedItems: mockSetSelectedItems,
			});

			const copiedItem = createMockSolidItem({id: 'item-1'});
			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 0,
				position: null,
			});

			expect(mockSetSelectedItems).toHaveBeenCalledWith(['paste-1']);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty copiedItems array', async () => {
			const {addItem} = await import('../add-item');
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				setSelectedItems: mockSetSelectedItems,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [],
				from: 0,
				position: null,
			});

			expect(addItem).not.toHaveBeenCalled();
			expect(mockSetSelectedItems).toHaveBeenCalledWith([]);
		});

		it('should handle items with very large from values', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				from: 10000,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 20000,
				position: null,
			});

			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						from: 20000,
					}),
				}),
			);
		});

		it('should handle items with from value of 0', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({id: 'item-1', from: 0});
			const item2 = createMockSolidItem({id: 'item-2', from: 100});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2],
				from: 50,
				position: null,
			});

			const calls = vi.mocked(addItem).mock.calls;

			// Min from is 0, offset is 50
			expect(calls[1][0].item.from).toBe(50); // 0 + 50
			expect(calls[0][0].item.from).toBe(150); // 100 + 50
		});
	});

	describe('Different item types', () => {
		it('should paste text items correctly', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockTextItem({
				id: 'text-1',
				from: 0,
				text: 'Test Text',
				fontSize: 48,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 100,
				position: null,
			});

			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						type: 'text',
						text: 'Test Text',
						fontSize: 48,
					}),
				}),
			);
		});

		it('should paste mixed item types correctly', async () => {
			const {addItem} = await import('../add-item');

			const solidItem = createMockSolidItem({id: 'solid-1', from: 0});
			const textItem = createMockTextItem({id: 'text-1', from: 50});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [solidItem, textItem],
				from: 100,
				position: null,
			});

			const calls = vi.mocked(addItem).mock.calls;

			expect(calls[1][0].item.type).toBe('solid');
			expect(calls[0][0].item.type).toBe('text');
		});
	});

	describe('Complex scenarios', () => {
		it('should handle pasting with both offset and position override', async () => {
			const {addItem} = await import('../add-item');

			const copiedItem = createMockSolidItem({
				id: 'item-1',
				from: 50,
				width: 100,
				height: 100,
				left: 0,
				top: 0,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [copiedItem],
				from: 200,
				position: {x: 500, y: 300},
			});

			expect(addItem).toHaveBeenCalledWith(
				expect.objectContaining({
					item: expect.objectContaining({
						from: 200, // 50 + (200 - 50) offset
						left: 450, // 500 - 100/2
						top: 250, // 300 - 100/2
					}),
				}),
			);
		});

		it('should maintain relative timing when pasting multiple items', async () => {
			const {addItem} = await import('../add-item');

			const item1 = createMockSolidItem({
				id: 'item-1',
				from: 0,
				durationInFrames: 30,
			});
			const item2 = createMockSolidItem({
				id: 'item-2',
				from: 30, // Immediately after item1
				durationInFrames: 30,
			});
			const item3 = createMockSolidItem({
				id: 'item-3',
				from: 60, // Immediately after item2
				durationInFrames: 30,
			});

			const state = createMockStateWithItems([]);

			pasteItems({
				state,
				copiedItems: [item1, item2, item3],
				from: 100,
				position: null,
			});

			const calls = vi.mocked(addItem).mock.calls;

			// Should maintain 30-frame gaps
			expect(calls[2][0].item.from).toBe(100); // item1
			expect(calls[1][0].item.from).toBe(130); // item2
			expect(calls[0][0].item.from).toBe(160); // item3
		});
	});
});
