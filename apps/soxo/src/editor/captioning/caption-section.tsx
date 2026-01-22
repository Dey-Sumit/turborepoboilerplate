import React, {useCallback} from 'react';
import {Button} from '../../components/ui/button';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';
import {taskIndicatorRef} from '../action-row/tasks-indicator/tasks-indicator';
import {
	getAssetDurationInSeconds,
	getAssetStartInSeconds,
	getDurationInSecondsOfCaptionAsset,
} from '../assets/utils';
import {InspectorLabel} from '../inspector/components/inspector-label';
import {CollapsableInspectorSection} from '../inspector/components/inspector-section';
import {useItemForTransition} from '../selectors/hooks';
import {AudioItem} from '../items/audio/audio-item-type';
import {VideoItem} from '../items/video/video-item-type';
import {addCaptionAsset} from '../state/actions/add-caption-asset';
import {addItem} from '../state/actions/add-item';
import {addSceneCaptionAsset} from '../state/actions/add-scene-caption-asset';
import {usePreferredLocalUrl} from '../utils/find-asset-by-id';
import {generateRandomId} from '../utils/generate-random-id';
import {
	useAssetFromItem,
	useCaptionState,
	useDimensions,
	useFps,
	useSceneCaptionState,
	useTracks,
} from '../utils/use-context';
import {MAX_DURATION_ALLOWING_CAPTIONING_IN_SEC} from './audio-buffer-to-wav';
import {getCaptions} from './caption-state';
import {
	addSceneCaptioningTask,
	updateSceneCaptioningTask,
} from '../state/actions/set-caption-state';
export type AICaptionGroupingResponse = {
	segments: Array<{segmentId: string; groups: string[]}>;
};
import {
	cleanCaptions,
	createSegments,
	remapAIGroupsToTimestamps,
	repairSegmentTimestamps,
} from '../items/captions/scene-captions/utils';
import {CaptionAsset} from '../assets/assets';
import { createGroupComposition } from '../items/captions/scene-captions/utils/create-group-composition';

const DEFAULT_HIGHLIGHT_COLOR = '#39E508';

export const GenerateCaptionSection: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const item = useItemForTransition(itemId) as VideoItem | AudioItem;
	const asset = useAssetFromItem(item);

	const {fps} = useFps();
	const captionState = useCaptionState();
	const sceneCaptionState = useSceneCaptionState();
	const setState = useEditorStore((s) => s.setState);
	const {tracks} = useTracks();
	const {compositionWidth} = useDimensions();

	const src = usePreferredLocalUrl(asset);

	const caption = useCallback(async () => {
		const captionItemId = generateRandomId('captions');
		taskIndicatorRef.current?.open();

		if (asset.type !== 'audio' && asset.type !== 'video') {
			throw new Error(
				'Captioning is only supported for audio and video assets',
			);
		}

		const captions = await getCaptions({
			src,
			setState: setState,
			asset,
			captionItemId,
		});

		const startInSeconds = getAssetStartInSeconds(item);

		if (!captions) {
			return;
		}

		const videoTrackIndex = tracks.findIndex((track) =>
			track.items.some((i) => i === item.id),
		);

		if (videoTrackIndex === -1) {
			throw new Error('Could not find track for video item');
		}

		const defaultLineHeight = 1.2;
		const defaultLetterSpacing = 0;
		const defaultFontSize = 80;
		const defaultMaxLines = 2;

		const width = Math.min(compositionWidth, 1000) - 40;
		// Place the caption item in the newly created track
		setState((state) => {
			const captionAsset = addCaptionAsset({
				state,
				captions,
				filename: 'captions.srt',
				sourceAssetId: item.assetId, // Link caption asset to source audio/video asset
			});

			// Set captionAssetId on the source item (bidirectional link)
			const sourceItem = state.compositionState.items[item.id];
			if (
				sourceItem &&
				(sourceItem.type === 'video' || sourceItem.type === 'audio')
			) {
				sourceItem.captionAssetId = captionAsset.id;
			}

			addItem({
				state,
				item: {
					type: 'captions',
					assetId: captionAsset.id,
					durationInFrames: Math.round(
						(getDurationInSecondsOfCaptionAsset(captionAsset) -
							(startInSeconds ?? 0)) *
							fps,
					),
					from: item.from,
					height: defaultFontSize * defaultLineHeight * defaultMaxLines,
					id: captionItemId,
					isDraggingInTimeline: false,
					left: (state.compositionState.compositionWidth - width) / 2,
					top: state.compositionState.compositionHeight / 2 + 150,
					width: width,
					opacity: 1,
					fontFamily: 'TikTok Sans',
					fontStyle: {
						variant: 'normal',
						weight: '600',
					},
					rotation: 0,
					lineHeight: defaultLineHeight,
					letterSpacing: defaultLetterSpacing,
					fontSize: defaultFontSize,
					align: 'center',
					color: 'white',
					highlightColor: DEFAULT_HIGHLIGHT_COLOR,
					direction: 'ltr',
					pageDurationInMilliseconds: 2000,
					captionStartInSeconds: startInSeconds ?? 0,
					strokeWidth: 4,
					strokeColor: 'black',
					maxLines: defaultMaxLines,
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					highlightStyle: 'highlight',
					// Background box
					backgroundEnabled: false,
					backgroundColor: '#000000',
					backgroundOpacity: 0.8,
					backgroundPadding: 8,
					backgroundBorderRadius: 4,
					// Text shadow
					textShadowEnabled: false,
					textShadowColor: '#000000',
					textShadowOffsetX: 2,
					textShadowOffsetY: 2,
					textShadowBlur: 4,
					transition: {
						toNext: undefined,
						toPrev: undefined,
					},
				},
				position: {type: 'directly-above', trackIndex: videoTrackIndex},
			});
		});
		// Select outside setState
		useUIStore.getState().setSelectedItems([captionItemId]);
	}, [
		item,
		// setState,
		setState,
		compositionWidth,
		tracks,
		src,
		fps,
		asset,
	]);

	const generateFineGrainedScenes = useCallback(async () => {
		// Use bidirectional link to get captions for this specific item
		const captionAssetId = item.captionAssetId;
		if (!captionAssetId) {
			console.warn(
				'No caption asset linked to this item. Generate captions first.',
			);
			return;
		}

		const assets = useEditorStore.getState().compositionState.assets;
		const captionAsset = assets[captionAssetId] as CaptionAsset | undefined;
		if (!captionAsset || captionAsset.type !== 'caption') {
			console.warn('Caption asset not found or invalid type');
			return;
		}

		const captions = captionAsset.captions;

		const cleaned = cleanCaptions(captions);
		const {segments, fullRawText} = createSegments(cleaned);
		const repaired = repairSegmentTimestamps(segments);

		//	Create task ID for tracking
		const taskId = generateRandomId('task');

		// Add task to show progress
		const temporalState = useEditorStore.temporal.getState();
		temporalState.pause();
		setState((state) => {
			addSceneCaptioningTask({
				state,
				newTask: {
					id: taskId,
					assetId: asset.id,
					filename: asset.filename,
					assetType: asset.type as 'video' | 'audio',
					status: {type: 'processing'},
					startedAt: Date.now(),
					type: 'scene-captioning',
				},
			});
		});
		temporalState.resume();

		// Open task indicator
		taskIndicatorRef.current?.open();

		try {
			// // Make API call to generate scene captions
			const response = await fetch('/api/generate-caption-scenes', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					fullText: fullRawText,
					segments: repaired.map((seg) => ({
						segmentId: seg.id,
						fullText: seg.fullText,
					})),
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to generate scene captions');
			}

			const aiGroupsData = (
				(await response.json()) as AICaptionGroupingResponse
			).segments;
			// const aiGroupsData = AI_RESPONSE_ANATOMY_OF_A_FALL.segments;

			// const aiGroupsData = SCENE_CAPTION_ANATOMY_OF_A_FALL.segments;
			const finalSegments = aiGroupsData.map((aiSegment) => {
				const originalSegment = repaired.find(
					(seg) => seg.id === aiSegment.segmentId,
				);

				if (!originalSegment) {
					console.warn(`Segment ${aiSegment.segmentId} not found`);
					return null;
				}

				const groups = remapAIGroupsToTimestamps(
					aiSegment.groups,
					originalSegment.captions,
					aiSegment.segmentId,
				);

				return {
					segmentId: aiSegment.segmentId,
					fullText: originalSegment.fullText,
					adjustedStartMs: originalSegment.adjustedStartMs,
					adjustedEndMs: originalSegment.adjustedEndMs,
					adjustedTotalMs: originalSegment.adjustedTotalMs,
					originalStartMs: originalSegment.startMs,
					originalEndMs: originalSegment.endMs,
					originalTotalMs: originalSegment.totalMs,
					groups,
				};
			});

			const validSegments = finalSegments.filter(
				(seg): seg is NonNullable<typeof seg> => seg !== null,
			);

			// Find track to place items
			const videoTrackIndex = tracks.findIndex((track) =>
				track.items.some((i) => i === item.id),
			);

			if (videoTrackIndex === -1) {
				throw new Error('Could not find track for video item');
			}

			const startInSeconds = getAssetStartInSeconds(item);

			// Create composite items for each segment and store the scene caption asset
			const temporalState2 = useEditorStore.temporal.getState();
			temporalState2.pause();
			setState((state) => {
				// Create the scene caption asset with bidirectional links
				const sceneCaptionAsset = addSceneCaptionAsset({
					state,
					segments: validSegments,
					filename: 'scene-captions.json',
					sourceAssetId: item.assetId,
					captionAssetId: captionAssetId,
				});

				// Set sceneCaptionAssetId on the source item (video/audio)
				const sourceItem = state.compositionState.items[item.id];
				if (
					sourceItem &&
					(sourceItem.type === 'video' || sourceItem.type === 'audio')
				) {
					sourceItem.sceneCaptionAssetId = sceneCaptionAsset.id;
				}

				// Set sceneCaptionAssetId on the raw caption asset
				const rawCaptionAsset = state.compositionState.assets[captionAssetId];
				if (rawCaptionAsset && rawCaptionAsset.type === 'caption') {
					rawCaptionAsset.sceneCaptionAssetId = sceneCaptionAsset.id;
				}

				const newTrackId = generateRandomId('track');
				const itemIds: string[] = [];
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newItems: Record<string, any> = {};

				// Create all composite items using the utility function
				validSegments.forEach((segment) => {
					const compositeItem = createGroupComposition({
						segment,
						fps,
						compositionWidth: state.compositionState.compositionWidth,
						compositionHeight: state.compositionState.compositionHeight,
						startInSeconds: startInSeconds ?? 0,
					});

					// Set trackId on the composite item
					compositeItem.trackId = newTrackId;

					itemIds.push(compositeItem.id);
					newItems[compositeItem.id] = compositeItem;
				});

				// Create new track with all composite items
				const newTrack = {
					id: newTrackId,
					items: itemIds,
					hidden: false,
					muted: false,
				};

				// Insert track above video track
				const updatedTracks = [...state.compositionState.tracks];
				updatedTracks.splice(videoTrackIndex + 1, 0, newTrack);
				state.compositionState.tracks = updatedTracks;

				// Add all items to state
				state.compositionState.items = {
					...state.compositionState.items,
					...newItems,
				};

				// Update task status to done
				updateSceneCaptioningTask({
					state,
					taskId,
					newStatus: {
						type: 'done',
						doneAt: Date.now(),
						segmentCount: validSegments.length,
					},
				});
			});
			temporalState2.resume();
		} catch (err) {
			// Update task status to error
			const temporalState3 = useEditorStore.temporal.getState();
			temporalState3.pause();
			setState((state) => {
				updateSceneCaptioningTask({
					state,
					taskId,
					newStatus: {type: 'error', error: err as Error},
				});
			});
			temporalState3.resume();
		}
	}, [item, setState, tracks, fps, asset]);

	const existingCaptioningTask = captionState.find(
		(task) => task.assetId === asset.id,
	);

	const existingSceneCaptioningTask = sceneCaptionState.find(
		(task) => task.assetId === asset.id,
	);

	const duration = getAssetDurationInSeconds(asset);

	const isOverLimit =
		duration === null
			? true
			: duration > MAX_DURATION_ALLOWING_CAPTIONING_IN_SEC;

	const captioningDone =
		existingCaptioningTask && existingCaptioningTask.status.type === 'done';
	const captioningInProgress =
		existingCaptioningTask &&
		(existingCaptioningTask.status.type === 'extracting-audio' ||
			existingCaptioningTask.status.type === 'uploading-audio' ||
			existingCaptioningTask.status.type === 'captioning');

	const sceneCaptioningInProgress =
		existingSceneCaptioningTask &&
		existingSceneCaptioningTask.status.type === 'processing';
	const sceneCaptioningDone =
		existingSceneCaptioningTask &&
		existingSceneCaptioningTask.status.type === 'done';

	return (
		<CollapsableInspectorSection
			summary={<InspectorLabel>Captions</InspectorLabel>}
			id={`captions-${item.id}`}
			defaultOpen={false}
		>
			{captioningDone ? (
				<div className="mb-2 text-xs text-neutral-400">
					Captions already generated
				</div>
			) : null}

			{isOverLimit ? (
				<div className="mb-2 text-xs text-neutral-400 italic">
					Audio is too long to caption
				</div>
			) : (
				<>
					<Button onClick={caption} disabled={captioningInProgress}>
						{captioningInProgress
							? 'Generating captions...'
							: captioningDone
								? 'Regenerate captions'
								: `Caption ${item.type === 'video' ? 'video' : 'audio'}`}{' '}
					</Button>

					<Button
						onClick={generateFineGrainedScenes}
						// disabled={
						// 	captioningInProgress ||
						// 	sceneCaptioningInProgress ||
						// 	!captioningDone
						// }
						className="mt-2"
					>
						{sceneCaptioningInProgress
							? 'Generating scenes...'
							: sceneCaptioningDone
								? 'Regenerate scenes'
								: 'Fine-Grained Scenes'}
					</Button>
				</>
			)}
		</CollapsableInspectorSection>
	);
};
