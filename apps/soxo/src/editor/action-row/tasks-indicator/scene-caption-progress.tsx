import {useCallback, useMemo, useState} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {SceneCaptioningTask} from '../../captioning/caption-state';
import {IconButton} from '../../icon-button';
import {CheckIcon} from '../../icons/check';
import {WaveformIcon} from '../../icons/waveform';
import {deleteSceneCaptioningTask} from '../../state/actions/set-caption-state';
import {useOptionalAssetFromAssetId} from '../../utils/use-context';
import {IconContainer} from './icon-container';
import {SceneCaptionProgressBottomLine} from './scene-caption-progress-bottom-line';
import {TaskContainer} from './task-container';
import {TaskDescription} from './task-description';
import {TaskSubtitle} from './task-subtitle';
import {TaskTitle} from './task-title';
import {taskIndicatorRef} from './tasks-indicator';

export const SceneCaptionProgress: React.FC<{
	sceneCaptionTask: SceneCaptioningTask;
}> = ({sceneCaptionTask}) => {
	const asset = useOptionalAssetFromAssetId(sceneCaptionTask.assetId);
	const setState = useEditorStore((state) => state.setState);

	const title = useMemo(() => {
		return `Scene Captions: ${asset ? asset.filename : sceneCaptionTask.filename}`;
	}, [asset, sceneCaptionTask.filename]);

	const onClick = useCallback(() => {
		if (!asset) {
			return;
		}

		taskIndicatorRef.current?.close();
	}, [asset]);

	const onDismiss = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.stopPropagation();
			e.preventDefault();

			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();
			setState((state) => {
				deleteSceneCaptioningTask({
					state,
					taskId: sceneCaptionTask.id,
				});
			});
			temporalState.resume();
		},
		[sceneCaptionTask, setState],
	);

	const [hovered, setHovered] = useState(false);

	const onMouseEnter = useCallback(() => {
		setHovered(true);
	}, []);

	const onMouseLeave = useCallback(() => {
		setHovered(false);
	}, []);

	return (
		<TaskContainer
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<IconContainer>
				<WaveformIcon />
			</IconContainer>
			<TaskDescription isError={sceneCaptionTask.status.type === 'error'}>
				<TaskTitle>{title}</TaskTitle>
				<TaskSubtitle>
					<SceneCaptionProgressBottomLine sceneCaptionTask={sceneCaptionTask} />
				</TaskSubtitle>
			</TaskDescription>
			{hovered &&
			(sceneCaptionTask.status.type === 'done' ||
				sceneCaptionTask.status.type === 'error') ? (
				<>
					<IconButton onClick={onDismiss} aria-label="Dismiss">
						<CheckIcon />
					</IconButton>
				</>
			) : null}
		</TaskContainer>
	);
};
