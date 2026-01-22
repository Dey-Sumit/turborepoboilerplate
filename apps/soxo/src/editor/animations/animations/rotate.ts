import type {AnimationFn} from '../types';

/**
 * Rotate animation - continuous rotation.
 * Rotates 360 degrees smoothly over the duration.
 * Can be used for loading indicators or decorative elements.
 */
export const rotate: AnimationFn = ({frame, duration}) => {
	// Linear rotation from 0 to 360 degrees
	const progress = (frame % duration) / duration;
	const rotation = progress * 360;

	return {
		transform: `rotate(${rotation}deg)`,
	};
};
