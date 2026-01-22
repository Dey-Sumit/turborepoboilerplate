import useUIStore from '../../../zustand/ui-store';
import {getCanCrop, getCropFromItem} from '../../utils/get-crop-from-item';
import {getCurrentItems} from '../helpers/get-current-timeline';
import {EditorState} from '../types';
import {changeItem} from './change-item';

/**
 * Set the item selected for crop mode
 * This now calls ui-store directly since crop mode is UI state (non-undoable)
 */
export const selectItemForCrop = ({itemId}: {itemId: string}): void => {
	useUIStore.getState().setItemSelectedForCrop(itemId);
};

// This function handles the following scenario:
// 1. An item is being double-clicked to enable crop UI
// 2. The item is being dragged and moved leading to negative crop values during editing (this is also supported by Figma)
// 3. Crop mode is being exited, now crop values are set to reasonable non-negative values
// See: https://remotion.dev/docs/editor-starter/cropping#negative-crop-values

export const resetItemCropToNonNegative = (state: EditorState): void => {
	const itemId = useUIStore.getState().itemSelectedForCrop;
	if (!itemId) {
		return;
	}

	changeItem(state, itemId, (i) => {
		const crop = getCropFromItem(i);
		if (!crop) {
			throw new Error('Item cannot be cropped');
		}

		const newCropLeft = Math.max(0, crop.cropLeft);
		const newCropTop = Math.max(0, crop.cropTop);
		const newCropRight = Math.max(0, crop.cropRight);
		const newCropBottom = Math.max(0, crop.cropBottom);

		if (
			newCropLeft === crop.cropLeft &&
			newCropTop === crop.cropTop &&
			newCropRight === crop.cropRight &&
			newCropBottom === crop.cropBottom
		) {
			return i;
		}

		return {
			...i,
			cropLeft: newCropLeft,
			cropTop: newCropTop,
			cropRight: newCropRight,
			cropBottom: newCropBottom,
		};
	});
};

// Immer versions - mutate state directly
export const updateCropLeft = ({
	state,
	itemId,
	cropLeft,
}: {
	state: EditorState;
	itemId: string;
	cropLeft: number;
}): void => {
	const items = getCurrentItems(state);
	const existingItem = items[itemId];
	if (!existingItem || !getCanCrop(existingItem)) {
		throw new Error('Item cannot be cropped');
	}

	if (existingItem.cropLeft !== cropLeft) {
		items[itemId] = {
			...existingItem,
			cropLeft,
		};
	}
};

export const updateCropTop = ({
	state,
	itemId,
	cropTop,
}: {
	state: EditorState;
	itemId: string;
	cropTop: number;
}): void => {
	const items = getCurrentItems(state);
	const existingItem = items[itemId];
	if (!existingItem || !getCanCrop(existingItem)) {
		throw new Error('Item cannot be cropped');
	}

	if (existingItem.cropTop !== cropTop) {
		items[itemId] = {
			...existingItem,
			cropTop,
		};
	}
};

export const updateCropRight = ({
	state,
	itemId,
	cropRight,
}: {
	state: EditorState;
	itemId: string;
	cropRight: number;
}): void => {
	const items = getCurrentItems(state);
	const existingItem = items[itemId];
	if (!existingItem || !getCanCrop(existingItem)) {
		throw new Error('Item cannot be cropped');
	}

	if (existingItem.cropRight !== cropRight) {
		items[itemId] = {
			...existingItem,
			cropRight,
		};
	}
};

export const updateCropBottom = ({
	state,
	itemId,
	cropBottom,
}: {
	state: EditorState;
	itemId: string;
	cropBottom: number;
}): void => {
	const items = getCurrentItems(state);
	const existingItem = items[itemId];
	if (!existingItem || !getCanCrop(existingItem)) {
		throw new Error('Item cannot be cropped');
	}

	if (existingItem.cropBottom !== cropBottom) {
		items[itemId] = {
			...existingItem,
			cropBottom,
		};
	}
};
