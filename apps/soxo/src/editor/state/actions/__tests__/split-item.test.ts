import {describe, it, expect, vi, beforeEach} from 'vitest';
import {splitItem} from '../split-item';
import {
	createMockSolidItem,
	createMockTextItem,
	createMockStateWithItems,
} from '../../../../test/test-helpers';
import {EditorStarterItem} from '../../../items/item-type';

// Mock dependencies
vi.mock('../../../utils/generate-random-id', () => ({
	generateRandomId: vi.fn(),
}));

// Don't mock getCurrentTimeline - use the real implementation

vi.mock('../../../../zustand/ui-store', () => ({
	default: {
		getState: vi.fn(() => ({
			setSelectedItems: vi.fn(),
		})),
	},
}));

vi.mock('../../../utils/fade', () => ({
	getCanFadeVisual: vi.fn(() => false),
	getCanFadeAudio: vi.fn(() => false),
}));

describe('splitItem', () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock generateRandomId to return predictable IDs
		let counter = 0;
		vi.mocked(
			(await import('../../../utils/generate-random-id')).generateRandomId,
		).mockImplementation(() => {
			counter++;
			return `split-${counter}`;
		});
	});

	describe('Basic splitting', () => {
		it('should split item into two new items', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 50,
			});

			// Original item should be deleted
			expect(state.compositionState.items['item-1']).toBeUndefined();

			// Two new items should exist
			expect(state.compositionState.items['split-1']).toBeDefined();
			expect(state.compositionState.items['split-2']).toBeDefined();

			// First item: from 0 to 50
			const firstItem = state.compositionState.items['split-1'];
			expect(firstItem.from).toBe(0);
			expect(firstItem.durationInFrames).toBe(50);

			// Second item: from 50 to 100
			const secondItem = state.compositionState.items['split-2'];
			expect(secondItem.from).toBe(50);
			expect(secondItem.durationInFrames).toBe(50);
		});

		it('should update track items array correctly', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 50,
			});

			const track = state.compositionState.tracks[0];
			expect(track.items).not.toContain('item-1');
			expect(track.items).toContain('split-1');
			expect(track.items).toContain('split-2');
		});

		it('should preserve all other item properties', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
				color: '#ff0000',
				opacity: 0.8,
				rotation: 45,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 50,
			});

			const firstItem = state.compositionState.items['split-1'];
			const secondItem = state.compositionState.items['split-2'];

			// Both items should preserve properties
			expect(firstItem.color).toBe('#ff0000');
			expect(firstItem.opacity).toBe(0.8);
			expect(firstItem.rotation).toBe(45);

			expect(secondItem.color).toBe('#ff0000');
			expect(secondItem.opacity).toBe(0.8);
			expect(secondItem.rotation).toBe(45);
		});
	});

	describe('Edge cases and validation', () => {
		it('should not split when frame position is at item start', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 100,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 100, // At start
			});

			// Should not split
			expect(state.compositionState.items['item-1']).toBeDefined();
			expect(state.compositionState.items['split-1']).toBeUndefined();
		});

		it('should not split when frame position is at item end', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 100,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 200, // At end
			});

			// Should not split
			expect(state.compositionState.items['item-1']).toBeDefined();
			expect(state.compositionState.items['split-1']).toBeUndefined();
		});

		it('should not split when frame position is before item start', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 100,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 50, // Before start
			});

			// Should not split
			expect(state.compositionState.items['item-1']).toBeDefined();
			expect(state.compositionState.items['split-1']).toBeUndefined();
		});

		it('should not split when frame position is after item end', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 100,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 250, // After end
			});

			// Should not split
			expect(state.compositionState.items['item-1']).toBeDefined();
			expect(state.compositionState.items['split-1']).toBeUndefined();
		});

		it('should handle splitting non-existent item gracefully', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
			});
			const state = createMockStateWithItems([item1]);

			expect(() => {
				splitItem({
					state,
					idToSplit: 'non-existent',
					framePosition: 50,
				});
			}).not.toThrow();
		});

		it('should handle splitting item not in any track gracefully', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'non-existent-track',
			});
			const state = createMockStateWithItems([]);

			// Manually add item without a track
			state.compositionState.items['item-1'] = item1;

			// Should not crash even if item has no track
			expect(() => {
				splitItem({
					state,
					idToSplit: 'item-1',
					framePosition: 50,
				});
			}).not.toThrow();

			// Item should remain unchanged
			expect(state.compositionState.items['item-1']).toBeDefined();
		});
	});

	describe('Video item splitting', () => {
		it('should adjust videoStartFromInSeconds for second item', () => {
			const videoItem = createMockSolidItem({
				id: 'video-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 120,
			}) as any;

			videoItem.type = 'video';
			videoItem.videoStartFromInSeconds = 5;

			const state = createMockStateWithItems([videoItem]);

			splitItem({
				state,
				idToSplit: 'video-1',
				framePosition: 60,
			});

			const firstItem = state.compositionState.items['split-1'] as any;
			const secondItem = state.compositionState.items['split-2'] as any;

			// First item keeps original start
			expect(firstItem.videoStartFromInSeconds).toBe(5);

			// Second item: 60 frames / 30 fps = 2 seconds offset
			expect(secondItem.videoStartFromInSeconds).toBe(7);
		});

		it('should handle video with undefined videoStartFromInSeconds', () => {
			const videoItem = createMockSolidItem({
				id: 'video-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 90,
			}) as any;

			videoItem.type = 'video';
			videoItem.videoStartFromInSeconds = undefined;

			const state = createMockStateWithItems([videoItem]);

			splitItem({
				state,
				idToSplit: 'video-1',
				framePosition: 30,
			});

			const secondItem = state.compositionState.items['split-2'] as any;

			// 30 frames / 30 fps = 1 second
			expect(secondItem.videoStartFromInSeconds).toBe(1);
		});
	});

	describe('Audio item splitting', () => {
		it('should adjust audioStartFromInSeconds for second item', () => {
			const audioItem = createMockSolidItem({
				id: 'audio-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 120,
			}) as any;

			audioItem.type = 'audio';
			audioItem.audioStartFromInSeconds = 3;

			const state = createMockStateWithItems([audioItem]);

			splitItem({
				state,
				idToSplit: 'audio-1',
				framePosition: 60,
			});

			const firstItem = state.compositionState.items['split-1'] as any;
			const secondItem = state.compositionState.items['split-2'] as any;

			// First item keeps original start
			expect(firstItem.audioStartFromInSeconds).toBe(3);

			// Second item: 60 frames / 30 fps = 2 seconds offset
			expect(secondItem.audioStartFromInSeconds).toBe(5);
		});
	});

	describe('GIF item splitting', () => {
		it('should adjust gifStartFromInSeconds for second item', () => {
			const gifItem = createMockSolidItem({
				id: 'gif-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 90,
			}) as any;

			gifItem.type = 'gif';
			gifItem.gifStartFromInSeconds = 1;

			const state = createMockStateWithItems([gifItem]);

			splitItem({
				state,
				idToSplit: 'gif-1',
				framePosition: 30,
			});

			const firstItem = state.compositionState.items['split-1'] as any;
			const secondItem = state.compositionState.items['split-2'] as any;

			// First item keeps original start
			expect(firstItem.gifStartFromInSeconds).toBe(1);

			// Second item: 30 frames / 30 fps = 1 second offset
			expect(secondItem.gifStartFromInSeconds).toBe(2);
		});
	});

	describe('Captions item splitting', () => {
		it('should adjust captionStartInSeconds for second item', () => {
			const captionsItem = createMockSolidItem({
				id: 'captions-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 150,
			}) as any;

			captionsItem.type = 'captions';
			captionsItem.captionStartInSeconds = 2;

			const state = createMockStateWithItems([captionsItem]);

			splitItem({
				state,
				idToSplit: 'captions-1',
				framePosition: 90,
			});

			const firstItem = state.compositionState.items['split-1'] as any;
			const secondItem = state.compositionState.items['split-2'] as any;

			// First item keeps original start
			expect(firstItem.captionStartInSeconds).toBe(2);

			// Second item: 90 frames / 30 fps = 3 seconds offset
			expect(secondItem.captionStartInSeconds).toBe(5);
		});
	});

	describe('Visual fade handling', () => {
		it('should handle visual fades correctly when item can fade', async () => {
			const {getCanFadeVisual} = await import('../../../utils/fade');

			vi.mocked(getCanFadeVisual).mockReturnValue(true);

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 120,
			}) as any;

			item1.fadeInDurationInSeconds = 1;
			item1.fadeOutDurationInSeconds = 1;

			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 60,
			});

			const firstItem = state.compositionState.items['split-1'] as any;
			const secondItem = state.compositionState.items['split-2'] as any;

			// First item keeps fade-in, loses fade-out
			expect(firstItem.fadeInDurationInSeconds).toBe(1);
			expect(firstItem.fadeOutDurationInSeconds).toBe(0);

			// Second item keeps fade-out, loses fade-in
			expect(secondItem.fadeInDurationInSeconds).toBe(0);
			expect(secondItem.fadeOutDurationInSeconds).toBe(1);
		});

		it('should clamp fade-in to first item duration', async () => {
			const {getCanFadeVisual} = await import('../../../utils/fade');

			vi.mocked(getCanFadeVisual).mockReturnValue(true);

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 90, // 3 seconds at 30fps
			}) as any;

			item1.fadeInDurationInSeconds = 5; // Longer than item
			item1.fadeOutDurationInSeconds = 1;

			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 30,
			});

			const firstItem = state.compositionState.items['split-1'] as any;

			// 30 frames / 30 fps = 1 second max
			expect(firstItem.fadeInDurationInSeconds).toBe(1);
		});

		it('should clamp fade-out to second item duration', async () => {
			const {getCanFadeVisual} = await import('../../../utils/fade');

			vi.mocked(getCanFadeVisual).mockReturnValue(true);

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 90,
			}) as any;

			item1.fadeInDurationInSeconds = 1;
			item1.fadeOutDurationInSeconds = 5; // Longer than item

			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 60,
			});

			const secondItem = state.compositionState.items['split-2'] as any;

			// 30 frames / 30 fps = 1 second max
			expect(secondItem.fadeOutDurationInSeconds).toBe(1);
		});
	});

	describe('Audio fade handling', () => {
		it('should handle audio fades correctly when item can fade audio', async () => {
			const {getCanFadeAudio} = await import('../../../utils/fade');

			vi.mocked(getCanFadeAudio).mockReturnValue(true);

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 120,
			}) as any;

			item1.audioFadeInDurationInSeconds = 1;
			item1.audioFadeOutDurationInSeconds = 1;

			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 60,
			});

			const firstItem = state.compositionState.items['split-1'] as any;
			const secondItem = state.compositionState.items['split-2'] as any;

			// First item keeps audio fade-in, loses audio fade-out
			expect(firstItem.audioFadeInDurationInSeconds).toBe(1);
			expect(firstItem.audioFadeOutDurationInSeconds).toBe(0);

			// Second item keeps audio fade-out, loses audio fade-in
			expect(secondItem.audioFadeInDurationInSeconds).toBe(0);
			expect(secondItem.audioFadeOutDurationInSeconds).toBe(1);
		});

		it('should clamp audio fade-in to first item duration', async () => {
			const {getCanFadeAudio} = await import('../../../utils/fade');

			vi.mocked(getCanFadeAudio).mockReturnValue(true);

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 60,
			}) as any;

			item1.audioFadeInDurationInSeconds = 5;
			item1.audioFadeOutDurationInSeconds = 1;

			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 30,
			});

			const firstItem = state.compositionState.items['split-1'] as any;

			// 30 frames / 30 fps = 1 second max
			expect(firstItem.audioFadeInDurationInSeconds).toBe(1);
		});

		it('should clamp audio fade-out to second item duration', async () => {
			const {getCanFadeAudio} = await import('../../../utils/fade');

			vi.mocked(getCanFadeAudio).mockReturnValue(true);

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 60,
			}) as any;

			item1.audioFadeInDurationInSeconds = 1;
			item1.audioFadeOutDurationInSeconds = 5;

			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 30,
			});

			const secondItem = state.compositionState.items['split-2'] as any;

			// 30 frames / 30 fps = 1 second max
			expect(secondItem.audioFadeOutDurationInSeconds).toBe(1);
		});
	});

	describe('UI store integration', () => {
		it('should update selection to second item after split', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 50,
			});

			// Should select second item
			expect(mockSetSelectedItems).toHaveBeenCalledWith(['split-2']);
		});

		it('should not update selection when split fails', async () => {
			const useUIStore = (await import('../../../../zustand/ui-store')).default;
			const mockSetSelectedItems = vi.fn();

			vi.mocked(useUIStore.getState).mockReturnValue({
				setSelectedItems: mockSetSelectedItems,
			});

			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 0, // At start - should not split
			});

			// Should not update selection
			expect(mockSetSelectedItems).not.toHaveBeenCalled();
		});
	});

	describe('Different split positions', () => {
		it('should split at 25% position correctly', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 25,
			});

			const firstItem = state.compositionState.items['split-1'];
			const secondItem = state.compositionState.items['split-2'];

			expect(firstItem.durationInFrames).toBe(25);
			expect(secondItem.durationInFrames).toBe(75);
		});

		it('should split at 75% position correctly', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 0,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 75,
			});

			const firstItem = state.compositionState.items['split-1'];
			const secondItem = state.compositionState.items['split-2'];

			expect(firstItem.durationInFrames).toBe(75);
			expect(secondItem.durationInFrames).toBe(25);
		});

		it('should split item not starting at 0', () => {
			const item1 = createMockSolidItem({
				id: 'item-1',
				trackId: 'track-1',
				from: 100,
				durationInFrames: 100,
			});
			const state = createMockStateWithItems([item1]);

			splitItem({
				state,
				idToSplit: 'item-1',
				framePosition: 150,
			});

			const firstItem = state.compositionState.items['split-1'];
			const secondItem = state.compositionState.items['split-2'];

			expect(firstItem.from).toBe(100);
			expect(firstItem.durationInFrames).toBe(50);
			expect(secondItem.from).toBe(150);
			expect(secondItem.durationInFrames).toBe(50);
		});
	});
});
