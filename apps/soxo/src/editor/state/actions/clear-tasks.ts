import {Task} from '../../action-row/tasks-indicator/get-tasks';
import {EditorState} from '../types';
import {
	canClearCaptioningTask,
	clearFinalizedCaptioningTasks,
} from './set-caption-state';
import {
	canClearRenderingTask,
	clearFinalizedRenderingTasks,
} from './set-render-state';

// Immer version - mutate state directly
export const clearTasks = (state: EditorState): void => {
	clearFinalizedCaptioningTasks(state);
	clearFinalizedRenderingTasks(state);
};

const canClearTask = (task: Task) => {
	if (task.type === 'captioning') {
		return canClearCaptioningTask(task);
	}

	if (task.type === 'rendering') {
		return canClearRenderingTask(task);
	}

	if (task.type === 'uploading') {
		return false;
	}
};

export const getCanClearTasks = (tasks: Task[]) => {
	return tasks.some(canClearTask);
};
