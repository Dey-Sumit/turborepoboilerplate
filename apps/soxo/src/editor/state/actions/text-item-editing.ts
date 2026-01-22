import useUIStore from '../../../zustand/ui-store';

/**
 * Marks a text item as being edited (shows the text editor)
 */
export const markTextAsEditing = (itemId: string): void => {
	const uiState = useUIStore.getState();
	if (uiState.textItemEditing !== itemId) {
		uiState.setTextItemEditing(itemId);
	}
};

/**
 * Unmarks the currently editing text item (hides the text editor)
 */
export const unmarkTextAsEditing = (): void => {
	const uiState = useUIStore.getState();
	if (uiState.textItemEditing !== null) {
		uiState.setTextItemEditing(null);
	}
};
