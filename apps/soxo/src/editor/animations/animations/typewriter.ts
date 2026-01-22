import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Typewriter animation.
 * Element appears with a clip reveal from left to right.
 * Best used with target: 'character' for authentic typewriter effect.
 */
export const typewriter: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {opacity: 0, clipPath: 'inset(0 100% 0 0)'};
	}

	if (frame >= duration) {
		return {opacity: 1, clipPath: 'inset(0 0% 0 0)'};
	}

	const progress = interpolate(frame, [0, duration], [100, 0], {
		extrapolateRight: 'clamp',
	});

	return {
		opacity: 1,
		clipPath: `inset(0 ${progress}% 0 0)`,
	};
};
