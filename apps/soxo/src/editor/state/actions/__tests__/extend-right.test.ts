import {describe, it, expect, vi, beforeEach} from 'vitest';
import {
	extendRight,
	getMaximumDurationWhenExtendingRight,
	getMaximumDurationWhenExtendingRightBasedOnAsset,
	getMaximumDurationWhenExtendingRightBasedOnNextItem,
} from '../extend-right';
import {
	createMockSolidItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';
import {EditorStarterItem} from '../../../items/item-type';
import {EditorStarterAsset} from '../../../assets/assets';

// Mock dependencies
vi.mock('../../../assets/utils', () => ({
	getAssetStartInSeconds: vi.fn(() => 1.0),
	getAssetDurationInSeconds: vi.fn(() => 10.0),
}));

vi.mock('../../../items/get-item-playback-rate', () => ({
	getItemPlaybackRate: vi.fn(() => 1),
}));

vi.mock('../../../timeline/timeline-item/timeline-item-extend-handles/clamp-fade-duration', () => ({
	clampFadeDurations: vi.fn((params) => params.item),
}));

describe('extend-right', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getMaximumDurationWhenExtendingRightBasedOnNextItem', () => {
		it('should return Infinity when there is no next item', () => {
			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({id: 'item-1', from: 100}),
			};

			const result = getMaximumDurationWhenExtendingRightBasedOnNextItem({
				trackItemsSorted: ['item-1'],
				items,
				itemIndex: 0,
				initialFrom: 100,
			});

			expect(result).toBe(Infinity);
		});

		it('should return distance to next item start', () => {
			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 100,
					durationInFrames: 90,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 250,
					durationInFrames: 50,
				}),
			};

			const result = getMaximumDurationWhenExtendingRightBasedOnNextItem({
				trackItemsSorted: ['item-1', 'item-2'],
				items,
				itemIndex: 0,
				initialFrom: 100,
			});

			// Max duration = 250 - 100 = 150
			expect(result).toBe(150);
		});

		it('should handle multiple items correctly', () => {
			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 50,
					durationInFrames: 30,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 100,
					durationInFrames: 40,
				}),
				'item-3': createMockSolidItem({
					id: 'item-3',
					from: 200,
					durationInFrames: 90,
				}),
			};

			const result = getMaximumDurationWhenExtendingRightBasedOnNextItem({
				trackItemsSorted: ['item-1', 'item-2', 'item-3'],
				items,
				itemIndex: 1,
				initialFrom: 100,
			});

			// Max duration = 200 - 100 = 100
			expect(result).toBe(100);
		});
	});

	describe('getMaximumDurationWhenExtendingRightBasedOnAsset', () => {
		it('should return Infinity when item has no asset start', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({id: 'item-1', from: 100});
			const asset = {id: 'asset-1'} as EditorStarterAsset;

			const result = getMaximumDurationWhenExtendingRightBasedOnAsset({
				asset,
				fps: 30,
				prevItem: item,
			});

			expect(result).toBe(Infinity);
		});

		it('should throw error when asset is null but item has asset start', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);

			const item = createMockSolidItem({id: 'item-1', from: 100});

			expect(() => {
				getMaximumDurationWhenExtendingRightBasedOnAsset({
					asset: null,
					fps: 30,
					prevItem: item,
				});
			}).toThrow('Asset not found');
		});

		it('should throw error when asset duration is null', async () => {
			const {getAssetStartInSeconds, getAssetDurationInSeconds} = await import(
				'../../../assets/utils'
			);
			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);
			vi.mocked(getAssetDurationInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({id: 'item-1', from: 100});
			const asset = {id: 'asset-1'} as EditorStarterAsset;

			expect(() => {
				getMaximumDurationWhenExtendingRightBasedOnAsset({
					asset,
					fps: 30,
					prevItem: item,
				});
			}).toThrow('Asset duration is null');
		});

		it('should calculate available frames based on asset duration', async () => {
			const {getAssetStartInSeconds, getAssetDurationInSeconds} = await import(
				'../../../assets/utils'
			);
			vi.mocked(getAssetStartInSeconds).mockReturnValue(2.0);
			vi.mocked(getAssetDurationInSeconds).mockReturnValue(10.0);

			const item = createMockSolidItem({id: 'item-1', from: 100});
			const asset = {id: 'asset-1'} as EditorStarterAsset;

			const result = getMaximumDurationWhenExtendingRightBasedOnAsset({
				asset,
				fps: 30,
				prevItem: item,
			});

			// (10.0 * 30 - 2.0 * 30) / 1 = 240 frames
			expect(result).toBe(240);
		});

		it('should handle playback rate in calculation', async () => {
			const {getAssetStartInSeconds, getAssetDurationInSeconds} = await import(
				'../../../assets/utils'
			);
			const {getItemPlaybackRate} = await import(
				'../../../items/get-item-playback-rate'
			);

			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);
			vi.mocked(getAssetDurationInSeconds).mockReturnValue(10.0);
			vi.mocked(getItemPlaybackRate).mockReturnValue(2); // 2x speed

			const item = createMockSolidItem({id: 'item-1', from: 100});
			const asset = {id: 'asset-1'} as EditorStarterAsset;

			const result = getMaximumDurationWhenExtendingRightBasedOnAsset({
				asset,
				fps: 30,
				prevItem: item,
			});

			// (10.0 * 30 - 1.0 * 30) / 2 = 135 frames
			expect(result).toBe(135);
		});
	});

	describe('getMaximumDurationWhenExtendingRight', () => {
		it('should return minimum of all constraints', async () => {
			const {getAssetStartInSeconds, getAssetDurationInSeconds} = await import(
				'../../../assets/utils'
			);
			const {getItemPlaybackRate} = await import(
				'../../../items/get-item-playback-rate'
			);

			vi.mocked(getAssetStartInSeconds).mockReturnValue(1.0);
			vi.mocked(getAssetDurationInSeconds).mockReturnValue(5.0);
			vi.mocked(getItemPlaybackRate).mockReturnValue(1);

			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 100,
					durationInFrames: 90,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 250,
					durationInFrames: 50,
				}),
			};
			const asset = {id: 'asset-1'} as EditorStarterAsset;

			const result = getMaximumDurationWhenExtendingRight({
				trackItemsSorted: ['item-1', 'item-2'],
				items,
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				asset,
				prevItem: items['item-1'],
				visibleFrames: 500,
			});

			// Next item constraint: 250 - 100 = 150
			// Asset constraint: (5.0 * 30 - 1.0 * 30) / 1 = 120
			// Visible frames constraint: 500 - 100 = 400
			// Min = 120
			expect(result).toBe(120);
		});

		it('should use visible frames as constraint', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 100,
					durationInFrames: 90,
				}),
			};

			const result = getMaximumDurationWhenExtendingRight({
				trackItemsSorted: ['item-1'],
				items,
				itemIndex: 0,
				initialFrom: 100,
				fps: 30,
				asset: null,
				prevItem: items['item-1'],
				visibleFrames: 300,
			});

			// Next item: Infinity
			// Asset: Infinity (no asset start)
			// Visible: 300 - 100 = 200
			// Min = 200
			expect(result).toBe(200);
		});
	});

	describe('extendRight function', () => {
		it('should extend item from right by offset', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendRight({
				prevItem: item,
				offsetInFrames: 20, // Extend right by 20 frames
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				asset: null,
				items: {'item-1': item},
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 1,
				visibleFrames: 500,
			});

			// New duration: 90 + 20 = 110
			// from should remain the same
			expect(result.durationInFrames).toBe(110);
			expect(result.from).toBe(100);
		});

		it('should clamp to maximum duration based on next item', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const items: Record<string, EditorStarterItem> = {
				'item-1': createMockSolidItem({
					id: 'item-1',
					from: 100,
					durationInFrames: 90,
				}),
				'item-2': createMockSolidItem({
					id: 'item-2',
					from: 200,
					durationInFrames: 50,
				}),
			};

			const result = extendRight({
				prevItem: items['item-1'],
				offsetInFrames: 150, // Try to extend beyond next item
				trackItemsSorted: ['item-1', 'item-2'],
				itemIndex: 0,
				asset: null,
				items,
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 1,
				visibleFrames: 500,
			});

			// Should clamp to 100 (200 - 100 = max 100 frames)
			expect(result.durationInFrames).toBe(100);
		});

		it('should ensure minimum duration of 1 frame', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendRight({
				prevItem: item,
				offsetInFrames: -100, // Try to shrink below 1
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				asset: null,
				items: {'item-1': item},
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 1,
				visibleFrames: 500,
			});

			// Should clamp to minimum of 1
			expect(result.durationInFrames).toBe(1);
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

			extendRight({
				prevItem: item,
				offsetInFrames: 20,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				asset: null,
				items: {'item-1': item},
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 2,
				visibleFrames: 500,
			});

			// Should clamp fade with prefer 'in' side
			expect(clampFadeDurations).toHaveBeenCalledWith(
				expect.objectContaining({
					fps: 30,
					preferSide: 'in',
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
				color: '#00ff00',
				opacity: 0.5,
			});

			const result = extendRight({
				prevItem: item,
				offsetInFrames: 30,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				asset: null,
				items: {'item-1': item},
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 1,
				visibleFrames: 500,
			});

			// Should preserve all other properties
			expect(result.color).toBe('#00ff00');
			expect(result.opacity).toBe(0.5);
			expect(result.type).toBe('solid');
			expect(result.from).toBe(100); // from shouldn't change
		});

		it('should handle zero offset correctly', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendRight({
				prevItem: item,
				offsetInFrames: 0,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				asset: null,
				items: {'item-1': item},
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 1,
				visibleFrames: 500,
			});

			// Should remain unchanged
			expect(result.durationInFrames).toBe(90);
			expect(result.from).toBe(100);
		});

		it('should handle visible frames constraint', async () => {
			const {getAssetStartInSeconds} = await import('../../../assets/utils');
			vi.mocked(getAssetStartInSeconds).mockReturnValue(null);

			const item = createMockSolidItem({
				id: 'item-1',
				from: 100,
				durationInFrames: 90,
			});

			const result = extendRight({
				prevItem: item,
				offsetInFrames: 200,
				trackItemsSorted: ['item-1'],
				itemIndex: 0,
				asset: null,
				items: {'item-1': item},
				fps: 30,
				initialDurationInFrames: 90,
				initialFrom: 100,
				pixelsPerFrame: 1,
				visibleFrames: 200, // Only 200 frames visible
			});

			// Max duration = 200 - 100 = 100
			expect(result.durationInFrames).toBe(100);
		});
	});
});
