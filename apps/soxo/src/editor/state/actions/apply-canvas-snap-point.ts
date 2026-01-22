import useUIStore from '../../../zustand/ui-store';
import {CanvasSnapPoint} from '../../canvas/snap/canvas-snap-types';
import {EditorState} from '../types';

export const applyCanvasSnapPoints = ({
	state,
	snapPoints,
}: {
	state: EditorState;
	snapPoints: CanvasSnapPoint[];
}): EditorState => {
	const currentSnapPoints = useUIStore.getState().activeCanvasSnapPoints;

	// Avoid unnecessary state updates if snap points haven't changed
	if (currentSnapPoints.length === 0 && snapPoints.length === 0) {
		return state;
	}

	// Update Zustand store
	useUIStore.getState().setActiveCanvasSnapPoints(snapPoints);

	return state;
};

export const clearCanvasSnapPoints = (state: EditorState): EditorState => {
	const currentSnapPoints = useUIStore.getState().activeCanvasSnapPoints;

	if (currentSnapPoints.length === 0) {
		return state;
	}

	// Update Zustand store
	useUIStore.getState().setActiveCanvasSnapPoints([]);

	return state;
};
