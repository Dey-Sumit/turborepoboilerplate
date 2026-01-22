import {Gif} from '@remotion/gif';
import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {getThreePhaseAnimationStyle} from '../../animations/get-three-phase-animation-style';
import {RequireCachedAsset} from '../../caching/require-cached-asset';
import {usePreferredLocalUrl} from '../../utils/find-asset-by-id';
import {useAssetFromItem} from '../../utils/use-context';
import {useCroppableLayer} from '../croppable-layer';
import {
	calculateFadeInOpacity,
	calculateFadeOutOpacity,
} from '../video/calculate-fade';
import {GifItem} from './gif-item-type';

export const GifLayer: React.FC<{
	item: GifItem;
	cropBackground: boolean;
}> = ({item, cropBackground}) => {
	if (item.type !== 'gif') {
		throw new Error('Item is not a gif');
	}

	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const asset = useAssetFromItem(item);

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

	const src = usePreferredLocalUrl(asset);

	return (
		<div style={mergedStyle}>
			<RequireCachedAsset asset={asset}>
				<Gif style={innerStyle} src={src} playbackRate={item.playbackRate} />
			</RequireCachedAsset>
		</div>
	);
};
