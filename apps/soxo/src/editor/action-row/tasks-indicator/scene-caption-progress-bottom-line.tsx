import {SceneCaptioningTask} from '../../captioning/caption-state';
import {DevelopingEllipsis} from '../../captioning/developing-ellipsis';
import {formatRelativeTime} from '../../rendering/format-relative-time';
import {useCurrentTime} from '../../rendering/use-current-time';

export const SceneCaptionProgressBottomLine: React.FC<{
	sceneCaptionTask: SceneCaptioningTask;
}> = ({sceneCaptionTask}) => {
	const time = useCurrentTime();

	if (sceneCaptionTask.status.type === 'done') {
		return (
			<div className="text-xs opacity-50">
				Done ({sceneCaptionTask.status.segmentCount} segments)
				{' • '}
				{formatRelativeTime({
					timestamp: sceneCaptionTask.status.doneAt,
					now: time,
				})}
			</div>
		);
	}

	if (sceneCaptionTask.status.type === 'processing') {
		return (
			<div className="text-xs opacity-50">
				Generating scenes
				<DevelopingEllipsis />
			</div>
		);
	}

	if (sceneCaptionTask.status.type === 'error') {
		return (
			<div className="text-xs text-red-300">
				Errored: {sceneCaptionTask.status.error.message}
			</div>
		);
	}

	throw new Error(
		'Unknown scene caption task status: ' +
			JSON.stringify(sceneCaptionTask.status satisfies never),
	);
};
