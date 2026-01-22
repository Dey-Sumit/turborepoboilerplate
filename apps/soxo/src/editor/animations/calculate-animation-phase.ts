import type {
	EmphasisAnimationConfig,
	ThreePhaseAnimations,
} from '../items/shared';

/**
 * Represents which phase of animation is currently active.
 */
export type AnimationPhase = 'before' | 'enter' | 'emphasis' | 'exit' | 'after';

/**
 * Result of phase calculation for a specific animation phase.
 */
export type PhaseCalculationResult = {
	/**
	 * The current phase of the animation.
	 */
	phase: AnimationPhase;

	/**
	 * Frame relative to the start of the current phase.
	 * Negative if before the phase, positive during/after.
	 */
	relativeFrame: number;

	/**
	 * For emphasis phase: which iteration we're in (0-based).
	 * undefined for other phases.
	 */
	emphasisIteration?: number;

	/**
	 * For emphasis phase: frame within the current iteration.
	 * undefined for other phases.
	 */
	emphasisIterationFrame?: number;
};

/**
 * Validate that animation durations don't exceed item duration.
 * Returns adjusted durations if needed.
 */
function validateAnimationDurations(
	animations: ThreePhaseAnimations,
	itemDurationInFrames: number,
): {
	isValid: boolean;
	warnings: string[];
	adjustedAnimations: ThreePhaseAnimations;
} {
	const warnings: string[] = [];
	const adjusted = {...animations};

	// Calculate total required frames
	const enterDuration = (animations.enter?.duration ?? 0) + (animations.enter?.delay ?? 0);
	const exitDuration = animations.exit?.duration ?? 0;
	const emphasisDelay = animations.emphasis?.delay ?? 0;

	const requiredFrames = enterDuration + exitDuration + emphasisDelay;

	// Check if animations fit
	if (requiredFrames > itemDurationInFrames) {
		warnings.push(
			`Animation durations (${requiredFrames} frames) exceed item duration (${itemDurationInFrames} frames)`,
		);

		// Auto-adjust: Scale down proportionally
		const scale = itemDurationInFrames / requiredFrames;

		if (adjusted.enter) {
			adjusted.enter = {
				...adjusted.enter,
				duration: Math.floor(adjusted.enter.duration * scale),
				delay: Math.floor((adjusted.enter.delay ?? 0) * scale),
			};
		}

		if (adjusted.exit) {
			adjusted.exit = {
				...adjusted.exit,
				duration: Math.floor(adjusted.exit.duration * scale),
			};
		}

		if (adjusted.emphasis) {
			adjusted.emphasis = {
				...adjusted.emphasis,
				delay: Math.floor((adjusted.emphasis.delay ?? 0) * scale),
			};
		}
	}

	// Ensure minimum space for emphasis (at least 1 frame)
	const emphasisSpace = itemDurationInFrames - enterDuration - exitDuration;
	if (animations.emphasis && emphasisSpace < 1) {
		warnings.push('No space remaining for emphasis animation');
	}

	return {
		isValid: warnings.length === 0,
		warnings,
		adjustedAnimations: adjusted,
	};
}

/**
 * Calculate timeline boundaries for each animation phase.
 * Includes validation to prevent overlaps.
 */
function calculatePhaseBoundaries(
	animations: ThreePhaseAnimations,
	itemDurationInFrames: number,
): {
	enterStart: number;
	enterEnd: number;
	emphasisStart: number;
	emphasisEnd: number;
	exitStart: number;
	exitEnd: number;
	validatedAnimations: ThreePhaseAnimations;
} {
	// Validate and potentially adjust animations
	const {adjustedAnimations} = validateAnimationDurations(
		animations,
		itemDurationInFrames,
	);

	const {enter, emphasis, exit} = adjustedAnimations;

	// Enter phase
	const enterStart = enter ? (enter.delay ?? 0) : 0;
	const enterEnd = enter ? enterStart + enter.duration : enterStart;

	// Exit phase (works backward from item end)
	const exitDuration = exit?.duration ?? 0;
	const exitStart = itemDurationInFrames - exitDuration;
	const exitEnd = itemDurationInFrames;

	// Emphasis phase (fills the gap between enter and exit)
	const emphasisStart = enterEnd + (emphasis?.delay ?? 0);
	const emphasisEnd = exitStart;

	return {
		enterStart,
		enterEnd,
		emphasisStart,
		emphasisEnd,
		exitStart,
		exitEnd,
		validatedAnimations: adjustedAnimations,
	};
}

/**
 * Calculate which iteration of emphasis animation we're in for looping.
 */
function calculateEmphasisIteration(
	frameInEmphasisPhase: number,
	emphasis: EmphasisAnimationConfig,
): {iteration: number; frameInIteration: number} {
	const cycleDuration = emphasis.duration + (emphasis.pauseBetween ?? 0);

	// Which iteration (0-based)
	const iteration = Math.floor(frameInEmphasisPhase / cycleDuration);

	// Frame within the current iteration
	const frameInIteration = frameInEmphasisPhase % cycleDuration;

	return {iteration, frameInIteration};
}

/**
 * Determine the current animation phase and relative frame.
 *
 * @param currentFrame - Current frame in the composition timeline
 * @param itemStartFrame - Frame where the item starts (item.from)
 * @param itemDurationInFrames - Duration of the item
 * @param animations - Three-phase animations configuration
 * @returns Phase calculation result
 */
export function calculateAnimationPhase(
	currentFrame: number,
	itemStartFrame: number,
	itemDurationInFrames: number,
	animations: ThreePhaseAnimations | undefined,
): PhaseCalculationResult {
	// No animations configured - always in 'after' state (fully visible)
	if (!animations) {
		return {
			phase: 'after',
			relativeFrame: 0,
		};
	}

	// Calculate frame relative to item start
	const frameRelativeToItem = currentFrame - itemStartFrame;

	// Before item starts
	if (frameRelativeToItem < 0) {
		return {
			phase: 'before',
			relativeFrame: frameRelativeToItem,
		};
	}

	// After item ends
	if (frameRelativeToItem >= itemDurationInFrames) {
		return {
			phase: 'after',
			relativeFrame: frameRelativeToItem - itemDurationInFrames,
		};
	}

	// Calculate boundaries for each phase (with validation)
	const boundaries = calculatePhaseBoundaries(
		animations,
		itemDurationInFrames,
	);

	// Use validated animations to prevent overlaps
	const validatedAnimations = boundaries.validatedAnimations;

	// Determine which phase we're in
	if (
		validatedAnimations.enter &&
		frameRelativeToItem >= boundaries.enterStart &&
		frameRelativeToItem < boundaries.enterEnd
	) {
		// ENTER PHASE
		return {
			phase: 'enter',
			relativeFrame: frameRelativeToItem - boundaries.enterStart,
		};
	}

	if (
		validatedAnimations.exit &&
		frameRelativeToItem >= boundaries.exitStart &&
		frameRelativeToItem < boundaries.exitEnd
	) {
		// EXIT PHASE
		return {
			phase: 'exit',
			relativeFrame: frameRelativeToItem - boundaries.exitStart,
		};
	}

	if (
		validatedAnimations.emphasis &&
		frameRelativeToItem >= boundaries.emphasisStart &&
		frameRelativeToItem < boundaries.emphasisEnd
	) {
		// EMPHASIS PHASE
		const frameInEmphasisPhase = frameRelativeToItem - boundaries.emphasisStart;
		const {iteration, frameInIteration} = calculateEmphasisIteration(
			frameInEmphasisPhase,
			validatedAnimations.emphasis,
		);

		// Check if we've exceeded max iterations
		const maxIterations = validatedAnimations.emphasis.iterations;
		if (
			typeof maxIterations === 'number' &&
			iteration >= maxIterations
		) {
			// Past the last iteration - hold final state
			return {
				phase: 'emphasis',
				relativeFrame: validatedAnimations.emphasis.duration, // End of animation
				emphasisIteration: maxIterations - 1,
				emphasisIterationFrame: validatedAnimations.emphasis.duration,
			};
		}

		// Check if we're in a pause between cycles
		const pauseDuration = validatedAnimations.emphasis.pauseBetween ?? 0;
		if (frameInIteration >= validatedAnimations.emphasis.duration && pauseDuration > 0) {
			// In pause - hold at end of animation
			return {
				phase: 'emphasis',
				relativeFrame: validatedAnimations.emphasis.duration,
				emphasisIteration: iteration,
				emphasisIterationFrame: validatedAnimations.emphasis.duration,
			};
		}

		return {
			phase: 'emphasis',
			relativeFrame: Math.min(frameInIteration, validatedAnimations.emphasis.duration),
			emphasisIteration: iteration,
			emphasisIterationFrame: frameInIteration,
		};
	}

	// In a gap (no animation configured for this period)
	// This happens in the spaces between phases
	return {
		phase: 'after',
		relativeFrame: 0,
	};
}

/**
 * Check if an animation phase is currently active.
 */
export function isPhaseActive(
	phase: AnimationPhase,
	result: PhaseCalculationResult,
): boolean {
	return result.phase === phase;
}

/**
 * Get a debug string representation of the phase calculation.
 * Useful for development and debugging.
 */
export function debugPhaseCalculation(
	result: PhaseCalculationResult,
): string {
	const {phase, relativeFrame, emphasisIteration, emphasisIterationFrame} =
		result;

	if (phase === 'emphasis' && emphasisIteration !== undefined) {
		return `Phase: ${phase} | Iteration: ${emphasisIteration} | Frame: ${relativeFrame} | IterFrame: ${emphasisIterationFrame}`;
	}

	return `Phase: ${phase} | Frame: ${relativeFrame}`;
}
