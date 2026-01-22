import React, {memo, useCallback} from 'react';
import {Slider} from '../../../components/ui/slider';
import useEditorStore from '../../../zustand/editor-store';
import {getCurrentTimeline} from '../../state/helpers/get-current-timeline';
import {useAssetFromAssetId} from '../../utils/use-context';
import {InspectorSubLabel} from '../components/inspector-label';
import {getMaxSafeDurationInFrames} from './playback-rate-collision-detection';

const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 5;

const PlaybackRateControlsUnmemoized: React.FC<{
	playbackRate: number;
	itemId: string;
	assetId: string;
}> = ({playbackRate, itemId, assetId}) => {
	const setState = useEditorStore((state) => state.setState);
	const asset = useAssetFromAssetId(assetId);

	const setPlaybackRate = useCallback(
		(newPlaybackRate: number, commitToUndoStack: boolean) => {
			const temporalState = useEditorStore.temporal.getState();

			if (!commitToUndoStack) {
				temporalState.pause();
			}

			setState((state) => {
				// Get items and tracks from current timeline context (could be inside a composite)
				const timeline = getCurrentTimeline(state.compositionState);
				const i = timeline.items[itemId];
				if (!i) return;

				let updatedItem = i;

				if (i.type === 'video' && asset.type === 'video') {
					const maxDurationBasedOnAsset = Math.floor(
						((asset.durationInSeconds - i.videoStartFromInSeconds) /
							newPlaybackRate) *
							state.compositionState.fps,
					);

					if (i.playbackRate === newPlaybackRate) {
						return;
					}

					const idealNewDuration = Math.floor(
						((asset.durationInSeconds - i.videoStartFromInSeconds) /
							newPlaybackRate) *
							state.compositionState.fps,
					);

					const safeDuration =
						newPlaybackRate > i.playbackRate
							? Math.min(i.durationInFrames, idealNewDuration)
							: getMaxSafeDurationInFrames({
									item: i,
									tracks: timeline.tracks,
									items: timeline.items,
									newDuration: idealNewDuration,
								});

					const finalDuration = Math.min(safeDuration, maxDurationBasedOnAsset);

					updatedItem = {
						...i,
						playbackRate: newPlaybackRate,
						durationInFrames: finalDuration,
					};
				} else if (i.type === 'audio' && asset.type === 'audio') {
					const maxDurationBasedOnAsset = Math.floor(
						((asset.durationInSeconds - i.audioStartFromInSeconds) /
							newPlaybackRate) *
							state.compositionState.fps,
					);

					if (i.playbackRate === newPlaybackRate) {
						return;
					}

					const idealNewDuration = Math.floor(
						((asset.durationInSeconds - i.audioStartFromInSeconds) /
							newPlaybackRate) *
							state.compositionState.fps,
					);

					const safeDuration =
						newPlaybackRate > i.playbackRate
							? Math.min(i.durationInFrames, idealNewDuration)
							: getMaxSafeDurationInFrames({
									item: i,
									tracks: timeline.tracks,
									items: timeline.items,
									newDuration: idealNewDuration,
								});

					const finalDuration = Math.min(safeDuration, maxDurationBasedOnAsset);

					updatedItem = {
						...i,
						playbackRate: newPlaybackRate,
						durationInFrames: finalDuration,
					};
				} else if (i.type === 'gif' && asset.type === 'gif') {
					const maxDurationBasedOnAsset = Math.floor(
						((asset.durationInSeconds - i.gifStartFromInSeconds) /
							newPlaybackRate) *
							state.compositionState.fps,
					);

					if (i.playbackRate === newPlaybackRate) {
						return;
					}

					const idealNewDuration = Math.floor(
						((asset.durationInSeconds - i.gifStartFromInSeconds) /
							newPlaybackRate) *
							state.compositionState.fps,
					);

					const safeDuration =
						newPlaybackRate > i.playbackRate
							? Math.min(i.durationInFrames, idealNewDuration)
							: getMaxSafeDurationInFrames({
									item: i,
									tracks: timeline.tracks,
									items: timeline.items,
									newDuration: idealNewDuration,
								});

					const finalDuration = Math.min(safeDuration, maxDurationBasedOnAsset);

					updatedItem = {
						...i,
						playbackRate: newPlaybackRate,
						durationInFrames: finalDuration,
					};
				} else {
					throw new Error(
						`Playback rate control not implemented for this item type: ${i.type}`,
					);
				}

				timeline.items[itemId] = updatedItem;
			});

			if (!commitToUndoStack) {
				temporalState.resume();
			}
		},
		[setState, itemId, asset],
	);

	const handleSliderChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const newPlaybackRate = value / 100;
			setPlaybackRate(newPlaybackRate, commitToUndoStack);
		},
		[setPlaybackRate],
	);

	const playbackRatePercent = Math.round(playbackRate * 100);

	return (
		<div>
			<InspectorSubLabel>Playback Rate</InspectorSubLabel>
			<div className="flex w-full items-center gap-3">
				<Slider
					value={playbackRatePercent}
					//@ts-expect-error : type mismatch
					onValueChange={handleSliderChange}
					min={MIN_PLAYBACK_RATE * 100}
					max={MAX_PLAYBACK_RATE * 100}
					step={5}
					className="flex-1"
					title={`Playback Rate: ${playbackRate.toFixed(2)}x`}
				/>
				<div className="min-w-[40px] text-right text-xs text-white/75">
					{playbackRate.toFixed(2)}x
				</div>
			</div>
		</div>
	);
};

export const PlaybackRateControls = memo(PlaybackRateControlsUnmemoized);
