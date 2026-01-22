import {useCallback} from 'react';
import useEditorStore from '../../../../zustand/editor-store';
import useUIStore, {useSetDragPreview} from '../../../../zustand/ui-store';
import {selectSelectedItemsSet} from '../../../selectors/selection-set-selector';
import {useDragOverlay} from '../../../drag-overlay-provider';
import {
	forceSpecificCursor,
	stopForcingSpecificCursor,
} from '../../../force-specific-cursor';
import {EditorStarterItem} from '../../../items/item-type';
import {applySnapPoint} from '../../../state/actions/apply-snap-point';
import {
	markMultipleAsDraggingInTimeline,
	unmarkMultipleAsDraggingInTimeline,
} from '../../../state/actions/make-as-dragging-in-timeline';
import {setSelectedItems} from '../../../state/actions/set-selected-items';
import {getCurrentTimeline} from '../../../state/helpers/get-current-timeline';
import {TrackType} from '../../../state/types';
import {getCompositionDuration} from '../../../utils/get-composition-duration';
import {getVisibleFrames} from '../../../utils/get-visible-frames';
import {isLeftClick} from '../../../utils/is-left-click';
import {timelineScrollContainerRef} from '../../../utils/restore-scroll-after-zoom';
import {
	adjustSelectionAfterClick,
	calculateSelectionAndDragState,
	hasExceededMoveThreshold,
} from '../../../utils/selection-utils';
import {useFps} from '../../../utils/use-context';
import {PreviewPosition} from '../../drag-preview-provider';
import type {SnapPoint} from '../snap-points';
import {collectSnapPoints} from '../snap-points';
import {useTimelineSize} from '../use-timeline-size';
import {applyNewPositionsToState} from './apply-new-positions-to-state';
import {calculateNewItemPositions} from './calculate-new-item-positions';
import { TimelineItemData } from '../../../selectors';

type DragOffsets = {
	offsetX: number;
	offsetY: number;
};

const cleanupDragEvent = ({
	pointerUpEvent,
	startX,
	startY,
	initialScrollLeft,
	initialScrollTop,
	stopDragOverlay,
}: {
	pointerUpEvent: PointerEvent;
	startX: number;
	startY: number;
	initialScrollLeft: number;
	initialScrollTop: number;
	stopDragOverlay: () => void;
}): DragOffsets => {
	stopDragOverlay();

	const finalScrollLeft = timelineScrollContainerRef.current?.scrollLeft ?? 0;
	const finalScrollTop = timelineScrollContainerRef.current?.scrollTop ?? 0;
	const scrollDifferenceX = finalScrollLeft - initialScrollLeft;
	const scrollDifferenceY = finalScrollTop - initialScrollTop;

	const offsetX = pointerUpEvent.clientX - startX + scrollDifferenceX;
	const offsetY = pointerUpEvent.clientY - startY + scrollDifferenceY;

	return {offsetX, offsetY};
};

const collectDraggedItemsData = ({
	tracks,
	items,
	itemsToDrag,
}: {
	tracks: TrackType[];
	items: Record<string, EditorStarterItem>;
	itemsToDrag: string[];
}): PreviewPosition[] => {
	const draggedItemsData: PreviewPosition[] = [];

	for (let i = 0; i < tracks.length; i++) {
		for (const trackItemId of tracks[i].items) {
			const trackItem = items[trackItemId];
			if (itemsToDrag.includes(trackItem.id)) {
				draggedItemsData.push({
					id: trackItem.id,
					from: trackItem.from,
					durationInFrames: trackItem.durationInFrames,
					trackIndex: i,
				});
			}
		}
	}

	return draggedItemsData;
};

export const useItemDrag = ({
	draggedItem,
}: {
	draggedItem: TimelineItemData;
}) => {
	const {fps} = useFps();
	const setState = useEditorStore((state) => state.setState);
	const {timelineWidth} = useTimelineSize();

	if (timelineWidth === null) {
		throw new Error('Timeline width is null');
	}

	const setDragPreview = useSetDragPreview();

	const {
		startDrag: startDragOverlay,
		updateCursorPosition,
		stopDrag: stopDragOverlay,
		setSnappedPositions,
	} = useDragOverlay();

	// Handle simple click (no drag) to potentially reduce selection.
	const onClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const selectedItems = useUIStore.getState().selectedItems;

			const multiSelect = e.metaKey || e.shiftKey;
			const newSelection = adjustSelectionAfterClick({
				clickedItem: draggedItem,
				currentSelectedItemIds: selectedItems,
				isMultiSelectMode: multiSelect,
			});

			if (newSelection.length !== selectedItems.length) {
				// Selection changes SHOULD be added to undo history
				useUIStore.getState().setSelectedItems(newSelection);
			}
		},
		[draggedItem],
	);

	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!isLeftClick(e)) {
				return;
			}

			e.stopPropagation();

			const multiSelect = e.metaKey || e.shiftKey;

			const currentState = useEditorStore.getState();
			// Use getCurrentTimeline to get context-aware items/tracks
			const currentTimeline = getCurrentTimeline(currentState);
			const items = currentTimeline.items;
			const tracks = currentTimeline.tracks;
			const durationInFrames = getCompositionDuration(items, tracks);
			const selectedItems = useUIStore.getState().selectedItems;

			const {allowDrag, newSelectedItems} = calculateSelectionAndDragState({
				clickedItem: draggedItem,
				currentSelectedItemIds: selectedItems,
				isMultiSelectMode: multiSelect,
			});

			// Selection changes SHOULD be added to undo history
			setState((state) => {
				setSelectedItems(state, newSelectedItems);
			});

			if (allowDrag) {
				// Get fresh state after setState to avoid using stale data
				const freshState = useEditorStore.getState();
				const freshTimeline = getCurrentTimeline(freshState);
				const freshTracks = freshTimeline.tracks;
				const freshItems = freshTimeline.items;

				const visibleFrames = getVisibleFrames({
					fps,
					totalDurationInFrames: durationInFrames,
				});

				// Use Set for O(1) selection check
				const selectedSet = selectSelectedItemsSet(useUIStore.getState());
				const itemsToDrag = selectedSet.has(draggedItem.id)
					? newSelectedItems
					: [draggedItem.id];

				startDragOverlay({
					clickedItemId: draggedItem.id,
					itemIds: itemsToDrag,
					timelineWidth,
					visibleFrames,
					clickX: e.clientX,
					clickY: e.clientY,
					tracks: freshTracks,
					items: freshItems,
				});
				forceSpecificCursor('grabbing');

				const startX = e.clientX;
				const startY = e.clientY;

				const initialScrollLeft =
					timelineScrollContainerRef.current?.scrollLeft ?? 0;
				const initialScrollTop =
					timelineScrollContainerRef.current?.scrollTop ?? 0;

				let didMove = false;

				// Precompute snap points for the drag gesture
				let snapPoints: SnapPoint[] = [];
				const isSnappingEnabled = useUIStore.getState().isSnappingEnabled;
				if (isSnappingEnabled) {
					snapPoints = collectSnapPoints({
						tracks,
						items,
						excludeItemIds: itemsToDrag,
					});
				}

				let lastPointerMoveEvent: PointerEvent | null = null;
				let rafCall: number | null = null;

				const cancelScheduledRaf = () => {
					if (rafCall !== null) {
						cancelAnimationFrame(rafCall);
						rafCall = null;
					}
					lastPointerMoveEvent = null;
				};

				const processPointerMove = () => {
					const pointerMoveEvent = lastPointerMoveEvent;
					rafCall = null;
					if (!pointerMoveEvent) {
						// Event was cleared before rAF ran; nothing to process
						return;
					}

					if (!didMove) {
						if (
							!hasExceededMoveThreshold(
								startX,
								startY,
								pointerMoveEvent.clientX,
								pointerMoveEvent.clientY,
							)
						) {
							// Ignore tiny jitters
							return;
						}
						didMove = true;
						// Marking as dragging should NOT be added to undo history
						const temporalState = useEditorStore.temporal.getState();
						console.log('[TIMELINE DRAG] Mark as dragging - pausing temporal', {
							pastCount: temporalState.pastStates.length,
						});
						temporalState.pause();
						setState((state) => {
							markMultipleAsDraggingInTimeline(state, itemsToDrag);
						});
						temporalState.resume();
						console.log('[TIMELINE DRAG] Mark complete - resumed temporal', {
							pastCount: useEditorStore.temporal.getState().pastStates.length,
						});
					}

					updateCursorPosition(
						pointerMoveEvent.clientX,
						pointerMoveEvent.clientY,
					);

					// Calculate offsets for preview
					const currentScrollLeft =
						timelineScrollContainerRef.current?.scrollLeft ?? 0;
					const currentScrollTop =
						timelineScrollContainerRef.current?.scrollTop ?? 0;
					const scrollDifferenceX = currentScrollLeft - initialScrollLeft;
					const scrollDifferenceY = currentScrollTop - initialScrollTop;
					const currentOffsetX =
						pointerMoveEvent.clientX - startX + scrollDifferenceX;
					const currentOffsetY =
						pointerMoveEvent.clientY - startY + scrollDifferenceY;

					// Get fresh state each time for accurate drag calculations
					const currentState = useEditorStore.getState();
					const currentTimeline = getCurrentTimeline(currentState);
					const currentTracks = currentTimeline.tracks;
					const currentItems = currentTimeline.items;

					const draggedItemsData = collectDraggedItemsData({
						tracks: currentTracks,
						items: currentItems,
						itemsToDrag,
					});

					const previewPositions = calculateNewItemPositions({
						draggedItems: draggedItemsData,
						draggedItemIds: itemsToDrag,
						timelineWidth,
						offsetX: currentOffsetX,
						offsetY: currentOffsetY,
						tracks: currentTracks,
						visibleFrames,
						allItems: currentItems,
						clickedItemId: draggedItem.id,
						isSnappingEnabled,
						setSnappedPositions,
						snapPoints,
					});
					forceSpecificCursor(previewPositions ? 'grabbing' : 'not-allowed');

					setDragPreview(previewPositions);
				};

				const onPointerMove = (pointerMoveEvent: PointerEvent) => {
					lastPointerMoveEvent = pointerMoveEvent;
					if (rafCall !== null) {
						return;
					}
					rafCall = requestAnimationFrame(() => {
						processPointerMove();
					});
				};

				const cleanupAll = () => {
					window.removeEventListener('pointermove', onPointerMove);
					window.removeEventListener('pointerup', onPointerUp);
					cancelScheduledRaf();
				};

				const onPointerUp = (pointerUpEvent: PointerEvent) => {
					cancelScheduledRaf();
					const {offsetX, offsetY} = cleanupDragEvent({
						pointerUpEvent,
						startX,
						startY,
						initialScrollLeft,
						initialScrollTop,
						stopDragOverlay,
					});

					cleanupAll();

					setDragPreview(null);
					stopForcingSpecificCursor();

					if (!didMove) {
						return; // No drag occurred; click handled by onClick
					}

					// Get fresh state for final position calculation
					const currentState = useEditorStore.getState();
					const currentTimeline = getCurrentTimeline(currentState);
					const currentTracks = currentTimeline.tracks;
					const currentItems = currentTimeline.items;

					const draggedItemsData: Array<PreviewPosition> =
						collectDraggedItemsData({
							tracks: currentTracks,
							items: currentItems,
							itemsToDrag,
						});

					const newPositions = calculateNewItemPositions({
						draggedItems: draggedItemsData,
						draggedItemIds: itemsToDrag,
						timelineWidth,
						offsetX,
						offsetY,
						tracks: currentTracks,
						visibleFrames,
						allItems: currentItems,
						clickedItemId: draggedItem.id,
						isSnappingEnabled,
						setSnappedPositions: null,
						snapPoints,
					});

					// Final drag result SHOULD be added to undo history
					console.log('[TIMELINE DRAG] Before final setState', {
						pastCount: useEditorStore.temporal.getState().pastStates.length,
						hasNewPositions: !!newPositions,
					});
					setState((state) => {
						unmarkMultipleAsDraggingInTimeline(state, itemsToDrag);

						applySnapPoint({
							state,
							snapPoint: null,
						});

						if (!newPositions) {
							console.log('[TIMELINE DRAG] No new positions, early return');
							return;
						}

						// Get the current timeline context for applying changes
						const timeline = getCurrentTimeline(state);
						const {tracks: newTracks, items: newItems} =
							applyNewPositionsToState({
								prevTracks: timeline.tracks,
								dragPreview: newPositions,
								prevItems: timeline.items,
								shouldRemoveEmptyTracks: true,
							});

						console.log('[TIMELINE DRAG] Applying new positions', {
							tracksBefore: timeline.tracks.length,
							tracksAfter: newTracks.length,
							itemsBefore: Object.keys(timeline.items).length,
							itemsAfter: Object.keys(newItems).length,
						});

						// Update the timeline in place
						timeline.tracks.splice(0, timeline.tracks.length, ...newTracks);
						Object.keys(timeline.items).forEach((key) => {
							delete timeline.items[key];
						});
						Object.assign(timeline.items, newItems);
					});
					console.log('[TIMELINE DRAG] After final setState', {
						pastCount: useEditorStore.temporal.getState().pastStates.length,
					});
				};

				window.addEventListener('pointermove', onPointerMove);
				window.addEventListener('pointerup', onPointerUp);
			}
		},
		[
			fps,
			draggedItem,
			setState,
			startDragOverlay,
			stopDragOverlay,
			timelineWidth,
			updateCursorPosition,
			setDragPreview,
			setSnappedPositions,
		],
	);

	return {onPointerDown, onClick};
};
