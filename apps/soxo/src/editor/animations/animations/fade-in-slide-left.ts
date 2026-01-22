import {interpolate, spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Fade in with slide left animation.
 * Element fades in while sliding in from the right.
 */
export const fadeInSlideLeft: AnimationFn = ({frame, fps, duration}) => {
	if (frame < 0) {
		return {opacity: 0, transform: 'translateX(50px)'};
	}

	if (frame >= duration) {
		return {opacity: 1, transform: 'translateX(0px)'};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const maxFrame = duration > 1 ? duration - 1 : 1;
	const opacity = interpolate(frame, [0, maxFrame], [0, 1], {
		extrapolateRight: 'clamp',
	});

	const translateX = spring({
		frame,
		fps,
		from: 50,
		to: 0,
		durationInFrames: duration,
	});

	return {
		opacity,
		transform: `translateX(${translateX}px)`,
	};
};
