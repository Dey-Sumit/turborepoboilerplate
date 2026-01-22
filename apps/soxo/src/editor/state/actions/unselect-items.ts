import useUIStore from '../../../zustand/ui-store';
import {EditorState} from '../types';
import {resetItemCropToNonNegative} from './item-cropping';

// Immer versions - mutate state directly
export const unselectItems = (_state: EditorState): void => {
	const currentSelectedItems = useUIStore.getState().selectedItems;

	if (currentSelectedItems.length === 0) {
		return;
	}

	// Clear selection in Zustand store
	useUIStore.getState().clearSelection();
};

export const unselectItemsOrDisableCropUI = (state: EditorState): void => {
	const currentSelectedItems = useUIStore.getState().selectedItems;

	if (currentSelectedItems.length === 0) {
		return;
	}

	// If the cropping UI is enabled,
	// we disable it on the first unselect
	// and has to click again to deselect item
	const itemSelectedForCrop = useUIStore.getState().itemSelectedForCrop;
	if (itemSelectedForCrop) {
		resetItemCropToNonNegative(state);
		useUIStore.getState().setItemSelectedForCrop(null);
	}

	// Clear selection in Zustand store
	useUIStore.getState().clearSelection();
};
