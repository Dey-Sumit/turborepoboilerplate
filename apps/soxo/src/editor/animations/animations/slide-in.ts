import {translateX, translateY} from '@remotion/animation-utils';
import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Helper function to create slide-in animations from different directions.
 */
const createSlideIn = (
	direction: 'left' | 'right' | 'top' | 'bottom',
): AnimationFn => {
	return ({frame, duration}) => {
		// Before animation starts - off screen
		if (frame < 0) {
			const offscreenTransforms = {
				left: translateX('-100%'),
				right: translateX('100%'),
				top: translateY('-100%'),
				bottom: translateY('100%'),
			};
			return {opacity: 0, transform: offscreenTransforms[direction]};
		}

		// After animation ends - at final position
		if (frame >= duration) {
			return {opacity: 1, transform: translateX(0)};
		}

		// During animation - slide in with easing
		// For N-frame animation, frame 0 = start, frame N-1 = end
		const maxFrame = duration > 1 ? duration - 1 : 1;
		const progress = interpolate(frame, [0, maxFrame], [0, 1], {
			extrapolateRight: 'clamp',
		});

		// Ease out cubic for smooth deceleration
		const eased = 1 - Math.pow(1 - progress, 3);

		// Calculate position based on direction
		const transformValue = interpolate(eased, [0, 1], [-100, 0]);
		const transformValueInverted = interpolate(eased, [0, 1], [100, 0]);

		const transforms = {
			left: translateX(`${transformValue}%`),
			right: translateX(`${transformValueInverted}%`),
			top: translateY(`${transformValue}%`),
			bottom: translateY(`${transformValueInverted}%`),
		};

		// Fade in opacity quickly at the start
		const fadeInEnd = duration > 1 ? (duration - 1) * 0.2 : 1;
		const opacity = interpolate(frame, [0, fadeInEnd], [0, 1], {
			extrapolateRight: 'clamp',
		});

		return {
			opacity,
			transform: transforms[direction],
		};
	};
};

/**
 * Slide in from left side
 */
export const slideInLeft: AnimationFn = createSlideIn('left');

/**
 * Slide in from right side
 */
export const slideInRight: AnimationFn = createSlideIn('right');

/**
 * Slide in from top
 */
export const slideInTop: AnimationFn = createSlideIn('top');

/**
 * Slide in from bottom
 */
export const slideInBottom: AnimationFn = createSlideIn('bottom');
