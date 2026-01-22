import React, {useEffect} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {FEATURE_DELETE_SHORTCUT} from '../flags';
import {deleteItems} from '../state/actions/delete-items';
import {isEventTargetInputElement} from '../utils/is-event-target-input-element';
import {useSelectedItems} from '../utils/use-context';

export const BackspaceToDelete: React.FC = () => {
	const {selectedItems} = useSelectedItems();
	const setState = useEditorStore((state) => state.setState);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// do not trigger if the target is an input
			if (isEventTargetInputElement(e)) {
				return;
			}

			if (
				(e.key === 'Backspace' || e.key === 'Delete') &&
				FEATURE_DELETE_SHORTCUT &&
				selectedItems.length > 0
			) {
				setState((state) => deleteItems(state, selectedItems));
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [selectedItems, setState]);

	return null;
};
