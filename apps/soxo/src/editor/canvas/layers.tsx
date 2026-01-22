import {linearTiming, TransitionSeries} from '@remotion/transitions';
import React, {useMemo, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {Layer} from '../items/layer';
import {TrackType} from '../state/types';
import {useForbidScroll} from '../utils/forbid-scroll';
import {
	createPresentation,
	getTransitionDuration,
} from '../utils/transition-mapper';
import {useAllItems} from '../utils/use-context';

const layerWrapperStyle: React.CSSProperties = {
	overflow: 'hidden',
};

const LayersUnmemoized: React.FC<{
	tracks: TrackType[];
}> = ({tracks}) => {
	const layerWrapperRef = useRef<HTMLDivElement | null>(null);
	useForbidScroll(layerWrapperRef);
	const {items} = useAllItems();

	// Memoize offset calculations to avoid recalculating on every render
	// This is performance-critical for large timelines (50+ items)
	// Only recalculates when tracks change or when item 'from' or 'durationInFrames' properties change
	// Creates a stable key based on only the properties we care about for offset calculation
	const itemPositionKey = useMemo(() => {
		return Object.keys(items)
			.sort()
			.map((id) => `${id}:${items[id].from}:${items[id].durationInFrames}`)
			.join('|');
	}, [items]);

	const trackOffsets = useMemo(() => {
		const offsetMap = new Map<string, Map<string, number>>();

		tracks.forEach((track) => {
			const itemOffsets = new Map<string, number>();

			track.items.forEach((itemId, index) => {
				const item = items[itemId];
				// Defensive check: skip if item doesn't exist in items record
				if (!item) {
					return;
				}

				const isFirst = index === 0;

				let offset: number;
				if (isFirst) {
					// First item: offset includes transition duration before the item
					offset = item.from - 0;
				} else {
					// Subsequent items: offset is gap from previous item's end plus transition duration before the item
					const previousItemId = track.items[index - 1];
					const previousItem = items[previousItemId];

					// Defensive check: ensure previous item exists
					if (!previousItem) {
						// Fallback: use current item's from as offset if previous item is missing
						offset = item.from;
					} else {
						const previousItemEnd =
							previousItem.from + previousItem.durationInFrames;
						offset = item.from - previousItemEnd;
					}
				}

				itemOffsets.set(itemId, offset);
			});

			offsetMap.set(track.id, itemOffsets);
		});

		return offsetMap;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tracks, itemPositionKey]);

	const renderTrackWithTransitions = (track: TrackType) => {
		if (track.hidden) return null;
		if (track.items.length === 0) return null;

		const itemOffsets = trackOffsets.get(track.id);
		// Defensive check: ensure offsets were calculated for this track
		if (!itemOffsets) {
			return null;
		}

		return (
			<TransitionSeries key={track.id} name={`track-${track.id}`}>
				{track.items.map((itemId, index) => {
					const item = items[itemId];

					// Defensive check: skip rendering if item doesn't exist
					if (!item) {
						return null;
					}

					const isLast = index === track.items.length - 1;

					// Get pre-calculated offset from memoized map
					const offset = itemOffsets.get(itemId);
					if (offset === undefined) {
						return null;
					}

					// Check if current item has transition to next

					const hasTransition = item.transition.toNext !== undefined && !isLast;
					const durationInFrames =
						item.durationInFrames +
						(item.transition.toNext
							? Math.ceil(getTransitionDuration(item.transition.toNext) / 2)
							: 0) +
						(item.transition.toPrev
							? Math.floor(getTransitionDuration(item.transition.toPrev) / 2)
							: 0);

					return (
						<React.Fragment key={itemId}>
							{/* Item sequence */}
							<TransitionSeries.Sequence
								offset={offset}
								durationInFrames={durationInFrames}
								name={`item-${itemId}`}
							>
								<Layer
									itemId={itemId}
									trackMuted={track.muted}
									previousItemId={
										index > 0 ? track.items[index - 1] : undefined
									}
								/>
							</TransitionSeries.Sequence>

							{/* Transition after item (if current item has transitionToNext) */}
							{hasTransition && item.transition.toNext && (
								<TransitionSeries.Transition
									timing={linearTiming({
										durationInFrames: getTransitionDuration(
											item.transition.toNext,
										),
									})}
									// @ts-expect-error type issue
									presentation={
										createPresentation(item.transition.toNext)
										}
								/>
							)}

							{/* <TransitionSeries.Transition
								timing={linearTiming({
									durationInFrames: 1,
								})}
								presentation={addSoundToTransition(
									fade(),
									// staticFile('whoosh.mp3'),
									staticFile('sfx/whoosh.mp3'),
								)}
							/> */}
						</React.Fragment>
					);
				})}
			</TransitionSeries>
		);
	};

	return (
		<AbsoluteFill style={layerWrapperStyle} ref={layerWrapperRef}>
			{tracks
				.slice()
				.reverse()
				.map((track) => renderTrackWithTransitions(track))}
		</AbsoluteFill>
	);
};

export const Layers = React.memo(LayersUnmemoized);
