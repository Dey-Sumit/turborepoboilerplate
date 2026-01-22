import {spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Slide down animation (no fade).
 * Element slides down from above with spring physics.
 */
export const slideDown: AnimationFn = ({frame, fps, duration}) => {
	if (frame < 0) {
		return {transform: 'translateY(-100px)'};
	}

	if (frame >= duration) {
		return {transform: 'translateY(0px)'};
	}

	const translateY = spring({
		frame,
		fps,
		from: -100,
		to: 0,
		durationInFrames: duration,
	});

	return {
		transform: `translateY(${translateY}px)`,
	};
};
