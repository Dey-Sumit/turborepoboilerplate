import {useContext, useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {getThreePhaseAnimationStyle} from '../../animations/get-three-phase-animation-style';
import {
	useTextItemEditing,
	useTextItemHoverPreview,
} from '../../../zustand/ui-store';
import {FEATURE_TEXT_BACKGROUND_CONTROL} from '../../flags';
import {turnFontStyleIntoCss} from '../../inspector/controls/font-style-controls/font-style-controls';
import {parseCssString} from '../../utils/parse-css-string';
import {FontInfoContext} from '../../utils/text/font-info';
import {useLoadFontFromTextItem} from '../../utils/text/load-font-from-text-item';
import {
	calculateFadeInOpacity,
	calculateFadeOutOpacity,
} from '../video/calculate-fade';
import {overrideTextItemWithHoverPreview} from './override-text-item-with-hover-preview';
import {RoundedTextBox} from './rounded-text-box';
import {CanvasTextEditor} from './text-editor';
import {TextItem} from './text-item-type';

export const TextLayer = ({
	item: itemWithoutHoverPreview,
}: {
	item: TextItem;
}) => {
	if (itemWithoutHoverPreview.type !== 'text') {
		throw new Error('Item is not a text');
	}

	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const textItemHoverPreview = useTextItemHoverPreview();
	const item = useMemo(
		() =>
			overrideTextItemWithHoverPreview({
				textItem: itemWithoutHoverPreview,
				hoverPreview: textItemHoverPreview,
			}),
		[itemWithoutHoverPreview, textItemHoverPreview],
	);

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

	const context = useContext(FontInfoContext);
	const textItemEditing = useTextItemEditing();

	const loaded = useLoadFontFromTextItem({
		fontFamily: item.fontFamily,
		fontVariant: item.fontStyle.variant,
		fontWeight: item.fontStyle.weight,
		fontInfosDuringRendering: context[item.fontFamily] ?? null,
	});

	const shouldShowBackground =
		item.background && item.background.color !== 'transparent';

	const cssStyles = useMemo(() => parseCssString(item.css || ''), [item.css]);
	// Apply three-phase animation styles
	// Note: frame is already relative to item start (inside Remotion Sequence)
	const threePhaseAnimationStyle = useMemo(() => {
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

	// Compute base style for text container
	const baseTextStyle = useMemo(() => {
		const base: React.CSSProperties = {
			fontSize: item.fontSize,
			color: item.color,
			lineHeight: String(item.lineHeight),
			letterSpacing: `${item.letterSpacing}px`,
			left: item.left,
			top: item.top,
			width: item.width,
			height: item.height,
			position: 'absolute',
			whiteSpace: 'pre-wrap',
			display: 'block',
			fontFamily: item.fontFamily,
			...turnFontStyleIntoCss(item.fontStyle),
			overflow: 'visible',
			wordWrap: 'break-word',
			boxSizing: 'border-box',
			userSelect: 'none',
			textAlign: item.align,
			opacity,
			transform: `rotate(${item.rotation}deg)`,
			WebkitTextStroke: item.strokeWidth
				? `${item.strokeWidth}px ${item.strokeColor}`
				: '0',
			paintOrder: 'stroke',
			...cssStyles,
		};

		// Merge three-phase animation styles
		if (Object.keys(threePhaseAnimationStyle).length > 0) {
			if (threePhaseAnimationStyle.opacity !== undefined) {
				const baseOpacity = typeof base.opacity === 'number' ? base.opacity : 1;
				const animOpacity =
					typeof threePhaseAnimationStyle.opacity === 'number'
						? threePhaseAnimationStyle.opacity
						: 1;
				base.opacity = baseOpacity * animOpacity;
			}

			if (threePhaseAnimationStyle.transform) {
				base.transform = `${base.transform} ${threePhaseAnimationStyle.transform}`;
			}

			if (threePhaseAnimationStyle.filter) {
				base.filter = threePhaseAnimationStyle.filter;
			}

			if (threePhaseAnimationStyle.clipPath) {
				base.clipPath = threePhaseAnimationStyle.clipPath;
			}
		}

		return base;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		item,
		opacity,
		cssStyles,
		threePhaseAnimationStyle,
		frame,
		fps,
	]);

	return (
		<>
			{shouldShowBackground && FEATURE_TEXT_BACKGROUND_CONTROL && loaded ? (
				<RoundedTextBox textItem={item} opacity={opacity} />
			) : null}
			{item.id === textItemEditing ? (
				<CanvasTextEditor item={item} />
			) : (
				<div
					dir={item.direction}
					style={baseTextStyle}
				>
					{item.text}
				</div>
			)}
		</>
	);
};
