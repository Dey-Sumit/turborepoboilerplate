import {TikTokPage} from '@remotion/captions';
import {fitTextOnNLines} from '@remotion/layout-utils';
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {turnFontStyleIntoCss} from '../../inspector/controls/font-style-controls/font-style-controls';
import {FontStyle, TextAlign, TextDirection} from '../text/text-item-type';
import {getHighlightStyles} from './highlight-styles';
import {HighlightStyle} from './captions-item-type';

export const CaptionPage: React.FC<{
	page: TikTokPage;
	captionWidth: number;
	fontFamily: string;
	fontStyle: FontStyle;
	lineHeight: number;
	letterSpacing: number;
	color: string;
	highlightColor: string;
	direction: TextDirection;
	align: TextAlign;
	fontSize: number;
	maxLines: number;
	highlightStyle: HighlightStyle;
	backgroundEnabled: boolean;
	backgroundColor: string;
	backgroundOpacity: number;
	backgroundPadding: number;
	backgroundBorderRadius: number;
	textShadowEnabled: boolean;
	textShadowColor: string;
	textShadowOffsetX: number;
	textShadowOffsetY: number;
	textShadowBlur: number;
}> = ({
	page,
	captionWidth,
	fontFamily,
	fontStyle,
	lineHeight,
	letterSpacing,
	color,
	highlightColor,
	direction,
	align,
	fontSize: desiredFontSize,
	maxLines,
	highlightStyle,
	backgroundEnabled,
	backgroundColor,
	backgroundOpacity,
	backgroundPadding,
	backgroundBorderRadius,
	textShadowEnabled,
	textShadowColor,
	textShadowOffsetX,
	textShadowOffsetY,
	textShadowBlur,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInMs = (frame / fps) * 1000;

	const fittedText = fitTextOnNLines({
		fontFamily,
		text: page.text,
		maxBoxWidth: captionWidth,
		maxLines: maxLines,
		maxFontSize: desiredFontSize,
	});

	const fontSize = Math.min(desiredFontSize, fittedText.fontSize);

	const style: React.CSSProperties = React.useMemo(
		() => ({
			fontSize: fontSize,
			color: 'white',
			fontFamily,
			height: '100%',
			width: '100%',
			...turnFontStyleIntoCss(fontStyle),
			lineHeight: String(lineHeight),
			letterSpacing: `${letterSpacing}px`,
			textAlign: align,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			textShadow: textShadowEnabled
				? `${textShadowOffsetX}px ${textShadowOffsetY}px ${textShadowBlur}px ${textShadowColor}`
				: undefined,
		}),
		[
			fontSize,
			fontFamily,
			fontStyle,
			lineHeight,
			letterSpacing,
			align,
			textShadowEnabled,
			textShadowOffsetX,
			textShadowOffsetY,
			textShadowBlur,
			textShadowColor,
		],
	);

	return (
		<AbsoluteFill>
			<div dir={direction} style={style}>
				<span>
					{page.tokens.map((t, index) => {
						const startRelativeToSequence = t.fromMs - page.startMs;
						const endRelativeToSequence = t.toMs - page.startMs;

						const isActive =
							startRelativeToSequence <= timeInMs &&
							endRelativeToSequence > timeInMs;

						// Calculate frame when this word becomes active (relative to page start)
						const wordStartFrame = Math.round((startRelativeToSequence / 1000) * fps);

						// Get styles based on highlight style
						const {style: wordStyle} = getHighlightStyles(highlightStyle, {
							isActive,
							frameInPage: frame,
							wordStartFrame,
							fps,
							color,
							highlightColor,
						});

						// Merge background box styles with word styles
						const finalWordStyle: React.CSSProperties = {
							...wordStyle,
							...(backgroundEnabled &&
								backgroundColor && {
									backgroundColor: (() => {
										// Convert hex color to rgba for background opacity
										try {
											const hex = backgroundColor;
											const r = parseInt(hex.slice(1, 3), 16);
											const g = parseInt(hex.slice(3, 5), 16);
											const b = parseInt(hex.slice(5, 7), 16);
											return `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
										} catch {
											return `rgba(0, 0, 0, ${backgroundOpacity})`;
										}
									})(),
									padding: `${backgroundPadding / 2}px ${backgroundPadding}px`,
									borderRadius: `${backgroundBorderRadius}px`,
									marginLeft: index === 0 ? '0' : '4px',
									marginRight: '4px',
								}),
						};

						return (
							<span key={t.fromMs + t.text} style={finalWordStyle}>
								{t.text}
							</span>
						);
					})}
				</span>
			</div>
		</AbsoluteFill>
	);
};
