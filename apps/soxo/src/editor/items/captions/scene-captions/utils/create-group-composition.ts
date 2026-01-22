import {CompositeItem} from '../../../composite/composite-item-type';
import {TextItem} from '../../../text/text-item-type';
import {generateRandomId} from '../../../../utils/generate-random-id';
import {measureTextSingleLine} from '../../../../utils/text/measure-text-single-line';

type SegmentData = {
	segmentId: string;
	fullText: string;
	adjustedStartMs: number;
	adjustedEndMs: number;
	adjustedTotalMs: number;
	originalStartMs: number;
	originalEndMs: number;
	originalTotalMs: number;
	groups: Array<{
		groupId: string;
		text: string;
		startMs: number;
		endMs: number;
		totalMs: number;
		captions: Array<{
			id: string;
			endMs: number;
			startMs: number;
			text: string;
			timestampMs: number;
		}>;
	}>;
};

type CreateGroupCompositionParams = {
	segment: SegmentData;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
	startInSeconds: number;
};

export const createGroupComposition = ({
	segment,
	fps,
	compositionWidth,
	compositionHeight,
	startInSeconds,
}: CreateGroupCompositionParams): CompositeItem => {
	// Calculate composite positioning on main timeline
	const fromFrame =
		Math.round((segment.adjustedStartMs / 1000) * fps) +
		(startInSeconds ? Math.round(startInSeconds * fps) : 0);
	const durationInFrames = Math.round((segment.adjustedTotalMs / 1000) * fps);

	// Styling constants
	const maxFontSize = 80;
	const defaultLineHeight = 1.2;
	const defaultLetterSpacing = 0;
	const defaultFontFamily = 'DM Serif Text';
	const defaultFontStyle = {
		variant: 'normal' as const,
		weight: '400' as const,
	};
	const maxWidth = Math.min(compositionWidth, 900) - 40;

	// Measure dimensions for each group's text (single line, font size adjusted to fit)
	const groupMeasurements = segment.groups.map((group) => {
		return measureTextSingleLine({
			text: group.text,
			fontFamily: defaultFontFamily,
			maxFontSize,
			lineHeight: defaultLineHeight,
			letterSpacing: defaultLetterSpacing,
			fontStyle: defaultFontStyle,
			maxWidth,
		});
	});

	// Find max dimensions across all groups for the composite
	const compositeWidth = Math.max(...groupMeasurements.map((m) => m.width));
	const compositeHeight = Math.max(...groupMeasurements.map((m) => m.height));

	// Center the composite horizontally and vertically
	const centerLeft = Math.round((compositionWidth - compositeWidth) / 2);
	const centerTop = Math.round((compositionHeight - compositeHeight) / 2);

	// Create track for child items
	const trackId = generateRandomId('track');
	const itemIds: string[] = [];
	const items: Record<string, TextItem> = {};

	// Create text items for each group
	segment.groups.forEach((group, index) => {
		const itemId = generateRandomId('text');
		itemIds.push(itemId);

		// Calculate relative position within the composite
		const relativeStartMs = group.startMs - segment.originalStartMs;
		const relativeFromFrame = Math.round((relativeStartMs / 1000) * fps);
		const groupDurationInFrames = Math.round((group.totalMs / 1000) * fps);

		// Get measured dimensions and fontSize for this group
		const {width, height, fontSize} = groupMeasurements[index];

		items[itemId] = {
			type: 'text',
			id: itemId,
			trackId, // Set trackId to the child track
			text: group.text,
			from: relativeFromFrame,
			durationInFrames: groupDurationInFrames,
			left: 0, // Relative to composite
			top: 0, // Relative to composite
			width,
			height,
			opacity: 1,
			fontFamily: defaultFontFamily,
			fontStyle: defaultFontStyle,
			rotation: 0,
			lineHeight: defaultLineHeight,
			letterSpacing: defaultLetterSpacing,
			fontSize,
			align: 'center',
			color: 'white',
			direction: 'ltr',
			strokeWidth: 4,
			strokeColor: 'black',
			css: '',
			animations: {
				enter: {
					type: 'fade-in',
					duration: 20,
					delay: 0,
				},
			},
			fadeInDurationInSeconds: 0,
			fadeOutDurationInSeconds: 0,
			transition: {
				toNext: undefined,
				toPrev: undefined,
			},
			background: null,
			resizeOnEdit: true,
			isDraggingInTimeline: false,
		};
	});

	// Create composite item
	const compositeItem: CompositeItem = {
		type: 'composite',
		id: generateRandomId('composite'),
		from: fromFrame,
		durationInFrames: durationInFrames,
		left: centerLeft,
		top: centerTop,
		width: compositeWidth,
		height: compositeHeight,
		originalWidth: compositeWidth,
		originalHeight: compositeHeight,
		opacity: 1,
		borderRadius: 0,
		rotation: 0,
		isDraggingInTimeline: false,
		keepAspectRatio: true,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		name: `Scene: ${segment.segmentId} (${segment.groups.length} groups)`,
		childTimeline: {
			tracks: [
				{
					id: trackId,
					items: itemIds,
					hidden: false,
					muted: false,
				},
			],
			items: items,
		},
		transition: {
			toNext: undefined,
			toPrev: undefined,
		},
	};

	return compositeItem;
};
