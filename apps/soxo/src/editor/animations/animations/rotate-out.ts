import {scale as scaleTransform} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Rotate out animation.
 * Element rotates while scaling down and fading out.
 * Creates a spinning exit effect.
 */
export const rotateOut: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {transform: 'rotate(0deg) scale(1)', opacity: 1};
	}

	if (frame >= duration) {
		return {transform: 'rotate(180deg) scale(0)', opacity: 0};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;

	// Rotate to 180 degrees
	const rotation = interpolate(progress, [0, 1], [0, 180]);

	// Scale down to 0
	const scale = interpolate(progress, [0, 1], [1, 0]);

	// Fade out
	const opacity = interpolate(progress, [0, 1], [1, 0]);

	return {
		transform: `rotate(${rotation}deg) ${scaleTransform(scale)}`,
		opacity,
	};
};
