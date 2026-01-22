import {spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Slide left animation (slides in from the right).
 * Element slides from right to center with spring physics.
 */
export const slideLeft: AnimationFn = ({frame, fps, duration}) => {
	// Before animation starts
	if (frame < 0) {
		return {transform: 'translateX(100px)'};
	}

	// After animation ends - hold final state
	if (frame >= duration) {
		return {transform: 'translateX(0px)'};
	}

	// During animation - spring-based slide
	const translateX = spring({
		frame,
		fps,
		from: 100,
		to: 0,
		durationInFrames: duration,
	});

	return {
		transform: `translateX(${translateX}px)`,
	};
};
