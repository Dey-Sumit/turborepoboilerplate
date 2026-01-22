import type {AnimationFn} from '../types';

/**
 * Bounce animation - continuous bouncing effect.
 * Bounces up and down with gravity-like motion.
 * Energetic and playful.
 */
export const bounce: AnimationFn = ({frame, duration}) => {
	const progress = (frame % duration) / duration;

	// Create bouncing effect using parabolic motion
	// Higher bounce at the start, settles at bottom
	const bounceHeight = Math.abs(Math.sin(progress * Math.PI)) * 20;

	return {
		transform: `translateY(-${bounceHeight}px)`,
	};
};
