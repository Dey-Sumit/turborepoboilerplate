import {
	DEFAULT_COMPOSITION_HEIGHT,
	DEFAULT_COMPOSITION_WIDTH,
	DEFAULT_FPS,
} from '../constants';
import {EditorState, TrackType, compositionState} from './types';

/**
 * This is the initial state of the timeline.
 * It's here to show you how to initialize the timeline with data.
 * You can change the shape of the data to fit your needs.
 */
const defaultInitialTracks: TrackType[] = [];

const defaultInitialState: compositionState = {
	tracks: defaultInitialTracks,
	fps: DEFAULT_FPS,
	compositionWidth: DEFAULT_COMPOSITION_WIDTH,
	compositionHeight: DEFAULT_COMPOSITION_HEIGHT,
	items: {},
	assets: {},
	deletedAssets: [],
	timelineViewStack: [{type: 'ROOT'}],
};

export const getInitialState = (): EditorState => {
	return {
		// selectedItems: MIGRATED TO ZUSTAND UI STORE
		// itemSelectedForCrop: MIGRATED TO ZUSTAND UI STORE
		// textItemHoverPreview: MIGRATED TO ZUSTAND UI STORE
		// textItemEditing: MIGRATED TO ZUSTAND UI STORE
		compositionState: defaultInitialState,
		renderingTasks: [],
		captioningTasks: [],
		sceneCaptioningTasks: [],
		initialized: false,
		// itemsBeingTrimmed: MIGRATED TO ZUSTAND UI STORE
		// loop: MIGRATED TO ZUSTAND UI STORE
		assetStatus: {},
		// timelineHeight: MIGRATED TO ZUSTAND UI STORE
		// isSnappingEnabled: MIGRATED TO ZUSTAND UI STORE
		// activeSnapPoint: MIGRATED TO ZUSTAND UI STORE
		// activeCanvasSnapPoints: MIGRATED TO ZUSTAND UI STORE
	};
};
