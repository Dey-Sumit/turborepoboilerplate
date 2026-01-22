import React, {useMemo} from 'react';
import {FEATURE_HIDE_TRACKS, FEATURE_ROLLING_EDITS} from '../../flags';
import {TrackType} from '../../state/types';
import {useTimelineItems} from '../../selectors/hooks';
import {TimelineItem} from '../timeline-item/timeline-item';
import {TimelineTrackRollingEdits} from './timeline-track-rolling-edits';

const TimelineTrackUnmemoized = ({
	track,
	visibleFrames,
	top,
	height,
}: {
	track: TrackType;
	visibleFrames: number;
	top: number;
	height: number;
}) => {
	// Use timeline virtual slice - only subscribes to timeline properties
	// This prevents re-renders when canvas properties (left, top, width, height, rotation) change
	const timelineItems = useTimelineItems();

	const style = useMemo((): React.CSSProperties => {
		if (!FEATURE_HIDE_TRACKS) {
			return {};
		}

		return {
			opacity: track.hidden ? 0.3 : 1,
		};
	}, [track.hidden]);

	return (
		<div className="relative" data-hidden={track.hidden} style={style}>
			{track.items.map((item) => {
				return (
					<TimelineItem
						key={item}
						item={timelineItems[item]}
						visibleFrames={visibleFrames}
						top={top}
						height={height}
						trackMuted={track.muted}
					/>
				);
			})}
			{FEATURE_ROLLING_EDITS && (
				<TimelineTrackRollingEdits
					items={track.items}
					allItems={timelineItems}
					visibleFrames={visibleFrames}
					top={top}
					height={height}
				/>
			)}
		</div>
	);
};

export const TimelineTrack = React.memo(TimelineTrackUnmemoized);
