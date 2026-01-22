// import {parseColorToRGBA} from '@/helpers/utils';
import parse from 'color-parse';
/**
 * Converts a color string to an {r, g, b, alpha} object.
 * If the color is invalid, returns a default rgba object.
 *
 * @param {string} color - The color string to parse.
 * @param {Object} [defaultColor={ r: 0, g: 0, b: 0, alpha: 1 }] - The default color object to return if parsing fails.
 * @returns {Object} An object with properties {r, g, b, alpha}.
 */
export function parseColorToRGBA(
	color: string,
	defaultColor = {r: 255, g: 0, b: 0, alpha: 1},
) {
	const parsed = parse(color);

	if (!parsed.space) {
		// Return the default color if parsing fails
		return defaultColor;
	}

	let r, g, b, alpha;

	if (parsed.space === 'rgb') {
		[r, g, b] = parsed.values;
		alpha = parsed.alpha;
	}

	return {r, g, b, alpha};
}

import {
	type AnnotationHandler,
	type CodeAnnotation,
	// type InlineAnnotation,
	InnerLine,
} from 'codehike/code';
import {
	interpolate,
	interpolateColors,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
// import { validateHighlight } from "./highlight.utils";
import highlightParser from './highlight.parser';
export const highlight: AnnotationHandler = {
	name: 'highlight',

	transform: (annotation: CodeAnnotation) => {
		return annotation;
		/*    // Validate the annotation
    const { annotation: validatedAnnotation, issues } =
      validateHighlight(annotation);

    // You can log or handle validation issues
    if (issues.length > 0) {
      console.warn("Highlight validation issues:", issues);
    }

    // Return the validated annotation (will have fallback values if needed)
    return validatedAnnotation; */
	},

	AnnotatedLine: ({annotation, ...props}) => {
		const {fps} = useVideoConfig();

		// Parse the annotation query
		const {
			data: {color, delayInSeconds, durationInSeconds},
		} = highlightParser.parse(annotation.query);

		// Convert seconds to frames
		const delayInFrames = Math.round(delayInSeconds * fps);
		const durationInFrames = Math.round(durationInSeconds * fps);

		const {r: red, g: green, b: blue} = parseColorToRGBA(color);

		const MARK_TRANSITION_DURATION_IN_FRAMES = durationInFrames;

		const frame = useCurrentFrame();
		const progress = interpolate(
			frame,
			[delayInFrames, delayInFrames + MARK_TRANSITION_DURATION_IN_FRAMES],
			[0, 1],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			},
		);

		const backgroundColor = interpolateColors(
			progress,
			[0, 1],
			['rgba(0, 0, 0, 0)', `rgba(${red}, ${green}, ${blue}, 0.25)`],
		);

		const borderColor = interpolateColors(
			progress,
			[0, 1],
			['rgba(0, 0, 0, 0)', `rgba(${red}, ${green}, ${blue}, 1)`],
		);

		return (
			<div
				{...props}
				style={{
					backgroundColor,
					padding: '0.25rem 0.75rem',
					margin: '0 0 0 -0.5rem ',
					borderLeft: `4px solid ${borderColor}`,
				}}
			>
				<InnerLine merge={props} className="highlight" />
			</div>
		);
	},

	Inline: ({children, annotation}) => {
		const {fps} = useVideoConfig();

		// Parse the annotation query
		const {
			data: {color, delayInSeconds, durationInSeconds},
		} = highlightParser.parse(annotation.query);

		// Convert seconds to frames
		const delayInFrames = Math.round(delayInSeconds * fps);
		const durationInFrames = Math.round(durationInSeconds * fps);

		const {r: red, g: green, b: blue} = parseColorToRGBA(color);

		const MARK_TRANSITION_DURATION_IN_FRAMES = durationInFrames;

		const frame = useCurrentFrame();

		const progress = interpolate(
			frame,
			[delayInFrames, delayInFrames + MARK_TRANSITION_DURATION_IN_FRAMES],
			[0, 1],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			},
		);

		const backgroundColor = interpolateColors(
			progress,
			[0, 1],
			['rgba(0, 0, 0, 0)', `rgba(${red}, ${green}, ${blue}, 0.25)`],
		);

		const borderColor = interpolateColors(
			progress,
			[0, 1],
			['rgba(0, 0, 0, 0)', `rgba(${red}, ${green}, ${blue}, 1)`],
		);

		return (
			<div
				style={{
					display: 'inline-block',
					backgroundColor,
					borderRadius: 4,
					padding: '0.25rem 0.75rem',
					margin: '0 -.125rem',
					border: `2px solid ${borderColor}`,
				}}
			>
				{children}
			</div>
		);
	},
};
