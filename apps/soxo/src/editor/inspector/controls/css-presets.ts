/**
 * CSS Effect Presets for quick styling.
 * Each preset applies CSS to enhance image/video appearance.
 */

export type CssPresetCategory = 'overlay' | 'shadow' | 'border' | 'filter';

export type CssPreset = {
	id: string;
	name: string;
	category: CssPresetCategory;
	/**
	 * CSS string to apply to the item.
	 * Will be added to existing CSS.
	 */
	css: string;
	/**
	 * Optional description for tooltip.
	 */
	description?: string;
};

/**
 * Predefined CSS effect presets.
 */
export const CSS_PRESETS: CssPreset[] = [
	// Overlay presets
	{
		id: 'overlay-dark',
		name: 'Dark Overlay',
		category: 'overlay',
		css: 'box-shadow: inset 0 0 0 2000px rgba(0, 0, 0, 0.4);',
		description: 'Add dark semi-transparent overlay',
	},
	{
		id: 'overlay-light',
		name: 'Light Overlay',
		category: 'overlay',
		css: 'box-shadow: inset 0 0 0 2000px rgba(255, 255, 255, 0.3);',
		description: 'Add light semi-transparent overlay',
	},
	{
		id: 'overlay-vignette',
		name: 'Vignette',
		category: 'overlay',
		css: 'box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.5);',
		description: 'Darken edges for focus effect',
	},
	{
		id: 'overlay-gradient',
		name: 'Gradient',
		category: 'overlay',
		css: 'box-shadow: inset 0 -100px 100px -50px rgba(0, 0, 0, 0.7);',
		description: 'Bottom gradient fade',
	},

	// Shadow presets
	{
		id: 'shadow-soft',
		name: 'Soft Shadow',
		category: 'shadow',
		css: 'filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));',
		description: 'Subtle drop shadow',
	},
	{
		id: 'shadow-hard',
		name: 'Hard Shadow',
		category: 'shadow',
		css: 'filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.8));',
		description: 'Strong drop shadow',
	},
	{
		id: 'shadow-glow-white',
		name: 'White Glow',
		category: 'shadow',
		css: 'filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));',
		description: 'White glow effect',
	},
	{
		id: 'shadow-neon',
		name: 'Neon Glow',
		category: 'shadow',
		css: 'filter: drop-shadow(0 0 20px #00ffff) drop-shadow(0 0 40px #00ffff);',
		description: 'Bright neon glow',
	},

	// Border presets
	{
		id: 'border-white',
		name: 'White Border',
		category: 'border',
		css: 'border: 4px solid white;',
		description: 'Simple white border',
	},
	{
		id: 'border-black',
		name: 'Black Border',
		category: 'border',
		css: 'border: 4px solid black;',
		description: 'Simple black border',
	},
	{
		id: 'border-neon',
		name: 'Neon Border',
		category: 'border',
		css: 'border: 3px solid #00ffff; box-shadow: 0 0 10px #00ffff, inset 0 0 10px #00ffff;',
		description: 'Glowing neon border',
	},
	{
		id: 'border-double',
		name: 'Double Border',
		category: 'border',
		css: 'border: 5px double white;',
		description: 'Double line border',
	},

	// Filter presets
	{
		id: 'filter-grayscale',
		name: 'Grayscale',
		category: 'filter',
		css: 'filter: grayscale(100%);',
		description: 'Black and white',
	},
	{
		id: 'filter-sepia',
		name: 'Sepia',
		category: 'filter',
		css: 'filter: sepia(80%);',
		description: 'Vintage sepia tone',
	},
	{
		id: 'filter-high-contrast',
		name: 'High Contrast',
		category: 'filter',
		css: 'filter: contrast(150%) saturate(120%);',
		description: 'Boost contrast and saturation',
	},
	{
		id: 'filter-vintage',
		name: 'Vintage',
		category: 'filter',
		css: 'filter: sepia(50%) contrast(110%) brightness(90%);',
		description: 'Vintage film look',
	},
	{
		id: 'filter-blur',
		name: 'Blur',
		category: 'filter',
		css: 'filter: blur(3px);',
		description: 'Soft blur effect',
	},
	{
		id: 'filter-sharpen',
		name: 'Sharpen',
		category: 'filter',
		css: 'filter: contrast(120%) brightness(105%);',
		description: 'Enhanced sharpness',
	},
];

/**
 * Get presets by category.
 */
export function getPresetsByCategory(
	category: CssPresetCategory,
): CssPreset[] {
	return CSS_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Parse CSS string into a map of property -> Set of values.
 * For combinable properties (filter, transform, box-shadow), stores multiple values.
 */
function parseCssToMap(css: string): Map<string, Set<string>> {
	const map = new Map<string, Set<string>>();
	if (!css) return map;

	// Split by semicolons and process each declaration
	const declarations = css.split(';').filter((d) => d.trim());

	for (const declaration of declarations) {
		const colonIndex = declaration.indexOf(':');
		if (colonIndex === -1) continue;

		const property = declaration.slice(0, colonIndex).trim();
		const value = declaration.slice(colonIndex + 1).trim();

		if (property && value) {
			// For combinable properties, split by spaces and store each function separately
			if (
				property === 'filter' ||
				property === 'transform' ||
				property === 'box-shadow'
			) {
				if (!map.has(property)) {
					map.set(property, new Set());
				}
				// Split multiple functions (e.g., "blur(3px) grayscale(100%)")
				const functions = value.match(/[a-z-]+\([^)]+\)|[a-z-]+\s+[^,;]+/gi) || [
					value,
				];
				functions.forEach((fn) => map.get(property)!.add(fn.trim()));
			} else {
				// For other properties, store as single value
				if (!map.has(property)) {
					map.set(property, new Set());
				}
				map.get(property)!.clear(); // Clear previous value
				map.get(property)!.add(value);
			}
		}
	}

	return map;
}

/**
 * Convert CSS map back to string.
 */
function mapToCssString(map: Map<string, Set<string>>): string {
	const lines: string[] = [];
	for (const [property, valueSet] of map.entries()) {
		const values = Array.from(valueSet).join(' ');
		lines.push(`${property}: ${values};`);
	}
	return lines.join('\n');
}

/**
 * Apply a CSS preset to existing CSS.
 * Intelligently merges CSS properties:
 * - For filter, transform, box-shadow: adds unique values (no duplicates)
 * - For other properties: new value replaces old
 */
export function applyCssPreset(existingCss: string, preset: CssPreset): string {
	const existingMap = parseCssToMap(existingCss);
	const presetMap = parseCssToMap(preset.css);

	// Merge preset into existing
	for (const [property, presetValues] of presetMap.entries()) {
		if (
			property === 'filter' ||
			property === 'transform' ||
			property === 'box-shadow'
		) {
			// For combinable properties, add new values to existing set (Set automatically prevents duplicates)
			if (!existingMap.has(property)) {
				existingMap.set(property, new Set());
			}
			const existingSet = existingMap.get(property)!;
			presetValues.forEach((value) => existingSet.add(value));
		} else {
			// Replace or add the property
			existingMap.set(property, presetValues);
		}
	}

	return mapToCssString(existingMap);
}
