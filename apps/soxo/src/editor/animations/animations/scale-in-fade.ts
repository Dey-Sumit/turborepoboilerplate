import {interpolate, spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Scale in with fade animation.
 * Element scales up while fading in.
 */
export const scaleInFade: AnimationFn = ({frame, fps, duration}) => {
	// Before animation starts
	if (frame < 0) {
		return {opacity: 0, transform: 'scale(0.5)'};
	}

	// After animation ends - hold final state
	if (frame >= duration) {
		return {opacity: 1, transform: 'scale(1)'};
	}

	// During animation
	const opacity = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	const scale = spring({
		frame,
		fps,
		from: 0.5,
		to: 1,
		durationInFrames: duration,
	});

	return {
		opacity,
		transform: `scale(${scale})`,
	};
};
