import {AssetUploadTask} from '../../assets/assets';
import {AssetDownloadTask} from '../../caching/download-tasks';
import {CaptioningTask, SceneCaptioningTask} from '../../captioning/caption-state';
import {RenderingTask} from '../../rendering/render-state';
import {truthy} from '../../utils/truthy';

export type Task =
	| CaptioningTask
	| SceneCaptioningTask
	| RenderingTask
	| AssetUploadTask
	| AssetDownloadTask;

export const getTasks = ({
	renderState,
	captioning,
	sceneCaptioning,
	assetUploads,
	downloadProgresses,
}: {
	renderState: RenderingTask[];
	captioning: CaptioningTask[];
	sceneCaptioning: SceneCaptioningTask[];
	assetUploads: AssetUploadTask[];
	downloadProgresses: AssetDownloadTask | null;
}): Task[] => {
	const allTasks: (RenderingTask | CaptioningTask | SceneCaptioningTask)[] = [
		...renderState,
		...captioning,
		...sceneCaptioning,
	];
	const newestFirst = allTasks.sort((a, b) => b.startedAt - a.startedAt);

	return [...assetUploads, downloadProgresses, ...newestFirst].filter(truthy);
};
