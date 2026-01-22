import {interpolate, spring} from 'remotion';
import type {HighlightStyle} from './captions-item-type';

// Re-export HighlightStyle for convenience
export type {HighlightStyle};

/**
 * Style configuration for active and inactive words
 */
export interface WordStyleResult {
	/**
	 * Styles to apply to the word span
	 */
	style: React.CSSProperties;
	/**
	 * Additional class names if needed
	 */
	className?: string;
}

export interface HighlightStyleParams {
	/**
	 * Whether this word is currently active (being spoken)
	 */
	isActive: boolean;
	/**
	 * Current frame within this caption page (starts at 0)
	 */
	frameInPage: number;
	/**
	 * Frame when this word becomes active (relative to page start)
	 */
	wordStartFrame: number;
	/**
	 * Frames per second
	 */
	fps: number;
	/**
	 * Base color for inactive words
	 */
	color: string;
	/**
	 * Highlight color for active words
	 */
	highlightColor: string;
}

/**
 * Calculate styles for a word based on highlight style
 */
export function getHighlightStyles(
	highlightStyle: HighlightStyle,
	params: HighlightStyleParams,
): WordStyleResult {
	switch (highlightStyle) {
		case 'highlight':
			return applyHighlight(params);

		case 'pop-in':
			return applyPopIn(params);

		case 'scale':
			return applyScale(params);

		case 'glow':
			return applyGlow(params);

		case 'bounce':
			return applyBounce(params);

		default:
			return applyHighlight(params);
	}
}

/**
 * Default: Simple color change
 */
function applyHighlight(params: HighlightStyleParams): WordStyleResult {
	const {isActive, color, highlightColor} = params;

	return {
		style: {
			display: 'inline',
			whiteSpace: 'pre-wrap',
			color: isActive ? highlightColor : color,
		},
	};
}

/**
 * Pop-in: Punchy scale spring animation when word becomes active
 */
function applyPopIn(params: HighlightStyleParams): WordStyleResult {
	const {isActive, frameInPage, wordStartFrame, fps, color, highlightColor} =
		params;

	if (!isActive) {
		return {
			style: {
				display: 'inline-block',
				whiteSpace: 'pre-wrap',
				color,
				opacity: 0.4,
			},
		};
	}

	// Calculate frames since this word became active
	const framesActive = frameInPage - wordStartFrame;

	// Spring animation for scale - more punchy with overshoot
	const scale = spring({
		frame: framesActive,
		fps,
		config: {
			damping: 12,
			stiffness: 300,
			mass: 0.8,
		},
		from: 0,
		to: 1,
	});

	// Aggressive scale: 0.6 → 1.3 → settles at 1.0
	const finalScale = interpolate(scale, [0, 1], [0.6, 1.3]);

	return {
		style: {
			display: 'inline-block',
			whiteSpace: 'pre-wrap',
			color: highlightColor,
			transform: `scale(${finalScale})`,
			transformOrigin: 'center bottom',
		},
	};
}

/**
 * Scale: Smooth scale up when active
 */
function applyScale(params: HighlightStyleParams): WordStyleResult {
	const {isActive, color, highlightColor} = params;

	return {
		style: {
			display: 'inline-block',
			whiteSpace: 'pre-wrap',
			color: isActive ? highlightColor : color,
			opacity: isActive ? 1 : 0.5,
			transform: isActive ? 'scale(1.2)' : 'scale(1)',
			transformOrigin: 'center bottom',
			transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease-out',
		},
	};
}


/**
 * Glow: Elegant glow effect using drop-shadow filter
 */
function applyGlow(params: HighlightStyleParams): WordStyleResult {
	const {isActive, color, highlightColor} = params;

	return {
		style: {
			display: 'inline-block',
			whiteSpace: 'pre-wrap',
			color: isActive ? highlightColor : color,
			opacity: isActive ? 1 : 0.6,
			filter: isActive
				? `drop-shadow(0 0 6px ${highlightColor}) drop-shadow(0 0 10px ${highlightColor}) drop-shadow(0 0 16px ${highlightColor})`
				: 'none',
			transition: 'filter 0.2s ease-out, color 0.2s ease-out, opacity 0.2s ease-out',
		},
	};
}

/**
 * Bounce: Springy bounce animation from bottom to up
 */
function applyBounce(params: HighlightStyleParams): WordStyleResult {
	const {isActive, frameInPage, wordStartFrame, fps, color, highlightColor} =
		params;

	if (!isActive) {
		return {
			style: {
				display: 'inline-block',
				whiteSpace: 'pre-wrap',
				color,
				opacity: 0.5,
			},
		};
	}

	// Calculate frames since this word became active
	const framesActive = frameInPage - wordStartFrame;

	// Springier bounce animation
	const bounce = spring({
		frame: framesActive,
		fps,
		config: {
			damping: 7,
			stiffness: 400,
			mass: 0.8,
		},
		from: 0,
		to: 1,
	});

	// Convert to translateY (bounce from bottom to up with overshoot)
	// Positive translateY moves down, so we start at 30 and go to 0 (with bounce)
	const translateY = interpolate(bounce, [0, 1], [30, 0]);

	return {
		style: {
			display: 'inline-block',
			whiteSpace: 'pre-wrap',
			color: highlightColor,
			transform: `translateY(${translateY}px)`,
		},
	};
}

/**
 * Human-readable labels for highlight styles
 */
export const HIGHLIGHT_STYLE_LABELS: Record<HighlightStyle, string> = {
	highlight: 'Highlight',
	'pop-in': 'Pop In',
	scale: 'Scale',
	glow: 'Glow',
	bounce: 'Bounce',
};
