import React, {useEffect} from 'react';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';
import {duplicateItems} from '../state/actions/duplicate-items';
import {isEventTargetInputElement} from '../utils/is-event-target-input-element';

export const DuplicateLayers: React.FC = () => {
	const setState = useEditorStore((state) => state.setState);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// do not trigger if the target is an input
			if (isEventTargetInputElement(e)) {
				return;
			}

			const commandKey = window.navigator.platform.startsWith('Mac')
				? e.metaKey
				: e.ctrlKey;

			// Read selectedItems fresh from Zustand store at event time
			const selectedItems = useUIStore.getState().selectedItems;

			if (e.key === 'd' && commandKey && selectedItems.length > 0) {
				e.preventDefault();

				setState((state) => {
					const duplicatedIds = duplicateItems(state, selectedItems);
					// Update selection immediately after duplication
					useUIStore.getState().setSelectedItems(duplicatedIds);
				});
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [setState]);

	return null;
};
