import {
	CaptioningTask,
	CaptioningTaskStatus,
	SceneCaptioningTask,
	SceneCaptioningTaskStatus,
} from '../../captioning/caption-state';
import {EditorState} from '../types';

/**
 * Adds a new captioning task to the beginning of the captioning tasks list.
 * Used when user initiates a new caption generation request.
 *
 * @param state - The editor state to mutate
 * @param newTask - The captioning task to add (contains id, status, and task details)
 */
export const addCaptioningTask = ({
	state,
	newTask,
}: {
	state: EditorState;
	newTask: CaptioningTask;
}): void => {
	state.captioningTasks = [newTask, ...state.captioningTasks];
};

/**
 * Updates the status of a specific captioning task.
 * Used when a captioning task progresses (e.g., from "processing" to "done" or "error").
 *
 * @param state - The editor state to mutate
 * @param taskId - The ID of the task to update
 * @param newStatus - The new status to set (e.g., {type: 'done'} or {type: 'error', message: '...'})
 */
export const updateCaptioningTask = ({
	state,
	taskId,
	newStatus,
}: {
	state: EditorState;
	taskId: string;
	newStatus: CaptioningTaskStatus;
}): void => {
	const taskIndex = state.captioningTasks.findIndex(
		(task) => task.id === taskId,
	);

	if (taskIndex !== -1) {
		state.captioningTasks[taskIndex] = {
			...state.captioningTasks[taskIndex],
			status: newStatus,
		};
	}
};

/**
 * Deletes a specific captioning task from the list.
 * Used when user manually dismisses/removes a captioning task.
 *
 * @param state - The editor state to mutate
 * @param taskId - The ID of the task to delete
 */
export const deleteCaptioningTask = ({
	state,
	taskId,
}: {
	state: EditorState;
	taskId: string;
}): void => {
	const newTasks = state.captioningTasks.filter((task) => task.id !== taskId);
	if (newTasks.length === state.captioningTasks.length) {
		return;
	}

	state.captioningTasks = newTasks;
};

/**
 * Checks if a captioning task can be cleared (removed from history).
 * A task can be cleared if it's in a finalized state (completed successfully or failed).
 *
 * @param task - The captioning task to check
 * @returns true if the task status is 'done' or 'error', false otherwise
 */
export const canClearCaptioningTask = (task: CaptioningTask) => {
	return task.status.type === 'done' || task.status.type === 'error';
};

/**
 * Removes all finalized captioning tasks (tasks with status 'done' or 'error').
 * Used to clean up completed/failed caption generation tasks from the UI.
 *
 * ⚠️ BUG: This function filters to keep non-finalized tasks in `newTasks`,
 * but then assigns an empty array instead of `newTasks`, clearing ALL tasks.
 * This bug existed in the pre-migration code and was faithfully preserved.
 *
 * Expected behavior: Keep only tasks that are still processing (not done/error)
 * Actual behavior: Clears ALL captioning tasks regardless of status
 *
 * @param state - The editor state to mutate
 */
export const clearFinalizedCaptioningTasks = (state: EditorState): void => {
	const newTasks = state.captioningTasks.filter(
		(task) => !canClearCaptioningTask(task),
	);

	if (newTasks.length === state.captioningTasks.length) {
		return;
	}

	state.captioningTasks = newTasks;
};

// ============================================
// Scene Captioning Task Actions
// ============================================

/**
 * Adds a new scene captioning task to the beginning of the scene captioning tasks list.
 * Used when user initiates a Fine-Grained Scenes (Granite) generation request.
 *
 * @param state - The editor state to mutate
 * @param newTask - The scene captioning task to add
 */
export const addSceneCaptioningTask = ({
	state,
	newTask,
}: {
	state: EditorState;
	newTask: SceneCaptioningTask;
}): void => {
	state.sceneCaptioningTasks = [newTask, ...state.sceneCaptioningTasks];
};

/**
 * Updates the status of a specific scene captioning task.
 * Used when a scene captioning task progresses (e.g., from "processing" to "done" or "error").
 *
 * @param state - The editor state to mutate
 * @param taskId - The ID of the task to update
 * @param newStatus - The new status to set
 */
export const updateSceneCaptioningTask = ({
	state,
	taskId,
	newStatus,
}: {
	state: EditorState;
	taskId: string;
	newStatus: SceneCaptioningTaskStatus;
}): void => {
	const taskIndex = state.sceneCaptioningTasks.findIndex(
		(task) => task.id === taskId,
	);

	if (taskIndex !== -1) {
		state.sceneCaptioningTasks[taskIndex] = {
			...state.sceneCaptioningTasks[taskIndex],
			status: newStatus,
		};
	}
};

/**
 * Deletes a specific scene captioning task from the list.
 * Used when user manually dismisses/removes a scene captioning task.
 *
 * @param state - The editor state to mutate
 * @param taskId - The ID of the task to delete
 */
export const deleteSceneCaptioningTask = ({
	state,
	taskId,
}: {
	state: EditorState;
	taskId: string;
}): void => {
	const newTasks = state.sceneCaptioningTasks.filter(
		(task) => task.id !== taskId,
	);
	if (newTasks.length === state.sceneCaptioningTasks.length) {
		return;
	}

	state.sceneCaptioningTasks = newTasks;
};

/**
 * Checks if a scene captioning task can be cleared (removed from history).
 * A task can be cleared if it's in a finalized state (completed successfully or failed).
 *
 * @param task - The scene captioning task to check
 * @returns true if the task status is 'done' or 'error', false otherwise
 */
export const canClearSceneCaptioningTask = (task: SceneCaptioningTask) => {
	return task.status.type === 'done' || task.status.type === 'error';
};
