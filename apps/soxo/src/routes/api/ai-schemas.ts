import {z} from 'zod';

/**
 * AI Tool Schemas - Flat structure matching actual state
 *
 * These schemas are designed for LLM tool calling:
 * - All properties at root level (no nesting like "changes" or "styling")
 * - Matches the actual item structure in editor state
 * - Simple for AI to understand and populate
 */

// ============================================
// TRANSITION SCHEMA (for reference in comments)
// ============================================
// type: 'slide' | 'fade' | 'wipe' | 'flip' | 'clockwipe' | 'iris'
// durationInFrames?: number
// direction?: 'from-left' | 'from-right' | 'from-top' | 'from-bottom'

// ============================================
// THREE-PHASE ANIMATIONS (for future reference)
// ============================================
// The editor supports three-phase animations:
// - enter: { type: 'fade-in' | 'pop-in' | 'slide-in-left' | etc., duration, delay }
// - emphasis: { type: 'pulse' | 'bounce' | 'shake' | etc., duration, iterations?, pauseBetween? }
// - exit: { type: 'fade-out' | 'slide-out-left' | etc., duration }

// ============================================
// ADD TEXT ITEM - Flat schema
// ============================================
/**
 * Schema for add_text_item tool
 * All properties at root level for easy AI access
 */
export const addTextItemSchema = z.object({
	// Required
	text: z.string(),
	x: z.number(), // left position on canvas
	y: z.number(), // top position on canvas

	// Optional styling (all from TextItem)
	color: z.string().optional(),
	fontSize: z.number().optional(),
	fontFamily: z.string().optional(),
	fontStyle: z
		.object({
			variant: z.string(),
			weight: z.string(),
		})
		.optional(),
	align: z.enum(['left', 'center', 'right']).optional(),
	direction: z.enum(['ltr', 'rtl']).optional(),
	lineHeight: z.number().optional(),
	letterSpacing: z.number().optional(),
	strokeWidth: z.number().optional(),
	strokeColor: z.string().optional(),
	opacity: z.number().optional(),
	rotation: z.number().optional(),
	background: z
		.object({
			color: z.string(),
			horizontalPadding: z.number(),
			borderRadius: z.number(),
		})
		.nullable()
		.optional(),
	fadeInDurationInSeconds: z.number().optional(),
	fadeOutDurationInSeconds: z.number().optional(),

	// Optional BaseItem properties
	durationInFrames: z.number().optional(),
	// Note: Three-phase animations (animations property) not exposed to AI tools yet
});

export type AddTextItemInput = z.infer<typeof addTextItemSchema>;

// ============================================
// EDIT TEXT ITEM - Flat schema
// ============================================
/**
 * Schema for text_editor tool
 * itemId + all editable properties at root level
 * Includes BaseItem properties that can be edited
 */
export const editTextItemSchema = z.object({
	// Required
	itemId: z.string(),

	// TextItem properties (all optional - only include what needs to change)
	text: z.string().optional(),
	color: z.string().optional(),
	fontSize: z.number().optional(),
	fontFamily: z.string().optional(),
	fontStyle: z
		.object({
			variant: z.string(),
			weight: z.string(),
		})
		.optional(),
	align: z.enum(['left', 'center', 'right']).optional(),
	direction: z.enum(['ltr', 'rtl']).optional(),
	lineHeight: z.number().optional(),
	letterSpacing: z.number().optional(),
	strokeWidth: z.number().optional(),
	strokeColor: z.string().optional(),
	opacity: z.number().optional(),
	rotation: z.number().optional(),
	background: z
		.object({
			color: z.string(),
			horizontalPadding: z.number(),
			borderRadius: z.number(),
		})
		.nullable()
		.optional(),
	fadeInDurationInSeconds: z.number().optional(),
	fadeOutDurationInSeconds: z.number().optional(),

	// BaseItem properties that can be edited
	top: z.number().optional(), // y position
	left: z.number().optional(), // x position
	durationInFrames: z.number().optional(),
	// Note: Three-phase animations (animations property) not exposed to AI tools yet
});

export type EditTextItemInput = z.infer<typeof editTextItemSchema>;

// ============================================
// GET ITEM INFO - Generic schema (works for any item type)
// ============================================
export const getItemInfoSchema = z.object({
	itemId: z.string(),
});

export type GetItemInfoInput = z.infer<typeof getItemInfoSchema>;

// ============================================
// ADD SOLID ITEM - Flat schema
// ============================================
export const addSolidItemSchema = z.object({
	// Required
	x: z.number(), // left position on canvas
	y: z.number(), // top position on canvas
	width: z.number(),
	height: z.number(),

	// Optional SolidItem properties
	color: z.string().optional(), // hex color, default '#ffffff'
	opacity: z.number().optional(),
	rotation: z.number().optional(),
	borderRadius: z.number().optional(),
	fadeInDurationInSeconds: z.number().optional(),
	fadeOutDurationInSeconds: z.number().optional(),
	durationInFrames: z.number().optional(),
});

export type AddSolidItemInput = z.infer<typeof addSolidItemSchema>;

// ============================================
// EDIT SOLID ITEM - Flat schema
// ============================================
export const editSolidItemSchema = z.object({
	// Required
	itemId: z.string(),

	// SolidItem properties (all optional)
	color: z.string().optional(),
	opacity: z.number().optional(),
	rotation: z.number().optional(),
	borderRadius: z.number().optional(),
	fadeInDurationInSeconds: z.number().optional(),
	fadeOutDurationInSeconds: z.number().optional(),

	// BaseItem properties
	top: z.number().optional(),
	left: z.number().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	durationInFrames: z.number().optional(),
});

export type EditSolidItemInput = z.infer<typeof editSolidItemSchema>;

// ============================================
// ADD TRANSITIONS - Handles multiple transitions at once
// ============================================
/**
 * Schema for add_transitions tool
 * Adds transitions between sequential item pairs
 *
 * Format: Array of transition pairs
 * Each pair: { itemIds: [fromItemId, toItemId], transition: {...} }
 *
 * Example for adding transitions between 3 sequential items:
 * [
 *   { itemIds: ["item-1", "item-2"], transition: { type: "fade" } },
 *   { itemIds: ["item-2", "item-3"], transition: { type: "slide", direction: "from-left" } }
 * ]
 */
export const addTransitionsSchema = z.object({
	transitions: z.array(
		z.object({
			// Pair of item IDs: [fromItem, toItem]
			// Transition goes from END of first item to START of second item
			itemIds: z.tuple([z.string(), z.string()]),

			// Transition configuration
			transition: z.object({
				type: z.enum(['fade', 'slide', 'wipe', 'flip', 'clockwipe', 'iris']),
				durationInFrames: z.number().optional(),
				// Direction for slide/wipe/flip transitions
				direction: z
					.enum([
						'from-left',
						'from-right',
						'from-top',
						'from-bottom',
						'from-top-left',
						'from-top-right',
						'from-bottom-left',
						'from-bottom-right',
					])
					.optional(),
			}),
		}),
	),
});

export type AddTransitionsInput = z.infer<typeof addTransitionsSchema>;
