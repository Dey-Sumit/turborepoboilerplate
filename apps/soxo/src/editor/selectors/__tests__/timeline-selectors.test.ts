import {describe, it, expect, beforeEach} from 'vitest';
import useEditorStore from '../../../zustand/editor-store';
import type {EditorStarterItem} from '../../items/item-type';
import {
	selectTimelineItems,
	createSelectTimelineItem,
	selectTimelineItemsArray,
	createSelectTimelineItemsByTrack,
	selectTimelineItemCount,
	selectTimelineItemsSortedByFrame,
} from '../timeline-selectors';

// Helper function to create a minimal text item for testing
const createTestTextItem = (overrides: Partial<EditorStarterItem> = {}): EditorStarterItem => {
	return {
		id: 'test-item',
		type: 'text' as const,
		trackId: 'track-1',
		from: 0,
		durationInFrames: 100,
		x: 0,
		y: 0,
		width: 400,
		height: 100,
		rotation: 0,
		scale: 1,
		opacity: 1,
		crop: null,
		name: 'Test Item',
		locked: false,
		text: 'Test',
		fontFamily: 'Arial',
		fontSize: 48,
		color: '#FFFFFF',
		textAlign: 'left',
		textDirection: 'ltr',
		lineHeight: 1.2,
		letterSpacing: 0,
		wordSpacing: 0,
		fontStyle: {variant: 'normal', weight: '400'},
		textTransform: 'none',
		textDecoration: 'none',
		textBackground: null,
		...overrides,
	} as EditorStarterItem;
};

describe('Timeline Selectors', () => {
	beforeEach(() => {
		// Reset store to clean state
		useEditorStore.setState({
			compositionState: {
				tracks: [
					{
						id: 'track-1',
						items: ['item-1', 'item-2'],
						hidden: false,
						muted: false,
					},
					{
						id: 'track-2',
						items: ['item-3'],
						hidden: false,
						muted: false,
					},
				],
				items: {
					'item-1': createTestTextItem({
						id: 'item-1',
						trackId: 'track-1',
						name: 'Text 1',
						from: 0,
						durationInFrames: 100,
						x: 100,
						y: 200,
					}),
					'item-2': createTestTextItem({
						id: 'item-2',
						trackId: 'track-1',
						name: 'Text 2',
						from: 100,
						durationInFrames: 50,
						x: 300,
						y: 400,
					}),
					'item-3': createTestTextItem({
						id: 'item-3',
						trackId: 'track-2',
						name: 'Text 3',
						from: 50,
						durationInFrames: 75,
						x: 500,
						y: 600,
					}),
				},
				assets: {},
				fps: 30,
				compositionWidth: 1920,
				compositionHeight: 1080,
				deletedAssets: [],
				timelineViewStack: [{type: 'ROOT'}],
			},
		});
	});

	describe('selectTimelineItems', () => {
		it('should return only timeline properties', () => {
			const state = useEditorStore.getState();
			const timelineItems = selectTimelineItems(state);

			expect(Object.keys(timelineItems)).toHaveLength(3);

			const item1 = timelineItems['item-1'];
			expect(item1).toEqual({
				id: 'item-1',
				from: 0,
				durationInFrames: 100,
				trackId: 'track-1',
				name: 'Text 1',
				locked: false,
				type: 'text',
			});

			// Should NOT include canvas properties
			expect(item1).not.toHaveProperty('x');
			expect(item1).not.toHaveProperty('y');
			expect(item1).not.toHaveProperty('width');
			expect(item1).not.toHaveProperty('height');
			expect(item1).not.toHaveProperty('text');
			expect(item1).not.toHaveProperty('fontFamily');
		});

		it('should be memoized when state unchanged', () => {
			const state = useEditorStore.getState();
			const result1 = selectTimelineItems(state);
			const result2 = selectTimelineItems(state);

			// Same reference (memoized)
			expect(result1).toBe(result2);
		});

		it('should NOT recalculate when non-timeline properties change', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			// Change canvas property (x) - should NOT trigger recalculation
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].x = 999;
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			// Should be same reference (not recalculated)
			expect(result1).toBe(result2);

			// Verify the actual item still has the timeline properties
			expect(result2['item-1'].id).toBe('item-1');
		});

		it('should recalculate when timeline properties change', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			// Change timeline property (name)
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].name = 'Changed Name';
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			// Should be different reference (recalculated)
			expect(result1).not.toBe(result2);
			expect(result2['item-1'].name).toBe('Changed Name');
		});

		it('should recalculate when from changes', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].from = 50;
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			expect(result1).not.toBe(result2);
			expect(result2['item-1'].from).toBe(50);
		});

		it('should recalculate when durationInFrames changes', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].durationInFrames = 200;
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			expect(result1).not.toBe(result2);
			expect(result2['item-1'].durationInFrames).toBe(200);
		});

		it('should recalculate when locked changes', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].locked = true;
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			expect(result1).not.toBe(result2);
			expect(result2['item-1'].locked).toBe(true);
		});

		it('should recalculate when items added', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-4'] = createTestTextItem({
					id: 'item-4',
					trackId: 'track-1',
				});
				draft.compositionState.tracks[0].items.push('item-4');
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			expect(result1).not.toBe(result2);
			expect(Object.keys(result2)).toHaveLength(4);
			expect(result2['item-4']).toBeDefined();
		});

		it('should recalculate when items removed', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			useEditorStore.setState((draft) => {
				delete draft.compositionState.items['item-1'];
				draft.compositionState.tracks[0].items = ['item-2'];
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			expect(result1).not.toBe(result2);
			expect(Object.keys(result2)).toHaveLength(2);
			expect(result2['item-1']).toBeUndefined();
		});
	});

	describe('createSelectTimelineItem', () => {
		it('should select specific timeline item', () => {
			const state = useEditorStore.getState();
			const selector = createSelectTimelineItem();

			const item = selector(state, 'item-1');

			expect(item).toEqual({
				id: 'item-1',
				from: 0,
				durationInFrames: 100,
				trackId: 'track-1',
				name: 'Text 1',
				locked: false,
				type: 'text',
			});
		});

		it('should return undefined for non-existent item', () => {
			const state = useEditorStore.getState();
			const selector = createSelectTimelineItem();

			const item = selector(state, 'non-existent');

			expect(item).toBeUndefined();
		});

		it('should be memoized for same item', () => {
			const state = useEditorStore.getState();
			const selector = createSelectTimelineItem();

			const result1 = selector(state, 'item-1');
			const result2 = selector(state, 'item-1');

			// Same result (memoized)
			expect(result1).toBe(result2);
		});
	});

	describe('selectTimelineItemsArray', () => {
		it('should return items as array', () => {
			const state = useEditorStore.getState();
			const items = selectTimelineItemsArray(state);

			expect(Array.isArray(items)).toBe(true);
			expect(items).toHaveLength(3);

			// Check that all items are present
			const ids = items.map((item) => item.id);
			expect(ids).toContain('item-1');
			expect(ids).toContain('item-2');
			expect(ids).toContain('item-3');
		});

		it('should only include timeline properties', () => {
			const state = useEditorStore.getState();
			const items = selectTimelineItemsArray(state);

			items.forEach((item) => {
				expect(item).toHaveProperty('id');
				expect(item).toHaveProperty('from');
				expect(item).toHaveProperty('durationInFrames');
				expect(item).toHaveProperty('trackId');
				expect(item).toHaveProperty('name');
				expect(item).toHaveProperty('locked');
				expect(item).toHaveProperty('type');

				// Should not have canvas properties
				expect(item).not.toHaveProperty('x');
				expect(item).not.toHaveProperty('y');
			});
		});
	});

	describe('createSelectTimelineItemsByTrack', () => {
		it('should return items for specific track', () => {
			const state = useEditorStore.getState();
			const selector = createSelectTimelineItemsByTrack();

			const track1Items = selector(state, 'track-1');
			const track2Items = selector(state, 'track-2');

			expect(track1Items).toHaveLength(2);
			expect(track2Items).toHaveLength(1);

			expect(track1Items[0].trackId).toBe('track-1');
			expect(track1Items[1].trackId).toBe('track-1');
			expect(track2Items[0].trackId).toBe('track-2');
		});

		it('should return empty array for track with no items', () => {
			const state = useEditorStore.getState();
			const selector = createSelectTimelineItemsByTrack();

			const items = selector(state, 'non-existent-track');

			expect(items).toEqual([]);
		});

		it('should only include timeline properties', () => {
			const state = useEditorStore.getState();
			const selector = createSelectTimelineItemsByTrack();

			const items = selector(state, 'track-1');

			items.forEach((item) => {
				expect(item).not.toHaveProperty('x');
				expect(item).not.toHaveProperty('y');
				expect(item).not.toHaveProperty('text');
			});
		});
	});

	describe('selectTimelineItemCount', () => {
		it('should return correct count', () => {
			const state = useEditorStore.getState();
			const count = selectTimelineItemCount(state);

			expect(count).toBe(3);
		});

		it('should update when items added', () => {
			let state = useEditorStore.getState();
			const count1 = selectTimelineItemCount(state);

			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-4'] = createTestTextItem({
					id: 'item-4',
					trackId: 'track-1',
				});
			});

			state = useEditorStore.getState();
			const count2 = selectTimelineItemCount(state);

			expect(count1).toBe(3);
			expect(count2).toBe(4);
		});

		it('should update when items removed', () => {
			let state = useEditorStore.getState();
			const count1 = selectTimelineItemCount(state);

			useEditorStore.setState((draft) => {
				delete draft.compositionState.items['item-1'];
			});

			state = useEditorStore.getState();
			const count2 = selectTimelineItemCount(state);

			expect(count1).toBe(3);
			expect(count2).toBe(2);
		});
	});

	describe('selectTimelineItemsSortedByFrame', () => {
		it('should return items sorted by from', () => {
			const state = useEditorStore.getState();
			const items = selectTimelineItemsSortedByFrame(state);

			expect(items).toHaveLength(3);

			// Check order: item-1 (0), item-3 (50), item-2 (100)
			expect(items[0].id).toBe('item-1');
			expect(items[0].from).toBe(0);

			expect(items[1].id).toBe('item-3');
			expect(items[1].from).toBe(50);

			expect(items[2].id).toBe('item-2');
			expect(items[2].from).toBe(100);
		});

		it('should maintain sort order after state changes', () => {
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].from = 200;
			});

			const state = useEditorStore.getState();
			const items = selectTimelineItemsSortedByFrame(state);

			// New order: item-3 (50), item-2 (100), item-1 (200)
			expect(items[0].id).toBe('item-3');
			expect(items[1].id).toBe('item-2');
			expect(items[2].id).toBe('item-1');
		});

		it('should handle items with same from', () => {
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].from = 50;
				draft.compositionState.items['item-3'].from = 50;
			});

			const state = useEditorStore.getState();
			const items = selectTimelineItemsSortedByFrame(state);

			// Both item-1 and item-3 have frame 50, item-2 has frame 100
			expect(items[0].from).toBe(50);
			expect(items[1].from).toBe(50);
			expect(items[2].from).toBe(100);
		});
	});

	describe('Performance characteristics', () => {
		it('should not recalculate when multiple non-timeline properties change', () => {
			const state1 = useEditorStore.getState();
			const result1 = selectTimelineItems(state1);

			// Change multiple canvas properties
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].x = 999;
				draft.compositionState.items['item-1'].y = 888;
				draft.compositionState.items['item-1'].width = 777;
				draft.compositionState.items['item-1'].height = 666;
				draft.compositionState.items['item-1'].rotation = 45;
				draft.compositionState.items['item-1'].scale = 2;
				draft.compositionState.items['item-1'].opacity = 0.5;
			});

			const state2 = useEditorStore.getState();
			const result2 = selectTimelineItems(state2);

			// Should still be same reference (not recalculated)
			expect(result1).toBe(result2);
		});

		it('should handle large number of items efficiently', () => {
			// Create 1000 items
			const largeItems: Record<string, EditorStarterItem> = {};
			for (let i = 0; i < 1000; i++) {
				largeItems[`item-${i}`] = createTestTextItem({
					id: `item-${i}`,
					trackId: 'track-1',
					from: i * 10,
				});
			}

			useEditorStore.setState((draft) => {
				draft.compositionState.items = largeItems;
			});

			const state = useEditorStore.getState();
			const start = performance.now();
			const timelineItems = selectTimelineItems(state);
			const duration = performance.now() - start;

			expect(Object.keys(timelineItems)).toHaveLength(1000);
			// Should be fast (under 10ms for 1000 items)
			expect(duration).toBeLessThan(10);
		});
	});
});
