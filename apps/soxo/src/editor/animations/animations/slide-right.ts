import {spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Slide right animation (slides in from the left).
 * Element slides from left to center with spring physics.
 */
export const slideRight: AnimationFn = ({frame, fps, duration}) => {
	if (frame < 0) {
		return {transform: 'translateX(-100px)'};
	}

	if (frame >= duration) {
		return {transform: 'translateX(0px)'};
	}

	const translateX = spring({
		frame,
		fps,
		from: -100,
		to: 0,
		durationInFrames: duration,
	});

	return {
		transform: `translateX(${translateX}px)`,
	};
};
