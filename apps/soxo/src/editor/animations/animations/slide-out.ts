import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Slide out to the left.
 * Element slides out of view to the left side.
 */
export const slideOutLeft: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {transform: 'translateX(0)'};
	}

	if (frame >= duration) {
		return {transform: 'translateX(-100%)', opacity: 0};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;
	const x = interpolate(progress, [0, 1], [0, -100]);

	// Also fade out for smoother exit
	const opacity = interpolate(progress, [0.7, 1], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return {
		transform: `translateX(${x}%)`,
		opacity,
	};
};

/**
 * Slide out to the right.
 * Element slides out of view to the right side.
 */
export const slideOutRight: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {transform: 'translateX(0)'};
	}

	if (frame >= duration) {
		return {transform: 'translateX(100%)', opacity: 0};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;
	const x = interpolate(progress, [0, 1], [0, 100]);

	const opacity = interpolate(progress, [0.7, 1], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return {
		transform: `translateX(${x}%)`,
		opacity,
	};
};

/**
 * Slide out to the top.
 * Element slides out of view upward.
 */
export const slideOutTop: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {transform: 'translateY(0)'};
	}

	if (frame >= duration) {
		return {transform: 'translateY(-100%)', opacity: 0};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;
	const y = interpolate(progress, [0, 1], [0, -100]);

	const opacity = interpolate(progress, [0.7, 1], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return {
		transform: `translateY(${y}%)`,
		opacity,
	};
};

/**
 * Slide out to the bottom.
 * Element slides out of view downward.
 */
export const slideOutBottom: AnimationFn = ({frame, duration}) => {
	if (frame < 0) {
		return {transform: 'translateY(0)'};
	}

	if (frame >= duration) {
		return {transform: 'translateY(100%)', opacity: 0};
	}

	// For N-frame animation, frame 0 = start, frame N-1 = end
	const progress = duration > 1 ? frame / (duration - 1) : 1;
	const y = interpolate(progress, [0, 1], [0, 100]);

	const opacity = interpolate(progress, [0.7, 1], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return {
		transform: `translateY(${y}%)`,
		opacity,
	};
};
