import {z} from 'zod';

// Direction types (matching @remotion/transitions)
export const slideDirectionSchema = z.enum([
	'from-left',
	'from-right',
	'from-top',
	'from-bottom',
]);
export type SlideDirection = z.infer<typeof slideDirectionSchema>;

export const wipeDirectionSchema = z.enum([
	'from-left',
	'from-right',
	'from-top',
	'from-bottom',
	'from-top-left',
	'from-top-right',
	'from-bottom-left',
	'from-bottom-right',
]);
export type WipeDirection = z.infer<typeof wipeDirectionSchema>;

export const flipDirectionSchema = z.enum([
	'from-left',
	'from-right',
	'from-top',
	'from-bottom',
]);
export type FlipDirection = z.infer<typeof flipDirectionSchema>;

// Transition schema (discriminated union)
export const transitionSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('slide'),
		durationInFrames: z.number().optional(),
		direction: slideDirectionSchema.optional(),
	}),
	z.object({
		type: z.literal('fade'),
		durationInFrames: z.number().optional(),
	}),
	z.object({
		type: z.literal('wipe'),
		durationInFrames: z.number().optional(),
		direction: wipeDirectionSchema.optional(),
	}),
	z.object({
		type: z.literal('flip'),
		durationInFrames: z.number().optional(),
		direction: flipDirectionSchema.optional(),
	}),
	z.object({
		type: z.literal('clockwipe'),
		durationInFrames: z.number().optional(),
		width: z.number(),
		height: z.number(),
	}),
	z.object({
		type: z.literal('iris'),
		durationInFrames: z.number().optional(),
		width: z.number(),
		height: z.number(),
	}),
]);
export type Transition = z.infer<typeof transitionSchema>;

// Animation types - categorized by phase
export const enterAnimationTypeSchema = z.enum([
	'fade-in',
	'pop-in',
	'slide-in-left',
	'slide-in-right',
	'slide-in-top',
	'slide-in-bottom',
	'blur-in',
	'fade-scale',
	'rotate-in',
	'bounce-in',
	'scale-in',
	'zoom-in',
]);
export type EnterAnimationType = z.infer<typeof enterAnimationTypeSchema>;

export const emphasisAnimationTypeSchema = z.enum([
	'pulse',
	'shake',
	'wiggle',
	'float',
	'bounce',
	'rotate',
	'breathe',
	'pan-left',
	'pan-right',
]);
export type EmphasisAnimationType = z.infer<typeof emphasisAnimationTypeSchema>;

export const exitAnimationTypeSchema = z.enum([
	'fade-out',
	'slide-out-left',
	'slide-out-right',
	'slide-out-top',
	'slide-out-bottom',
	'zoom-out',
	'shrink',
	'blur-out',
	'rotate-out',
]);
export type ExitAnimationType = z.infer<typeof exitAnimationTypeSchema>;

// Three-phase animation system
export const enterAnimationConfigSchema = z.object({
	type: enterAnimationTypeSchema,
	duration: z.number(), // Duration in frames
	delay: z.number().optional(), // Delay after item starts (frames)
	easing: z.string().optional(), // CSS easing function
});
export type EnterAnimationConfig = z.infer<typeof enterAnimationConfigSchema>;

export const emphasisAnimationConfigSchema = z.object({
	type: emphasisAnimationTypeSchema,
	duration: z.number(), // Duration of one cycle in frames
	iterations: z.union([z.number(), z.literal('infinite')]).optional(), // Number of loops
	delay: z.number().optional(), // Delay after enter completes (frames)
	pauseBetween: z.number().optional(), // Pause between cycles (frames)
	easing: z.string().optional(), // CSS easing function
});
export type EmphasisAnimationConfig = z.infer<
	typeof emphasisAnimationConfigSchema
>;

export const exitAnimationConfigSchema = z.object({
	type: exitAnimationTypeSchema,
	duration: z.number(), // Duration in frames
	easing: z.string().optional(), // CSS easing function
});
export type ExitAnimationConfig = z.infer<typeof exitAnimationConfigSchema>;

export const threePhaseAnimationsSchema = z.object({
	enter: enterAnimationConfigSchema.optional(),
	emphasis: emphasisAnimationConfigSchema.optional(),
	exit: exitAnimationConfigSchema.optional(),
});
export type ThreePhaseAnimations = z.infer<typeof threePhaseAnimationsSchema>;

// BaseItem schema
export const baseItemSchema = z.object({
	id: z.string(),
	trackId: z.string().optional(), // Set when item is added to a track via addItem()
	durationInFrames: z.number(),
	from: z.number(),
	top: z.number(),
	left: z.number(),
	width: z.number(),
	height: z.number(),
	opacity: z.number(),
	isDraggingInTimeline: z.boolean(),
	transition: z.object({
		toNext: transitionSchema.optional(),
		toPrev: transitionSchema.optional(),
	}),
	// Three-phase animation system
	animations: threePhaseAnimationsSchema.optional(),
	css: z.string().optional(),
});
export type BaseItem = z.infer<typeof baseItemSchema>;

// Extension schemas for items that can have additional properties
export const canHaveBorderRadiusSchema = baseItemSchema.extend({
	borderRadius: z.number(),
});
export type CanHaveBorderRadius = z.infer<typeof canHaveBorderRadiusSchema>;

export const canHaveRotationSchema = baseItemSchema.extend({
	rotation: z.number(),
});
export type CanHaveRotation = z.infer<typeof canHaveRotationSchema>;

export const canHaveCropSchema = z.object({
	cropLeft: z.number(),
	cropTop: z.number(),
	cropRight: z.number(),
	cropBottom: z.number(),
});
export type CanHaveCrop = z.infer<typeof canHaveCropSchema>;

// ============================================
// TextItem schemas
// ============================================

export const textAlignSchema = z.enum(['left', 'center', 'right']);
export type TextAlign = z.infer<typeof textAlignSchema>;

export const textDirectionSchema = z.enum(['ltr', 'rtl']);
export type TextDirection = z.infer<typeof textDirectionSchema>;

export const fontStyleSchema = z.object({
	variant: z.string(),
	weight: z.string(),
});
export type FontStyle = z.infer<typeof fontStyleSchema>;

export const textItemBackgroundSchema = z.object({
	color: z.string(),
	horizontalPadding: z.number(),
	borderRadius: z.number(),
});
export type TextItemBackground = z.infer<typeof textItemBackgroundSchema>;

export const textItemSchema = canHaveRotationSchema.extend({
	type: z.literal('text'),
	text: z.string(),
	color: z.string(),
	align: textAlignSchema,
	fontFamily: z.string(),
	fontStyle: fontStyleSchema,
	fontSize: z.number(),
	lineHeight: z.number(),
	letterSpacing: z.number(),
	resizeOnEdit: z.boolean(),
	direction: textDirectionSchema,
	strokeWidth: z.number(),
	strokeColor: z.string(),
	fadeInDurationInSeconds: z.number(),
	fadeOutDurationInSeconds: z.number(),
	background: textItemBackgroundSchema.nullable(),
});
export type TextItem = z.infer<typeof textItemSchema>;

// ============================================
// Partial schemas for AI tools (all fields optional)
// Derived from textItemSchema - single source of truth
// ============================================

/**
 * Partial schema for text item properties that can be modified by AI.
 * All fields are optional - AI only includes fields that need to change.
 * Excludes system fields (id, type, from, top, left, width, height, isDraggingInTimeline, resizeOnEdit, transition, css)
 */
export const textItemPartialSchema = z.object({
	text: z.string().optional(),
	color: z.string().optional(),
	fontSize: z.number().optional(),
	fontFamily: z.string().optional(),
	fontStyle: fontStyleSchema.optional(),
	align: textAlignSchema.optional(),
	direction: textDirectionSchema.optional(),
	lineHeight: z.number().optional(),
	letterSpacing: z.number().optional(),
	strokeWidth: z.number().optional(),
	strokeColor: z.string().optional(),
	opacity: z.number().optional(),
	rotation: z.number().optional(),
	background: textItemBackgroundSchema.nullable().optional(),
	fadeInDurationInSeconds: z.number().optional(),
	fadeOutDurationInSeconds: z.number().optional(),
	animations: threePhaseAnimationsSchema.optional(),
});
export type TextItemPartial = z.infer<typeof textItemPartialSchema>;
