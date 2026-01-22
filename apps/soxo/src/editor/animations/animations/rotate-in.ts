import {makeTransform, rotate, scale as scaleTransform} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Rotate in animation - rotate from -15deg with scale, creating dynamic entrance.
 * Combines rotation, scale, and fade for an energetic effect.
 */
export const rotateIn: AnimationFn = ({frame, duration}) => {
	// Before animation starts - rotated, scaled down, invisible
	if (frame < 0) {
		return {
			opacity: 0,
			transform: makeTransform([rotate(-15), scaleTransform(0.5)]),
		};
	}

	// After animation ends - normal rotation and scale, fully visible
	if (frame >= duration) {
		return {
			opacity: 1,
			transform: makeTransform([rotate(0), scaleTransform(1)]),
		};
	}

	// During animation
	const progress = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	// Ease out cubic for smooth deceleration
	const eased = 1 - Math.pow(1 - progress, 3);

	// Rotate from -15deg to 0deg
	const rotateValue = interpolate(eased, [0, 1], [-15, 0]);

	// Scale from 0.5 to 1.0
	const scaleValue = interpolate(eased, [0, 1], [0.5, 1]);

	// Fade in opacity
	const opacity = interpolate(frame, [0, duration * 0.5], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return {
		opacity,
		transform: makeTransform([rotate(rotateValue), scaleTransform(scaleValue)]),
	};
};
