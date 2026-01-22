import React, {useEffect} from 'react';
import {interpolate} from 'remotion';
import useUIStore from '../../zustand/ui-store';
import {MAX_TIMELINE_WIDTH} from '../constants';
import {getVisibleFrames} from '../utils/get-visible-frames';

// Exported for use in computed hook
export interface TimelineSizeState {
	timelineWidth: number | null;
	containerWidth: number | null;
	maxZoom: number;
	zoomStep: number;
}

type TimelineSizeProviderProps = {
	children: React.ReactNode;
	containerWidth: number | null;
};

// calculate the maximum safe zoom multiplier that keeps timeline width under MAX_TIMELINE_WIDTH
const getMaxSafeZoomMultiplier = ({
	containerWidth,
	durationInFrames,
	fps,
}: {
	containerWidth: number;
	durationInFrames: number;
	fps: number;
}) => {
	const maxMultiplierFromWidth = MAX_TIMELINE_WIDTH / containerWidth;

	const originalMaxMultiplier = Math.max(
		4,
		interpolate(durationInFrames, [0, 60 * fps], [1, 6]),
	);

	// use the smaller of the two to respect both the width constraint and original logic
	return Math.min(maxMultiplierFromWidth, originalMaxMultiplier);
};

export const getZoomMultiplier = ({
	durationInFrames,
	fps,
	zoom,
	containerWidth,
}: {
	durationInFrames: number;
	fps: number;
	zoom: number;
	containerWidth: number;
}) => {
	const maxMultiplier = getMaxSafeZoomMultiplier({
		containerWidth,
		durationInFrames,
		fps,
	});

	return interpolate(zoom, [0, 1], [1, maxMultiplier]);
};

const BASE_ZOOM_STEP = 0.1;
const ZOOM_STEP_THRESHOLD_SECONDS = 300; // timeline content longer than this threshold gets progressively smaller zoom steps

// calculate dynamic zoom step based on content duration - smaller steps for longer content
export const getDynamicZoomStep = ({
	durationInFrames,
	fps,
	containerWidth,
}: {
	durationInFrames: number;
	fps: number;
	containerWidth: number;
}) => {
	const visibleFrames = getVisibleFrames({
		fps,
		totalDurationInFrames: durationInFrames,
	});
	const maxMultiplier = getMaxSafeZoomMultiplier({
		containerWidth,
		durationInFrames,
		fps,
	});

	// for longer content or when max multiplier is smaller, use smaller steps
	// this prevents big jumps in timeline width
	const thresholdInFrames = ZOOM_STEP_THRESHOLD_SECONDS * fps;
	const durationFactor = Math.min(1, thresholdInFrames / visibleFrames); // gets smaller for content > threshold
	const multiplierFactor = Math.min(1, maxMultiplier / 4); // gets smaller for lower max multipliers

	return Math.max(0.01, BASE_ZOOM_STEP * durationFactor * multiplierFactor);
};

// calculate the effective maximum zoom value (0-1 range) based on constraints
export const getDynamicMaxZoom = ({
	containerWidth,
	durationInFrames,
	fps,
}: {
	containerWidth: number;
	durationInFrames: number;
	fps: number;
}) => {
	const maxMultiplier = getMaxSafeZoomMultiplier({
		containerWidth,
		durationInFrames,
		fps,
	});

	// since our zoom range is [0, 1] and multiplier range is [1, maxMultiplier],
	// if maxMultiplier is less than the original max (6), we need to scale down the max zoom
	const originalMaxMultiplier = Math.max(
		4,
		interpolate(durationInFrames, [0, 60 * fps], [1, 6]),
	);

	if (maxMultiplier < originalMaxMultiplier) {
		return maxMultiplier / originalMaxMultiplier;
	}

	return 1; // fallback: full zoom range available
};

export const calculateTimelineWidth = ({
	timelineContainerWidth,
	zoom,
	durationInFrames,
	fps,
}: {
	timelineContainerWidth: number;
	zoom: number;
	durationInFrames: number;
	fps: number;
}) => {
	return (
		timelineContainerWidth *
		getZoomMultiplier({
			durationInFrames,
			fps,
			zoom,
			containerWidth: timelineContainerWidth,
		})
	);
};

export const TimelineSizeProvider = ({
	children,
	containerWidth,
}: TimelineSizeProviderProps) => {
	const setTimelineContainerWidth = useUIStore(
		(s) => s.setTimelineContainerWidth,
	);

	// Update ui-store whenever containerWidth changes
	useEffect(() => {
		setTimelineContainerWidth(containerWidth);
	}, [containerWidth, setTimelineContainerWidth]);

	// No Context needed - just render children
	// All calculations happen in useTimelineSize() hook
	return <>{children}</>;
};
