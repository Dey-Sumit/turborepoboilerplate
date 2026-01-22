import useUIStore from '../../../zustand/ui-store';
import {TextItemHoverPreview} from '../../items/text/override-text-item-with-hover-preview';

/**
 * Sets or clears the text item hover preview state.
 * Used when hovering over font options in the inspector to show a live preview.
 *
 * @param hoverPreview - The hover preview state to set, or null to clear
 */
export const setTextItemHoverPreview = (
	hoverPreview: TextItemHoverPreview | null,
): void => {
	const uiState = useUIStore.getState();
	if (hoverPreview === uiState.textItemHoverPreview) {
		return;
	}

	uiState.setTextItemHoverPreview(hoverPreview);
};
