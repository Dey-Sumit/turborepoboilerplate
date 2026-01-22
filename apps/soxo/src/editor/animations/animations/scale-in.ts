import {spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Scale in animation.
 * Element scales from small to full size with spring physics.
 */
export const scaleIn: AnimationFn = ({frame, fps, duration}) => {
	// Before animation starts
	if (frame < 0) {
		return {transform: 'scale(0)'};
	}

	// After animation ends - hold final state
	if (frame >= duration) {
		return {transform: 'scale(1)'};
	}

	// During animation - spring-based scale
	const scale = spring({
		frame,
		fps,
		from: 0,
		to: 1,
		durationInFrames: duration,
	});

	return {
		transform: `scale(${scale})`,
	};
};
