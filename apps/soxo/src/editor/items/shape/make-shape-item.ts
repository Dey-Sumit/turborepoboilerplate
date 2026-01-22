import {generateRandomId} from '../../utils/generate-random-id';
import {
	BorderStyle,
	FillPattern,
	ShapeItem,
	ShapeVariant,
} from './shape-item-type';

/**
 * Default dimensions for different shape variants
 *
 * These dimensions provide good starting points for each shape type.
 * - Circles and stars work best with square dimensions
 * - Rectangles use a 2:1 aspect ratio
 * - Arrows are wider than tall to look natural
 */
const DEFAULT_DIMENSIONS: Record<
	ShapeVariant,
	{width: number; height: number}
> = {
	circle: {width: 100, height: 100},
	rectangle: {width: 200, height: 100},
	triangle: {width: 100, height: 100},
	star: {width: 120, height: 120},
	'arrow-right': {width: 150, height: 50},
	'arrow-left': {width: 150, height: 50},
	'arrow-up': {width: 50, height: 150},
	'arrow-down': {width: 50, height: 150},
};

/**
 * Factory function to create a new ShapeItem
 *
 * Creates a shape item with sensible defaults based on the variant.
 * All properties can be overridden via the params object.
 *
 * @param params - Configuration object for the shape item
 * @param params.variant - Type of shape to create
 * @param params.from - Starting frame position in timeline
 * @param params.left - Horizontal position on canvas
 * @param params.top - Vertical position on canvas
 * @param params.width - Optional width override (uses variant default if not provided)
 * @param params.height - Optional height override (uses variant default if not provided)
 * @param params.fill - Optional fill color (defaults to semi-transparent white)
 * @param params.stroke - Optional stroke color (defaults to white)
 * @param params.strokeWidth - Optional stroke width (defaults to 2)
 * @param params.rotation - Optional rotation in degrees (defaults to 0)
 * @param params.durationInFrames - Optional duration (defaults to 90 frames)
 *
 * @returns A new ShapeItem ready to be added to the composition
 *
 * @example
 * // Create a red circle at position (100, 100)
 * const circle = makeShapeItem({
 *   variant: 'circle',
 *   from: 0,
 *   left: 100,
 *   top: 100,
 *   fill: '#ff0000',
 * });
 *
 * @example
 * // Create a blue arrow with custom dimensions
 * const arrow = makeShapeItem({
 *   variant: 'arrow-right',
 *   from: 30,
 *   left: 200,
 *   top: 150,
 *   width: 200,
 *   height: 80,
 *   fill: '#0000ff',
 *   stroke: '#0000ff',
 * });
 */
export const makeShapeItem = (params: {
	variant: ShapeVariant;
	from: number;
	left: number;
	top: number;
	width?: number;
	height?: number;
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	borderStyle?: BorderStyle;
	fillPattern?: FillPattern;
	rotation?: number;
	durationInFrames?: number;
	points?: number;
	cornerRadius?: number;
}): ShapeItem => {
	// Get default dimensions for the variant
	const defaultDimensions = DEFAULT_DIMENSIONS[params.variant];

	// Generate unique ID for the shape
	const id = generateRandomId('shape');

	return {
		// Identity
		id,
		type: 'shape',
		variant: params.variant,

		// Positioning and sizing
		from: params.from,
		left: params.left,
		top: params.top,
		width: params.width ?? defaultDimensions.width,
		height: params.height ?? defaultDimensions.height,

		// Styling
		fill: params.fill ?? '#3b82f6', // Blue fill (matches stroke default)
		stroke: params.stroke ?? '#3b82f6', // Blue stroke
		strokeWidth: params.strokeWidth ?? 3,
		borderStyle: params.borderStyle ?? 'solid',
		fillPattern: params.fillPattern ?? 'none',
		rotation: params.rotation ?? 0,

		// Standard BaseItem properties
		opacity: 1,
		durationInFrames: params.durationInFrames ?? 90, // 3 seconds at 30fps
		isDraggingInTimeline: false,
		keepAspectRatio: false, // Don't lock aspect ratio by default

		// Transitions
		transition: {
			toNext: undefined,
			toPrev: undefined,
		},

		// Optional shape-specific properties
		points: params.points, // For star shapes (default: 5)
		cornerRadius: params.cornerRadius ?? 0, // For rectangles (default: 0)

		// Fade effects
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,

		// Optional CSS override
		css: undefined,
	};
};
