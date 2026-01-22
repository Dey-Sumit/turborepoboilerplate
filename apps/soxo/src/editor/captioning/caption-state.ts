import {Caption} from '@remotion/captions';
import useEditorStore from '../../zustand/editor-store';
import {taskIndicatorRef} from '../action-row/tasks-indicator/tasks-indicator';
import {AudioAsset, VideoAsset} from '../assets/assets';
import {PresignResponse} from '../assets/types';
import {
	addCaptioningTask,
	updateCaptioningTask,
} from '../state/actions/set-caption-state';
import {EditorState} from '../state/types';
import {generateRandomId} from '../utils/generate-random-id';
import {uploadWithProgress} from '../utils/upload';
import {extractAudio} from './audio-buffer-to-wav';
import {GetCaptionsResponse} from './types';

export type CaptioningTaskStatus =
	| {
			type: 'extracting-audio';
			src: string;
	  }
	| {
			type: 'uploading-audio';
			progress: number;
			loadedBytes: number;
			totalBytes: number;
	  }
	| {
			type: 'captioning';
	  }
	| {
			type: 'error';
			error: Error;
	  }
	| {
			type: 'done';
			captions: Caption[];
			doneAt: number;
			captionItemId: string;
	  };

export type CaptioningTask = {
	id: string;
	assetId: string;
	filename: string;
	assetType: 'video' | 'audio';
	status: CaptioningTaskStatus;
	startedAt: number;
	type: 'captioning';
};

// Scene Captioning Task Types (for Fine-Grained Scenes / Granite)
export type SceneCaptioningTaskStatus =
	| {
			type: 'processing';
	  }
	| {
			type: 'error';
			error: Error;
	  }
	| {
			type: 'done';
			doneAt: number;
			segmentCount: number;
	  };

export type SceneCaptioningTask = {
	id: string;
	assetId: string;
	filename: string;
	assetType: 'video' | 'audio';
	status: SceneCaptioningTaskStatus;
	startedAt: number;
	type: 'scene-captioning';
};

export const getCaptions = async ({
	src,
	setState,
	asset,
	captionItemId,
}: {
	src: string;
	setState: (updater: (draft: EditorState) => void) => void;
	asset: AudioAsset | VideoAsset;
	captionItemId: string;
}) => {
	const taskId = generateRandomId('task');

	try {
		const temporalState = useEditorStore.temporal.getState();
		temporalState.pause();
		setState((state) => {
			addCaptioningTask({
				state,
				newTask: {
					id: taskId,
					assetId: asset.id,
					filename: asset.filename,
					assetType: asset.type,
					status: {type: 'extracting-audio', src},
					startedAt: Date.now(),
					type: 'captioning',
				},
			});
		});
		temporalState.resume();

		taskIndicatorRef.current?.open();

		const audio = await extractAudio(src);
		const audioFile = new File([audio], 'audio.wav', {
			type: 'audio/wav',
		});

		// Get a presigned URL for upload
		const presignResponse = await fetch('/api/upload', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contentType: 'audio/wav',
				size: audio.byteLength,
			}),
		});

		if (!presignResponse.ok) {
			const errorData = await presignResponse.json();
			throw new Error(errorData.error || 'Failed to get upload URL');
		}

		const presignData = (await presignResponse.json()) as PresignResponse;

		// Upload the audio file to S3 with progress
		await uploadWithProgress({
			file: audioFile,
			url: presignData.presignedUrl,
			onProgress: ({progress, loadedBytes, totalBytes}) => {
				const temporalState = useEditorStore.temporal.getState();
				temporalState.pause();
				setState((prevState) => {
					return updateCaptioningTask({
						state: prevState,
						taskId,
						newStatus: {
							type: 'uploading-audio',
							progress,
							loadedBytes,
							totalBytes,
						},
					});
				});
				temporalState.resume();
			},
		});

		const temporalState2 = useEditorStore.temporal.getState();
		temporalState2.pause();
		setState((prevState) => {
			return updateCaptioningTask({
				state: prevState,
				taskId,
				newStatus: {type: 'captioning'},
			});
		});
		temporalState2.resume();

		// Request captions using the file key
		const res = await fetch(`/api/captions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				fileKey: presignData.fileKey,
			}),
		});
		if (!res.ok) {
			throw new Error('Failed to get captions');
		}
		const json = (await res.json()) as GetCaptionsResponse;
		const temporalState3 = useEditorStore.temporal.getState();
		temporalState3.pause();
		setState((prevState) => {
			return updateCaptioningTask({
				state: prevState,
				taskId,
				newStatus: {
					type: 'done',
					captions: json.captions,
					doneAt: Date.now(),
					captionItemId,
				},
			});
		});
		temporalState3.resume();
		return json.captions;
	} catch (err) {
		const temporalState4 = useEditorStore.temporal.getState();
		temporalState4.pause();
		setState((prevState) => {
			return updateCaptioningTask({
				state: prevState,
				taskId,
				newStatus: {type: 'error', error: err as Error},
			});
		});
		temporalState4.resume();
	}
};

export const getGeneratedCaptionByAssetId = (assetId: string) => {
	const assets = useEditorStore.getState().compositionState.assets;
	console.log({audioItemId: assetId, assets});

	const asset = assets[assetId];
	if (!asset) {
		throw new Error('Asset not found');
	}
	if (asset.type !== 'caption') {
		throw new Error('Asset is not an audio');
	}
	return asset.captions;
};
