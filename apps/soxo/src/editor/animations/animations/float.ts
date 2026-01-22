import type {AnimationFn} from '../types';

/**
 * Float animation - gentle vertical movement.
 * Floats up and down smoothly like a balloon.
 * Creates a calm, floating effect.
 */
export const float: AnimationFn = ({frame, duration}) => {
	// Smooth up and down movement using sine wave
	const progress = (frame % duration) / duration;

	// Move between -10px and +10px vertically
	const yOffset = Math.sin(progress * Math.PI * 2) * 10;

	return {
		transform: `translateY(${yOffset}px)`,
	};
};
