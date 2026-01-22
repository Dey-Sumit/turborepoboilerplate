import {RenderingTask, RenderingTaskState} from '../../rendering/render-state';
import {EditorState} from '../types';

// Immer version - mutate state directly
export const addRenderingTask = ({
	state,
	task,
}: {
	state: EditorState;
	task: RenderingTask;
}): void => {
	state.renderingTasks = [task, ...state.renderingTasks];
};

// Immer version - mutate state directly
export const updateRenderingTask = ({
	state,
	taskId,
	newStatus,
}: {
	state: EditorState;
	taskId: string;
	newStatus: RenderingTaskState;
}): void => {
	const taskIndex = state.renderingTasks.findIndex(
		(task) => task.id === taskId,
	);
	if (taskIndex !== -1) {
		state.renderingTasks[taskIndex] = {
			...state.renderingTasks[taskIndex],
			status: newStatus,
		};
	}
};

// Immer version - mutate state directly
export const deleteRenderingTask = ({
	state,
	taskId,
}: {
	state: EditorState;
	taskId: string;
}): void => {
	const newTasks = state.renderingTasks.filter((task) => task.id !== taskId);
	if (newTasks.length === state.renderingTasks.length) {
		return;
	}

	state.renderingTasks = newTasks;
};

export const canClearRenderingTask = (task: RenderingTask) => {
	return task.status.type === 'done' || task.status.type === 'error';
};

// Immer version - mutate state directly
export const clearFinalizedRenderingTasks = (state: EditorState): void => {
	const newTasks = state.renderingTasks.filter(
		(task) => !canClearRenderingTask(task),
	);

	if (newTasks.length === state.renderingTasks.length) {
		return;
	}

	state.renderingTasks = newTasks;
};
