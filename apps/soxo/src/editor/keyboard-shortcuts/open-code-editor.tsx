import React from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';

/**
 * Keyboard shortcut to open code editor for selected code item
 * CMD+I (Mac) or Ctrl+I (Windows/Linux)
 */
export const OpenCodeEditorShortcut: React.FC = () => {
	useHotkeys(
		'mod+i',
		(e) => {
			e.preventDefault();

			const selectedItems = useUIStore.getState().selectedItems;
			const items = useEditorStore.getState().compositionState.items;

			// Check if exactly one item is selected and it's a code item
			if (selectedItems.length !== 1) {
				return;
			}

			const selectedItemId = selectedItems[0];
			const selectedItem = items[selectedItemId];

			if (selectedItem?.type === 'code') {
				// Open the code editor for this item
				useUIStore.getState().setCodeEditorOpenForItemId(selectedItemId);
			}
		},
		{
			enableOnFormTags: false, // Don't trigger in input fields
			preventDefault: true,
		},
	);

	return null;
};
