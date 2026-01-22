import {spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Slide up animation (no fade).
 * Element slides up from below with spring physics.
 */
export const slideUp: AnimationFn = ({frame, fps, duration}) => {
	// Before animation starts
	if (frame < 0) {
		return {transform: 'translateY(100px)'};
	}

	// After animation ends - hold final state
	if (frame >= duration) {
		return {transform: 'translateY(0px)'};
	}

	// During animation - spring-based slide
	const translateY = spring({
		frame,
		fps,
		from: 100,
		to: 0,
		durationInFrames: duration,
	});

	return {
		transform: `translateY(${translateY}px)`,
	};
};
