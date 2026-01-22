import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Simple fade in animation.
 * Opacity goes from 0 to 1 over the duration.
 */
export const fadeIn: AnimationFn = ({frame, duration}) => {
	// Before animation starts
	if (frame < 0) {
		return {opacity: 0};
	}

	// After animation ends - hold final state
	if (frame >= duration) {
		return {opacity: 1};
	}

	// During animation
	// For N-frame animation, frame 0 = start, frame N-1 = end
	const maxFrame = duration > 1 ? duration - 1 : 1;
	const opacity = interpolate(frame, [0, maxFrame], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return {opacity};
};
