import {z} from 'zod';
import {canHaveRotationSchema} from '../schemas';

/**
 * Shape variants supported by the editor
 *
 * Built-in shapes (rendered via @remotion/shapes):
 * - circle: Basic circle shape
 * - rectangle: Rectangle with optional corner radius
 * - triangle: Triangle polygon
 * - star: Star polygon with configurable points
 *
 * Custom arrow shapes (rendered via custom SVG components):
 * - arrow-right: Straight arrow pointing right
 * - arrow-left: Straight arrow pointing left
 * - arrow-up: Straight arrow pointing up
 * - arrow-down: Straight arrow pointing down
 */
export const shapeVariantSchema = z.enum([
	// @remotion/shapes built-in shapes
	'circle',
	'rectangle',
	'triangle',
	'star',
	// Custom arrow shapes
	'arrow-right',
	'arrow-left',
	'arrow-up',
	'arrow-down',
]);
export type ShapeVariant = z.infer<typeof shapeVariantSchema>;

/**
 * Border style types for shape strokes
 */
export const borderStyleSchema = z.enum(['solid', 'dashed', 'dotted']);
export type BorderStyle = z.infer<typeof borderStyleSchema>;

/**
 * Fill pattern types for shape backgrounds
 */
export const fillPatternSchema = z.enum([
	'none',
	'stripes-horizontal',
	'stripes-vertical',
	'stripes-diagonal',
	'dots',
	'grid',
]);
export type FillPattern = z.infer<typeof fillPatternSchema>;

/**
 * ShapeItem type definition
 *
 * Extends BaseItem with rotation capability and shape-specific properties.
 * All shape items support:
 * - Positioning (left, top, width, height) via BaseItem
 * - Rotation via CanHaveRotation
 * - Transitions and animations via BaseItem
 * - Fade in/out effects
 * - Fill and stroke styling
 * - Border styles (solid, dashed, dotted)
 * - Fill patterns (stripes, dots, grid)
 */
export const shapeItemSchema = canHaveRotationSchema.extend({
	type: z.literal('shape'),
	variant: shapeVariantSchema,

	// Styling properties
	fill: z.string(), // Fill color (supports hex, rgba, etc.)
	stroke: z.string(), // Stroke/outline color
	strokeWidth: z.number(), // Stroke thickness in pixels
	borderStyle: borderStyleSchema.optional(), // Border style (solid, dashed, dotted)
	fillPattern: fillPatternSchema.optional(), // Fill pattern (stripes, dots, etc.)

	// Shape-specific properties (optional, used by certain variants)
	points: z.number().optional(), // Number of points for star/polygon shapes
	cornerRadius: z.number().optional(), // Corner radius for rectangles

	// Aspect ratio control
	keepAspectRatio: z.boolean(), // Whether to maintain aspect ratio when resizing

	// Fade effects (consistent with video/image items)
	fadeInDurationInSeconds: z.number(),
	fadeOutDurationInSeconds: z.number(),
});

export type ShapeItem = z.infer<typeof shapeItemSchema>;
