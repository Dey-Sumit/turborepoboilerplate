import {interpolate, spring} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Fade in with slide down animation.
 * Element fades in while sliding down from above.
 */
export const fadeInSlideDown: AnimationFn = ({frame, fps, duration}) => {
	if (frame < 0) {
		return {opacity: 0, transform: 'translateY(-50px)'};
	}

	if (frame >= duration) {
		return {opacity: 1, transform: 'translateY(0px)'};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const maxFrame = duration > 1 ? duration - 1 : 1;
	const opacity = interpolate(frame, [0, maxFrame], [0, 1], {
		extrapolateRight: 'clamp',
	});

	const translateY = spring({
		frame,
		fps,
		from: -50,
		to: 0,
		durationInFrames: duration,
	});

	return {
		opacity,
		transform: `translateY(${translateY}px)`,
	};
};
