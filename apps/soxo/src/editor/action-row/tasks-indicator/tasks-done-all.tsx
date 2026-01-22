import {useCallback, useMemo} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {DoneAllIcon} from '../../icons/done-all';
import {clearTasks, getCanClearTasks} from '../../state/actions/clear-tasks';
import {Task} from './get-tasks';

export const TasksDoneAll: React.FC<{
	tasks: Task[];
}> = ({tasks}) => {
	const setState = useEditorStore((state) => state.setState);

	const canClearTasks = useMemo(() => {
		return getCanClearTasks(tasks);
	}, [tasks]);

	const onClick = useCallback(() => {
		const temporalState = useEditorStore.temporal.getState();
		temporalState.pause();
		setState((state) => {
			clearTasks(state);
		});
		temporalState.resume();
	}, [setState]);

	return (
		<div className="flex flex-row items-center justify-end px-2 py-1">
			<button
				onClick={onClick}
				disabled={!canClearTasks}
				className="editor-starter-focus-ring flex flex-row items-center gap-2 rounded px-2 py-1 text-xs text-neutral-300 enabled:cursor-pointer enabled:hover:bg-white/5 enabled:hover:text-white disabled:opacity-50"
				aria-label="Clear all"
			>
				Clear all
				<DoneAllIcon className="h-5 w-5" />
			</button>
		</div>
	);
};
