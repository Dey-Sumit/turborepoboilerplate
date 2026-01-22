/**
 * Animation types for the editor.
 * Three-phase animation system.
 */

/**
 * Result of an animation function - styles to apply.
 */
export type AnimationResult = {
	opacity?: number;
	transform?: string;
	clipPath?: string;
	filter?: string;
};

/**
 * Animation function signature.
 */
export type AnimationFn = (params: {
	/**
	 * Current frame relative to animation start.
	 * Negative = before animation, 0+ = during/after animation.
	 */
	frame: number;

	/**
	 * Frames per second (for spring calculations).
	 */
	fps: number;

	/**
	 * Animation duration in frames.
	 */
	duration: number;
}) => AnimationResult;
