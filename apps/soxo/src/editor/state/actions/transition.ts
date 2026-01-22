import {toast} from 'sonner';
import {DEFAULT_TRANSITION_DURATION_IN_FRAMES} from '../../constants';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {EditorState, Transition} from '../types';
import {
	SlideDirection,
	WipeDirection,
	FlipDirection,
} from '../../items/schemas';

/**
 * Transition implementation following the transition-idea.md specification.
 * When adding a transition between CURRENT_ITEM and NEXT_ITEM:
 *
 * 1. Set transition.toNext = true on CURRENT_ITEM
 * 2. Set transition.toPrev = true on NEXT_ITEM
 * 3. Adjust NEXT_ITEM.from by subtracting half transition duration (15 frames)
 * 4. Adjust duration of both items by subtracting half transition duration each (15 frames each)
 * 5. Shift all items after NEXT_ITEM by full transition duration (30 frames)
 *
 * This ensures proper timing calculations in the composition renderer.
 */
export const addTransition = ({
	state,
	itemId,
	transition,
	direction = 'toNext',
}: {
	state: EditorState;
	itemId: string;
	transition: Transition;
	direction?: 'toNext' | 'toPrev';
}): void => {
	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// Find the track containing the item and its index within that track
	let trackIndex = -1;
	let itemIndex = -1;

	for (let t = 0; t < currentTimeline.tracks.length; t++) {
		const track = currentTimeline.tracks[t];
		const i = track.items.indexOf(itemId);
		if (i !== -1) {
			trackIndex = t;
			itemIndex = i;
			break;
		}
	}

	if (trackIndex === -1 || itemIndex === -1) {
		console.warn('Item not found in tracks');
		return;
	}

	const track = currentTimeline.tracks[trackIndex];
	const currentItem = currentTimeline.items[itemId];

	if (direction === 'toNext') {
		// Cannot add transition to the last item in a track
		if (itemIndex === track.items.length - 1) {
			console.warn('Cannot add transition to last item in track');
			return;
		}

		const nextItemId = track.items[itemIndex + 1];
		const nextItem = currentTimeline.items[nextItemId];

		if (currentItem.transition.toNext !== undefined) {
			toast.info('Current item already has a transition to next');
			return;
		}
		if (nextItem.transition.toPrev !== undefined) {
			toast.info('Next item already has a transition from previous');
			return;
		}

		// Set transition flags to indicate transition relationship
		currentItem.transition.toNext = transition;
		nextItem.transition.toPrev = transition;
	} else {
		// direction === 'toPrev'
		// Cannot add transition from previous if this is the first item
		if (itemIndex === 0) {
			console.warn('Cannot add transition from previous on first item');
			return;
		}

		const prevItemId = track.items[itemIndex - 1];
		const prevItem = currentTimeline.items[prevItemId];

		if (currentItem.transition.toPrev !== undefined) {
			toast.info('Current item already has a transition from previous');
			return;
		}
		if (prevItem.transition.toNext !== undefined) {
			toast.info('Previous item already has a transition to next');
			return;
		}

		// Set transition flags to indicate transition relationship
		currentItem.transition.toPrev = transition;
		prevItem.transition.toNext = transition;
	}
};

/**
 * Remove transition implementation - reverses the add transition logic.
 * When removing a transition between CURRENT_ITEM and NEXT_ITEM:
 *
 * 1. Set transition.toNext = false on CURRENT_ITEM
 * 2. Set transition.toPrev = false on NEXT_ITEM
 * 3. Add back half transition duration to CURRENT_ITEM.durationInFrames
 * 4. Add back half transition duration to NEXT_ITEM.durationInFrames
 * 5. Add back half transition duration to NEXT_ITEM.from (move it right)
 * 6. Shift all items after NEXT_ITEM by full transition duration (move them left)
 *
 * This reverses all the timing adjustments made when adding the transition.
 */
export const removeTransition = ({
	state,
	itemId,
	direction,
}: {
	state: EditorState;
	itemId: string;
	direction: 'toNext' | 'toPrev';
}): void => {
	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// Find the track containing the item and its index within that track
	let trackIndex = -1;
	let itemIndex = -1;

	for (let t = 0; t < currentTimeline.tracks.length; t++) {
		const track = currentTimeline.tracks[t];
		const i = track.items.indexOf(itemId);
		if (i !== -1) {
			trackIndex = t;
			itemIndex = i;
			break;
		}
	}

	if (trackIndex === -1 || itemIndex === -1) {
		console.warn('Item not found in tracks');
		return;
	}

	const track = currentTimeline.tracks[trackIndex];
	const currentItem = currentTimeline.items[itemId];

	if (direction === 'toNext') {
		// Check if item has transition to next
		if (!currentItem.transition.toNext) {
			console.warn('Item does not have transition to next');
			return;
		}

		// Check if there's a next item
		if (itemIndex === track.items.length - 1) {
			console.warn('Cannot remove transition from last item');
			return;
		}

		const nextItemId = track.items[itemIndex + 1];
		const nextItem = currentTimeline.items[nextItemId];

		// Step 1: Reset transition flags
		currentItem.transition.toNext = undefined;
		nextItem.transition.toPrev = undefined;
	} else if (direction === 'toPrev') {
		// Check if item has transition from previous
		if (!currentItem.transition.toPrev) {
			console.warn('Item does not have transition from previous');
			return;
		}

		// Find the previous item
		if (itemIndex === 0) {
			console.warn('Cannot remove transition from first item');
			return;
		}

		const prevItemId = track.items[itemIndex - 1];
		const prevItem = currentTimeline.items[prevItemId];

		// Step 1: Reset transition flags
		currentItem.transition.toPrev = undefined;
		prevItem.transition.toNext = undefined;
	}
};

/**
 * Update transition - modifies properties of an existing transition.
 * Updates both the current item and its paired item to maintain consistency.
 *
 * @param state - Editor state
 * @param itemId - ID of the item with the transition
 * @param direction - Which transition to update ('toNext' or 'toPrev')
 * @param updates - Partial transition object with properties to update
 */
export const updateTransition = ({
	state,
	itemId,
	direction,
	updates,
}: {
	state: EditorState;
	itemId: string;
	direction: 'toNext' | 'toPrev';
	updates: Partial<Transition>;
}): void => {
	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// Find the track containing the item and its index within that track
	let trackIndex = -1;
	let itemIndex = -1;

	for (let t = 0; t < currentTimeline.tracks.length; t++) {
		const track = currentTimeline.tracks[t];
		const i = track.items.indexOf(itemId);
		if (i !== -1) {
			trackIndex = t;
			itemIndex = i;
			break;
		}
	}

	if (trackIndex === -1 || itemIndex === -1) {
		console.warn('Item not found in tracks');
		return;
	}

	const track = currentTimeline.tracks[trackIndex];
	const currentItem = currentTimeline.items[itemId];

	// Validate transition exists in the specified direction
	const currentTransition =
		direction === 'toNext'
			? currentItem.transition.toNext
			: currentItem.transition.toPrev;

	if (!currentTransition) {
		console.warn(`Item does not have transition in direction: ${direction}`);
		return;
	}

	// Find the paired item based on direction
	let pairedItemId: string | null = null;
	let pairedItem: typeof currentItem | null = null;

	if (direction === 'toNext') {
		if (itemIndex === track.items.length - 1) {
			console.warn('Cannot update transition on last item');
			return;
		}
		pairedItemId = track.items[itemIndex + 1];
		pairedItem = currentTimeline.items[pairedItemId];
	} else {
		// direction === 'toPrev'
		if (itemIndex === 0) {
			console.warn('Cannot update transition on first item');
			return;
		}
		pairedItemId = track.items[itemIndex - 1];
		pairedItem = currentTimeline.items[pairedItemId];
	}

	if (!pairedItem) {
		console.warn('Paired item not found');
		return;
	}

	// Create the updated transition object
	let updatedTransition: Transition;

	// Check if type is changing
	const isTypeChanging =
		updates.type && updates.type !== currentTransition.type;

	if (isTypeChanging) {
		// Type is changing - build new transition with proper type-specific properties
		const newType = updates.type!;
		const preservedDuration =
			updates.durationInFrames ??
			currentTransition.durationInFrames ??
			DEFAULT_TRANSITION_DURATION_IN_FRAMES;

		switch (newType) {
			case 'fade':
				updatedTransition = {
					type: 'fade',
					durationInFrames: preservedDuration,
				};
				break;

			case 'slide':
				updatedTransition = {
					type: 'slide',
					durationInFrames: preservedDuration,
					direction:
						'direction' in updates && updates.direction
							? (updates.direction as SlideDirection)
							: 'from-left',
				};
				break;

			case 'wipe':
				updatedTransition = {
					type: 'wipe',
					durationInFrames: preservedDuration,
					direction:
						'direction' in updates && updates.direction
							? (updates.direction as  WipeDirection )
							: 'from-left',
				};
				break;

			case 'flip':
				updatedTransition = {
					type: 'flip',
					durationInFrames: preservedDuration,
					direction:
						'direction' in updates && updates.direction
							? (updates.direction as FlipDirection)
							: 'from-left',
				};
				break;

			case 'clockwipe':
				updatedTransition = {
					type: 'clockwipe',
					durationInFrames: preservedDuration,
					width:
						'width' in updates && updates.width
							? updates.width
							: state.compositionState.compositionWidth,
					height:
						'height' in updates && updates.height
							? updates.height
							: state.compositionState.compositionHeight,
				};
				break;

			case 'iris':
				updatedTransition = {
					type: 'iris',
					durationInFrames: preservedDuration,
					width:
						'width' in updates && updates.width
							? updates.width
							: state.compositionState.compositionWidth,
					height:
						'height' in updates && updates.height
							? updates.height
							: state.compositionState.compositionHeight,
				};
				break;

			default:
				console.warn(`Unknown transition type: ${newType}`);
				return;
		}
	} else {
		// Type is NOT changing - merge updates with current transition
		updatedTransition = {
			...currentTransition,
			...updates,
		} as Transition;
	}

	// Apply the updated transition to BOTH items (maintaining bidirectional sync)
	if (direction === 'toNext') {
		currentItem.transition.toNext = updatedTransition;
		pairedItem.transition.toPrev = updatedTransition;
	} else {
		currentItem.transition.toPrev = updatedTransition;
		pairedItem.transition.toNext = updatedTransition;
	}
};
