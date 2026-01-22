import {useMemo} from 'react';
import {useDurationInFrames} from '../../../zustand/editor-store';
import useUIStore from '../../../zustand/ui-store';
import {useFps} from '../../utils/use-context';
import {
	calculateTimelineWidth,
	getDynamicMaxZoom,
	getDynamicZoomStep,
	TimelineSizeState,
} from '../timeline-size-provider';
import {useTimelineZoom} from './use-timeline-zoom';

/**
 * Computed hook for timeline size calculations.
 * Reads from Zustand stores and calculates values on-demand.
 * No Context needed - all values derived from:
 * - containerWidth (ui-store)
 * - zoom (ui-store)
 * - durationInFrames (editor-store)
 * - fps (editor-store)
 */
export const useTimelineSize = (): TimelineSizeState => {
	const containerWidth = useUIStore((s) => s.timelineContainerWidth);
	const {zoom} = useTimelineZoom();
	const durationInFrames = useDurationInFrames();
	const {fps} = useFps();

	return useMemo(() => {
		if (containerWidth === null) {
			return {
				timelineWidth: null,
				containerWidth: null,
				maxZoom: 1,
				zoomStep: 0.1,
			};
		}

		const timelineWidth = calculateTimelineWidth({
			timelineContainerWidth: containerWidth,
			zoom,
			durationInFrames,
			fps,
		});

		const maxZoom = getDynamicMaxZoom({
			containerWidth,
			durationInFrames,
			fps,
		});

		const zoomStep = getDynamicZoomStep({
			durationInFrames,
			fps,
			containerWidth,
		});

		return {
			timelineWidth,
			containerWidth,
			maxZoom,
			zoomStep,
		};
	}, [containerWidth, zoom, durationInFrames, fps]);
};
