import React, {memo, useCallback} from 'react';
import {Slider} from '../../../components/ui/slider';
import useEditorStore from '../../../zustand/editor-store';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import {MAX_FADE_DURATION_SECONDS} from '../../constants';
import {AudioItem} from '../../items/audio/audio-item-type';
import {useFps} from '../../utils/use-context';
import {InspectorSubLabel} from '../components/inspector-label';

const AudioFadeControlsUnmemoized: React.FC<{
	fadeInDuration: number;
	fadeOutDuration: number;
	itemId: string;
	durationInFrames: number;
}> = ({fadeInDuration, fadeOutDuration, itemId, durationInFrames}) => {
	const {fps} = useFps();
	const updateItem = useEditorStore((state) => state.updateItem);

	const undoTrackerFadeIn = React.useMemo(
		() => createContinuousUpdateTracker(),
		[],
	);
	const undoTrackerFadeOut = React.useMemo(
		() => createContinuousUpdateTracker(),
		[],
	);

	const setFadeInDuration = useCallback(
		(newFadeInDuration: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as AudioItem;
					if (prev.audioFadeInDurationInSeconds === newFadeInDuration) {
						return prev;
					}
					return {
						...prev,
						audioFadeInDurationInSeconds: newFadeInDuration,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerFadeIn.endTracking(performUpdate);
			} else {
				if (!undoTrackerFadeIn.isTracking()) {
					undoTrackerFadeIn.startTracking(performUpdate);
				} else {
					undoTrackerFadeIn.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, undoTrackerFadeIn],
	);

	const setFadeOutDuration = useCallback(
		(newFadeOutDuration: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as AudioItem;
					if (prev.audioFadeOutDurationInSeconds === newFadeOutDuration) {
						return prev;
					}
					return {
						...prev,
						audioFadeOutDurationInSeconds: newFadeOutDuration,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerFadeOut.endTracking(performUpdate);
			} else {
				if (!undoTrackerFadeOut.isTracking()) {
					undoTrackerFadeOut.startTracking(performUpdate);
				} else {
					undoTrackerFadeOut.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, undoTrackerFadeOut],
	);

	const handleFadeInChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			setFadeInDuration(value, commitToUndoStack);
		},
		[setFadeInDuration],
	);

	const handleFadeOutChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			setFadeOutDuration(value, commitToUndoStack);
		},
		[setFadeOutDuration],
	);

	// Calculate max fade duration based on item duration and fade constraints
	const clipDurationInSeconds = durationInFrames / fps;

	// Each fade cannot overlap the other and together they cannot exceed clip duration
	// Keep a minimal gap of one frame to prevent visual overlap
	const minGap = 1 / fps;
	const maxFadeInDuration = Math.max(
		0,
		Math.min(
			MAX_FADE_DURATION_SECONDS,
			clipDurationInSeconds - fadeOutDuration - minGap,
		),
	);

	const maxFadeOutDuration = Math.max(
		0,
		Math.min(
			MAX_FADE_DURATION_SECONDS,
			clipDurationInSeconds - fadeInDuration - minGap,
		),
	);

	return (
		<div className="space-y-4">
			<div>
				<InspectorSubLabel>Fade In</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={fadeInDuration}
						//@ts-expect-error : type mismatch
						onValueChange={handleFadeInChange}
						min={0}
						max={maxFadeInDuration}
						step={0.1}
						className="flex-1"
						title={`Fade In: ${fadeInDuration.toFixed(1)}s`}
					/>
					<div className="min-w-[50px] text-right text-xs text-white/75">
						{fadeInDuration.toFixed(1)}s
					</div>
				</div>
			</div>
			<div>
				<InspectorSubLabel>Fade Out</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={fadeOutDuration}
						//@ts-expect-error : type mismatch
						onValueChange={handleFadeOutChange}
						min={0}
						max={maxFadeOutDuration}
						step={0.1}
						className="flex-1"
						title={`Fade Out: ${fadeOutDuration.toFixed(1)}s`}
					/>
					<div className="min-w-[50px] text-right text-xs text-white/75">
						{fadeOutDuration.toFixed(1)}s
					</div>
				</div>
			</div>
		</div>
	);
};

export const AudioFadeControls = memo(AudioFadeControlsUnmemoized);
