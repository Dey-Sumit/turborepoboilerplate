import {BaseItem, CanHaveRotation} from '../shared';
import {FontStyle, TextAlign, TextDirection} from '../text/text-item-type';

/**
 * Highlight style determines how the active word appears
 */
export type HighlightStyle =
	| 'highlight' // Default - color change only
	| 'pop-in' // Scale spring animation
	| 'scale' // Simple scale up
	| 'glow' // Active word with glow effect
	| 'bounce'; // Bounce animation

export type CaptionsItem = BaseItem &
	CanHaveRotation & {
		type: 'captions';
		assetId: string;
		fontFamily: string;
		fontStyle: FontStyle;
		lineHeight: number;
		letterSpacing: number;
		fontSize: number;
		align: TextAlign;
		color: string;
		highlightColor: string;
		strokeWidth: number;
		strokeColor: string;
		direction: TextDirection;
		pageDurationInMilliseconds: number;
		captionStartInSeconds: number;
		maxLines: number;
		fadeInDurationInSeconds: number;
		fadeOutDurationInSeconds: number;
		highlightStyle: HighlightStyle;
		// Background box
		backgroundEnabled: boolean;
		backgroundColor: string;
		backgroundOpacity: number;
		backgroundPadding: number;
		backgroundBorderRadius: number;
		// Text shadow
		textShadowEnabled: boolean;
		textShadowColor: string;
		textShadowOffsetX: number;
		textShadowOffsetY: number;
		textShadowBlur: number;
	};
