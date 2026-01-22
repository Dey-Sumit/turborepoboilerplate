/**
 * Type definitions for virtual state slices
 *
 * Timeline and Canvas don't need full item data.
 * These types define minimal "views" of items for specific purposes.
 */

import {Transition} from '../items/schemas';

// Base properties shared by all timeline items (9 base properties)
type TimelineItemDataBase = {
	id: string;
	from: number; // Start frame in timeline
	durationInFrames: number;
	trackId?: string; // Optional - set when item is added to a track
	name?: string; // Optional - only some item types have name
	locked?: boolean; // Optional - only some item types have locked
	transition?: {
		// Transition effects between items
		toNext?: Transition;
		toPrev?: Transition;
	};
	isDraggingInTimeline: boolean; // Hide item during timeline drag
};

// Type-specific extensions - ONLY properties needed for timeline preview/display
type TimelineTextItemData = TimelineItemDataBase & {
	type: 'text';
	text: string; // For preview display
};

type TimelineSolidItemData = TimelineItemDataBase & {
	type: 'solid';
	color: string; // For color dot in preview
};

type TimelineShapeItemData = TimelineItemDataBase & {
	type: 'shape';
	variant: string; // For preview display
};

// Other types don't need extra properties for timeline display
type TimelineImageItemData = TimelineItemDataBase & { type: 'image' };
type TimelineVideoItemData = TimelineItemDataBase & { type: 'video' };
type TimelineAudioItemData = TimelineItemDataBase & { type: 'audio' };
type TimelineCaptionsItemData = TimelineItemDataBase & { type: 'captions' };
type TimelineGifItemData = TimelineItemDataBase & { type: 'gif' };
type TimelineCompositeItemData = TimelineItemDataBase & { type: 'composite' };
type TimelineCodeItemData = TimelineItemDataBase & { type: 'code' };

/**
 * Timeline Item Data - Discriminated union with minimal properties
 *
 * Only includes properties needed for:
 * - Timeline layout (position, duration, track)
 * - Timeline preview display (text, color, variant)
 *
 * Does NOT include:
 * - Canvas positioning (left, top, width, height)
 * - Feature-specific props (videoStartFromInSeconds, playbackRate, volume, etc.)
 *
 * Use `useFullItem()` hook when you need complete item data for features
 * like filmstrip, waveform, fade controls, etc.
 */
export type TimelineItemData =
	| TimelineTextItemData
	| TimelineSolidItemData
	| TimelineShapeItemData
	| TimelineImageItemData
	| TimelineVideoItemData
	| TimelineAudioItemData
	| TimelineCaptionsItemData
	| TimelineGifItemData
	| TimelineCompositeItemData
	| TimelineCodeItemData;
