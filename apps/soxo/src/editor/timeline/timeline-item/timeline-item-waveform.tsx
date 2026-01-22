import React, {useEffect, useMemo, useRef, useState} from 'react';
import {FEATURE_AUDIO_FADE_CONTROL} from '../../flags';
import {AudioItem} from '../../items/audio/audio-item-type';
import {VideoItem} from '../../items/video/video-item-type';
import {clsx} from '../../utils/clsx';
import {decibelToGain} from '../../utils/decibels';
import {usePreferredLocalUrl} from '../../utils/find-asset-by-id';
import {getAudioData} from '../../utils/get-audio-data';
import {getVisibleFrames} from '../../utils/get-visible-frames';
import QuickLRU from '../../utils/quick-lru';
import {
	useAssetFromItem,
	useFps,
	useTimelineContext,
} from '../../utils/use-context';
import {
	AudioDataWithPeaks,
	generateDownsampledPeakData,
	selectPeakLevel,
} from '../../utils/waveform-peak-data';
import {FadeCurve} from './timeline-item-fade-control/fade-curve';
import { TimelineItemData } from '../../selectors';

const CLIPPING_COLOR = '#FF7F50';

export const WAVEFORM_HEIGHT = 20;

export const getWaveformHeight = ({
	item,
	trackHeight,
}: {
	item: TimelineItemData;
	trackHeight: number;
}) => {
	if (item.type === 'audio') {
		return trackHeight;
	}

	// Type safety check, add item types that don't have a waveform here
	if (
		item.type === 'video' ||
		item.type === 'captions' ||
		item.type === 'gif' ||
		item.type === 'text' ||
		item.type === 'solid' ||
		item.type === 'image' ||
		item.type === 'composite' ||
		item.type === 'code' ||
		item.type === 'shape'
	) {
		return WAVEFORM_HEIGHT;
	}

	throw new Error('Invalid item type: ' + (item ));
};

const BAR_WIDTH = 1;
const BAR_GAP = 0;
const BAR_TOTAL = BAR_WIDTH + BAR_GAP;

/**
 * Optimized drawing function that uses pre-computed peak data
 */
function drawPeaks(
	canvas: HTMLCanvasElement,
	peaks: Float32Array,
	color: string,
	decibelAdjustment: number,
	width: number,
) {
	const ctx = canvas.getContext('2d');

	if (!ctx) return;

	// clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const height = canvas.height;
	const numBars = Math.ceil(width / BAR_TOTAL);

	// move expensive calculations outside the loop
	const volume = decibelToGain(decibelAdjustment);
	const isVolumeZero = volume === 0;

	// early exit if volume is zero
	if (isVolumeZero) return;

	// use Path2D for better performance with many rectangles
	const regularPath = new Path2D();
	const clippingPath = new Path2D();

	for (let barIndex = 0; barIndex < numBars; barIndex++) {
		const x = barIndex * BAR_TOTAL;

		// map bar index to peak data index
		const peakIndex = Math.floor((barIndex / numBars) * peaks.length);
		const peak = peaks[peakIndex] || 0;

		const scaledPeak = peak * volume;
		const isClipping = scaledPeak > 1;

		const barHeight = Math.max(0, Math.min(height, scaledPeak * height));

		if (barHeight === 0) continue;

		const barY = Math.round(height - barHeight);
		const roundedBarHeight = Math.round(barHeight);

		// add rectangle to regular path
		regularPath.rect(x, barY, BAR_WIDTH, roundedBarHeight);

		// add clipping indicator
		if (isClipping) {
			const clipIndicatorHeight = Math.min(2, roundedBarHeight);
			clippingPath.rect(x, barY, BAR_WIDTH, clipIndicatorHeight);
		}
	}

	// Draw all bars in two batch operations
	ctx.fillStyle = color;
	ctx.fill(regularPath);

	// Draw clipping indicators if any exist
	if (clippingPath) {
		ctx.fillStyle = CLIPPING_COLOR;
		ctx.fill(clippingPath);
	}
}

const WaveformCanvas = ({
	peaks,
	color,
	width,
	height,
	leftOffset,
	volume,
}: {
	peaks: Float32Array;
	color: string;
	width: number;
	height: number;
	leftOffset: number;
	volume: number;
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const style = useMemo(() => ({marginLeft: leftOffset}), [leftOffset]);

	useEffect(() => {
		const {current: canvasElement} = canvasRef;
		if (!canvasElement) return;

		canvasElement.width = width;
		canvasElement.height = height;

		drawPeaks(canvasElement, peaks, color, volume, width);
	}, [color, peaks, volume, width, height]);

	return (
		<canvas className="pointer-events-none" ref={canvasRef} style={style} />
	);
};

function TimelineWaveformBackground({
	children,
	waveformHeight,
	trackMuted,
}: {
	children?: React.ReactNode;
	waveformHeight: number;
	trackMuted: boolean;
}) {
	const style = useMemo(() => ({height: waveformHeight}), [waveformHeight]);

	return (
		<div
			className="group/timeline-item absolute bottom-0 flex w-full items-center overflow-hidden"
			style={style}
		>
			<div
				className={clsx('relative h-full w-full', trackMuted && 'opacity-30')}
			>
				{children}
			</div>
		</div>
	);
}

const audioPeaksCache = new QuickLRU<string, AudioDataWithPeaks>({maxSize: 50});

export const TimelineItemWaveform = ({
	item,
	children,
	trackHeight,
	timelineWidth,
	roundedDifference,
	trackMuted,
}: {
	item: AudioItem | VideoItem;
	children: React.ReactNode;
	trackHeight: number;
	timelineWidth: number;
	roundedDifference: number;
	trackMuted: boolean;
}) => {
	const [audioData, setAudioData] = useState<AudioDataWithPeaks | null>(null);

	const {fps} = useFps();
	const {durationInFrames} = useTimelineContext();
	const visibleFrames = getVisibleFrames({
		fps: fps,
		totalDurationInFrames: durationInFrames,
	});
	const pixelsPerFrame = timelineWidth / visibleFrames;

	const asset = useAssetFromItem(item);

	const url = usePreferredLocalUrl(asset);
	const [initialUrl] = useState(url);

	useEffect(() => {
		// getAudioData has its own cache, however we're storing the peak data in a separate cache
		const cached = audioPeaksCache.get(initialUrl);

		if (cached) {
			setAudioData(cached);
			return;
		}

		getAudioData(initialUrl)
			.then((newAudioData) => {
				const peakData = generateDownsampledPeakData(
					newAudioData.channelWaveforms[0],
				);

				const audioDataWithPeaks: AudioDataWithPeaks = {
					...newAudioData,
					peakData: peakData,
				};

				audioPeaksCache.set(initialUrl, audioDataWithPeaks);
				setAudioData(audioDataWithPeaks);
			})

			.catch(console.error);
	}, [initialUrl]);

	if (asset.type !== 'audio' && asset.type !== 'video') {
		throw new Error('Asset is not an audio or video');
	}

	// Total frames in the underlying media
	const totalFrames =
		(asset.type === 'audio'
			? asset.durationInSeconds
			: asset.durationInSeconds) * fps;

	const waveformWidthPx = (totalFrames / item.playbackRate) * pixelsPerFrame;

	const startOffsetFrames =
		item.type === 'audio'
			? item.audioStartFromInSeconds * fps
			: item.videoStartFromInSeconds * fps;

	const marginLeft =
		-(startOffsetFrames / item.playbackRate) * pixelsPerFrame -
		roundedDifference;

	const volume = item.decibelAdjustment;

	const waveformHeight = getWaveformHeight({
		item,
		trackHeight,
	});

	const itemWidthPx = item.durationInFrames * pixelsPerFrame;

	const height = getWaveformHeight({
		item,
		trackHeight,
	});

	// Calculate optimal peak level based on visual width
	const optimalPeakLevel = useMemo(() => {
		if (!audioData) return null;

		return selectPeakLevel(audioData.peakData, waveformWidthPx);
	}, [audioData, waveformWidthPx]);

	if (!optimalPeakLevel) {
		return (
			<TimelineWaveformBackground
				waveformHeight={waveformHeight}
				trackMuted={trackMuted}
			/>
		);
	}

	return (
		<TimelineWaveformBackground
			waveformHeight={waveformHeight}
			trackMuted={trackMuted}
		>
			{FEATURE_AUDIO_FADE_CONTROL && (
				<>
					<FadeCurve
						item={item}
						height={waveformHeight}
						width={itemWidthPx}
						fadeType="audio"
					/>
				</>
			)}
			<WaveformCanvas
				peaks={optimalPeakLevel.peaks}
				color="white"
				width={waveformWidthPx}
				height={height}
				leftOffset={marginLeft}
				volume={volume}
			/>
			{children}
		</TimelineWaveformBackground>
	);
};
