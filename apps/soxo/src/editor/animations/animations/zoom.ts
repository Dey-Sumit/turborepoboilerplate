import {scale as scaleTransform} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Zoom in animation - gradually scales the image from 100% to 130%.
 * Creates a cinematic "Ken Burns" style effect when combined with pan.
 */
export const zoomIn: AnimationFn = ({frame, duration}) => {
	// Before animation starts - normal scale
	if (frame < 0) {
		return {transform: scaleTransform(1)};
	}

	// After animation ends - hold final zoom
	if (frame >= duration) {
		return {transform: scaleTransform(1.3)};
	}

	// During animation - smooth zoom with ease out
	const progress = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	// Ease out cubic for smooth deceleration
	const eased = 1 - Math.pow(1 - progress, 3);

	// Zoom from 1.0 to 1.3 (30% zoom)
	const scaleValue = interpolate(eased, [0, 1], [1, 1.3]);

	return {
		transform: scaleTransform(scaleValue),
	};
};

/**
 * Zoom out animation - gradually scales the image from 130% to 100%.
 * Reverse of zoom in effect.
 */
export const zoomOut: AnimationFn = ({frame, duration}) => {
	// Before animation starts - zoomed in
	if (frame < 0) {
		return {transform: scaleTransform(1.3)};
	}

	// After animation ends - normal scale
	if (frame >= duration) {
		return {transform: scaleTransform(1)};
	}

	// During animation - smooth zoom out with ease out
	const progress = interpolate(frame, [0, duration], [0, 1], {
		extrapolateRight: 'clamp',
	});

	// Ease out cubic for smooth deceleration
	const eased = 1 - Math.pow(1 - progress, 3);

	// Zoom from 1.3 to 1.0
	const scaleValue = interpolate(eased, [0, 1], [1.3, 1]);

	return {
		transform: scaleTransform(scaleValue),
	};
};
