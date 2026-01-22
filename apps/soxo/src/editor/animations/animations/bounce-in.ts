import {interpolate, spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Bounce in animation.
 * Element scales up with an overshoot bounce effect.
 */
export const bounceIn: AnimationFn = ({frame, fps, duration}) => {
	if (frame < 0) {
		return {opacity: 0, transform: 'scale(0)'};
	}

	if (frame >= duration) {
		return {opacity: 1, transform: 'scale(1)'};
	}

	const opacity = interpolate(frame, [0, duration * 0.3], [0, 1], {
		extrapolateRight: 'clamp',
	});

	// Spring with high overshoot for bounce effect
	const scale = spring({
		frame,
		fps,
		from: 0,
		to: 1,
		durationInFrames: duration,
		config: {
			damping: 8,
			stiffness: 200,
			mass: 0.5,
		},
	});

	return {
		opacity,
		transform: `scale(${scale})`,
	};
};
