export type PropertyGroup = {
	label: string;
	properties: string[];
};

export type PropertyGroups = Record<string, PropertyGroup>;

// Properties that should NEVER be copied
export const EXCLUDED_PROPERTIES = new Set([
	'id',
	'trackId',
	'type',
	'assetId',
	'name',
	'from',
	'durationInFrames',
	'isDraggingInTimeline',
]);

// Common property groups that apply to most items
const COMMON_GROUPS: PropertyGroups = {
	layout: {
		label: 'Layout',
		properties: ['top', 'left', 'width', 'height', 'rotation'],
	},
	appearance: {
		label: 'Appearance',
		properties: ['opacity', 'borderRadius', 'css'],
	},
	animation: {
		label: 'Animation',
		properties: ['animation'],
	},
	timing: {
		label: 'Timing',
		properties: ['fadeInDurationInSeconds', 'fadeOutDurationInSeconds'],
	},
	crop: {
		label: 'Crop',
		properties: ['cropLeft', 'cropTop', 'cropRight', 'cropBottom'],
	},
	transition: {
		label: 'Transitions',
		properties: ['transition'],
	},
};

// Type-specific properties
const TYPE_SPECIFIC_PROPERTIES: Record<string, string[]> = {
	text: [
		'text',
		'color',
		'align',
		'fontFamily',
		'fontStyle',
		'fontSize',
		'lineHeight',
		'letterSpacing',
		'resizeOnEdit',
		'direction',
		'strokeWidth',
		'strokeColor',
		'background',
	],
	image: ['keepAspectRatio'],
	video: ['volume', 'playbackRate', 'keepAspectRatio'],
	gif: ['keepAspectRatio'],
	audio: ['volume', 'playbackRate'],
	solid: ['color'],
	captions: [
		'captionAssetId',
		'textColor',
		'backgroundColor',
		'fontSize',
		'fontFamily',
		'fontWeight',
		'lineHeight',
		'padding',
	],
	composite: [],
};

export const getItemPropertyGroups = (
	itemType: string,
	availableProperties: Set<string>,
): PropertyGroups => {
	const groups: PropertyGroups = {};

	// Add common groups, filtering to only include properties that exist
	Object.entries(COMMON_GROUPS).forEach(([key, group]) => {
		const filteredProperties = group.properties.filter((prop) =>
			availableProperties.has(prop),
		);
		if (filteredProperties.length > 0) {
			groups[key] = {
				label: group.label,
				properties: filteredProperties,
			};
		}
	});

	// Add type-specific group if it has properties
	const typeSpecific = TYPE_SPECIFIC_PROPERTIES[itemType] || [];
	const filteredTypeSpecific = typeSpecific.filter((prop) =>
		availableProperties.has(prop),
	);

	if (filteredTypeSpecific.length > 0) {
		groups.typeSpecific = {
			label: 'Type-Specific',
			properties: filteredTypeSpecific,
		};
	}

	return groups;
};

export const formatPropertyName = (prop: string): string => {
	// Convert camelCase to Title Case
	return prop
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
};

export const formatPropertyValue = (value: unknown): string => {
	if (value === null || value === undefined) {
		return 'null';
	}
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	if (typeof value === 'number') {
		return value.toString();
	}
	if (typeof value === 'string') {
		return value.length > 20 ? `${value.slice(0, 20)}...` : value;
	}
	if (typeof value === 'object') {
		return '{...}';
	}
	return String(value);
};
