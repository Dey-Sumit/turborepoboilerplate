import {linearTiming, TransitionPresentation, TransitionSeries} from '@remotion/transitions';
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {getThreePhaseAnimationStyle} from '../../animations/get-three-phase-animation-style';
import {mergeAnimationStyles} from '../../animations/merge-animation-styles';
import {
	createPresentation,
	getTransitionDuration,
} from '../../utils/transition-mapper';
import {InnerLayer} from '../inner-layer';
import {CompositeItem} from './composite-item-type';

/**
 * Calculates fade opacity for a given frame.
 */
const calculateFadeOpacity = ({
	currentFrame,
	fadeInDurationInSeconds,
	fadeOutDurationInSeconds,
	totalDurationInFrames,
	fps,
}: {
	currentFrame: number;
	fadeInDurationInSeconds: number;
	fadeOutDurationInSeconds: number;
	totalDurationInFrames: number;
	fps: number;
}): number => {
	const fadeInFrames = fadeInDurationInSeconds * fps;
	const fadeOutFrames = fadeOutDurationInSeconds * fps;

	let opacity = 1;

	// Fade in
	if (currentFrame < fadeInFrames && fadeInFrames > 0) {
		opacity = currentFrame / fadeInFrames;
	}

	// Fade out
	const fadeOutStart = totalDurationInFrames - fadeOutFrames;
	if (currentFrame >= fadeOutStart && fadeOutFrames > 0) {
		const progress = (currentFrame - fadeOutStart) / fadeOutFrames;
		opacity *= 1 - progress;
	}

	return Math.max(0, Math.min(1, opacity));
};

/**
 * Renders the child timeline content of a composite.
 * This is separate to allow proper Remotion context scoping.
 */
const CompositeContent: React.FC<{
	item: CompositeItem;
}> = ({item}) => {
	const {childTimeline} = item;
	const {tracks, items} = childTimeline;

	// Calculate offsets for each item within the composite's tracks
	const trackOffsets = useMemo(() => {
		const offsetMap = new Map<string, Map<string, number>>();

		tracks.forEach((track) => {
			const itemOffsets = new Map<string, number>();

			track.items.forEach((itemId, index) => {
				const childItem = items[itemId];
				if (!childItem) return;

				const isFirst = index === 0;
				let offset: number;

				if (isFirst) {
					offset = childItem.from;
				} else {
					const previousItemId = track.items[index - 1];
					const previousItem = items[previousItemId];

					if (!previousItem) {
						offset = childItem.from;
					} else {
						const previousItemEnd =
							previousItem.from + previousItem.durationInFrames;
						offset = childItem.from - previousItemEnd;
					}
				}

				itemOffsets.set(itemId, offset);
			});

			offsetMap.set(track.id, itemOffsets);
		});

		return offsetMap;
	}, [tracks, items]);

	const containerStyle: React.CSSProperties = useMemo(
		() => ({
			width: item.originalWidth,
			height: item.originalHeight,
			position: 'relative' as const,
		}),
		[item.originalWidth, item.originalHeight],
	);

	const renderTrackWithTransitions = (track: (typeof tracks)[0]) => {
		if (track.hidden) return null;
		if (track.items.length === 0) return null;

		const itemOffsets = trackOffsets.get(track.id);
		if (!itemOffsets) return null;

		return (
			<TransitionSeries key={track.id} name={`composite-track-${track.id}`}>
				{track.items.map((itemId, index) => {
					const childItem = items[itemId];
					if (!childItem) return null;

					const isLast = index === track.items.length - 1;
					const offset = itemOffsets.get(itemId);
					if (offset === undefined) return null;

					const hasTransition =
						childItem.transition.toNext !== undefined && !isLast;
					const durationInFrames =
						childItem.durationInFrames +
						(childItem.transition.toNext
							? Math.ceil(
									getTransitionDuration(childItem.transition.toNext) / 2,
								)
							: 0) +
						(childItem.transition.toPrev
							? Math.floor(
									getTransitionDuration(childItem.transition.toPrev) / 2,
								)
							: 0);

					return (
						<React.Fragment key={itemId}>
							<TransitionSeries.Sequence
								offset={offset}
								durationInFrames={durationInFrames}
								name={`composite-item-${itemId}`}
							>
								<InnerLayer
									item={childItem}
									trackMuted={track.muted}
									cropBackground={false}
								/>
							</TransitionSeries.Sequence>

							{hasTransition && childItem.transition.toNext && (
								<TransitionSeries.Transition
									timing={linearTiming({
										durationInFrames: getTransitionDuration(
											childItem.transition.toNext,
										),
									})}
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									presentation={createPresentation(childItem.transition.toNext) as TransitionPresentation<any>}
								/>
							)}
						</React.Fragment>
					);
				})}
			</TransitionSeries>
		);
	};

	return (
		<div style={containerStyle}>
			<AbsoluteFill>
				{tracks
					.slice()
					.reverse()
					.map((track) => renderTrackWithTransitions(track))}
			</AbsoluteFill>
		</div>
	);
};

/**
 * CompositeLayer renders a composite item on the canvas.
 *
 * A composite is rendered as:
 * 1. An outer container positioned at (left, top) with rotation/opacity
 * 2. An inner container that scales child content from original to current size
 * 3. Child tracks rendered with the same TransitionSeries pattern as root
 *
 * Note: Composites don't support cropping - they clip their children at their bounds.
 *
 * The Sequence wrapper ensures child items receive proper frame context
 * relative to the composite's timeline position.
 */
export const CompositeLayer: React.FC<{
	item: CompositeItem;
	cropBackground: boolean;
}> = ({item}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	// Calculate fade opacity
	const calculatedOpacity = useMemo(() => {
		return calculateFadeOpacity({
			currentFrame: frame,
			fadeInDurationInSeconds: item.fadeInDurationInSeconds,
			fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
			totalDurationInFrames: durationInFrames,
			fps,
		});
	}, [
		frame,
		item.fadeInDurationInSeconds,
		item.fadeOutDurationInSeconds,
		durationInFrames,
		fps,
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

	// Calculate scale factors for rendering child content
	const scaleX = item.width / item.originalWidth;
	const scaleY = item.height / item.originalHeight;

	// Base outer style
	const baseOuterStyle: React.CSSProperties = useMemo(
		() => ({
			position: 'absolute',
			left: item.left,
			top: item.top,
			width: item.width,
			height: item.height,
			transform: `rotate(${item.rotation}deg)`,
			opacity: calculatedOpacity * item.opacity,
			overflow: 'hidden',
			borderRadius: item.borderRadius,
		}),
		[
			item.left,
			item.top,
			item.width,
			item.height,
			item.rotation,
			item.borderRadius,
			calculatedOpacity,
			item.opacity,
		],
	);

	// Merge animation styles with base outer style intelligently
	const outerStyle = useMemo(() => {
		return mergeAnimationStyles(baseOuterStyle, animationStyle);
	}, [baseOuterStyle, animationStyle]);

	// Inner container: scales child content to fit composite bounds
	const innerStyle: React.CSSProperties = useMemo(
		() => ({
			width: item.originalWidth,
			height: item.originalHeight,
			transform: `scale(${scaleX}, ${scaleY})`,
			transformOrigin: 'top left',
			position: 'absolute' as const,
		}),
		[item.originalWidth, item.originalHeight, scaleX, scaleY],
	);

	return (
		<div style={outerStyle}>
			<div style={innerStyle}>
				<CompositeContent item={item} />
			</div>
		</div>
	);
};
