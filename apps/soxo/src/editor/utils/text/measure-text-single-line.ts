import {fitTextOnNLines} from '@remotion/layout-utils';
import {turnFontStyleIntoCss} from '../../inspector/controls/font-style-controls/font-style-controls';
import {FontStyle} from '../../items/text/text-item-type';

type MeasureTextSingleLineParams = {
	text: string;
	fontFamily: string;
	maxFontSize: number;
	lineHeight: number;
	letterSpacing: number;
	fontStyle: FontStyle;
	maxWidth: number;
};

type MeasureTextSingleLineResult = {
	width: number;
	height: number;
	fontSize: number;
};

/**
 * Measures text dimensions ensuring it fits on a single line.
 * Uses fitTextOnNLines with maxLines=1 to find the optimal font size
 * that allows the text to fit within maxWidth on one line.
 */
export const measureTextSingleLine = ({
	text,
	fontFamily,
	maxFontSize,
	lineHeight,
	letterSpacing,
	fontStyle,
	maxWidth,
}: MeasureTextSingleLineParams): MeasureTextSingleLineResult => {
	const additionalStyles = {
		lineHeight: String(lineHeight),
		letterSpacing: `${letterSpacing}px`,
		...turnFontStyleIntoCss(fontStyle),
	};

	const {fontSize} = fitTextOnNLines({
		text,
		maxBoxWidth: maxWidth,
		maxLines: 1,
		fontFamily,
		fontWeight: fontStyle.weight,
		// @ts-expect-error : TODO fix fontStyle.variant type
		additionalStyles,
		maxFontSize,
	});

	// Calculate dimensions based on the fitted font size
	const height = Math.round(lineHeight * fontSize);
	// Width is constrained to maxWidth (text fits within it)
	const width = Math.min(maxWidth, Math.ceil(maxWidth));

	return {
		width,
		height,
		fontSize,
	};
};
