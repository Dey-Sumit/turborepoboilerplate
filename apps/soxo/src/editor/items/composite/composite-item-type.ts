import {TrackType} from '../../state/types';
import {BaseItem, CanHaveBorderRadius, CanHaveRotation} from '../shared';

/**
 * ChildTimeline represents a complete timeline structure within a composite.
 * It has the same structure as the root timeline, enabling recursive nesting.
 *
 * Items stored here are ChildTimelineItem types, which include CompositeItem,
 * enabling infinite nesting of composites within composites.
 *
 * Child item coordinates (left, top) are always relative to their parent composite's bounds.
 * When entering a composite for editing, coordinates are converted to absolute for canvas editing.
 * When exiting, they're converted back to relative coordinates.
 */
export type ChildTimeline = {
	/**
	 * Tracks within this composite.
	 * Track order = z-order (first track = bottom layer, last track = top layer)
	 */
	tracks: TrackType[];

	/**
	 * Items within this composite, keyed by item ID.
	 * Coordinates (left, top) are relative to the composite's bounds.
	 */
	items: Record<string, ChildTimelineItem>;
};

/**
 * Items that can exist within a composite's childTimeline.
 *
 * This is now the same as EditorStarterItem, enabling nested composites.
 * TypeScript handles the circular type reference (CompositeItem → ChildTimeline → ChildTimelineItem → CompositeItem)
 * because it's resolved through nominal type references.
 *
 * We maintain this as a separate type alias for:
 * 1. Semantic clarity (documenting that these items live in child timelines)
 * 2. Future flexibility (in case we need to restrict child items differently)
 */
import {EditorStarterItem} from '../item-type';

export type ChildTimelineItem = EditorStarterItem;

/**
 * CompositeItem represents a group of items that act as a single unit.
 *
 * Key characteristics:
 * - Contains a complete childTimeline with its own tracks and items
 * - Child item coordinates are relative to the composite's bounds
 * - Supports fade in/out transitions
 * - Can be scaled (width/height differ from originalWidth/originalHeight)
 * - Enables templates, reusable components, and grouped animations
 *
 * The recursive timeline architecture allows:
 * - Infinite nesting (composites within composites)
 * - Multi-track support within composites
 * - Natural undo/redo (navigation stack is part of undoable state)
 * - Same rendering logic at any level
 */
export type CompositeItem = BaseItem &
	CanHaveBorderRadius &
	CanHaveRotation & {
		type: 'composite';

		/**
		 * Whether to maintain aspect ratio when resizing.
		 */
		keepAspectRatio: boolean;

		/**
		 * Fade in duration in seconds.
		 */
		fadeInDurationInSeconds: number;

		/**
		 * Fade out duration in seconds.
		 */
		fadeOutDurationInSeconds: number;

		/**
		 * Original width of the composite (before scaling).
		 * Used to calculate scale factors when width differs.
		 */
		originalWidth: number;

		/**
		 * Original height of the composite (before scaling).
		 * Used to calculate scale factors when height differs.
		 */
		originalHeight: number;

		/**
		 * Display name for the composite (shown in timeline and breadcrumbs).
		 */
		name: string;

		/**
		 * The complete timeline structure within this composite.
		 * Contains tracks and items, enabling full multi-track support.
		 */
		childTimeline: ChildTimeline;
	};
