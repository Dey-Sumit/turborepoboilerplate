import {generateRandomId} from '../../utils/generate-random-id';
import {CodeItem} from './code-item-type';

const CODE_DURATION_IN_FRAMES = 90; // 3 seconds at 30fps
const DEFAULT_CODE_FONT_SIZE = 18;
const DEFAULT_TOKEN_TRANSITION_DURATION = 0.75; // in seconds

export const makeCodeItem = ({
	xOnCanvas,
	yOnCanvas,
	from,
	code,
	compositionWidth,
	compositionHeight,
	fontFamily,
	fontSize,
	theme,
	backgroundColor,
	durationInFrames,
}: {
	xOnCanvas: number;
	yOnCanvas: number;
	from: number;
	code: string;
	compositionWidth: number;
	compositionHeight: number;
	fontFamily?: string;
	fontSize?: number;
	theme?: string;
	backgroundColor?: string;
	durationInFrames?: number;
}): CodeItem => {
	const id = generateRandomId('code');

	// Default size for code block
	const width = Math.min(800, compositionWidth * 0.8);
	const height = Math.min(400, compositionHeight * 0.4);

	return {
		id,
		durationInFrames: durationInFrames ?? CODE_DURATION_IN_FRAMES,
		from,
		type: 'code',
		code,
		processedCode: null, // Will be compiled on first render
		top: Math.round(yOnCanvas - height / 2),
		left: Math.round(xOnCanvas - width / 2),
		width,
		height,
		opacity: 1,
		rotation: 0,
		fontSize: fontSize ?? DEFAULT_CODE_FONT_SIZE,
		fontFamily: fontFamily ?? 'Fira Code',
		theme: theme ?? 'poimandres',
		lineHeight: 1.6,
		tokenTransitionDuration: DEFAULT_TOKEN_TRANSITION_DURATION,
		disableTokenTransitions: false,
		backgroundColor: backgroundColor ?? 'transparent',
		padding: 24,
		borderRadius: 8,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		isDraggingInTimeline: false,
		transition: {
			toNext: undefined,
			toPrev: undefined,
		},
	};
};

/**
 * Creates a CodeItem with explicit dimensions and position
 * Useful for config files and programmatic creation
 */
export const makeCodeItemWithDimensions = ({
	id,
	from,
	durationInFrames,
	code,
	left,
	top,
	width,
	height,
	fontSize = DEFAULT_CODE_FONT_SIZE,
	fontFamily = 'Fira Code',
	theme = 'poimandres',
	lineHeight = 1.6,
	backgroundColor = 'transparent',
	padding = 24,
	borderRadius = 8,
}: {
	id: string;
	from: number;
	durationInFrames: number;
	code: string;
	left: number;
	top: number;
	width: number;
	height: number;
	fontSize?: number;
	fontFamily?: string;
	theme?: string;
	lineHeight?: number;
	backgroundColor?: string;
	padding?: number;
	borderRadius?: number;
}): CodeItem => {
	return {
		id,
		durationInFrames,
		from,
		type: 'code',
		code,
		processedCode: null,
		top,
		left,
		width,
		height,
		opacity: 1,
		rotation: 0,
		fontSize,
		fontFamily,
		theme,
		lineHeight,
		tokenTransitionDuration: DEFAULT_TOKEN_TRANSITION_DURATION,
		disableTokenTransitions: false,
		backgroundColor,
		padding,
		borderRadius,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		isDraggingInTimeline: false,
		transition: {
			toNext: undefined,
			toPrev: undefined,
		},
	};
};
