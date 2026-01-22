import {translateX} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Maximum pan distance as percentage of image width.
 * Prevents panning too far and showing black space.
 * 40% is safe for most wide images in 9:16 format.
 */
const MAX_PAN_PERCENT = 40;

/**
 * Helper function to create pan animations.
 * Pan animations move the image position to reveal different portions.
 * Useful for wide images in narrow viewports (like 9:16 format).
 */
const createPan = (direction: 'left' | 'right'): AnimationFn => {
	return ({frame, duration}) => {
		// Before animation starts - no transform
		if (frame < 0) {
			return {transform: translateX(0)};
		}

		// After animation ends - hold final position at MAX_PAN_PERCENT
		if (frame >= duration) {
			const finalTransforms = {
				left: translateX(-MAX_PAN_PERCENT, '%'), // Move image left, reveals right side
				right: translateX(MAX_PAN_PERCENT, '%'), // Move image right, reveals left side
			};
			return {transform: finalTransforms[direction]};
		}

		// During animation - smooth pan with proper clamping
		const progress = interpolate(
			frame,
			[0, duration],
			[0, 1],
			{
				extrapolateLeft: 'clamp', // Prevent negative values before start
				extrapolateRight: 'clamp', // Prevent exceeding 1 after end
			},
		);

		// Ease out for smooth deceleration
		const eased = 1 - Math.pow(1 - progress, 2);

		// Interpolate from 0 to MAX_PAN_PERCENT with clamping
		// This ensures we never pan more than MAX_PAN_PERCENT regardless of duration
		const translateAmount = interpolate(
			eased,
			[0, 1],
			[0, MAX_PAN_PERCENT],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			},
		);

		const transforms = {
			left: translateX(-translateAmount, '%'),
			right: translateX(translateAmount, '%'),
		};

		return {
			transform: transforms[direction],
		};
	};
};

/**
 * Pan left - image moves left, revealing right portion.
 * Perfect for wide images in narrow viewports.
 */
export const panLeft: AnimationFn = createPan('left');

/**
 * Pan right - image moves right, revealing left portion.
 * Perfect for wide images in narrow viewports.
 */
export const panRight: AnimationFn = createPan('right');
