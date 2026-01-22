import {useMemo} from 'react';
import {TIMELINE_HORIZONTAL_PADDING} from '../../constants';
import {useTracksWithLayout} from '../../selectors/hooks';
import {TimelineGutter} from './timeline-gutter';

/**
 * TimelineBackground - Renders background gutters for timeline tracks
 *
 * Optimization: Subscribes directly to tracks via useTracksWithLayout()
 * Does NOT receive tracks as prop from parent (prevents prop re-renders)
 *
 * Re-renders only when:
 * - tracks structure changes (add/remove/reorder)
 * - timelineWidth changes
 * - inbetweenTrackDropTrackIndex changes
 *
 * Does NOT re-render when:
 * - Item properties change (left, top, width, height, color, etc.)
 */
export const TimelineBackground: React.FC<{
	timelineWidth: number;
	inbetweenTrackDropTrackIndex: number | null;
}> = ({timelineWidth, inbetweenTrackDropTrackIndex}) => {
	// Subscribe directly to tracks - only re-renders when tracks structure changes
	const tracks = useTracksWithLayout();
	const style: React.CSSProperties = useMemo(() => {
		return {
			width: timelineWidth + TIMELINE_HORIZONTAL_PADDING * 2,
			marginLeft: -TIMELINE_HORIZONTAL_PADDING,
		};
	}, [timelineWidth]);

	return (
		<div className="absolute" style={style}>
			{tracks.map((track, i) => (
				<TimelineGutter
					key={i}
					track={track}
					timelineWidth={timelineWidth}
					inbetweenTrackDropTrackIndex={inbetweenTrackDropTrackIndex}
					trackIndex={i}
				/>
			))}
		</div>
	);
};
