import React from 'react';
import {calculateAnimationPhase} from './calculate-animation-phase';
import {
	ENTER_ANIMATION_REGISTRY,
	EMPHASIS_ANIMATION_REGISTRY,
	EXIT_ANIMATION_REGISTRY,
} from './animation-map';
import type {ThreePhaseAnimations} from '../items/shared';
import {mergeAnimationStyles} from './merge-animation-styles';

/**
 * Get animation styles for THREE-PHASE animation system.
 * Combines enter, emphasis, and exit animations based on current phase.
 *
 * This is a shared utility used by all item layer components.
 *
 * @param animations - The three-phase animations configuration
 * @param currentFrame - Current frame in the composition timeline
 * @param itemStartFrame - Frame where the item starts (item.from)
 * @param itemDurationInFrames - Duration of the item
 * @param fps - Frames per second
 * @returns Combined CSS styles for all active animation phases
 */
export const getThreePhaseAnimationStyle = (
	animations: ThreePhaseAnimations | undefined,
	currentFrame: number,
	itemStartFrame: number,
	itemDurationInFrames: number,
	fps: number,
): React.CSSProperties => {
	if (!animations) {
		return {};
	}

	// Calculate which phase we're in
	const phaseResult = calculateAnimationPhase(
		currentFrame,
		itemStartFrame,
		itemDurationInFrames,
		animations,
	);

	let enterStyle: React.CSSProperties = {};
	let emphasisStyle: React.CSSProperties = {};
	let exitStyle: React.CSSProperties = {};

	// ENTER PHASE
	if (phaseResult.phase === 'enter' && animations.enter) {
		const enterMeta = ENTER_ANIMATION_REGISTRY[animations.enter.type];
		if (enterMeta?.fn) {
			const result = enterMeta.fn({
				frame: phaseResult.relativeFrame,
				fps,
				duration: animations.enter.duration,
			});
			enterStyle = {
				opacity: result.opacity,
				transform: result.transform,
				filter: result.filter,
				clipPath: result.clipPath,
			};
		}
	}

	// EMPHASIS PHASE
	if (phaseResult.phase === 'emphasis' && animations.emphasis) {
		const emphasisMeta = EMPHASIS_ANIMATION_REGISTRY[animations.emphasis.type];
		if (emphasisMeta?.fn) {
			const result = emphasisMeta.fn({
				frame: phaseResult.relativeFrame,
				fps,
				duration: animations.emphasis.duration,
			});
			emphasisStyle = {
				opacity: result.opacity,
				transform: result.transform,
				filter: result.filter,
				clipPath: result.clipPath,
			};
		}
	}

	// EXIT PHASE
	if (phaseResult.phase === 'exit' && animations.exit) {
		const exitMeta = EXIT_ANIMATION_REGISTRY[animations.exit.type];
		if (exitMeta?.fn) {
			const result = exitMeta.fn({
				frame: phaseResult.relativeFrame,
				fps,
				duration: animations.exit.duration,
			});
			exitStyle = {
				opacity: result.opacity,
				transform: result.transform,
				filter: result.filter,
				clipPath: result.clipPath,
			};
		}
	}

	// MERGE ALL THREE PHASES INTELLIGENTLY
	// Use smart merging that handles transform/opacity conflicts properly

	// Start with enter style as base
	let merged = {...enterStyle};

	// Merge emphasis on top of enter
	if (Object.keys(emphasisStyle).length > 0) {
		merged = mergeAnimationStyles(merged, emphasisStyle);
	}

	// Merge exit on top of everything (exit takes highest priority)
	if (Object.keys(exitStyle).length > 0) {
		merged = mergeAnimationStyles(merged, exitStyle);
	}

	return merged;
};
