import React from 'react';

export type BackgroundPresetType = 'solid' | 'gradient' | 'image';

export type BackgroundPreset = {
	id: string;
	name: string;
	type: BackgroundPresetType;
	/**
	 * CSS styles to apply to the composition root.
	 * This is what gets stored in compositionRootStyles.
	 */
	styles: React.CSSProperties;
	/**
	 * Preview-specific styles (same as styles, but can be overridden for thumbnail display).
	 */
	previewStyles?: React.CSSProperties;
};

/**
 * Predefined background presets for the canvas composition.
 * Organized in a 3x3 grid: 3 solids, 3 gradients, 3 images/patterns.
 */
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
	// Row 1: Solid colors
	{
		id: 'solid-black',
		name: 'Black',
		type: 'solid',
		styles: {
			backgroundColor: '#000000',
		},
	},
	{
		id: 'solid-white',
		name: 'White',
		type: 'solid',
		styles: {
			backgroundColor: '#ffffff',
		},
	},
	{
		id: 'solid-dark-gray',
		name: 'Dark Gray',
		type: 'solid',
		styles: {
			backgroundColor: '#1a1a1a',
		},
	},

	// Row 2: Gradients
	{
		id: 'gradient-sunset',
		name: 'Sunset',
		type: 'gradient',
		styles: {
			background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
		},
	},
	{
		id: 'gradient-ocean',
		name: 'Ocean',
		type: 'gradient',
		styles: {
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		},
	},
	{
		id: 'gradient-forest',
		name: 'Forest',
		type: 'gradient',
		styles: {
			background:
				'radial-gradient(125% 125% at 50% 10%, #072607 10%, #000000 100%)',
		},
	},

	// Row 3: Patterns / Image-like backgrounds
	{
		id: 'gradient-aurora',
		name: 'Aurora',
		type: 'gradient',
		styles: {
			background:
				'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
		},
	},
	{
		id: 'gradient-neon',
		name: 'Neon',
		type: 'gradient',
		styles: {
			background: 'linear-gradient(90deg, #fc466b 0%, #3f5efb 100%)',
		},
	},
	{
		id: 'gradient-midnight',
		name: 'Midnight',
		type: 'gradient',
		styles: {
			background:
				'radial-gradient(ellipse at bottom, #1b2838 0%, #090a0f 100%)',
		},
	},
];

/**
 * Placeholder for future background configuration.
 * This structure will be used when we add custom background support.
 */
export type CompositionBackground = {
	color?: string;
	gradient?: {
		colors: string[];
		angle?: number;
		type?: 'linear' | 'radial';
	};
	image?: string;
	activeType: BackgroundPresetType;
};

/**
 * Default background configuration (placeholder for future use).
 */
export const DEFAULT_COMPOSITION_BACKGROUND: CompositionBackground = {
	color: '#000000',
	activeType: 'solid',
};
