import React, {useEffect} from 'react';
import {toggleSnapping} from '../state/actions/toggle-snapping';
import {isEventTargetInputElement} from '../utils/is-event-target-input-element';

export const SnappingShortcut: React.FC = () => {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Avoid capturing typing and system shortcuts in inputs
			if (isEventTargetInputElement(e)) {
				return;
			}

			// Toggle snapping on Shift+M
			if (e.shiftKey && e.code === 'KeyM') {
				e.preventDefault();
				toggleSnapping();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return null;
};
