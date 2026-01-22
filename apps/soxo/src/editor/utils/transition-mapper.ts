import {type TransitionPresentation} from '@remotion/transitions';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {fade, FadeProps} from '@remotion/transitions/fade';
import {flip, FlipDirection, FlipProps} from '@remotion/transitions/flip';
import {iris, IrisProps} from '@remotion/transitions/iris';
import {slide, SlideDirection, SlideProps} from '@remotion/transitions/slide';
import {wipe, WipeDirection, WipeProps} from '@remotion/transitions/wipe';
import {DEFAULT_TRANSITION_DURATION_IN_FRAMES} from '../constants';
import {Transition} from '../state/types';

/**
 * Default direction for transitions that support direction
 */
const DEFAULT_DIRECTION = 'from-left';

/**
 * Maps user's transition direction to Remotion's direction format
 */
function mapDirection(direction?: string) {
	if (!direction) return DEFAULT_DIRECTION;

	const directionMap: Record<string, string> = {
		up: 'from-top',
		down: 'from-bottom',
		left: 'from-left',
		right: 'from-right',
	};

	return directionMap[direction] || direction;
}
export type TransitionPresentationTypes =TransitionPresentation<FadeProps> | TransitionPresentation<WipeProps>| TransitionPresentation<FlipProps> | TransitionPresentation<SlideProps> | TransitionPresentation<IrisProps>
/**
 * Creates a Remotion presentation config from user's transition config
 */
export function createPresentation(
	transition: Transition
): TransitionPresentationTypes
{
	const {type} = transition;

	switch (type) {
		case 'fade':
			return fade();

		case 'wipe':
			return wipe({
				direction: mapDirection(transition.direction) as WipeDirection,
			});

		case 'slide':
			return slide({
				direction: mapDirection(transition.direction) as SlideDirection,
			});

		case 'flip':
			return flip({
				direction: mapDirection(transition.direction) as FlipDirection,
			});

		case 'clockwipe':
			return clockWipe({
				width: transition.width,
				height: transition.height,
			});

		case 'iris':
			return iris({
				width: transition.width,
				height: transition.height,
			});

		default:
			// Fallback to fade if unknown type
			return fade();
	}
}

/**
 * Get transition duration in frames with default fallback
 * @param transition - The transition object
 * @param defaultDuration - Default duration in frames if transition doesn't specify one (defaults to 30)
 */
export function getTransitionDuration(
	transition: Transition,
	defaultDuration: number = DEFAULT_TRANSITION_DURATION_IN_FRAMES,
): number {
	return transition.durationInFrames ?? defaultDuration;
}
