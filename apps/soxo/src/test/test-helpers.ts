import {EditorStarterItem} from '../editor/items/item-type';
import {SolidItem} from '../editor/items/solid/solid-item-type';
import {TextItem} from '../editor/items/text/text-item-type';
import {EditorState, TrackType, compositionState} from '../editor/state/types';

/**
 * Creates a minimal mock SolidItem for testing
 */
export const createMockSolidItem = (
	overrides: Partial<SolidItem> = {},
): SolidItem => ({
	id: 'test-solid-1',
	type: 'solid',
	trackId: 'track-1',
	durationInFrames: 90,
	from: 0,
	top: 0,
	left: 0,
	width: 1080,
	height: 1920,
	opacity: 1,
	isDraggingInTimeline: false,
	transition: {},
	color: '#ffffff',
	borderRadius: 0,
	rotation: 0,
	keepAspectRatio: false,
	fadeInDurationInSeconds: 0,
	fadeOutDurationInSeconds: 0,
	...overrides,
});

/**
 * Creates a minimal mock TextItem for testing
 */
export const createMockTextItem = (
	overrides: Partial<TextItem> = {},
): TextItem => ({
	id: 'test-text-1',
	type: 'text',
	trackId: 'track-1',
	durationInFrames: 90,
	from: 0,
	top: 100,
	left: 100,
	width: 500,
	height: 100,
	opacity: 1,
	isDraggingInTimeline: false,
	transition: {},
	text: 'Test Text',
	color: '#000000',
	align: 'left',
	fontFamily: 'Inter',
	fontStyle: {variant: 'normal', weight: '400'},
	fontSize: 48,
	lineHeight: 1.2,
	letterSpacing: 0,
	resizeOnEdit: true,
	direction: 'ltr',
	strokeWidth: 0,
	strokeColor: '#000000',
	fadeInDurationInSeconds: 0,
	fadeOutDurationInSeconds: 0,
	background: null,
	rotation: 0,
	...overrides,
});

/**
 * Creates a minimal mock Track for testing
 */
export const createMockTrack = (
	overrides: Partial<TrackType> = {},
): TrackType => ({
	id: 'track-1',
	items: [],
	hidden: false,
	muted: false,
	...overrides,
});

/**
 * Creates a minimal mock compositionState for testing
 */
export const createMockCompositionState = (
	overrides: Partial<compositionState> = {},
): compositionState => ({
	tracks: [],
	assets: {},
	items: {},
	fps: 30,
	compositionWidth: 1080,
	compositionHeight: 1920,
	deletedAssets: [],
	timelineViewStack: [{type: 'ROOT'}],
	compositionRootStyles: {},
	...overrides,
});

/**
 * Creates a minimal mock EditorState for testing
 */
export const createMockEditorState = (
	overrides: Partial<EditorState> = {},
): EditorState => ({
	compositionState: createMockCompositionState(),
	renderingTasks: [],
	captioningTasks: [],
	sceneCaptioningTasks: [],
	initialized: true,
	assetStatus: {},
	...overrides,
});

/**
 * Creates an EditorState with pre-configured tracks and items for testing
 */
export const createMockStateWithItems = (
	items: EditorStarterItem[],
): EditorState => {
	const itemsRecord: Record<string, EditorStarterItem> = {};
	const tracks: TrackType[] = [];

	// Group items by trackId
	const itemsByTrack = new Map<string, string[]>();

	items.forEach((item) => {
		itemsRecord[item.id] = item;

		if (item.trackId) {
			if (!itemsByTrack.has(item.trackId)) {
				itemsByTrack.set(item.trackId, []);
			}
			itemsByTrack.get(item.trackId)!.push(item.id);
		}
	});

	// Create tracks
	itemsByTrack.forEach((itemIds, trackId) => {
		tracks.push(createMockTrack({id: trackId, items: itemIds}));
	});

	return createMockEditorState({
		compositionState: createMockCompositionState({
			items: itemsRecord,
			tracks,
		}),
	});
};
