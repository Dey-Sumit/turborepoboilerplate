import React from 'react';

/**
 * Parse transform string into individual transform functions.
 * Handles transforms like "rotate(45deg) scale(1.2) translateX(10px)"
 */
function parseTransform(transformString: string): Map<string, string> {
	const transforms = new Map<string, string>();

	// Match transform functions: functionName(values)
	const regex = /(\w+)\(([^)]+)\)/g;
	let match;

	while ((match = regex.exec(transformString)) !== null) {
		const [, functionName, value] = match;
		transforms.set(functionName, value);
	}

	return transforms;
}

/**
 * Intelligently merge transform values.
 * For each transform type, applies appropriate merging strategy:
 * - rotate: Use last value (animations override)
 * - scale: Multiply values
 * - translate/translateX/translateY: Add values (compound movement)
 * - Other: Use last value
 */
function mergeTransforms(
	baseTransform: string | undefined,
	animationTransform: string | undefined,
): string | undefined {
	if (!baseTransform && !animationTransform) return undefined;
	if (!baseTransform) return animationTransform;
	if (!animationTransform) return baseTransform;

	const baseMap = parseTransform(baseTransform);
	const animMap = parseTransform(animationTransform);

	// Merge maps - animation transforms take precedence for most operations
	const merged = new Map<string, string>(baseMap);

	for (const [fn, value] of animMap.entries()) {
		if (fn === 'scale') {
			// For scale, multiply if both exist
			if (baseMap.has('scale')) {
				const baseScale = parseFloat(baseMap.get('scale')!);
				const animScale = parseFloat(value);
				merged.set('scale', String(baseScale * animScale));
			} else {
				merged.set('scale', value);
			}
		} else if (fn.startsWith('translate')) {
			// For translate, add values if both exist (compound movement)
			if (baseMap.has(fn)) {
				const baseVal = parseFloat(baseMap.get(fn)!);
				const animVal = parseFloat(value);
				// Preserve unit from animation value
				const unit = value.replace(/[\d.-]/g, '') || 'px';
				merged.set(fn, `${baseVal + animVal}${unit}`);
			} else {
				merged.set(fn, value);
			}
		} else {
			// For rotate and other transforms, animation overrides
			merged.set(fn, value);
		}
	}

	// Reconstruct transform string
	// Order: translate -> rotate -> scale (standard CSS order)
	const ordered: string[] = [];

	// Translate functions first
	if (merged.has('translateX')) ordered.push(`translateX(${merged.get('translateX')})`);
	if (merged.has('translateY')) ordered.push(`translateY(${merged.get('translateY')})`);
	if (merged.has('translate')) ordered.push(`translate(${merged.get('translate')})`);

	// Rotate
	if (merged.has('rotate')) ordered.push(`rotate(${merged.get('rotate')})`);

	// Scale
	if (merged.has('scale')) ordered.push(`scale(${merged.get('scale')})`);
	if (merged.has('scaleX')) ordered.push(`scaleX(${merged.get('scaleX')})`);
	if (merged.has('scaleY')) ordered.push(`scaleY(${merged.get('scaleY')})`);

	// Other transforms (skew, matrix, etc.)
	for (const [fn, value] of merged.entries()) {
		if (!['translateX', 'translateY', 'translate', 'rotate', 'scale', 'scaleX', 'scaleY'].includes(fn)) {
			ordered.push(`${fn}(${value})`);
		}
	}

	return ordered.length > 0 ? ordered.join(' ') : undefined;
}

/**
 * Safely merge opacity values with bounds checking.
 * Ensures result is never below minimum threshold or above 1.
 */
function mergeOpacity(
	baseOpacity: number | string | undefined,
	animationOpacity: number | string | undefined,
	minThreshold: number = 0.01, // Prevent completely invisible elements
): number | undefined {
	const base = typeof baseOpacity === 'number'
		? baseOpacity
		: baseOpacity
			? parseFloat(String(baseOpacity))
			: 1;

	const anim = typeof animationOpacity === 'number'
		? animationOpacity
		: animationOpacity
			? parseFloat(String(animationOpacity))
			: 1;

	// Multiply opacities
	let result = base * anim;

	// Clamp to valid range [minThreshold, 1]
	result = Math.max(minThreshold, Math.min(1, result));

	return result !== 1 ? result : undefined;
}

/**
 * Merge filter strings (concatenate, removing duplicates).
 */
function mergeFilters(
	baseFilter: string | undefined,
	animationFilter: string | undefined,
): string | undefined {
	if (!baseFilter && !animationFilter) return undefined;
	if (!baseFilter) return animationFilter;
	if (!animationFilter) return baseFilter;

	// Parse filters into map to deduplicate
	const filterMap = new Map<string, string>();

	const parseFilters = (filterStr: string) => {
		const regex = /(\w+)\(([^)]+)\)/g;
		let match;
		while ((match = regex.exec(filterStr)) !== null) {
			const [, name, value] = match;
			filterMap.set(name, value);
		}
	};

	parseFilters(baseFilter);
	parseFilters(animationFilter); // Animation filters override base

	// Reconstruct filter string
	const filters: string[] = [];
	for (const [name, value] of filterMap.entries()) {
		filters.push(`${name}(${value})`);
	}

	return filters.length > 0 ? filters.join(' ') : undefined;
}

/**
 * Intelligently merge animation styles with base styles.
 *
 * Merging strategy:
 * - Opacity: Multiply values with safety bounds
 * - Transform: Parse and intelligently combine (scale multiplies, translate adds, rotate overrides)
 * - Filter: Deduplicate and combine
 * - ClipPath: Animation takes precedence
 *
 * @param baseStyle - Base CSS properties
 * @param animationStyle - Animation CSS properties
 * @returns Merged CSS properties with intelligent conflict resolution
 */
export function mergeAnimationStyles(
	baseStyle: React.CSSProperties,
	animationStyle: React.CSSProperties,
): React.CSSProperties {
	if (Object.keys(animationStyle).length === 0) {
		return baseStyle;
	}

	const merged = {...baseStyle};

	// Merge opacity with safety bounds
	if (animationStyle.opacity !== undefined || baseStyle.opacity !== undefined) {
		const mergedOpacity = mergeOpacity(baseStyle.opacity, animationStyle.opacity);
		if (mergedOpacity !== undefined) {
			merged.opacity = mergedOpacity;
		}
	}

	// Merge transforms intelligently
	const mergedTransform = mergeTransforms(
		typeof baseStyle.transform === 'string' ? baseStyle.transform : undefined,
		typeof animationStyle.transform === 'string' ? animationStyle.transform : undefined,
	);
	if (mergedTransform) {
		merged.transform = mergedTransform;
	}

	// Merge filters
	const mergedFilter = mergeFilters(
		typeof baseStyle.filter === 'string' ? baseStyle.filter : undefined,
		typeof animationStyle.filter === 'string' ? animationStyle.filter : undefined,
	);
	if (mergedFilter) {
		merged.filter = mergedFilter;
	}

	// ClipPath: Animation takes precedence
	if (animationStyle.clipPath) {
		merged.clipPath = animationStyle.clipPath;
	}

	return merged;
}
