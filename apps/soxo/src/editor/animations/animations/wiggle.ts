import type {AnimationFn} from '../types';

/**
 * Wiggle animation - subtle rotation wiggle.
 * Rotates slightly left and right in a playful manner.
 * Good for playful, friendly interfaces.
 */
export const wiggle: AnimationFn = ({frame, duration}) => {
	// Smooth wiggle using sine wave
	const progress = (frame % duration) / duration;

	// Rotate between -5deg and +5deg
	const rotation = Math.sin(progress * Math.PI * 2) * 5;

	return {
		transform: `rotate(${rotation}deg)`,
	};
};
