import {describe, it, expect, beforeEach} from 'vitest';
import useEditorStore from '../../../zustand/editor-store';
import type {EditorStarterItem} from '../../items/item-type';
import {
	selectAllItems,
	selectAllTracks,
	selectItemIds,
	selectCompositionState,
	selectCurrentTimeline,
} from '../base-selectors';

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

describe('Base Selectors', () => {
	beforeEach(() => {
		// Reset store to clean state with test data
		useEditorStore.setState({
			compositionState: {
				tracks: [
					{
						id: 'track-1',
						items: ['item-1', 'item-2'],
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
					}),
					'item-2': createTestTextItem({
						id: 'item-2',
						trackId: 'track-1',
						name: 'Text 2',
						from: 100,
						durationInFrames: 100,
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

	describe('selectAllItems', () => {
		it('should return all items from current timeline', () => {
			const state = useEditorStore.getState();
			const items = selectAllItems(state);

			expect(Object.keys(items)).toHaveLength(2);
			expect(items['item-1']).toBeDefined();
			expect(items['item-2']).toBeDefined();
		});

		it('should return items object with correct structure', () => {
			const state = useEditorStore.getState();
			const items = selectAllItems(state);
			const item = items['item-1'];

			// Verify item has expected properties
			expect(item).toHaveProperty('id');
			expect(item).toHaveProperty('from');
			expect(item).toHaveProperty('durationInFrames');
			expect(item).toHaveProperty('trackId');
			expect(item).toHaveProperty('name');
			expect(item).toHaveProperty('x');
			expect(item).toHaveProperty('y');
			expect(item).toHaveProperty('width');
			expect(item).toHaveProperty('height');
		});

		it('should return same reference when state unchanged', () => {
			const state = useEditorStore.getState();
			const items1 = selectAllItems(state);
			const items2 = selectAllItems(state);

			// Same reference (no new object created)
			expect(items1).toBe(items2);
		});

		it('should return different reference after state change', () => {
			const state1 = useEditorStore.getState();
			const items1 = selectAllItems(state1);

			// Change item property
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-1'].name = 'Changed';
			});

			const state2 = useEditorStore.getState();
			const items2 = selectAllItems(state2);

			// Different reference (Immer creates new object)
			expect(items1).not.toBe(items2);
		});
	});

	describe('selectAllTracks', () => {
		it('should return all tracks from current timeline', () => {
			const state = useEditorStore.getState();
			const tracks = selectAllTracks(state);

			expect(tracks).toHaveLength(1);
			expect(tracks[0].id).toBe('track-1');
			expect(tracks[0].items).toEqual(['item-1', 'item-2']);
		});

		it('should return tracks with correct structure', () => {
			const state = useEditorStore.getState();
			const tracks = selectAllTracks(state);
			const track = tracks[0];

			expect(track).toHaveProperty('id');
			expect(track).toHaveProperty('items');
			expect(track).toHaveProperty('hidden');
			expect(track).toHaveProperty('muted');
		});

		it('should handle multiple tracks', () => {
			// Add second track
			useEditorStore.setState((draft) => {
				draft.compositionState.tracks.push({
					id: 'track-2',
					items: ['item-3'],
					hidden: false,
					muted: false,
				});
				draft.compositionState.items['item-3'] = createTestTextItem({
					id: 'item-3',
					trackId: 'track-2',
				});
			});

			const state = useEditorStore.getState();
			const tracks = selectAllTracks(state);

			expect(tracks).toHaveLength(2);
			expect(tracks[0].id).toBe('track-1');
			expect(tracks[1].id).toBe('track-2');
		});
	});

	describe('selectItemIds', () => {
		it('should return array of item IDs', () => {
			const state = useEditorStore.getState();
			const ids = selectItemIds(state);

			expect(ids).toHaveLength(2);
			expect(ids).toContain('item-1');
			expect(ids).toContain('item-2');
		});

		it('should return empty array when no items', () => {
			// Clear all items
			useEditorStore.setState((draft) => {
				draft.compositionState.items = {};
				draft.compositionState.tracks[0].items = [];
			});

			const state = useEditorStore.getState();
			const ids = selectItemIds(state);

			expect(ids).toEqual([]);
		});

		it('should update when items added', () => {
			const state1 = useEditorStore.getState();
			const ids1 = selectItemIds(state1);

			// Add new item
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-3'] = createTestTextItem({
					id: 'item-3',
					trackId: 'track-1',
				});
				draft.compositionState.tracks[0].items.push('item-3');
			});

			const state2 = useEditorStore.getState();
			const ids2 = selectItemIds(state2);

			expect(ids1).toHaveLength(2);
			expect(ids2).toHaveLength(3);
			expect(ids2).toContain('item-3');
		});
	});

	describe('selectCompositionState', () => {
		it('should return composition state', () => {
			const state = useEditorStore.getState();
			const compositionState = selectCompositionState(state);

			expect(compositionState).toBeDefined();
			expect(compositionState).toHaveProperty('tracks');
			expect(compositionState).toHaveProperty('items');
			expect(compositionState).toHaveProperty('timelineViewStack');
		});

		it('should return same reference when unchanged', () => {
			const state = useEditorStore.getState();
			const comp1 = selectCompositionState(state);
			const comp2 = selectCompositionState(state);

			expect(comp1).toBe(comp2);
		});
	});

	describe('selectCurrentTimeline', () => {
		it('should return root timeline data', () => {
			const state = useEditorStore.getState();
			const timeline = selectCurrentTimeline(state);

			expect(timeline).toHaveProperty('tracks');
			expect(timeline).toHaveProperty('items');
			expect(timeline.tracks).toHaveLength(1);
		});

		it('should return timeline with items and tracks', () => {
			const state = useEditorStore.getState();
			const timeline = selectCurrentTimeline(state);

			expect(timeline).toHaveProperty('items');
			expect(timeline).toHaveProperty('tracks');
			expect(Object.keys(timeline.items)).toHaveLength(2);
			expect(timeline.tracks).toHaveLength(1);
		});
	});

	describe('Integration', () => {
		it('all selectors should work together', () => {
			const state = useEditorStore.getState();

			const items = selectAllItems(state);
			const tracks = selectAllTracks(state);
			const ids = selectItemIds(state);
			const timeline = selectCurrentTimeline(state);

			// All should return data from same timeline
			expect(Object.keys(items)).toEqual(ids);
			expect(tracks[0].items).toEqual(ids);
			expect(timeline.items).toBe(items);
			expect(timeline.tracks).toBe(tracks);
		});

		it('should handle state updates correctly', () => {
			const state1 = useEditorStore.getState();
			const items1 = selectAllItems(state1);
			const tracks1 = selectAllTracks(state1);

			// Add item to track
			useEditorStore.setState((draft) => {
				draft.compositionState.items['item-3'] = createTestTextItem({
					id: 'item-3',
					trackId: 'track-1',
				});
				draft.compositionState.tracks[0].items.push('item-3');
			});

			const state2 = useEditorStore.getState();
			const items2 = selectAllItems(state2);
			const tracks2 = selectAllTracks(state2);
			const ids2 = selectItemIds(state2);

			// Verify all selectors see the new item
			expect(Object.keys(items2)).toHaveLength(3);
			expect(tracks2[0].items).toHaveLength(3);
			expect(ids2).toHaveLength(3);
			expect(items2['item-3']).toBeDefined();
		});
	});
});
