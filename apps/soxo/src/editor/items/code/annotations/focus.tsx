import {
	type AnnotationHandler,
	type CodeAnnotation,
	InnerLine,
	InnerPre,
} from 'codehike/code';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import focusParser from './focus/focus.parser';
import {validateHighlight} from './highlight/highlight.utils';

export const focus: AnnotationHandler = {
	name: 'focus',
	onlyIfAnnotated: true,

	transform: (annotation: CodeAnnotation) => {
		// Validate the annotation using highlight validation
		const {annotation: validatedAnnotation, issues} =
			validateHighlight(annotation);

		// Log validation issues if any
		if (issues.length > 0) {
			console.warn('Focus validation issues:', issues);
		}

		return validatedAnnotation;
	},

	Pre: (props) => <InnerPre merge={props} style={{position: 'relative'}} />,

	Line: (props) => {
		const frame = useCurrentFrame();
		const {fps} = useVideoConfig();

		// Check if this line has a focus annotation
		// @ts-expect-error - data-focus is a custom prop added by AnnotatedLine
		const isFocused = props['data-focus'] === true;

		// Parse delay from query if annotation exists
		const query = props.annotation?.query || '';
		const {
			data: {delayInSeconds, fadeInDurationInSeconds},
		} = focusParser.parse(query);

		// Convert seconds to frames
		const delayInFrames = Math.round(delayInSeconds * fps);
		const fadeInFrames = Math.round(fadeInDurationInSeconds * fps);

		// For non-focused lines: fade to 0.3 opacity
		// For focused lines: stay at 1.0 opacity
		const targetOpacity = isFocused ? 1 : 0.3;

		const opacity = interpolate(
			frame,
			[delayInFrames, delayInFrames + fadeInFrames],
			[1, targetOpacity],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			},
		);

		return (
			<InnerLine
				merge={props}
				style={{
					opacity,
				}}
			/>
		);
	},

	AnnotatedLine: ({annotation, ...props}) => {
		const frame = useCurrentFrame();
		const {fps} = useVideoConfig();

		// Parse delay from query
		const {
			data: {delayInSeconds, fadeInDurationInSeconds},
		} = focusParser.parse(annotation.query);

		// Convert seconds to frames
		const delayInFrames = Math.round(delayInSeconds * fps);
		const fadeInFrames = Math.round(fadeInDurationInSeconds * fps);

		// Interpolate background color - fade in, then stay
		const bgOpacity = interpolate(
			frame,
			[delayInFrames, delayInFrames + fadeInFrames],
			[0, 0.15],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			},
		);

		return (
			<InnerLine
				merge={props}
				data-focus={true}
				style={{
					opacity: 1, // Focused lines always stay at full opacity
					backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
				}}
			/>
		);
	},
};
