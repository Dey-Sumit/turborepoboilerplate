import {scale as scaleTransform} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Fade scale animation - fade in with subtle scale (110% to 100%).
 * Very common in professional video editing, smooth and elegant.
 */
export const fadeScale: AnimationFn = ({frame, duration}) => {
	// Before animation starts - invisible and slightly larger
	if (frame < 0) {
		return {
			opacity: 0,
			transform: scaleTransform(1.1),
		};
	}

	// After animation ends - fully visible at normal scale
	if (frame >= duration) {
		return {
			opacity: 1,
			transform: scaleTransform(1),
		};
	}

	// During animation
	const progress = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	// Ease out cubic for smooth deceleration
	const eased = 1 - Math.pow(1 - progress, 3);

	// Scale from 1.1 to 1.0 (subtle zoom out effect)
	const scaleValue = interpolate(eased, [0, 1], [1.1, 1]);

	// Fade in opacity
	const opacity = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return {
		opacity,
		transform: scaleTransform(scaleValue),
	};
};
