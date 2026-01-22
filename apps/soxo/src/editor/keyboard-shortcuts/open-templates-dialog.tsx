import React from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import useUIStore from '../../zustand/ui-store';

/**
 * Keyboard shortcut to open templates dialog
 * CMD+P (Mac) or Ctrl+P (Windows/Linux)
 */
export const OpenTemplatesDialogShortcut: React.FC = () => {
	useHotkeys(
		'mod+p',
		(e) => {
			e.preventDefault();
			const currentState = useUIStore.getState().isTemplatesDialogOpen;
			useUIStore.getState().setTemplatesDialogOpen(!currentState);
		},
		{
			enableOnFormTags: false, // Don't trigger in input fields
			preventDefault: true,
		},
	);

	return null;
};
