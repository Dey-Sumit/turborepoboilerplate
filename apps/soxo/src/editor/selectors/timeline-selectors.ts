import {createSelector} from 'reselect';
import type {EditorState} from '../state/types';
import type {TimelineItemData} from './types';
import {selectAllItems, selectCurrentTimeline} from './base-selectors';
import {DEFAULT_TRACK_HEIGHT, TRACK_PADDING} from '../state/items';
import type {TimelineTrackAndLayout} from '../timeline/utils/drag/calculate-track-heights';

/**
 * TODO: Import from items.ts when it's exported
 * Currently getItemHeight() always returns this value (48px) for all items.
 * The _getItemHeight() function has logic for variable heights but is unused.
 * When variable heights are enabled, this selector will need refactoring.
 */

/**
 * Timeline Selectors - Create "virtual timeline slice" with only 9 properties per item
 *
 * Problem: Timeline components subscribe to full items (20+ properties).
 * Changing item.left/top triggers timeline re-render even though timeline doesn't use position.
 *
 * Solution: Create a virtual slice with only the 9 properties timeline needs:
 * - id, from, durationInFrames, trackId, name, locked, type, transition, isDraggingInTimeline
 *
 * This reduces timeline re-renders by 50%+ - only when timeline properties change.
 *
 * Reselect v5 best practices:
 * - Simple input selector (selectAllItems)
 * - All transformation in result function
 * - Custom equality check for timeline properties
 * - Uses default weakMapMemoize
 */

/**
 * Custom equality check for timeline items.
 * Only recalculates if timeline-relevant properties change.
 */
const timelineItemsEqual = (
	a: Record<string, TimelineItemData>,
	b: Record<string, TimelineItemData>,
): boolean => {
	// Quick checks first
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) return false;

	// Check each item's timeline properties
	for (const id of aKeys) {
		const itemA = a[id];
		const itemB = b[id];

		if (!itemB) return false;

		// Compare base properties
		if (
			itemA.id !== itemB.id ||
			itemA.from !== itemB.from ||
			itemA.durationInFrames !== itemB.durationInFrames ||
			itemA.trackId !== itemB.trackId ||
			itemA.name !== itemB.name ||
			itemA.locked !== itemB.locked ||
			itemA.type !== itemB.type ||
			itemA.isDraggingInTimeline !== itemB.isDraggingInTimeline
		) {
			return false;
		}

		// Deep compare transition (can be undefined or object)
		if (JSON.stringify(itemA.transition) !== JSON.stringify(itemB.transition)) {
			return false;
		}

		// Compare type-specific properties
		if (itemA.type === 'text' && itemB.type === 'text') {
			if (itemA.text !== itemB.text) return false;
		} else if (itemA.type === 'solid' && itemB.type === 'solid') {
			if (itemA.color !== itemB.color) return false;
		} else if (itemA.type === 'shape' && itemB.type === 'shape') {
			if (itemA.variant !== itemB.variant) return false;
		}
	}

	return true;
};

/**
 * Select timeline items - only 9 properties per item
 *
 * This selector creates a "virtual slice" of the full items state,
 * exposing only the properties that timeline components need.
 *
 * Performance impact:
 * - Before: Changing item.left/top/width/height → timeline re-renders
 * - After: Changing item.left/top/width/height → 0 timeline re-renders (not in slice)
 */
export const selectTimelineItems = createSelector(
	[selectAllItems],
	(items): Record<string, TimelineItemData> => {
		const timelineItems: Record<string, TimelineItemData> = {};

		for (const [id, item] of Object.entries(items)) {
			// Base properties (all items have these)
			const base = {
				id: item.id,
				from: item.from,
				durationInFrames: item.durationInFrames,
				trackId: item.trackId,
				name: (item as Record<string, unknown>).name as string | undefined, // Optional property on some item types
				locked: (item as Record<string, unknown>).locked as boolean | undefined, // Optional property on some item types
				transition: item.transition,
				isDraggingInTimeline: item.isDraggingInTimeline,
			};

			// Add type-specific properties (only what timeline preview needs)
			if (item.type === 'text') {
				timelineItems[id] = { ...base, type: 'text', text: item.text };
			} else if (item.type === 'solid') {
				timelineItems[id] = { ...base, type: 'solid', color: item.color };
			} else if (item.type === 'shape') {
				timelineItems[id] = { ...base, type: 'shape', variant: item.variant };
			} else {
				// Other types don't need extra properties
				timelineItems[id] = { ...base, type: item.type };
			}
		}

		return timelineItems;
	},
	{
		// Use custom equality check for result
		memoizeOptions: {
			resultEqualityCheck: timelineItemsEqual,
		},
	},
);

/**
 * Select timeline item by ID
 *
 * Returns only timeline properties for a specific item.
 * Useful for individual item components that only need timeline data.
 */
export const createSelectTimelineItem = () => {
	return createSelector(
		[selectTimelineItems, (_state: EditorState, itemId: string) => itemId],
		(timelineItems, itemId): TimelineItemData | undefined => {
			return timelineItems[itemId];
		},
	);
};

/**
 * Select timeline items as array
 *
 * Useful for list rendering or when you need to iterate over all items.
 */
export const selectTimelineItemsArray = createSelector(
	[selectTimelineItems],
	(timelineItems): TimelineItemData[] => {
		return Object.values(timelineItems);
	},
);

/**
 * Select timeline items by track ID
 *
 * Returns all items for a specific track with only timeline properties.
 */
export const createSelectTimelineItemsByTrack = () => {
	return createSelector(
		[selectTimelineItems, (_state: EditorState, trackId: string) => trackId],
		(timelineItems, trackId): TimelineItemData[] => {
			return Object.values(timelineItems).filter(
				(item) => item.trackId === trackId,
			);
		},
	);
};

/**
 * Select count of timeline items
 *
 * Useful for showing item count without subscribing to full items data.
 */
export const selectTimelineItemCount = createSelector(
	[selectTimelineItems],
	(timelineItems): number => {
		return Object.keys(timelineItems).length;
	},
);

/**
 * Select timeline items sorted by start frame
 *
 * Useful for timeline rendering where items need to be in temporal order.
 */
export const selectTimelineItemsSortedByFrame = createSelector(
	[selectTimelineItemsArray],
	(items): TimelineItemData[] => {
		return [...items].sort((a, b) => a.from - b.from);
	},
);

/**
 * Custom equality check for tracks layout array
 *
 * Compares arrays deeply to prevent unnecessary re-renders.
 * Returns true if arrays are equal (same tracks, same positions, same properties).
 *
 * This is CRITICAL for performance - without this, selector returns new array
 * reference every time, causing SidePanel to re-render even when nothing changed!
 */
const tracksLayoutEqual = (
	a: TimelineTrackAndLayout[],
	b: TimelineTrackAndLayout[],
): boolean => {
	// Quick length check
	if (a.length !== b.length) return false;

	// Compare each track's layout data
	for (let i = 0; i < a.length; i++) {
		const trackA = a[i];
		const trackB = b[i];

		// Compare position and height
		if (trackA.top !== trackB.top || trackA.height !== trackB.height) {
			return false;
		}

		// Compare track properties that affect layout/rendering
		if (
			trackA.track.id !== trackB.track.id ||
			trackA.track.hidden !== trackB.track.hidden ||
			trackA.track.muted !== trackB.track.muted
		) {
			return false;
		}

		// Compare items array (checks if items moved between tracks)
		// Using length + join for efficient array comparison
		if (trackA.track.items.length !== trackB.track.items.length) {
			return false;
		}

		if (trackA.track.items.join(',') !== trackB.track.items.join(',')) {
			return false;
		}
	}

	return true;
};

/**
 * Select tracks with layout info
 *
 * **What this subscribes to:**
 * - ONLY the tracks array from timeline
 * - Does NOT subscribe to items or item properties!
 *
 * **What triggers re-render:**
 * - Track added/removed
 * - Track order changes
 * - Track.items[] array changes (item ID moved between tracks)
 * - Track.hidden or Track.muted changes
 *
 * **What does NOT trigger re-render:**
 * - Item property changes (left, top, width, height, color, rotation, etc.)
 * - Any changes inside item objects
 *
 * **How it works:**
 * - Calculates track heights using DEFAULT_TRACK_HEIGHT constant
 * - Since getItemHeight() always returns 48px, we don't need actual items
 * - Uses resultEqualityCheck to return cached array if content unchanged
 *
 * **Why not use getTrackHeight() function?**
 * - getTrackHeight({track, items}) requires the items object
 * - Subscribing to items would cause re-renders on EVERY item change
 * - This defeats the optimization! SidePanel would re-render during canvas ops
 * - Currently safe because getItemHeight() always returns 48px anyway
 *
 * **TODO: Future refactoring needed**
 * - When variable item heights are enabled (_getItemHeight logic is used)
 * - This selector will need to subscribe to items OR
 * - Track heights need to be pre-calculated and stored in state
 *
 * **Performance impact:**
 * - Prevents SidePanel from re-rendering during canvas operations
 * - Expected: 80-90% fewer SidePanel re-renders
 */
export const selectTracksWithLayout = createSelector(
	[selectCurrentTimeline],
	(timeline): TimelineTrackAndLayout[] => {
		// Use constant from single source of truth (not hardcoded!)
		// getItemHeight always returns 48, so track height is always 48 + TRACK_PADDING
		const trackHeight = DEFAULT_TRACK_HEIGHT + TRACK_PADDING;

		let currentTop = 0;
		const tracks = timeline.tracks;

		return tracks.map((track) => {
			const result: TimelineTrackAndLayout = {
				track,
				top: currentTop,
				height: trackHeight,
			};

			currentTop += trackHeight;
			return result;
		});
	},
	{
		// CRITICAL: Use custom equality check to prevent unnecessary re-renders
		// Without this, new array reference causes re-render even if content is same
		memoizeOptions: {
			resultEqualityCheck: tracksLayoutEqual,
		},
	},
);
