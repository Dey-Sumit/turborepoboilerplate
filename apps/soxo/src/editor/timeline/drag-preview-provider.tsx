// MIGRATED TO ZUSTAND UI STORE
// This file now only exports types for backwards compatibility
// The actual state management has been moved to ui-store.ts
// Use useDragPreview() and useSetDragPreview() from ui-store.ts instead

import {TrackInsertions} from './utils/drag/types';
import {SnapPoint} from './utils/snap-points';

export type PreviewPosition = {
	id: string;
	trackIndex: number;
	from: number;
	durationInFrames: number;
};

export type DragPreviewState = {
	positions: PreviewPosition[];
	trackInsertions: TrackInsertions | null;
	itemsBeingDragged: string[];
	snapPoint: SnapPoint | null;
};
