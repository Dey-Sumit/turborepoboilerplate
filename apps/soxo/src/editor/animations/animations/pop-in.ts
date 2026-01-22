import {scale as scaleTransform} from '@remotion/animation-utils';
import {interpolate, spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Pop in animation - scale from 0 to 100% with spring effect.
 * Creates an energetic, bouncy entrance.
 */
export const popIn: AnimationFn = ({frame, duration, fps}) => {
	// Before animation starts - invisible
	if (frame < 0) {
		return {opacity: 0, transform: scaleTransform(0)};
	}

	// After animation ends - fully visible
	if (frame >= duration) {
		return {opacity: 1, transform: scaleTransform(1)};
	}

	// During animation - spring effect
	const scaleValue = spring({
		frame,
		fps,
		config: {
			damping: 10,
			mass: 0.5,
			stiffness: 200,
		},
	});

	// Fade in opacity linearly
	// For N-frame animation, frame 0 = start, frame N-1 = end
	const fadeInEnd = duration > 1 ? (duration - 1) * 0.3 : 1;
	const opacity = interpolate(frame, [0, fadeInEnd], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return {
		opacity,
		transform: scaleTransform(scaleValue),
	};
};
