import {PlayerRef} from '@remotion/player';
import {useCallback, useMemo, useState} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import useUIStore from '../../../zustand/ui-store';
import {TIMELINE_HORIZONTAL_PADDING} from '../../constants';
import {FEATURE_TIMELINE_MARQUEE_SELECTION} from '../../flags';
import {
	forceSpecificCursor,
	stopForcingSpecificCursor,
} from '../../force-specific-cursor';
import {MarqueeSelection} from '../../marquee-selection';
import {setSelectedItems} from '../../state/actions/set-selected-items';
import {unselectItems} from '../../state/actions/unselect-items';
import {getCurrentTimeline} from '../../state/helpers/get-current-timeline';
import {getTrackHeight, TRACK_PADDING} from '../../state/items';
import {TICKS_HEIGHT} from '../../timeline/ticks/constants';
import {SIDE_PANEL_WIDTH} from '../../timeline/timeline-side-panel/timeline-side-panel';
import {isLeftClick} from '../is-left-click';
import {
	getItemLeftOffset,
	getItemWidth,
	getOffsetOfTrack,
} from '../position-utils';
import {
	timelineContainerRef,
	timelineScrollableContainerRef,
	timelineScrollContainerRef,
} from '../restore-scroll-after-zoom';
import {useTimelineContainerAutoScroll} from '../use-timeline-container-auto-scroll';
import {useTimelineSeek} from '../use-timeline-seek';
import {isItemInMarquee} from './is-item-in-marquee';

export const useTimelineMarqueeSelectionAndSeek = ({
	timelineWidth,
	timelineScrollableHeight,
	visibleFrames,
	playerRef,
}: {
	timelineScrollableHeight: number;
	visibleFrames: number;
	playerRef: React.RefObject<PlayerRef | null>;
	timelineWidth: number | null;
}) => {
	const setState = useEditorStore((state) => state.setState);
	const [isUsingMarqueeSelection, setIsUsingMarqueeSelection] = useState(false);
	const [rect, setRect] = useState<MarqueeSelection | null>(null);

	const {startTimelineSeek, isSeekingTimeline: isDraggingTimelineSeek} =
		useTimelineSeek({
			containerRef: timelineScrollableContainerRef,
			playerRef,
			totalDurationInFrames: visibleFrames,
			timelineWidth,
		});

	useTimelineContainerAutoScroll({
		isDragging: isDraggingTimelineSeek,
		edgeThreshold: 10,
		maxScrollSpeed: 5,
		xAxis: true,
		yAxis: false,
	});

	const onPointerDown: React.MouseEventHandler<HTMLDivElement> = useCallback(
		(initialPointerEvent) => {
			if (timelineWidth === null) {
				return;
			}

			if (!isLeftClick(initialPointerEvent)) {
				return;
			}

			if (!FEATURE_TIMELINE_MARQUEE_SELECTION) {
				return;
			}

			const y = initialPointerEvent.clientY;
			const scrollableContainerY =
				timelineScrollContainerRef.current?.getBoundingClientRect()
					.top as number;
			const isSeekArea = y < scrollableContainerY + TICKS_HEIGHT;
			if (isSeekArea) {
				startTimelineSeek(initialPointerEvent);
				return;
			}

			initialPointerEvent.preventDefault();
			initialPointerEvent.stopPropagation();
			setIsUsingMarqueeSelection(true);

			// Unselect items without committing to undo stack
			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();
			setState((state) => {
				unselectItems(state);
			});
			temporalState.resume();

			const {current} = timelineContainerRef;
			if (!current) {
				throw new Error('timelineContainerRef is not set');
			}

			const {current: scrollContainer} = timelineScrollContainerRef;
			if (!scrollContainer) {
				throw new Error('timelineScrollContainerRef is not set');
			}

			const timlineContainerRect = current.getBoundingClientRect();

			const startX =
				initialPointerEvent.clientX -
				timlineContainerRect.left -
				SIDE_PANEL_WIDTH +
				scrollContainer.scrollLeft;
			const startY =
				initialPointerEvent.clientY -
				timlineContainerRect.top +
				scrollContainer.scrollTop;

			if (startX < 0) {
				return;
			}

			forceSpecificCursor('default');

			let lastPointerEvent: PointerEvent | null = null;
			let animationFrameId: number | null = null;

			const updateMarqueeSelection = (e: PointerEvent) => {
				const endX =
					e.clientX -
					timlineContainerRect.left -
					SIDE_PANEL_WIDTH +
					scrollContainer.scrollLeft;

				const maxEndX = timelineWidth;
				const timelineHeight = useUIStore.getState().timelineHeight;

				const maxEndY = Math.max(
					timelineHeight + TICKS_HEIGHT,
					timelineScrollableHeight,
				);

				const endY =
					e.clientY - timlineContainerRect.top + scrollContainer.scrollTop;

				const topLeftPoint = {
					x: Math.max(0, Math.min(startX, endX, maxEndX)),
					y: Math.max(0, Math.min(startY, endY, maxEndY)),
				};
				const bottomRight = {
					x: Math.min(maxEndX, Math.max(startX, endX)),
					y: Math.min(maxEndY, Math.max(startY, endY)),
				};

				const rectToSet: MarqueeSelection = {
					start: topLeftPoint,
					end: bottomRight,
				};

				setRect(rectToSet);

				const selectedIds: string[] = [];

				// Get items and tracks from current timeline context (root or composite)
				const currentState = useEditorStore.getState();
				const {items, tracks} = getCurrentTimeline(currentState);

				for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
					const track = tracks[trackIndex];
					const top =
						getOffsetOfTrack({trackIndex, tracks, items}) +
						TRACK_PADDING / 2 +
						TICKS_HEIGHT;
					const height = getTrackHeight({track, items}) - TRACK_PADDING;

					for (const itemId of track.items) {
						const item = items[itemId];
						const timelineItemLeft =
							getItemLeftOffset({
								timelineWidth,
								totalDurationInFrames: visibleFrames,
								from: item.from,
							}) + TIMELINE_HORIZONTAL_PADDING;

						const timelineItemWidth = getItemWidth({
							itemDurationInFrames: item.durationInFrames,
							timelineWidth,
							totalDurationInFrames: visibleFrames,
						});
						if (
							isItemInMarquee({
								marquee: rectToSet,
								itemX: timelineItemLeft,
								itemY: top,
								itemEndX: timelineItemLeft + timelineItemWidth,
								itemEndY: top + height,
							})
						) {
							selectedIds.push(itemId);
						}
					}
				}

				// Update selected items without committing to undo stack
				const temporalState = useEditorStore.temporal.getState();
				temporalState.pause();
				setState((state) => {
					setSelectedItems(state, selectedIds);
				});
				temporalState.resume();
			};

			const scheduleMarqueeUpdate = (e: PointerEvent) => {
				lastPointerEvent = e;

				if (animationFrameId === null) {
					animationFrameId = requestAnimationFrame(() => {
						if (lastPointerEvent) {
							updateMarqueeSelection(lastPointerEvent);
						}
						animationFrameId = null;
					});
				}
			};

			const onPointerMove = (e: PointerEvent) => {
				scheduleMarqueeUpdate(e);
			};

			// account for `useTimelineContainerAutoScroll`
			const onScroll = () => {
				if (lastPointerEvent) {
					scheduleMarqueeUpdate(lastPointerEvent);
				}
			};

			const onPointerUp = () => {
				cleanup();
			};

			const cleanup = () => {
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
				scrollContainer.removeEventListener('scroll', onScroll);
				if (animationFrameId !== null) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
				setRect(null);
				stopForcingSpecificCursor();
				setIsUsingMarqueeSelection(false);
			};

			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
			scrollContainer.addEventListener('scroll', onScroll);
		},
		[
			setState,
			timelineWidth,
			timelineScrollableHeight,
			visibleFrames,
			startTimelineSeek,
		],
	);

	return useMemo(
		() => ({
			rect,
			onPointerDown,
			isDragging: isUsingMarqueeSelection,
		}),
		[onPointerDown, rect, isUsingMarqueeSelection],
	);
};
