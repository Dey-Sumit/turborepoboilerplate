import {useCallback, useMemo, useState} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {CaptioningTask} from '../../captioning/caption-state';
import {IconButton} from '../../icon-button';
import {CheckIcon} from '../../icons/check';
import {WaveformIcon} from '../../icons/waveform';
import {deleteCaptioningTask} from '../../state/actions/set-caption-state';
import {setSelectedItems} from '../../state/actions/set-selected-items';
import {useOptionalAssetFromAssetId} from '../../utils/use-context';
import {CaptionProgressBottomLine} from './caption-progress-bottom-line';
import {IconContainer} from './icon-container';
import {TaskContainer} from './task-container';
import {TaskDescription} from './task-description';
import {TaskSubtitle} from './task-subtitle';
import {TaskTitle} from './task-title';
import {taskIndicatorRef} from './tasks-indicator';

export const CaptionProgress: React.FC<{
	captionTask: CaptioningTask;
}> = ({captionTask}) => {
	const asset = useOptionalAssetFromAssetId(captionTask.assetId);
	const setState = useEditorStore((state) => state.setState);

	const title = useMemo(() => {
		return `Transcribing ${asset ? asset.filename : captionTask.filename}`;
	}, [asset, captionTask.filename]);

	const onClick = useCallback(() => {
		if (!asset) {
			return;
		}

		const temporalState = useEditorStore.temporal.getState();
		temporalState.pause();
		setState((state) => {
			if (captionTask.status.type !== 'done') {
				return;
			}

			if (!state.compositionState.items[captionTask.status.captionItemId]) {
				return;
			}

			setSelectedItems(state, [captionTask.status.captionItemId]);
		});
		temporalState.resume();
		taskIndicatorRef.current?.close();
	}, [asset, captionTask, setState]);

	const onDismiss = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.stopPropagation();
			e.preventDefault();

			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();
			setState((state) => {
				deleteCaptioningTask({
					state,
					taskId: captionTask.id,
				});
			});
			temporalState.resume();
		},
		[captionTask, setState],
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
			<TaskDescription isError={captionTask.status.type === 'error'}>
				<TaskTitle>{title}</TaskTitle>
				<TaskSubtitle>
					<CaptionProgressBottomLine captionTask={captionTask} />
				</TaskSubtitle>
			</TaskDescription>
			{hovered &&
			(captionTask.status.type === 'done' ||
				captionTask.status.type === 'error') ? (
				<>
					<IconButton onClick={onDismiss} aria-label="Dismiss">
						<CheckIcon />
					</IconButton>
				</>
			) : null}
		</TaskContainer>
	);
};
