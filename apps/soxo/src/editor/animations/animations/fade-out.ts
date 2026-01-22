import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Fade out animation.
 * Opacity goes from 1 to 0 over the duration.
 * Classic, simple exit animation.
 */
export const fadeOut: AnimationFn = ({frame, duration}) => {
	// Before animation starts - fully visible
	if (frame < 0) {
		return {opacity: 1};
	}

	// After animation ends - invisible
	if (frame >= duration) {
		return {opacity: 0};
	}

	// During animation - fade out
	// For N-frame animation, frame 0 = start, frame N-1 = end
	const maxFrame = duration > 1 ? duration - 1 : 1;
	const opacity = interpolate(frame, [0, maxFrame], [1, 0], {
		extrapolateRight: 'clamp',
	});

	return {opacity};
};
