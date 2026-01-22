import useUIStore from '../../../zustand/ui-store';
import {ItemSide} from '../../items/trim-indicator';
import {EditorState} from '../types';

export const markItemAsBeingTrimmed = ({
	state: _state,
	itemId,
	side,
	maxDurationInFrames,
	minFrom,
	trackIndex,
	top,
	height,
}: {
	state: EditorState;
	itemId: string;
	side: ItemSide;
	maxDurationInFrames: number | null;
	minFrom: number | null;
	trackIndex: number;
	top: number;
	height: number;
}): void => {
	let currentItemsBeingTrimmed = useUIStore.getState().itemsBeingTrimmed;

	for (const item of currentItemsBeingTrimmed) {
		if (item.itemId === itemId) {
			if (
				item.maxDurationInFrames === maxDurationInFrames &&
				item.minFrom === minFrom &&
				item.side === side
			) {
				return;
			} else {
				currentItemsBeingTrimmed = currentItemsBeingTrimmed.filter(
					(i) => i.itemId !== itemId,
				);
			}
		}
	}

	useUIStore.getState().setItemsBeingTrimmed([
		...currentItemsBeingTrimmed,
		{itemId, side, maxDurationInFrames, minFrom, trackIndex, top, height},
	]);
};

export const unmarkItemAsBeingTrimmed = ({
	state: _state,
	itemId,
}: {
	state: EditorState;
	itemId: string;
}): void => {
	const currentItemsBeingTrimmed = useUIStore
		.getState()
		.itemsBeingTrimmed.find((item) => item.itemId === itemId);

	if (!currentItemsBeingTrimmed) {
		return;
	}

	useUIStore
		.getState()
		.setItemsBeingTrimmed(
			useUIStore.getState().itemsBeingTrimmed.filter((item) => item.itemId !== itemId),
		);
};
