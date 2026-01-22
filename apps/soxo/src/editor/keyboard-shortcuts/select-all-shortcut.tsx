import React, {useEffect} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {setSelectedItems} from '../state/actions/set-selected-items';
import {isEventTargetInputElement} from '../utils/is-event-target-input-element';
import {useItemIds} from '../selectors/hooks';

export const SelectAllShortcut: React.FC = () => {
	// Performance optimization: only subscribe to item IDs, not full items
	// This prevents re-renders when ANY item property changes
	const itemIds = useItemIds();
	const setState = useEditorStore((state) => state.setState);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// do not trigger if the target is an input
			if (isEventTargetInputElement(e)) {
				return;
			}

			// Select All: Cmd+A (Mac) or Ctrl+A (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
				e.preventDefault();

				setState((state) => {
					setSelectedItems(state, itemIds);
				});
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [itemIds, setState]);

	return null;
};
