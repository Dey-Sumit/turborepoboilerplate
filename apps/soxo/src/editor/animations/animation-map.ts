import type {AnimationFn} from './types';
import {fadeIn} from './animations/fade-in';
import {popIn} from './animations/pop-in';
import {
	slideInLeft,
	slideInRight,
	slideInTop,
	slideInBottom,
} from './animations/slide-in';
import {panLeft, panRight} from './animations/pan';
import {zoomIn, zoomOut} from './animations/zoom';
import {blurIn} from './animations/blur-in';
import {fadeScale} from './animations/fade-scale';
import {rotateIn} from './animations/rotate-in';
import {bounceIn} from './animations/bounce-in';
import {scaleIn} from './animations/scale-in';

// Three-phase animation imports
import {pulse} from './animations/pulse';
import {shake} from './animations/shake';
import {wiggle} from './animations/wiggle';
import {float} from './animations/float';
import {bounce} from './animations/bounce';
import {breathe} from './animations/breathe';
import {rotate} from './animations/rotate';
import {fadeOut} from './animations/fade-out';
import {
	slideOutLeft,
	slideOutRight,
	slideOutTop,
	slideOutBottom,
} from './animations/slide-out';
import {shrink} from './animations/shrink';
import {blurOut} from './animations/blur-out';
import {rotateOut} from './animations/rotate-out';

/**
 * Item types that can have animations.
 */
export type AnimatableItemType =
	| 'text'
	| 'captions'
	| 'image'
	| 'video'
	| 'solid'
	| 'composite'
	| 'gif'
	| 'code'
	| 'shape';

/**
 * Animation phase categorization.
 */
export type AnimationPhase = 'enter' | 'emphasis' | 'exit';

// ============================================
// THREE-PHASE ANIMATION REGISTRIES
// ============================================

import type {
	EnterAnimationType,
	EmphasisAnimationType,
	ExitAnimationType,
} from '../items/shared';

/**
 * Animation metadata for three-phase system (simpler - no text split).
 */
export type ThreePhaseAnimationMeta = {
	label: string;
	fn: AnimationFn;
	appliesTo: AnimatableItemType[] | 'all';
};

/**
 * Registry of ENTER animations.
 * These play when an item first appears.
 */
export const ENTER_ANIMATION_REGISTRY: Record<
	EnterAnimationType,
	ThreePhaseAnimationMeta
> = {
	'fade-in': {
		label: 'Fade In',
		fn: fadeIn,
		appliesTo: 'all',
	},
	'pop-in': {
		label: 'Pop In',
		fn: popIn,
		appliesTo: 'all',
	},
	'slide-in-left': {
		label: 'Slide In (Left)',
		fn: slideInLeft,
		appliesTo: 'all',
	},
	'slide-in-right': {
		label: 'Slide In (Right)',
		fn: slideInRight,
		appliesTo: 'all',
	},
	'slide-in-top': {
		label: 'Slide In (Top)',
		fn: slideInTop,
		appliesTo: 'all',
	},
	'slide-in-bottom': {
		label: 'Slide In (Bottom)',
		fn: slideInBottom,
		appliesTo: 'all',
	},
	'blur-in': {
		label: 'Blur In',
		fn: blurIn,
		appliesTo: 'all',
	},
	'fade-scale': {
		label: 'Fade Scale',
		fn: fadeScale,
		appliesTo: 'all',
	},
	'rotate-in': {
		label: 'Rotate In',
		fn: rotateIn,
		appliesTo: 'all',
	},
	'bounce-in': {
		label: 'Bounce In',
		fn: bounceIn,
		appliesTo: 'all',
	},
	'scale-in': {
		label: 'Scale In',
		fn: scaleIn,
		appliesTo: 'all',
	},
	'zoom-in': {
		label: 'Zoom In',
		fn: zoomIn,
		appliesTo: ['image', 'video', 'solid', 'gif'],
	},
};

/**
 * Registry of EMPHASIS animations.
 * These loop while the item is visible (between enter and exit).
 */
export const EMPHASIS_ANIMATION_REGISTRY: Record<
	EmphasisAnimationType,
	ThreePhaseAnimationMeta
> = {
	pulse: {
		label: 'Pulse',
		fn: pulse,
		appliesTo: 'all',
	},
	shake: {
		label: 'Shake',
		fn: shake,
		appliesTo: 'all',
	},
	wiggle: {
		label: 'Wiggle',
		fn: wiggle,
		appliesTo: 'all',
	},
	float: {
		label: 'Float',
		fn: float,
		appliesTo: 'all',
	},
	bounce: {
		label: 'Bounce',
		fn: bounce,
		appliesTo: 'all',
	},
	rotate: {
		label: 'Rotate',
		fn: rotate,
		appliesTo: 'all',
	},
	breathe: {
		label: 'Breathe',
		fn: breathe,
		appliesTo: 'all',
	},
	'pan-left': {
		label: 'Pan Left',
		fn: panLeft,
		appliesTo: ['image', 'video', 'solid', 'gif'],
	},
	'pan-right': {
		label: 'Pan Right',
		fn: panRight,
		appliesTo: ['image', 'video', 'solid', 'gif'],
	},
};

/**
 * Registry of EXIT animations.
 * These play when an item disappears.
 */
export const EXIT_ANIMATION_REGISTRY: Record<
	ExitAnimationType,
	ThreePhaseAnimationMeta
> = {
	'fade-out': {
		label: 'Fade Out',
		fn: fadeOut,
		appliesTo: 'all',
	},
	'slide-out-left': {
		label: 'Slide Out (Left)',
		fn: slideOutLeft,
		appliesTo: 'all',
	},
	'slide-out-right': {
		label: 'Slide Out (Right)',
		fn: slideOutRight,
		appliesTo: 'all',
	},
	'slide-out-top': {
		label: 'Slide Out (Top)',
		fn: slideOutTop,
		appliesTo: 'all',
	},
	'slide-out-bottom': {
		label: 'Slide Out (Bottom)',
		fn: slideOutBottom,
		appliesTo: 'all',
	},
	'zoom-out': {
		label: 'Zoom Out',
		fn: zoomOut,
		appliesTo: ['image', 'video', 'solid', 'gif'],
	},
	shrink: {
		label: 'Shrink',
		fn: shrink,
		appliesTo: 'all',
	},
	'blur-out': {
		label: 'Blur Out',
		fn: blurOut,
		appliesTo: 'all',
	},
	'rotate-out': {
		label: 'Rotate Out',
		fn: rotateOut,
		appliesTo: 'all',
	},
};

/**
 * Get enter animations available for a specific item type.
 */
export function getEnterAnimationsForItemType(
	itemType: AnimatableItemType,
): EnterAnimationType[] {
	return (
		Object.keys(ENTER_ANIMATION_REGISTRY) as EnterAnimationType[]
	).filter((type) => {
		const meta = ENTER_ANIMATION_REGISTRY[type];
		return meta.appliesTo === 'all' || meta.appliesTo.includes(itemType);
	});
}

/**
 * Get emphasis animations available for a specific item type.
 */
export function getEmphasisAnimationsForItemType(
	itemType: AnimatableItemType,
): EmphasisAnimationType[] {
	return (
		Object.keys(EMPHASIS_ANIMATION_REGISTRY) as EmphasisAnimationType[]
	).filter((type) => {
		const meta = EMPHASIS_ANIMATION_REGISTRY[type];
		return meta.appliesTo === 'all' || meta.appliesTo.includes(itemType);
	});
}

/**
 * Get exit animations available for a specific item type.
 */
export function getExitAnimationsForItemType(
	itemType: AnimatableItemType,
): ExitAnimationType[] {
	return (Object.keys(EXIT_ANIMATION_REGISTRY) as ExitAnimationType[]).filter(
		(type) => {
			const meta = EXIT_ANIMATION_REGISTRY[type];
			return meta.appliesTo === 'all' || meta.appliesTo.includes(itemType);
		},
	);
}
