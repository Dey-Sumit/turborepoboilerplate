/**
 * Default item properties based on canvas size
 * Canvas size key format: "w{width}xh{height}" (e.g., "w1080xh1920" for portrait, "w1920xh1080" for landscape)
 */

export type CanvasSizeKey = 'w1080xh1920' | 'w1920xh1080';

export type CodeItemDefaults = {
	fontSize: number;
	durationInFrames: number;
	padding: number;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ImageItemDefaults = {
	// Will be added later
};

export type CanvasSizeItemDefaults = {
	codeItem: CodeItemDefaults;
	imageItem?: ImageItemDefaults;
};

/**
 * Map of canvas size to default item properties
 * - w1080xh1920: Portrait (9:16) - typical for TikTok, Reels, Shorts
 * - w1920xh1080: Landscape (16:9) - typical for YouTube, standard video
 */
export const CANVAS_SIZE_DEFAULTS: Record<CanvasSizeKey, CanvasSizeItemDefaults> = {
	// Portrait mode (1080x1920) - smaller font, more padding for mobile viewing
	'w1080xh1920': {
		codeItem: {
			fontSize: 22,
			durationInFrames: 60, // 2 seconds at 30fps
			padding: 24,
		},
	},
	// Landscape mode (1920x1080) - larger font for desktop viewing
	'w1920xh1080': {
		codeItem: {
			fontSize: 28,
			durationInFrames: 60, // 2 seconds at 30fps
			padding: 32,
		},
	},
};

/**
 * Get canvas size key from width and height
 */
export const getCanvasSizeKey = (width: number, height: number): CanvasSizeKey | null => {
	const key = `w${width}xh${height}` as CanvasSizeKey;
	if (key in CANVAS_SIZE_DEFAULTS) {
		return key;
	}
	return null;
};

/**
 * Get default code item properties based on canvas size
 * Falls back to portrait defaults if size is not found
 */
export const getCodeItemDefaults = (width: number, height: number): CodeItemDefaults => {
	const key = getCanvasSizeKey(width, height);
	if (key) {
		return CANVAS_SIZE_DEFAULTS[key].codeItem;
	}
	// Fallback to portrait defaults
	return CANVAS_SIZE_DEFAULTS['w1080xh1920'].codeItem;
};
