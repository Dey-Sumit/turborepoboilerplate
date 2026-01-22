import {describe, it, expect, vi, beforeEach} from 'vitest';
import {
	extendLeft,
	getMinimumFromWhenExtendingLeft,
	getMinimumFromWhenExtendingLeftBasedOnAsset,
	getMinimumFromWhenExtendingLeftBasedOnPreviousItem,
} from '../extend-left';
import {
	createMockSolidItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';
import {EditorStarterItem} from '../../../items/item-type';

// Mock dependencies
vi.mock('../../../assets/utils', () => ({
	getAssetStartInSeconds: vi.fn(() => 1.0),
}));

vi.mock('../../../items/get-item-playback-rate', () => ({
	getItemPlaybackRate: vi.fn(() => 1),
}));

vi.mock('../../../timeline/timeline-item/timeline-item-extend-handles/clamp-fade-duration', () => ({
	clampFadeDurations: vi.fn((params) => params.item),
}));

vi.mock('../update-start-duration', () => ({
	updateAssetStartDurationOfItem: vi.fn((params) => params.item),
}));

describe('extend-left', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getMinimumFromWhenExtendingLeftBasedOnPreviousItem', () => {
		it('should return 0 when there is no previous item', () => {
			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({id: 'item-1', from: 100}),
			};

			const result = getMinimumFromWhenExtendingLeftBasedOnPreviousItem({
				trackItemsSorted: ['item-1'],
				items,
				itemIndex: 0,
			});

			expect(result).toBe(0);
		});

		it('should return end position of previous item', () => {
			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 0,
					durationInFrames: 50,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 100,
					durationInFrames: 90,
				}),
			};

			const result = getMinimumFromWhenExtendingLeftBasedOnPreviousItem({
				trackItemsSorted: ['item-1', 'item-2'],
				items,
				itemIndex: 1,
			});

			// Previous item ends at 0 + 50 = 50
			expect(result).toBe(50);
		});

		it('should calculate correct end for multiple previous items', () => {
			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 0,
					durationInFrames: 30,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 50,
					durationInFrames: 40,
				}),
				'item-3': createMockSolidItem({
					id: 'item-3',
					from: 100,
					durationInFrames: 90,
				}),
			};

			const result = getMinimumFromWhenExtendingLeftBasedOnPreviousItem({
				trackItemsSorted: ['item-1', 'item-2', 'item-3'],
				items,
				itemIndex: 2,
			});

			// Previous item (item-2) ends at 50 + 40 = 90
			expect(result).toBe(90);
		});
	});

	describe('getMinimumFromWhenExtendingLeftBasedOnAsset', () => {
		it('should return null when asset has no start time', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({id: 'item-1', from: 100});

			const result = getMinimumFromWhenExtendingLeftBasedOnAsset({
				fps: 30,
				prevItem: item,
			});

			expect(result).toBeNull();
		});

		it('should calculate minimum from based on available asset frames', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(2.0);

			const item = createMockSolidItem({id: 'item-1', from: 100});

			const result = getMinimumFromWhenExtendingLeftBasedOnAsset({
				fps: 30,
				prevItem: item,
			});

			// 2.0 seconds * 30 fps = 60 frames available
			// minFrom = 100 - 60 = 40
			expect(result).toBe(40);
		});

		it('should handle playback rate in calculation', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			const {getItemPlaybackRate} = await import(
				'../../../items/get-item-playback-rate'
			);

			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);
			vi.mocked(getItemPlaybackRate).mockReturnValue(2); // 2x speed

			const item = createMockSolidItem({id: 'item-1', from: 100});

			const result = getMinimumFromWhenExtendingLeftBasedOnAsset({
				fps: 30,
				prevItem: item,
			});

			// 1.0 seconds * 30 fps / 2 playback rate = 15 frames available
			// minFrom = 100 - 15 = 85
			expect(result).toBe(85);
		});
	});

	describe('getMinimumFromWhenExtendingLeft', () => {
		it('should use maximum of previous item and asset constraints', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			const {getItemPlaybackRate} = await import(
				'../../../items/get-item-playback-rate'
			);

			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);
			vi.mocked(getItemPlaybackRate).mockReturnValue(1);

			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 0,
					durationInFrames: 80,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 100,
					durationInFrames: 90,
				}),
			};

			const result = getMinimumFromWhenExtendingLeft({
				trackItemsSorted: ['item-1', 'item-2'],
				items,
				itemIndex: 1,
				fps: 30,
				prevItem: items['item-2'],
			});

			// Previous item constraint: 80 (end of item-1)
			// Asset constraint: Math.round(100 - (1.0 * 30) / 1) = Math.round(100 - 30) = 70
			// Max of (80, 70) = 80
			expect(result).toBe(80);
		});

		it('should use 0 when asset constraint is null', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 100,
					durationInFrames: 90,
				}),
			};

			const result = getMinimumFromWhenExtendingLeft({
				trackItemsSorted: ['item-1'],
				items,
				itemIndex: 0,
				fps: 30,
				prevItem: items['item-1'],
			});

			// No previous item: 0
			// Asset constraint: null (treated as 0)
			expect(result).toBe(0);
		});
	});

	describe('extendLeft function', () => {
		it('should extend item from left by offset', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendLeft({
				prevItem: item,
				offsetInFrames: -10, // Extend left by 10 frames
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				items: {'item-1': item},
				initialDurationInFrames: 90,
				pixelsPerFrame: 1,
			});

			// New from: 100 + (-10) = 90
			// New duration: 100 + 90 - 90 = 100
			expect(result.from).toBe(90);
			expect(result.durationInFrames).toBe(100);
		});

		it('should clamp to minimum from based on previous item', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 0,
					durationInFrames: 80,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 100,
					durationInFrames: 90,
				}),
			};

			const result = extendLeft({
				prevItem: items['item-2'],
				offsetInFrames: -50, // Try to extend to 50, but should clamp to 80
				trackItemsSorted: ['item-1', 'item-2'],
				itemIndex: 1,
				initialFrom: 100,
				fps: 30,
				items,
				initialDurationInFrames: 90,
				pixelsPerFrame: 1,
			});

			// Should clamp to 80 (end of item-1)
			expect(result.from).toBe(80);
			expect(result.durationInFrames).toBe(110); // 100 + 90 - 80
		});

		it('should not extend beyond item end (max from)', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendLeft({
				prevItem: item,
				offsetInFrames: 100, // Try to move from past the end
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				items: {'item-1': item},
				initialDurationInFrames: 90,
				pixelsPerFrame: 1,
			});

			// Max from is initialFrom + initialDuration - 1 = 189
			// Should clamp to 189 with duration of 1
			expect(result.from).toBe(189);
			expect(result.durationInFrames).toBe(1);
		});

		it('should handle asset start offset for video items', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			const {updateAssetStartDurationOfItem} = await import(
				'../update-start-duration'
			);

			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			extendLeft({
				prevItem: item,
				offsetInFrames: -30,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				items: {'item-1': item},
				initialDurationInFrames: 90,
				pixelsPerFrame: 1,
			});

			// Should call updateAssetStartDurationOfItem
			expect(updateAssetStartDurationOfItem).toHaveBeenCalled();
		});

		it('should call clampFadeDurations with correct parameters', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			const {clampFadeDurations} = await import(
				'../../../timeline/timeline-item/timeline-item-extend-handles/clamp-fade-duration'
			);

			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			extendLeft({
				prevItem: item,
				offsetInFrames: -10,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				items: {'item-1': item},
				initialDurationInFrames: 90,
				pixelsPerFrame: 2,
			});

			// Should clamp fade with prefer 'out' side
			expect(clampFadeDurations).toHaveBeenCalledWith(
				expect.objectContaining({
					fps: 30,
					preferSide: 'out',
					pixelsPerFrame: 2,
				}),
			);
		});

		it('should preserve other item properties', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
				color: '#ff0000',
				opacity: 0.8,
			});

			const result = extendLeft({
				prevItem: item,
				offsetInFrames: -10,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				items: {'item-1': item},
				initialDurationInFrames: 90,
				pixelsPerFrame: 1,
			});

			// Should preserve all other properties
			expect(result.color).toBe('#ff0000');
			expect(result.opacity).toBe(0.8);
			expect(result.type).toBe('solid');
		});

		it('should handle zero offset correctly', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendLeft({
				prevItem: item,
				offsetInFrames: 0,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				items: {'item-1': item},
				initialDurationInFrames: 90,
				pixelsPerFrame: 1,
			});

			// Should remain unchanged
			expect(result.from).toBe(100);
			expect(result.durationInFrames).toBe(90);
		});
	});
});
