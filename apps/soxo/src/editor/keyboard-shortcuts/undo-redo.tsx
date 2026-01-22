import React from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import useEditorStore from '../../zustand/editor-store';
import {FEATURE_REDO_SHORTCUT, FEATURE_UNDO_SHORTCUT} from '../flags';

export const UndoRedo: React.FC = () => {
	// Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
	useHotkeys(
		'mod+z',
		(e) => {
			if (!FEATURE_UNDO_SHORTCUT) return;
			e.preventDefault();
			const {undo} = useEditorStore.temporal.getState();
			undo();
		},
		{
			enableOnFormTags: false, // Don't trigger in input fields
			preventDefault: true,
		},
	);

	// Redo: Cmd+Y (Mac) or Ctrl+Y (Windows/Linux)
	useHotkeys(
		'mod+y',
		(e) => {
			if (!FEATURE_REDO_SHORTCUT) return;
			e.preventDefault();
			const {redo} = useEditorStore.temporal.getState();
			redo();
		},
		{
			enableOnFormTags: false,
			preventDefault: true,
		},
	);

	return null;
};
