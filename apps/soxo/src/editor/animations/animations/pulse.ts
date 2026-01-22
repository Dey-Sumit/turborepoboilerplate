import {scale as scaleTransform} from '@remotion/animation-utils';
import type {AnimationFn} from '../types';

/**
 * Pulse animation - breathing scale effect.
 * Scales from 100% to 110% and back in a smooth loop.
 * Perfect for drawing attention to elements.
 */
export const pulse: AnimationFn = ({frame, duration}) => {
	// Create a smooth pulse that goes 100% -> 110% -> 100%
	// Use sine wave for smooth, natural motion
	const progress = (frame % duration) / duration;
	const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;

	return {
		transform: scaleTransform(scale),
	};
};
