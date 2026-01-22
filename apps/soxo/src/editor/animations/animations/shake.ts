import type {AnimationFn} from '../types';

/**
 * Shake animation - horizontal shake effect.
 * Shakes left and right rapidly to grab attention.
 * Common for errors, alerts, or emphasis.
 */
export const shake: AnimationFn = ({frame, duration}) => {
	// Quick shake with decreasing amplitude over the duration
	const progress = (frame % duration) / duration;

	// Use multiple frequencies for more natural shake
	const shake1 = Math.sin(progress * Math.PI * 8) * 5;
	const shake2 = Math.sin(progress * Math.PI * 12) * 3;
	const shake3 = Math.sin(progress * Math.PI * 16) * 2;

	const totalShake = shake1 + shake2 + shake3;

	return {
		transform: `translateX(${totalShake}px)`,
	};
};
