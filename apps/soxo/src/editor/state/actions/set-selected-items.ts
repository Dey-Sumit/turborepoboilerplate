import useUIStore from '../../../zustand/ui-store';
import {EditorState} from '../types';
import {resetItemCropToNonNegative} from './item-cropping';

const isSameItems = (items1: string[], items2: string[]): boolean => {
	if (items1.length !== items2.length) {
		return false;
	}

	for (const item of items1) {
		if (!items2.includes(item)) {
			return false;
		}
	}

	return true;
};

// Immer version - mutates state directly
export const setSelectedItems = (
	state: EditorState,
	selectedItems: string[],
): void => {
	const currentSelectedItems = useUIStore.getState().selectedItems;
	const isSame = isSameItems(currentSelectedItems, selectedItems);

	if (!isSame) {
		// Update Zustand store
		useUIStore.getState().setSelectedItems(selectedItems);
	}

	// https://www.remotion.dev/docs/editor-starter/cropping#negative-crop-values
	resetItemCropToNonNegative(state);

	useUIStore.getState().setItemSelectedForCrop(null);
};
