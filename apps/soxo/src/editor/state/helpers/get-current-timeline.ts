import {CompositeItem} from '../../items/composite/composite-item-type';
import {EditorStarterItem} from '../../items/item-type';
import {EditorState, TrackType, compositionState} from '../types';

/**
 * Timeline structure returned by getCurrentTimeline.
 * Has the same shape at both root and composite levels.
 */
export type TimelineData = {
	tracks: TrackType[];
	items: Record<string, EditorStarterItem>;
};

/**
 * Recursively search for a composite item by ID in the timeline hierarchy.
 * Searches root level first, then descends into child composites.
 *
 * @param timeline - The timeline to search in (root or composite's childTimeline)
 * @param compositeId - The ID of the composite to find
 * @returns The composite item if found, null otherwise
 */
export function findCompositeInTimeline(
	timeline: {items: Record<string, EditorStarterItem>},
	compositeId: string,
): CompositeItem | null {
	// Check if composite exists at this level
	const item = timeline.items[compositeId];
	if (item && item.type === 'composite') {
		return item;
	}

	// Search in all child composites at this level
	for (const itemId of Object.keys(timeline.items)) {
		const currentItem = timeline.items[itemId];
		if (currentItem.type === 'composite') {
			const found = findCompositeInTimeline(
				currentItem.childTimeline,
				compositeId,
			);
			if (found) return found;
		}
	}

	return null;
}

/**
 * Find a composite item anywhere in the state hierarchy.
 *
 * @param state - The full editor state
 * @param compositeId - The ID of the composite to find
 * @returns The composite item if found, null otherwise
 */
export function findCompositeInHierarchy(
	state: EditorState | compositionState,
	compositeId: string,
): CompositeItem | null {
	// Handle both EditorState and compositionState
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	return findCompositeInTimeline(compositionState, compositeId);
}

/**
 * Get the current timeline based on the navigation stack.
 *
 * - At root level: Returns root tracks and items
 * - Inside a composite: Returns that composite's childTimeline
 *
 * This is the core function that makes the editor context-aware.
 * All UI components should use this (via hooks) to get the correct timeline data.
 *
 * @param state - The full editor state (or just compositionState)
 * @returns The tracks and items for the current navigation context
 */
export function getCurrentTimeline(
	state: EditorState | compositionState,
): TimelineData {
	// Handle both EditorState and compositionState
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	const stack = compositionState.timelineViewStack;
	const current = stack[stack.length - 1];

	// At root level - return root timeline
	if (current.type === 'ROOT') {
		return {
			tracks: compositionState.tracks,
			items: compositionState.items,
		};
	}

	// Inside a composite - find and return its childTimeline
	const composite = findCompositeInTimeline(
		compositionState,
		current.compositeId,
	);

	if (!composite) {
		// Composite not found - this shouldn't happen in normal use
		// Fall back to root to prevent crashes
		console.error(
			`Composite ${current.compositeId} not found in hierarchy. Falling back to root.`,
		);
		return {
			tracks: compositionState.tracks,
			items: compositionState.items,
		};
	}

	return composite.childTimeline;
}

/**
 * Get the current composite ID from the navigation stack.
 *
 * @param state - The full editor state
 * @returns The composite ID if inside a composite, null if at root
 */
export function getCurrentCompositeId(
	state: EditorState | compositionState,
): string | null {
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	const stack = compositionState.timelineViewStack;
	const current = stack[stack.length - 1];

	return current.type === 'COMPOSITE' ? current.compositeId : null;
}

/**
 * Check if the editor is currently at the root timeline level.
 *
 * @param state - The full editor state
 * @returns true if at root level, false if inside a composite
 */
export function isAtRootLevel(state: EditorState | compositionState): boolean {
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	const stack = compositionState.timelineViewStack;
	return stack.length === 1 && stack[0].type === 'ROOT';
}

/**
 * Get the current composite item if inside one.
 *
 * @param state - The full editor state
 * @returns The current composite item if inside one, null if at root
 */
export function getCurrentComposite(
	state: EditorState | compositionState,
): CompositeItem | null {
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	const stack = compositionState.timelineViewStack;
	const current = stack[stack.length - 1];

	if (current.type === 'ROOT') {
		return null;
	}

	return findCompositeInTimeline(compositionState, current.compositeId);
}

/**
 * Get the canvas dimensions for the current context.
 *
 * - At root level: Returns the composition dimensions
 * - Inside a composite: Returns the composite's original dimensions
 *
 * This ensures items render at the correct positions when editing inside a composite.
 *
 * @param state - The full editor state
 * @returns {width, height} for the current editing context
 */
export function getCurrentCanvasDimensions(
	state: EditorState | compositionState,
): {width: number; height: number} {
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	const composite = getCurrentComposite(state);

	if (composite) {
		return {
			width: composite.originalWidth,
			height: composite.originalHeight,
		};
	}

	return {
		width: compositionState.compositionWidth,
		height: compositionState.compositionHeight,
	};
}

/**
 * Get the items object from the current timeline context.
 * This is a convenience function for action handlers.
 *
 * @param state - The editor state
 * @returns The items record for the current navigation context
 */
export function getCurrentItems(
	state: EditorState | compositionState,
): Record<string, EditorStarterItem> {
	return getCurrentTimeline(state).items;
}

/**
 * Get the tracks array from the current timeline context.
 * This is a convenience function for action handlers.
 *
 * @param state - The editor state
 * @returns The tracks array for the current navigation context
 */
export function getCurrentTracks(
	state: EditorState | compositionState,
): TrackType[] {
	return getCurrentTimeline(state).tracks;
}

/**
 * Find an item by ID anywhere in the hierarchy.
 * First checks the current timeline, then searches the full hierarchy.
 *
 * @param state - The editor state
 * @param itemId - The ID of the item to find
 * @returns The item if found, undefined otherwise
 */
export function findItemInState(
	state: EditorState | compositionState,
	itemId: string,
): EditorStarterItem | undefined {
	const compositionState =
		'compositionState' in state ? state.compositionState : state;

	// First check current timeline context
	const currentItems = getCurrentItems(state);
	if (currentItems[itemId]) {
		return currentItems[itemId];
	}

	// Then check root items
	if (compositionState.items[itemId]) {
		return compositionState.items[itemId];
	}

	// Finally search in all composites
	return findItemInHierarchy(compositionState.items, itemId) ?? undefined;
}

/**
 * Recursively search for an item in the hierarchy.
 */
function findItemInHierarchy(
	items: Record<string, EditorStarterItem>,
	itemId: string,
): EditorStarterItem | null {
	// Check current level
	if (items[itemId]) {
		return items[itemId];
	}

	// Search in composite children
	for (const item of Object.values(items)) {
		if (item.type === 'composite') {
			const found = findItemInHierarchy(item.childTimeline.items, itemId);
			if (found) return found;
		}
	}

	return null;
}

/**
 * Recursively collect ALL items from the entire hierarchy.
 * This is useful for operations that need to scan all items regardless of context,
 * such as finding orphaned assets or saving state.
 *
 * @param items - The root level items
 * @returns All items including those nested inside composites
 */
export function getAllItemsInHierarchy(
	items: Record<string, EditorStarterItem>,
): EditorStarterItem[] {
	const result: EditorStarterItem[] = [];

	for (const item of Object.values(items)) {
		result.push(item);

		// Recursively collect items from composites
		if (item.type === 'composite') {
			const nestedItems = getAllItemsInHierarchy(item.childTimeline.items);
			result.push(...nestedItems);
		}
	}

	return result;
}

/**
 * Get all items as a flat record from the entire hierarchy.
 * Similar to getAllItemsInHierarchy but returns a Record for easy lookup.
 *
 * @param items - The root level items
 * @returns All items as a Record, including those nested inside composites
 */
export function getAllItemsAsRecord(
	items: Record<string, EditorStarterItem>,
): Record<string, EditorStarterItem> {
	const result: Record<string, EditorStarterItem> = {};

	for (const item of Object.values(items)) {
		result[item.id] = item;

		// Recursively collect items from composites
		if (item.type === 'composite') {
			const nestedItems = getAllItemsAsRecord(item.childTimeline.items);
			Object.assign(result, nestedItems);
		}
	}

	return result;
}
