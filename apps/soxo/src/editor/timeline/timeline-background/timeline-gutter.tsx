import React, {memo, useMemo} from 'react';
import {TIMELINE_HORIZONTAL_PADDING} from '../../constants';
import {TRACK_DIVIDER_HEIGHT} from '../../state/items';
import {clsx} from '../../utils/clsx';
import {TimelineTrackAndLayout} from '../utils/drag/calculate-track-heights';

type TimelineGutterProps = {
	track: TimelineTrackAndLayout;
	timelineWidth: number;
	inbetweenTrackDropTrackIndex: number | null;
	trackIndex: number;
};

/**
 * TimelineGutter - Individual track background gutter
 *
 * Optimization: Wrapped in React.memo with custom comparison
 * Only re-renders when track.height, timelineWidth, or drop indicator changes
 *
 * Does NOT re-render when:
 * - Other track properties change (track.top, track.track.id, etc.)
 * - Item properties change
 */
export const TimelineGutter = memo(
	({
		track,
		timelineWidth,
		inbetweenTrackDropTrackIndex,
		trackIndex,
	}: TimelineGutterProps) => {
		// Only depend on track.height (not entire track object)
		const trackHeight = track.height;

		const style: React.CSSProperties = useMemo(() => {
			return {
				height: trackHeight + TRACK_DIVIDER_HEIGHT,
				width: timelineWidth + TIMELINE_HORIZONTAL_PADDING * 2,
			};
		}, [trackHeight, timelineWidth]);

		return (
			<div
				className={clsx(
					'pointer-events-none flex border-b',
					inbetweenTrackDropTrackIndex !== null &&
						trackIndex === inbetweenTrackDropTrackIndex - 1
						? 'border-editor-starter-accent'
						: 'border-b',
				)}
				style={style}
			/>
		);
	},
	// Custom comparison: only re-render if these specific props change
	(prevProps, nextProps) => {
		return (
			prevProps.track.height === nextProps.track.height &&
			prevProps.timelineWidth === nextProps.timelineWidth &&
			prevProps.inbetweenTrackDropTrackIndex ===
				nextProps.inbetweenTrackDropTrackIndex &&
			prevProps.trackIndex === nextProps.trackIndex
		);
	},
);

TimelineGutter.displayName = 'TimelineGutter';
