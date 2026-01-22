import useUIStore from '../../../zustand/ui-store';

/**
 * Set snapping enabled state
 * This now calls ui-store directly since snapping is UI state (non-undoable)
 */
export const setSnappingEnabled = (enabled: boolean): void => {
	const uiState = useUIStore.getState();
	if (uiState.isSnappingEnabled === enabled) {
		return;
	}

	// Clear active snap point when disabling to avoid stale indicators
	if (!enabled) {
		uiState.setActiveSnapPoint(null);
	}

	uiState.setIsSnappingEnabled(enabled);
};

/**
 * Toggle snapping enabled state
 */
export const toggleSnapping = (): void => {
	const currentState = useUIStore.getState().isSnappingEnabled;
	setSnappingEnabled(!currentState);
};
