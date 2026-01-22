import type {AnimationFn} from '../types';

/**
 * Breathe animation - subtle opacity pulsing.
 * Fades between 80% and 100% opacity smoothly.
 * Very subtle, calming effect.
 */
export const breathe: AnimationFn = ({frame, duration}) => {
	const progress = (frame % duration) / duration;

	// Gentle opacity change using sine wave
	// Range from 0.8 to 1.0
	const opacity = 0.8 + Math.sin(progress * Math.PI * 2) * 0.1 + 0.1;

	return {
		opacity,
	};
};
