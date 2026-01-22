import {Video} from '@remotion/media';
import {useMemo} from 'react';
import {OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import {getThreePhaseAnimationStyle} from '../../animations/get-three-phase-animation-style';
import {RequireCachedAsset} from '../../caching/require-cached-asset';
import {FEATURE_NEW_MEDIA_TAGS} from '../../flags';
import {usePreferredLocalUrl} from '../../utils/find-asset-by-id';
import {useAssetFromItem} from '../../utils/use-context';
import {volumeFn} from '../../utils/volume-fn';
import {useCroppableLayer} from '../croppable-layer';
import {
	calculateFadeInOpacity,
	calculateFadeOutOpacity,
} from './calculate-fade';
import {VideoItem} from './video-item-type';

export const VideoLayer = ({
	item,
	trackMuted,
	cropBackground,
}: {
	item: VideoItem;
	trackMuted: boolean;
	cropBackground: boolean;
}) => {
	if (item.type !== 'video') {
		throw new Error('Item is not a video');
	}

	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const volume = useMemo(() => {
		return volumeFn({
			fps,
			audioFadeInDurationInSeconds: item.audioFadeInDurationInSeconds,
			audioFadeOutDurationInSeconds: item.audioFadeOutDurationInSeconds,
			durationInFrames: item.durationInFrames,
			decibelAdjustment: item.decibelAdjustment,
		});
	}, [
		item.audioFadeInDurationInSeconds,
		item.audioFadeOutDurationInSeconds,
		item.decibelAdjustment,
		item.durationInFrames,
		fps,
	]);

	const asset = useAssetFromItem(item);
	const src = usePreferredLocalUrl(asset);

	const opacity = useMemo(() => {
		const inOpacity = calculateFadeInOpacity({
			currentFrame: frame,
			fadeInDurationInSeconds: item.fadeInDurationInSeconds,
			framesPerSecond: fps,
		});
		const outOpacity = calculateFadeOutOpacity({
			currentFrame: frame,
			fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
			framesPerSecond: fps,
			totalDurationInFrames: durationInFrames,
		});
		return inOpacity * outOpacity * item.opacity;
	}, [
		item.fadeInDurationInSeconds,
		fps,
		frame,
		item.opacity,
		durationInFrames,
		item.fadeOutDurationInSeconds,
	]);

	// Apply three-phase animation styles
	// Note: frame is already relative to item start (inside Remotion Sequence)
	const animationStyle = useMemo(() => {
		if (item.animations) {
			return getThreePhaseAnimationStyle(
				item.animations,
				frame,
				0, // Frame is already relative to item start due to Sequence wrapper
				item.durationInFrames,
				fps,
			);
		}
		return {};
	}, [item.animations, frame, item.durationInFrames, fps]);

	const {innerStyle, outerStyle} = useCroppableLayer({
		item,
		rotation: item.rotation,
		opacity,
		borderRadius: item.borderRadius,
		cropBackground,
	});

	// Merge animation styles with outer styles
	const mergedStyle = useMemo(() => {
		const merged = {...outerStyle};

		if (Object.keys(animationStyle).length > 0) {
			// Merge opacity (multiply)
			if (
				animationStyle.opacity !== undefined &&
				outerStyle.opacity !== undefined
			) {
				const outerOpacity =
					typeof outerStyle.opacity === 'number'
						? outerStyle.opacity
						: parseFloat(String(outerStyle.opacity));
				const animOpacity =
					typeof animationStyle.opacity === 'number'
						? animationStyle.opacity
						: parseFloat(String(animationStyle.opacity));
				merged.opacity = outerOpacity * animOpacity;
			} else if (animationStyle.opacity !== undefined) {
				merged.opacity = animationStyle.opacity;
			}

			// Merge filter
			if (animationStyle.filter && outerStyle.filter) {
				merged.filter = `${outerStyle.filter} ${animationStyle.filter}`;
			} else if (animationStyle.filter) {
				merged.filter = animationStyle.filter;
			}

			// Merge transform (concatenate rotation + animation)
			if (animationStyle.transform && outerStyle.transform) {
				const rotationMatch =
					typeof outerStyle.transform === 'string'
						? outerStyle.transform.match(/rotate\([^)]+\)/)
						: null;
				const rotation = rotationMatch ? rotationMatch[0] : '';
				merged.transform = rotation
					? `${rotation} ${animationStyle.transform}`
					: animationStyle.transform;
			} else if (animationStyle.transform) {
				merged.transform = animationStyle.transform;
			}

			// Merge clipPath
			if (animationStyle.clipPath) {
				merged.clipPath = animationStyle.clipPath;
			}
		}

		return merged;
	}, [outerStyle, animationStyle]);

	const startFrom = item.videoStartFromInSeconds * fps;

	if (FEATURE_NEW_MEDIA_TAGS) {
		return (
			<div style={mergedStyle}>
				<RequireCachedAsset asset={asset}>
					<Video
						volume={volume}
						trimBefore={startFrom}
						src={src}
						style={innerStyle}
						muted={trackMuted}
						playbackRate={item.playbackRate}
					/>
				</RequireCachedAsset>
			</div>
		);
	}

	return (
		<div style={mergedStyle}>
			<RequireCachedAsset asset={asset}>
				<OffthreadVideo
					volume={volume}
					trimBefore={startFrom}
					src={src}
					style={innerStyle}
					muted={trackMuted}
					playbackRate={item.playbackRate}
					useWebAudioApi
					crossOrigin="anonymous"
					pauseWhenBuffering
				/>
			</RequireCachedAsset>
		</div>
	);
};
