export const isEventTargetInputElement = (
	e: KeyboardEvent | ClipboardEvent,
) => {
	const target = e.target as HTMLElement | null;
	if (!target) {
		return false;
	}

	// Check for standard input elements
	if (
		(target instanceof HTMLInputElement && target.type !== 'range') ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	) {
		return true;
	}

	// Check if target is inside Monaco editor (Monaco uses contenteditable divs)
	// Monaco editor containers have class 'monaco-editor' or contain elements with 'monaco-mouse-cursor-text'
	let element: HTMLElement | null = target;
	while (element) {
		// Check for Monaco editor classes
		if (
			element.classList.contains('monaco-editor') ||
			element.classList.contains('monaco-mouse-cursor-text') ||
			element.closest('.monaco-editor')
		) {
			return true;
		}
		// Check if element is contenteditable (Monaco uses this)
		if (element.contentEditable === 'true') {
			return true;
		}
		element = element.parentElement;
	}

	return false;
};
