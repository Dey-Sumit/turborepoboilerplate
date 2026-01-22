import {byDefaultKeepAspectRatioMap} from '../../utils/aspect-ratio';
import {generateRandomId} from '../../utils/generate-random-id';
import {ChildTimeline, CompositeItem} from './composite-item-type';

/**
 * Creates a new CompositeItem with the given child timeline.
 *
 * The composite will be positioned at the specified bounds and contain
 * the provided child timeline structure.
 *
 * @param params - Configuration for the composite item
 * @returns A new CompositeItem
 */
export const makeCompositeItem = ({
	childTimeline,
	from,
	durationInFrames,
	left,
	top,
	width,
	height,
	name,
}: {
	/** The child timeline containing tracks and items */
	childTimeline: ChildTimeline;
	/** Start frame in the parent timeline */
	from: number;
	/** Duration in frames */
	durationInFrames: number;
	/** Left position on canvas */
	left: number;
	/** Top position on canvas */
	top: number;
	/** Width of the composite */
	width: number;
	/** Height of the composite */
	height: number;
	/** Display name for the composite */
	name?: string;
}): CompositeItem => {
	const id = generateRandomId('composite');

	return {
		id,
		type: 'composite',
		from,
		durationInFrames,
		left,
		top,
		width,
		height,
		originalWidth: width,
		originalHeight: height,
		opacity: 1,
		borderRadius: 0,
		rotation: 0,
		isDraggingInTimeline: false,
		keepAspectRatio: byDefaultKeepAspectRatioMap.composite,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		name: name ?? 'Composite',
		childTimeline,
		transition: {
			toNext: undefined,
			toPrev: undefined,
		},
	};
};
