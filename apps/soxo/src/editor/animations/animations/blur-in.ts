import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Blur in animation - starts blurred and becomes sharp.
 * Modern, smooth entrance effect using CSS filter.
 */
export const blurIn: AnimationFn = ({frame, duration}) => {
	// Before animation starts - fully blurred
	if (frame < 0) {
		return {
			opacity: 0,
			filter: 'blur(20px)',
		};
	}

	// After animation ends - sharp and visible
	if (frame >= duration) {
		return {
			opacity: 1,
			filter: 'blur(0px)',
		};
	}

	// During animation - gradually reduce blur
	const progress = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	// Ease out cubic for smooth deceleration
	const eased = 1 - Math.pow(1 - progress, 3);

	// Blur from 20px to 0px
	const blurAmount = interpolate(eased, [0, 1], [20, 0]);

	// Fade in opacity faster at the start
	const opacity = interpolate(frame, [0, duration * 0.4], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return {
		opacity,
		filter: `blur(${blurAmount}px)`,
	};
};
