import useUIStore from '../../../zustand/ui-store';
import {SnapPoint} from '../../timeline/utils/snap-points';
import {EditorState} from '../types';

export const applySnapPoint = ({
	state,
	snapPoint,
}: {
	state: EditorState;
	snapPoint: SnapPoint | null;
}): EditorState => {
	const currentSnapPoint = useUIStore.getState().activeSnapPoint;

	if (currentSnapPoint?.frame === snapPoint?.frame) {
		return state;
	}

	// Update Zustand store
	useUIStore.getState().setActiveSnapPoint(snapPoint);

	return state;
};
