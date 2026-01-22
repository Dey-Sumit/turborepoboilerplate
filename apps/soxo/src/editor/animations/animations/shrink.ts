import {scale as scaleTransform} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Shrink animation - scales down to zero with fade.
 * Element shrinks and fades out simultaneously.
 * Creates a "disappearing" effect.
 */
export const shrink: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {opacity: 1, transform: scaleTransform(1)};
	}

	if (frame >= duration) {
		return {opacity: 0, transform: scaleTransform(0)};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;

	// Scale from 1 to 0
	const scale = interpolate(progress, [0, 1], [1, 0]);

	// Fade out from 1 to 0
	const opacity = interpolate(progress, [0, 1], [1, 0]);

	return {
		opacity,
		transform: scaleTransform(scale),
	};
};
