import {interpolate} from 'remotion';
import type {AnimationFn} from '../types';

/**
 * Highlight animation for karaoke-style text effects.
 *
 * Unlike other animations that start at opacity 0 and reveal,
 * highlight starts with all words visible but dimmed (opacity 0.3).
 * As each word animates, it transitions from dimmed to fully visible (opacity 1).
 *
 * Key difference: Words are ALWAYS visible, just at different opacity levels.
 * This creates a "highlighting" effect rather than a "revealing" effect.
 *
 * The cumulative effect is achieved through the stagger system in AnimatedSpan:
 * - Word 0: Highlights from frame 0
 * - Word 1: Highlights from frame (0 + stagger)
 * - Word 2: Highlights from frame (0 + stagger * 2)
 * - etc.
 *
 * Once a word is highlighted, it stays highlighted (opacity 1).
 */
export const highlight: AnimationFn = ({frame, duration}) => {
	// Dimmed opacity before animation starts
	const DIMMED_OPACITY = 0.5;
	// Full opacity after animation
	const FULL_OPACITY = 1;

	// Before animation starts - word is visible but dimmed
	if (frame < 0) {
		return {opacity: DIMMED_OPACITY};
	}

	// After animation ends - word is fully highlighted
	if (frame >= duration) {
		return {opacity: FULL_OPACITY};
	}

	// During animation - transition from dimmed to full
	const opacity = interpolate(
		frame,
		[0, duration],
		[DIMMED_OPACITY, FULL_OPACITY],
		{
			extrapolateRight: 'clamp',
		},
	);

	return {opacity};
};
