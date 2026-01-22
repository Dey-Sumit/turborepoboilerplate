import {fillTextBox, measureText} from '@remotion/layout-utils';
import {turnFontStyleIntoCss} from '../../inspector/controls/font-style-controls/font-style-controls';
import {FontStyle} from '../../items/text/text-item-type';

type MeasureWrappedTextParams = {
	text: string;
	fontFamily: string;
	fontSize: number;
	lineHeight: number;
	letterSpacing: number;
	fontStyle: FontStyle;
	maxWidth: number;
};

type MeasureWrappedTextResult = {
	width: number;
	height: number;
	lineCount: number;
};

/**
 * Measures text dimensions with wrapping support.
 * If text exceeds maxWidth, it calculates the wrapped height.
 */
export const measureWrappedText = ({
	text,
	fontFamily,
	fontSize,
	lineHeight,
	letterSpacing,
	fontStyle,
	maxWidth,
}: MeasureWrappedTextParams): MeasureWrappedTextResult => {
	const additionalStyles = {
		lineHeight: String(lineHeight),
		display: 'inline',
		whiteSpace: 'pre',
		letterSpacing: `${letterSpacing}px`,
		...turnFontStyleIntoCss(fontStyle),
	};

	// First measure unwrapped to get natural width
	const {width: naturalWidth} = measureText({
		text,
		fontSize,
		fontFamily,
		fontWeight: fontStyle.weight,
		additionalStyles,
	});

	// If text fits within maxWidth, no wrapping needed
	if (naturalWidth <= maxWidth) {
		const lineCount = text.split('\n').length;
		return {
			width: Math.ceil(naturalWidth),
			height: Math.round(lineHeight * fontSize * lineCount),
			lineCount,
		};
	}

	// Text needs wrapping - use fillTextBox to calculate lines
	const lines = text.split('\n');
	let totalLineCount = 0;
	let maxLineWidth = 0;

	for (const line of lines) {
		const words = line.split(' ');
		const box = fillTextBox({
			maxBoxWidth: maxWidth,
			maxLines: 1000,
		});

		let currentLineCount = 1;

		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			if (word === '') continue;

			const {newLine} = box.add({
				fontFamily,
				fontSize,
				fontWeight: fontStyle.weight,
				text: word,
				additionalStyles,
			});

			if (newLine) {
				currentLineCount++;
			}

			// Add space after word (except for last word)
			if (i < words.length - 1) {
				const spaceResult = box.add({
					fontFamily,
					fontSize,
					fontWeight: fontStyle.weight,
					text: ' ',
					additionalStyles,
				});
				if (spaceResult.newLine) {
					currentLineCount++;
				}
			}
		}

		totalLineCount += currentLineCount;
	}

	// Measure each wrapped line to get max width
	maxLineWidth = maxWidth; // When wrapping, width is constrained to maxWidth

	return {
		width: Math.ceil(maxLineWidth),
		height: Math.round(lineHeight * fontSize * totalLineCount),
		lineCount: totalLineCount,
	};
};
