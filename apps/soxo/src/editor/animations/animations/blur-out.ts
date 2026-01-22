import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Blur out animation.
 * Element blurs and fades out simultaneously.
 * Creates a dreamy, soft exit.
 */
export const blurOut: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {filter: 'blur(0px)', opacity: 1};
	}

	if (frame >= duration) {
		return {filter: 'blur(20px)', opacity: 0};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;

	// Blur from 0px to 20px
	const blur = interpolate(progress, [0, 1], [0, 20]);

	// Fade out from 1 to 0
	const opacity = interpolate(progress, [0, 1], [1, 0]);

	return {
		filter: `blur(${blur}px)`,
		opacity,
	};
};
