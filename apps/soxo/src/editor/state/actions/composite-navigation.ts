import useUIStore from '../../../zustand/ui-store';
import {
	findCompositeInHierarchy,
	isAtRootLevel,
} from '../helpers/get-current-timeline';
import {EditorState} from '../types';

/**
 * Enter a composite's edit mode by pushing it onto the navigation stack.
 *
 * This action:
 * 1. Validates the composite exists
 * 2. Converts child items from relative to absolute coordinates
 * 3. Pushes the composite onto the timelineViewStack
 * 4. Clears the current selection (items in parent aren't relevant)
 *
 * After this action, all context-aware hooks (useTracks, useAllItems, etc.)
 * will return data from the composite's childTimeline with absolute coordinates.
 *
 * @param state - The editor state to mutate
 * @param compositeId - The ID of the composite to enter
 * @returns true if navigation succeeded, false if composite not found
 */
export const enterCompositeEditMode = (
	state: EditorState,
	compositeId: string,
): boolean => {
	// Validate composite exists
	const composite = findCompositeInHierarchy(state, compositeId);
	if (!composite) {
		console.error(`Cannot enter composite: ${compositeId} not found`);
		return false;
	}

	// Convert all child items from relative to absolute coordinates
	// This allows normal editing on the full canvas
	const {childTimeline} = composite;
	for (const itemId of Object.keys(childTimeline.items)) {
		const item = childTimeline.items[itemId];
		childTimeline.items[itemId] = {
			...item,
			left: item.left + composite.left,
			top: item.top + composite.top,
		};
	}

	// Push composite onto the navigation stack
	state.compositionState.timelineViewStack.push({
		type: 'COMPOSITE',
		compositeId,
	});

	// Clear selection - parent items aren't relevant inside composite
	useUIStore.getState().setSelectedItems([]);

	return true;
};

/**
 * Exit the current composite's edit mode by popping from the navigation stack.
 *
 * This action:
 * 1. Validates we're not at root level
 * 2. Recalculates the composite's bounding box from its children
 * 3. Updates the composite's position and size
 * 4. Converts child items back to relative coordinates
 * 5. Pops the current composite from the stack
 * 6. Clears the current selection
 *
 * After this action, context-aware hooks will return data from the parent level.
 *
 * @param state - The editor state to mutate
 * @returns true if exit succeeded, false if already at root
 */
export const exitCompositeEditMode = (state: EditorState): boolean => {
	// Can't exit if already at root
	if (isAtRootLevel(state)) {
		console.warn('Cannot exit: already at root level');
		return false;
	}

	// Get the current composite before popping
	const stack = state.compositionState.timelineViewStack;
	const currentEntry = stack[stack.length - 1];
	if (currentEntry.type !== 'COMPOSITE') {
		console.error('Expected COMPOSITE entry at top of stack');
		return false;
	}

	const composite = findCompositeInHierarchy(state, currentEntry.compositeId);
	if (!composite) {
		console.error(`Composite ${currentEntry.compositeId} not found`);
		return false;
	}

	const {childTimeline} = composite;
	const childItems = Object.values(childTimeline.items);

	// Handle empty composite case
	if (childItems.length === 0) {
		// Pop the stack and return - composite remains at its current position
		state.compositionState.timelineViewStack.pop();
		useUIStore.getState().setSelectedItems([]);
		return true;
	}

	// Calculate new bounding box from all children (in absolute coords)
	let minLeft = Infinity;
	let minTop = Infinity;
	let maxRight = -Infinity;
	let maxBottom = -Infinity;

	for (const item of childItems) {
		minLeft = Math.min(minLeft, item.left);
		minTop = Math.min(minTop, item.top);
		maxRight = Math.max(maxRight, item.left + item.width);
		maxBottom = Math.max(maxBottom, item.top + item.height);
	}

	const newLeft = minLeft;
	const newTop = minTop;
	const newWidth = maxRight - minLeft;
	const newHeight = maxBottom - minTop;

	// Convert all child items back to relative coordinates
	for (const itemId of Object.keys(childTimeline.items)) {
		const item = childTimeline.items[itemId];
		childTimeline.items[itemId] = {
			...item,
			left: item.left - newLeft,
			top: item.top - newTop,
		};
	}

	// Update the composite's position and size
	composite.left = newLeft;
	composite.top = newTop;
	composite.width = newWidth;
	composite.height = newHeight;
	composite.originalWidth = newWidth;
	composite.originalHeight = newHeight;

	// Pop the current composite from the stack
	state.compositionState.timelineViewStack.pop();

	// Clear selection - composite items aren't relevant in parent
	useUIStore.getState().setSelectedItems([]);

	return true;
};

/**
 * Exit all the way to root level, clearing the entire navigation stack.
 *
 * This properly handles coordinate conversion for each level by calling
 * exitCompositeEditMode repeatedly until we reach root.
 *
 * @param state - The editor state to mutate
 */
export const exitToRoot = (state: EditorState): void => {
	// Exit each level one by one to ensure proper coordinate conversion
	while (!isAtRootLevel(state)) {
		exitCompositeEditMode(state);
	}

	// Clear selection
	useUIStore.getState().setSelectedItems([]);
};

/**
 * Get the navigation path as an array of composite IDs.
 * Useful for rendering breadcrumbs.
 *
 * @param state - The editor state
 * @returns Array of composite IDs from root to current (empty if at root)
 */
export const getNavigationPath = (state: EditorState): string[] => {
	return state.compositionState.timelineViewStack
		.filter((entry) => entry.type === 'COMPOSITE')
		.map(
			(entry) =>
				(entry as {type: 'COMPOSITE'; compositeId: string}).compositeId,
		);
};

/**
 * Get the current navigation depth.
 *
 * @param state - The editor state
 * @returns 0 if at root, 1 if inside first composite, etc.
 */
export const getNavigationDepth = (state: EditorState): number => {
	return state.compositionState.timelineViewStack.length - 1;
};
