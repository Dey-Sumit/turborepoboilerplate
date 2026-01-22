import {useMemo} from 'react';
import {useDurationInFrames} from '../../../../zustand/editor-store';
import {useItemsBeingTrimmed} from '../../../../zustand/ui-store';
import {getVisibleFrames} from '../../../utils/get-visible-frames';
import {useFps} from '../../../utils/use-context';
import {TimelineMaxTrimIndicator} from './timeline-max-trim-indicator';

export const TimelineMaxTrimIndicators: React.FC<{
	timelineWidth: number;
}> = ({timelineWidth}) => {
	const itemsBeingTrimmed = useItemsBeingTrimmed();
	const durationInFrames = useDurationInFrames();

	const {fps} = useFps();

	const visibleFrames = useMemo(
		() =>
			getVisibleFrames({
				fps,
				totalDurationInFrames: durationInFrames,
			}),
		[fps, durationInFrames],
	);

	return (
		<div className="pointer-events-none absolute inset-0">
			{itemsBeingTrimmed.map((itemBeingTrimmed) => {
				if (itemBeingTrimmed.minFrom === null) {
					return null;
				}

				if (itemBeingTrimmed.maxDurationInFrames === null) {
					return null;
				}

				return (
					<TimelineMaxTrimIndicator
						key={itemBeingTrimmed.itemId}
						itemBeingTrimmed={itemBeingTrimmed}
						timelineWidth={timelineWidth}
						visibleFrames={visibleFrames}
						minFrom={itemBeingTrimmed.minFrom}
						maxDurationInFrames={itemBeingTrimmed.maxDurationInFrames}
						top={itemBeingTrimmed.top}
						height={itemBeingTrimmed.height}
					/>
				);
			})}
		</div>
	);
};
