import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {parseCssString} from '../../utils/parse-css-string';
import {
	calculateFadeInOpacity,
	calculateFadeOutOpacity,
} from '../video/calculate-fade';
import {SolidItem} from './solid-item-type';
import {getThreePhaseAnimationStyle} from '../../animations/get-three-phase-animation-style';

export const SolidLayer = ({item}: {item: SolidItem}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

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

	const cssStyles = useMemo(() => parseCssString(item.css || ''), [item.css]);

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

	const style: React.CSSProperties = useMemo(() => {
		const baseStyle: React.CSSProperties = {
			backgroundColor: item.color,
			position: 'absolute',
			left: item.left,
			top: item.top,
			width: item.width,
			height: item.height,
			opacity,
			borderRadius: item.borderRadius,
			transform: `rotate(${item.rotation}deg)`,
			// Apply custom CSS styles
			...cssStyles,
		};

		// Merge animation styles
		if (Object.keys(animationStyle).length > 0) {
			// Merge opacity (multiply)
			if (animationStyle.opacity !== undefined) {
				const baseOpacity =
					typeof baseStyle.opacity === 'number' ? baseStyle.opacity : 1;
				const animOpacity =
					typeof animationStyle.opacity === 'number'
						? animationStyle.opacity
						: 1;
				baseStyle.opacity = baseOpacity * animOpacity;
			}

			// Merge transform (concatenate)
			if (animationStyle.transform) {
				baseStyle.transform = `${baseStyle.transform} ${animationStyle.transform}`;
			}

			// Merge filter
			if (animationStyle.filter) {
				baseStyle.filter = animationStyle.filter;
			}

			// Merge clipPath
			if (animationStyle.clipPath) {
				baseStyle.clipPath = animationStyle.clipPath;
			}
		}

		return baseStyle;
	}, [
		item.color,
		item.height,
		item.left,
		item.top,
		item.width,
		opacity,
		item.borderRadius,
		item.rotation,
		cssStyles,
		animationStyle,
	]);

	return <div style={style}></div>;
};
