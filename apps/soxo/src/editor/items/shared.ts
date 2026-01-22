// Re-export types inferred from Zod schemas
export type {
	BaseItem,
	CanHaveBorderRadius,
	CanHaveRotation,
	CanHaveCrop,
	Transition,
	// Three-phase animation types
	EnterAnimationType,
	EmphasisAnimationType,
	ExitAnimationType,
	EnterAnimationConfig,
	EmphasisAnimationConfig,
	ExitAnimationConfig,
	ThreePhaseAnimations,
} from './schemas';

// Re-export schemas for validation
export {
	baseItemSchema,
	canHaveBorderRadiusSchema,
	canHaveRotationSchema,
	canHaveCropSchema,
	transitionSchema,
	// Three-phase animation schemas
	enterAnimationTypeSchema,
	emphasisAnimationTypeSchema,
	exitAnimationTypeSchema,
	enterAnimationConfigSchema,
	emphasisAnimationConfigSchema,
	exitAnimationConfigSchema,
	threePhaseAnimationsSchema,
} from './schemas';
