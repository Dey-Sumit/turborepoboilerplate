import useUIStore from '../../../zustand/ui-store';
import {
	ChildTimeline,
	ChildTimelineItem,
} from '../../items/composite/composite-item-type';
import {makeCompositeItem} from '../../items/composite/make-composite-item';
import {EditorStarterItem} from '../../items/item-type';
import {generateRandomId} from '../../utils/generate-random-id';
import {getRectAfterCrop} from '../../utils/get-dimensions-after-crop';
import {EditorState, TrackType} from '../types';

/**
 * Calculates the bounding box of multiple items on the canvas.
 * Uses visual bounds (accounting for crop) for items that can be cropped.
 */
function calculateBoundingBox(items: EditorStarterItem[]): {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
} {
	if (items.length === 0) {
		return {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
	}

	let minLeft = Infinity;
	let minTop = Infinity;
	let maxRight = -Infinity;
	let maxBottom = -Infinity;

	for (const item of items) {
		// Use visual bounds (accounting for crop) instead of raw item dimensions
		const rect = getRectAfterCrop(item);
		minLeft = Math.min(minLeft, rect.left);
		minTop = Math.min(minTop, rect.top);
		maxRight = Math.max(maxRight, rect.left + rect.width);
		maxBottom = Math.max(maxBottom, rect.top + rect.height);
	}

	return {
		left: minLeft,
		top: minTop,
		right: maxRight,
		bottom: maxBottom,
		width: maxRight - minLeft,
		height: maxBottom - minTop,
	};
}

/**
 * Calculates the timeline span (start frame and duration) for a set of items.
 */
function calculateTimelineSpan(items: EditorStarterItem[]): {
	from: number;
	durationInFrames: number;
} {
	if (items.length === 0) {
		return {from: 0, durationInFrames: 0};
	}

	let minFrom = Infinity;
	let maxEnd = -Infinity;

	for (const item of items) {
		minFrom = Math.min(minFrom, item.from);
		maxEnd = Math.max(maxEnd, item.from + item.durationInFrames);
	}

	return {
		from: minFrom,
		durationInFrames: maxEnd - minFrom,
	};
}

/**
 * Converts an item's coordinates to be relative to the composite's bounds.
 * Also adjusts the timeline position to be relative to the composite's start.
 *
 * For cropped items: The bounding box is based on visual bounds (after crop).
 * The item's raw left/top needs to be adjusted so that when the crop offset
 * is applied during rendering, the visual content appears at the correct
 * position within the composite.
 *
 * Example with cropped image:
 * - Image raw position: (0, 0), size: 1080x1920
 * - Crop: cropTop=0.135 (visual offset = 260px)
 * - Visual position: (0, 260)
 * - Bounding box: top=260 (from visual bounds)
 * - Relative raw position: 0 - 260 = -260
 * - During render: -260 + cropOffset(260) = 0 (correct!)
 */
function convertToRelativeCoordinates(
	item: EditorStarterItem,
	boundingBox: {left: number; top: number},
	timelineStart: number,
	newTrackId: string,
): ChildTimelineItem {
	// The bounding box origin is based on visual bounds (after crop).
	// We subtract it from the raw item position so that when the crop
	// offset is applied during rendering, the visual content aligns correctly.
	//
	// For nested composites: The childTimeline property is preserved as-is.
	// Children of nested composites remain relative to their parent composite,
	// not to this new composite. Only the composite's own position is adjusted.
	const relativeItem = {
		...item,
		left: item.left - boundingBox.left,
		top: item.top - boundingBox.top,
		from: item.from - timelineStart,
		trackId: newTrackId, // Update trackId to point to the new child track
	};

	return relativeItem as ChildTimelineItem;
}

/**
 * Groups items by their track and creates a new track structure for the child timeline.
 */
function createChildTimelineTracks(
	items: EditorStarterItem[],
	parentTracks: TrackType[],
	boundingBox: {left: number; top: number},
	timelineStart: number,
): ChildTimeline {
	// Group items by their current track
	const itemsByTrack = new Map<string, EditorStarterItem[]>();

	for (const item of items) {
		const track = parentTracks.find((t) => t.items.includes(item.id));
		if (!track) continue;

		const existing = itemsByTrack.get(track.id) ?? [];
		existing.push(item);
		itemsByTrack.set(track.id, existing);
	}

	// Create new tracks preserving the order from parent
	const childTracks: TrackType[] = [];
	const childItems: Record<string, ChildTimelineItem> = {};

	// Process tracks in order (preserving z-order)
	for (const parentTrack of parentTracks) {
		const trackItems = itemsByTrack.get(parentTrack.id);
		if (!trackItems || trackItems.length === 0) continue;

		// Sort items by their position in the original track
		const sortedItems = [...trackItems].sort((a, b) => {
			const aIndex = parentTrack.items.indexOf(a.id);
			const bIndex = parentTrack.items.indexOf(b.id);
			return aIndex - bIndex;
		});

		// Create new track with converted items
		const newTrack: TrackType = {
			id: generateRandomId('track'),
			items: sortedItems.map((item) => item.id),
			hidden: parentTrack.hidden,
			muted: parentTrack.muted,
		};

		childTracks.push(newTrack);

		// Convert each item to relative coordinates and update trackId
		for (const item of sortedItems) {
			childItems[item.id] = convertToRelativeCoordinates(
				item,
				boundingBox,
				timelineStart,
				newTrack.id, // Pass the new track ID to update item's trackId
			);
		}
	}

	return {
		tracks: childTracks,
		items: childItems,
	};
}

/**
 * Creates a composite item from the currently selected items.
 *
 * This action:
 * 1. Gets all selected items
 * 2. Calculates their bounding box on the canvas
 * 3. Calculates their timeline span (start frame and duration)
 * 4. Creates a child timeline with the items (coordinates made relative)
 * 5. Removes items from the parent timeline
 * 6. Creates a composite item positioned at the bounding box
 * 7. Selects the new composite item
 *
 * @param state - The editor state to mutate
 * @param selectedItemIds - IDs of items to include in the composite
 * @returns The ID of the created composite, or null if creation failed
 */
export const createCompositeFromSelection = (
	state: EditorState,
	selectedItemIds: string[],
): string | null => {
	// Need at least 2 items to create a meaningful composite
	if (selectedItemIds.length < 2) {
		return null;
	}

	// Get the actual items
	const selectedItems: EditorStarterItem[] = [];
	for (const id of selectedItemIds) {
		const item = state.compositionState.items[id];
		if (item) {
			selectedItems.push(item);
		}
	}

	if (selectedItems.length < 2) {
		return null;
	}

	// Calculate bounding box on canvas
	const boundingBox = calculateBoundingBox(selectedItems);

	// Calculate timeline span
	const timelineSpan = calculateTimelineSpan(selectedItems);

	// Create child timeline structure
	const childTimeline = createChildTimelineTracks(
		selectedItems,
		state.compositionState.tracks,
		boundingBox,
		timelineSpan.from,
	);

	// Create the composite item
	const compositeItem = makeCompositeItem({
		childTimeline,
		from: timelineSpan.from,
		durationInFrames: timelineSpan.durationInFrames,
		left: boundingBox.left,
		top: boundingBox.top,
		width: boundingBox.width,
		height: boundingBox.height,
		name: `Composite (${selectedItems.length} items)`,
	});

	// Remove selected items from parent tracks
	for (const track of state.compositionState.tracks) {
		track.items = track.items.filter((id) => !selectedItemIds.includes(id));
	}

	// Remove empty tracks
	state.compositionState.tracks = state.compositionState.tracks.filter(
		(track) => track.items.length > 0,
	);

	// Remove items from parent items record
	for (const id of selectedItemIds) {
		delete state.compositionState.items[id];
	}

	// Create a new track for the composite (at the top)
	const compositeTrack: TrackType = {
		id: generateRandomId('track'),
		items: [compositeItem.id],
		hidden: false,
		muted: false,
	};

	// Set trackId on the composite item before adding to items record
	compositeItem.trackId = compositeTrack.id;

	// Add composite item to items record
	state.compositionState.items[compositeItem.id] = compositeItem;

	// Add the composite track at the end (top layer)
	state.compositionState.tracks.push(compositeTrack);

	// Select the new composite item
	useUIStore.getState().setSelectedItems([compositeItem.id]);

	return compositeItem.id;
};
