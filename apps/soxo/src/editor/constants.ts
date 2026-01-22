import {EditorStarterItem} from './items/item-type';

export const MIN_TIMELINE_ZOOM = 0;
export const MAX_TIMELINE_WIDTH = 40_000; // want higher max zoom? increase this value

export const PLAYHEAD_WIDTH = 19;

// Make enough space for the playhead to be visible, and add some more padding so it is not glued to the left edge
export const TIMELINE_HORIZONTAL_PADDING = Math.ceil(PLAYHEAD_WIDTH / 2) + 5;

export const scrollbarStyle: React.CSSProperties = {
	scrollbarWidth: 'thin',
	scrollbarColor:
		'var(--color-editor-starter-scrollbar-thumb) var(--color-editor-starter-scrollbar-track)',
};

export const ITEM_COLORS: Record<EditorStarterItem['type'], string> = {
	image: 'linear-gradient(135deg, #c026d3 0%, #d946ef 100%)',
	gif: '#3A7A44',
	text: 'linear-gradient(135deg, #a16207 0%, #ca8a04 100%)',
	video: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
	solid: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
	audio: 'linear-gradient(90deg, #db2777 0%, #ec4899 100%)',
	captions: '#347EBF',
	composite: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
	code: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
	shape: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan gradient for shapes
};

export const ITEM_BORDERS: Record<EditorStarterItem['type'], string> = {
	image: '#000000',
	gif: '#000000',
	text: '#000000',
	video: '#000000',
	audio: '#000000',
	captions: '#000000',
	solid: '#000000',
	composite: '#000000',
	code: '#000000',
	shape: '#000000',
	// solid: '#a855f7',
	// composite: '#22c55e',
	// code: '#c2410c',
};

export const DEFAULT_COMPOSITION_WIDTH = 1080;
export const DEFAULT_COMPOSITION_HEIGHT = 1920;
export const DEFAULT_FPS = 30;

export const SCROLL_EDGE_THRESHOLD = 200; // px from edge that activates auto-scroll
export const MAX_AUTOSCROLL_SPEED = 10;

export const MAX_FADE_DURATION_SECONDS = Infinity;

// Timeline snapping
// Default pixel threshold used when evaluating proximity to snap points.
export const DEFAULT_TIMELINE_SNAPPING_THRESHOLD_PIXELS = 5;

// Canvas snapping
// Default pixel threshold for canvas snap targets (edges + center)
export const CANVAS_SNAP_THRESHOLD_PIXELS = 10;
// Color for canvas snap indicator guide lines
export const CANVAS_SNAP_INDICATOR_COLOR = '#FF00FF';
// Line width for canvas snap indicators
export const CANVAS_SNAP_LINE_WIDTH = 0.5;

export const DEFAULT_TRANSITION_DURATION_IN_FRAMES = 30;
