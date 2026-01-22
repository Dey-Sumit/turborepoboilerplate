import {PlayerRef} from '@remotion/player';

import React, {useMemo} from 'react';
import {useDurationInFrames} from '../../zustand/editor-store';
import {useActiveSnapPoint, useDragPreview} from '../../zustand/ui-store';
import {MAX_AUTOSCROLL_SPEED, scrollbarStyle} from '../constants';
import {DraggingTimelineItems} from '../drag-overlay';
import {DropHandler} from '../drop-handler';
import {
	FEATURE_BACKSPACE_TO_DELETE,
	FEATURE_DUPLICATE_LAYERS,
	FEATURE_FOLLOW_PLAYHEAD_WHILE_PLAYING,
	FEATURE_MAX_TRIM_INDICATORS,
	FEATURE_SAVE_BUTTON,
	FEATURE_SELECT_ALL_SHORTCUT,
	FEATURE_SNAPPING_SHORTCUT,
	FEATURE_TIMELINE_SNAPPING,
} from '../flags';
import {BackspaceToDelete} from '../keyboard-shortcuts/backspace-to-delete';
import {CopyPasteLayers} from '../keyboard-shortcuts/copy-paste-layers';
import {CopyPasteStyle} from '../keyboard-shortcuts/copy-paste-style';
import {DuplicateLayers} from '../keyboard-shortcuts/duplicate-layers';
import {SaveShortcut} from '../keyboard-shortcuts/save-shortcut';
import {SelectAllShortcut} from '../keyboard-shortcuts/select-all-shortcut';
import {SnappingShortcut} from '../keyboard-shortcuts/snapping-shortcut';
import {SpaceToPlayPause} from '../keyboard-shortcuts/space-to-play-pause';
import {UndoRedo} from '../keyboard-shortcuts/undo-redo';
import {OpenCodeEditorShortcut} from '../keyboard-shortcuts/open-code-editor';
import {OpenTemplatesDialogShortcut} from '../keyboard-shortcuts/open-templates-dialog';
import {MarqueeSelection} from '../marquee-selection';
import {getVisibleFrames} from '../utils/get-visible-frames';
import {useTimelineMarqueeSelectionAndSeek} from '../utils/marquee-selection/use-timeline-marquee-selection-and-seek';
import {
	timelineRightSide,
	timelineScrollContainerRef,
} from '../utils/restore-scroll-after-zoom';
import {
	useDimensions,
	useFps,
	useTimelineHeight,
	useTracks,
} from '../utils/use-context';
import {useTimelineItems} from '../selectors/hooks';
import useEditorStore from '../../zustand/editor-store';
import {getCurrentTimeline} from '../state/helpers/get-current-timeline';
import {EditorStarterItem} from '../items/item-type';
import {useTimelineContainerAutoScroll} from '../utils/use-timeline-container-auto-scroll';
import {Playhead} from './playhead';
import {TimelineSnapIndicators} from './snap-indicator/timeline-snap-indicators';
import {TICKS_HEIGHT} from './ticks/constants';
import {TimelineTicks} from './ticks/ticks';
import {TimelineBackground} from './timeline-background/timeline-background';
import {TimelineMaxTrimIndicators} from './timeline-item/timeline-max-trim-indicators/timeline-max-trim-indicators';
import {TimelineFollowPlayheadWhilePlaying} from './timeline-scroll-while-playing';
import {TimelineScrollableContainerMemo,} from './timeline-scrollable-container';
import {SidePanel} from './timeline-side-panel/timeline-side-panel';
import {TimelineTracks} from './timeline-tracks';
import {TimelineUnderlayPreviews} from './timeline-underlay-previews';
import {applyNewPositionsToState} from './utils/drag/apply-new-positions-to-state';
import {getTracksHeight} from './utils/drag/calculate-track-heights';
import {remainOriginalTrackHeights} from './utils/drag/remain-original-track-heights';
import {useTimelineSize} from './utils/use-timeline-size';

export const Timeline = ({
	playerRef,
}: {
	playerRef: React.RefObject<PlayerRef | null>;
}) => {
	const durationInFrames = useDurationInFrames();
	const {tracks: tracksInState} = useTracks();
	const {compositionHeight, compositionWidth} = useDimensions();
	const {fps} = useFps();

	// Use timeline slice - only subscribes to timeline properties (id, from, durationInFrames, trackId, etc.)
	// This prevents re-renders when canvas properties (left, top, width, height, rotation) change
	const timelineItemsSlice = useTimelineItems();

	// Get full items only when drag preview is active (need full item data for spreading)
	// When no drag preview, this selector won't cause re-renders on canvas changes
	const previewState = useDragPreview();
	const fullItems = useEditorStore((state) => {
		if (!previewState) {
			return null;
		}
		const timeline = getCurrentTimeline(state.compositionState);
		return timeline.items;
	});

	const activeSnapPoint = useActiveSnapPoint();

	const visibleFrames = getVisibleFrames({
		fps,
		totalDurationInFrames: durationInFrames,
	});

	const timelineHeight = useTimelineHeight();

	const style = useMemo<React.CSSProperties>(
		() => ({
			height: timelineHeight + TICKS_HEIGHT,
		}),
		[timelineHeight],
	);

	const containerStyles = useMemo<React.CSSProperties>(
		() => ({
			...scrollbarStyle,
			height: timelineHeight + TICKS_HEIGHT,
		}),
		[timelineHeight],
	);

	// If the user drag would result in a new track being created between two tracks,
	// we only preview it with a line, not a new track since that could result in flickering.
	const previewsTrackInsertionInbetween = useMemo(() => {
		if (!previewState) {
			return false;
		}

		return previewState.trackInsertions?.type === 'between';
	}, [previewState]);

	const {tracks, items} = useMemo(() => {
		if (!previewState) {
			// No drag preview - use timeline slice (only timeline properties)
			// Safe cast: timeline slice has all properties needed for layout calculations (type, id, etc.)
			return {
				tracks: tracksInState,
				items: timelineItemsSlice as unknown as Record<string, EditorStarterItem>,
			};
		}

		if (previewsTrackInsertionInbetween) {
			// Between-track insertion - use full items for drag preview
			return {
				tracks: tracksInState,
				items:
					fullItems ||
					(timelineItemsSlice as unknown as Record<string, EditorStarterItem>),
			};
		}

		// Active drag preview - use full items for applying positions
		return applyNewPositionsToState({
			prevTracks: tracksInState,
			dragPreview: previewState,
			prevItems:
				fullItems ||
				(timelineItemsSlice as unknown as Record<string, EditorStarterItem>),
			shouldRemoveEmptyTracks: false,
		});
	}, [
		tracksInState,
		previewState,
		timelineItemsSlice,
		fullItems,
		previewsTrackInsertionInbetween,
	]);

	const tracksAndLayout = useMemo(() => {
		return remainOriginalTrackHeights({
			originalTracks: tracksInState,
			// Safe cast: only uses item.type for height calculation
			originalItems: timelineItemsSlice as unknown as Record<
				string,
				EditorStarterItem
			>,
			newTracks: tracks,
			newItems: items,
		});
	}, [tracks, items, tracksInState, timelineItemsSlice]);

	const tracksHeight = useMemo(() => {
		return getTracksHeight({tracks: tracksAndLayout});
	}, [tracksAndLayout]);

	const styles = useMemo(
		() => ({
			minHeight: timelineHeight + TICKS_HEIGHT,
			height: tracksHeight + TICKS_HEIGHT,
		}),
		[tracksHeight, timelineHeight],
	);

	const {timelineWidth} = useTimelineSize();

	const {
		onPointerDown: onPointerDownEmptySpace,
		rect,
		isDragging: isDraggingMarqueeSelection,
	} = useTimelineMarqueeSelectionAndSeek({
		playerRef,
		timelineWidth,
		timelineScrollableHeight: tracksHeight + TICKS_HEIGHT,
		visibleFrames,
	});

	useTimelineContainerAutoScroll({
		isDragging: isDraggingMarqueeSelection,
		edgeThreshold: 10,
		maxScrollSpeed: MAX_AUTOSCROLL_SPEED,
		xAxis: true,
		yAxis: true,
	});

	const inbetweenTrackIndicators = useMemo(() => {
		if (!previewState) {
			return null;
		}

		if (previewState.trackInsertions?.type !== 'between') {
			return null;
		}

		return previewState.trackInsertions.trackIndex;
	}, [previewState]);

	const snapPoint = previewState?.snapPoint ?? activeSnapPoint;

	return (
		<>
			<div
				className={'bg-pattern-black-orchid relative h-full w-full select-none'}
				style={style}
			>
				<DropHandler
					playerRef={playerRef}
					compositionHeight={compositionHeight}
					compositionWidth={compositionWidth}
					context="timeline"
				>
					<div
						className="flex h-full w-full overflow-x-scroll overflow-y-scroll"
						style={containerStyles}
						ref={timelineScrollContainerRef}
						onPointerDown={onPointerDownEmptySpace}
					>
						{timelineWidth !== null ? (
							<>
								<SidePanel
									inbetweenTrackDropTrackIndex={inbetweenTrackIndicators}
								/>
								<div
									style={styles}
									ref={timelineRightSide}
									className="relative h-full"
								>
									<TimelineTicks
										visibleFrames={visibleFrames}
										timelineWidth={timelineWidth}
									/>
									<TimelineScrollableContainerMemo timelineWidth={timelineWidth}>
										<TimelineBackground
											timelineWidth={timelineWidth}
											inbetweenTrackDropTrackIndex={inbetweenTrackIndicators}
										/>
										<TimelineTracks
											tracks={tracksAndLayout}
											visibleFrames={visibleFrames}
										/>
										{previewState && !previewsTrackInsertionInbetween ? (
											<TimelineUnderlayPreviews
												timelineWidth={timelineWidth}
												simulatedTracks={tracksAndLayout}
												previewState={previewState}
											/>
										) : null}
										{FEATURE_MAX_TRIM_INDICATORS ? (
											<TimelineMaxTrimIndicators
												timelineWidth={timelineWidth}
											/>
										) : null}
										{FEATURE_TIMELINE_SNAPPING && snapPoint ? (
											<TimelineSnapIndicators
												timelineWidth={timelineWidth}
												activeSnapPoint={snapPoint}
											/>
										) : null}
									</TimelineScrollableContainerMemo>
									<Playhead
										visibleFrames={visibleFrames}
										playerRef={playerRef}
										height={tracksHeight}
										timelineWidth={timelineWidth}
										durationInFrames={durationInFrames}
									/>
									{rect ? <MarqueeSelection selection={rect} /> : null}
								</div>
							</>
						) : null}
					</div>
				</DropHandler>
			</div>
			<DraggingTimelineItems />
			<SpaceToPlayPause playerRef={playerRef} />
			{FEATURE_BACKSPACE_TO_DELETE && <BackspaceToDelete />}
			{FEATURE_DUPLICATE_LAYERS && <DuplicateLayers />}
			<UndoRedo />
			<OpenCodeEditorShortcut />
			<OpenTemplatesDialogShortcut />
			{FEATURE_SAVE_BUTTON && <SaveShortcut />}
			<CopyPasteLayers playerRef={playerRef} />
			<CopyPasteStyle />
			{FEATURE_SELECT_ALL_SHORTCUT && <SelectAllShortcut />}
			{FEATURE_TIMELINE_SNAPPING && FEATURE_SNAPPING_SHORTCUT && (
				<SnappingShortcut />
			)}

			{FEATURE_FOLLOW_PLAYHEAD_WHILE_PLAYING ? (
				<TimelineFollowPlayheadWhilePlaying
					playerRef={playerRef}
					timelineWidth={timelineWidth}
					visibleFrames={visibleFrames}
				/>
			) : null}
		</>
	);
};
