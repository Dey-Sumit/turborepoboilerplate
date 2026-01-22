import {AudioItem} from '../items/audio/audio-item-type';
import {CaptionsItem} from '../items/captions/captions-item-type';
import {CodeItem} from '../items/code/code-item-type';
import {CompositeItem} from '../items/composite/composite-item-type';
import {GifItem} from '../items/gif/gif-item-type';
import {ImageItem} from '../items/image/image-item-type';
import {EditorStarterItem} from '../items/item-type';
import {SolidItem} from '../items/solid/solid-item-type';
import {TextItem} from '../items/text/text-item-type';
import {VideoItem} from '../items/video/video-item-type';

/**
 * Base metadata shared by all templates
 */
type BaseTemplateMetadata = {
	name: string;
	description: string;
	category: string;
	tags: string[];
	keywords?: string[];
	estimatedDuration?: number; // minutes
	useCases?: string[];
	composition: string[]; // Array of "width*height" strings, e.g., ["1080*1920", "1920*1080"]
	fps?: number; // Optional FPS, defaults to 30 if not specified
};

/**
 * Variable configuration with type, value, and path information
 */
type VariableConfig = {
	type: string;
	value: unknown;
	path: string;
};

/**
 * Organized variable structure for better canvas size support
 * Variables are processed in order: composition → static → derive
 */
type OrganizedVariables = {
	composition?: Record<string, VariableConfig>;
	static?: Record<string, VariableConfig>;
	derive?: Record<string, VariableConfig>;
};

/**
 * Variables can be either flat (legacy) or organized (new structure)
 */
type TemplateVariables = Record<string, VariableConfig> | OrganizedVariables;

/**
 * Template item structure - allows string placeholders for variables
 * Recursively maps all properties to support variable placeholders
 */
type TemplateItemStructure<T> = {
	[K in keyof T]: T[K] extends object
		? T[K] | string | TemplateItemStructure<T[K]>
		: T[K] | string;
};

/**
 * Base template structure
 * Generic over the item type for DRY and type safety
 */
type BaseVariableTemplate<
	TType extends EditorStarterItem['type'],
	TItem extends Extract<EditorStarterItem, {type: TType}>,
> = {
	id: string;
	type: TType; // Root-level type discriminator for filtering/searching
	metadata: BaseTemplateMetadata;
	variables: TemplateVariables; // Supports both flat and organized structures
	template: TemplateItemStructure<Omit<TItem, 'id' | 'type'>> & {
		type: TType;
		id: string;
	};
};

/**
 * Composite template with additional assets support
 */
export type CompositeVariableTemplate = BaseVariableTemplate<
	'composite',
	CompositeItem
> & {
	template: TemplateItemStructure<Omit<CompositeItem, 'id' | 'type'>> & {
		type: 'composite';
		id: string;
		assets?: Record<string, unknown>;
	};
};

// Specific template types - DRY principle: derived from existing item types
export type TextVariableTemplate = BaseVariableTemplate<'text', TextItem>;
export type SolidVariableTemplate = BaseVariableTemplate<'solid', SolidItem>;
export type ImageVariableTemplate = BaseVariableTemplate<'image', ImageItem>;
export type VideoVariableTemplate = BaseVariableTemplate<'video', VideoItem>;
export type AudioVariableTemplate = BaseVariableTemplate<'audio', AudioItem>;
export type GifVariableTemplate = BaseVariableTemplate<'gif', GifItem>;
export type CaptionsVariableTemplate = BaseVariableTemplate<
	'captions',
	CaptionsItem
>;
export type CodeVariableTemplate = BaseVariableTemplate<'code', CodeItem>;

/**
 * Union of all template types with root-level type discriminator
 */
export type VariableTemplate =
	| CompositeVariableTemplate
	| TextVariableTemplate
	| SolidVariableTemplate
	| ImageVariableTemplate
	| VideoVariableTemplate
	| AudioVariableTemplate
	| GifVariableTemplate
	| CaptionsVariableTemplate
	| CodeVariableTemplate;

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

/**
 * Full Canvas Solid Background
 * Auto-sized to canvas dimensions, perfect for backgrounds
 */
const fullCanvasSolid: SolidVariableTemplate = {
	id: 'full-canvas-solid',
	type: 'solid',
	metadata: {
		name: 'Full Canvas Background',
		description:
			'Auto-sized solid color background that fills entire canvas. Perfect for video backgrounds, color overlays, and base layers. Automatically adapts to canvas dimensions.',
		category: 'background',
		tags: ['background', 'solid', 'foundation', 'layer', 'base'],
		keywords: ['background', 'solid color', 'full canvas', 'layer'],
		estimatedDuration: 1,
		useCases: [
			'Video background',
			'Color overlay',
			'Base layer',
			'Solid backdrop',
		],
		composition: ['1080*1920'],
		fps: 30,
	},
	variables: {
		composition: {
			width: {
				type: 'number',
				value: '{{COMPOSITION_WIDTH}}',
				path: 'template.width',
			},
			height: {
				type: 'number',
				value: '{{COMPOSITION_HEIGHT}}',
				path: 'template.height',
			},
		},
		static: {
			color: {
				type: 'COLOR',
				value: '#ffffff',
				path: 'template.color',
			},
			width: {
				type: 'number',
				value: '{{COMPOSITION_WIDTH}}',
				path: 'template.width',
			},
			height: {
				type: 'number',
				// value: 1080,
				value: '{{COMPOSITION_HEIGHT}}',
				path: 'template.height',
			},
		},
	},
	template: {
		type: 'solid',
		id: 'bg-solid',
		durationInFrames: 90,
		from: 0,
		left: 0,
		top: 0,
		width: '{{width}}',
		height: '{{height}}',
		color: '{{color}}',
		opacity: 1,
		borderRadius: 0,
		rotation: 0,
		keepAspectRatio: false,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		transition: {},
		isDraggingInTimeline: false,
	},
};

/**
 * Centered Text
 * Text positioned in the center of canvas with customizable styling
 */
const centeredText: TextVariableTemplate = {
	id: 'centered-text',
	type: 'text',
	metadata: {
		name: 'Centered Text',
		description:
			'Text element positioned in the center of canvas with customizable content, font size, and color. Perfect for titles, headings, and call-to-action text.',
		category: 'text',
		tags: ['text', 'centered', 'title', 'heading', 'cta'],
		keywords: ['text', 'center', 'title', 'heading'],
		estimatedDuration: 1,
		useCases: [
			'Video titles',
			'Headings',
			'Call-to-action text',
			'Centered messages',
		],
		composition: ['1080*1920'],
		fps: 30,
	},
	variables: {
		composition: {
			width: {
				type: 'number',
				value: '{{COMPOSITION_WIDTH}}',
				path: 'template.width',
			},
			height: {
				type: 'number',
				value: '{{COMPOSITION_HEIGHT}}',
				path: 'template.height',
			},
		},
		static: {
			text: {
				type: 'string',
				value: 'Your Text Here',
				path: 'template.text',
			},
			fontSize: {
				type: 'number',
				value: 80,
				path: 'template.fontSize',
			},
			color: {
				type: 'COLOR',
				value: '#000000',
				path: 'template.color',
			},
			fontFamily: {
				type: 'string',
				value: 'Inter',
				path: 'template.fontFamily',
			},
		},
		derive: {
			centerX: {
				type: 'number',
				value: '{{COMPOSITION_WIDTH}} / 2',
				path: 'template.left',
			},
			centerY: {
				type: 'number',
				value: '{{COMPOSITION_HEIGHT}} / 2',
				path: 'template.top',
			},
		},

		text: {
			type: 'string',
			value: 'Your Text Here',
			path: 'template.text',
		},
		fontSize: {
			type: 'number',
			value: 80,
			path: 'template.fontSize',
		},
		color: {
			type: 'COLOR',
			value: '#000000',
			path: 'template.color',
		},
		fontFamily: {
			type: 'string',
			value: 'Inter',
			path: 'template.fontFamily',
		},
	},
	template: {
		type: 'text',
		id: 'center-text',
		durationInFrames: 90,
		from: 0,
		text: '{{text}}',
		color: '{{color}}',
		fontSize: '{{fontSize}}',
		fontFamily: '{{fontFamily}}',
		width: 800,
		height: 100,
		left: '{{centerX}}',
		top: '{{centerY}}',
		align: 'center',
		opacity: 1,
		rotation: 0,
		lineHeight: 1.2,
		letterSpacing: 0,
		resizeOnEdit: true,
		direction: 'ltr',
		fontStyle: {
			variant: 'normal',
			weight: '400',
		},
		isDraggingInTimeline: false,
		strokeWidth: 0,
		strokeColor: '#000000',
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		background: null,
		transition: {},
	},
};

/**
 * Composite Card Template
 * A versatile content card template with background image and text overlays
 */
const cardTemplate: CompositeVariableTemplate = {
	id: 'composite-card-template',
	type: 'composite',
	metadata: {
		name: 'Composite Card',
		description:
			'A versatile content card template featuring a background image with overlaid text elements including title, description, and helper text. Perfect for creating engaging social media posts, promotional content, and informational graphics. Supports customizable background images, multiple text styles, and professional typography layouts. Ideal for marketing materials, blog graphics, announcements, and branded content creation.',
		category: 'card',
		tags: [
			'content',
			'social',
			'marketing',
			'promotional',
			'informational',
			'text-overlay',
			'image-background',
		],
		estimatedDuration: 5,
		useCases: [
			'Social media posts',
			'Blog graphics',
			'Promotional content',
			'Announcements',
			'Branded materials',
			'Informational graphics',
		],
		composition: ['1080*1920'],
		fps: 30,
	},
	variables: {
		title: {
			type: 'string',
			value: 'Main Title Goes Here',
			path: 'template.childTimeline.items.qCVx.text',
		},
		description: {
			type: 'string',
			value: 'Description Text goes here',
			path: 'template.childTimeline.items.ewK2.text',
		},
		helperText1: {
			type: 'string',
			value: 'Helper Text 1',
			path: 'template.childTimeline.items.WADB.text',
		},
		helperText2: {
			type: 'string',
			value: 'Helper Text 2',
			path: 'template.childTimeline.items.YsBP.text',
		},
		backgroundImage: {
			type: 'URL',
			value:
				'https://promptlibrary.org/wp-content/uploads/2025/05/Pop-Art-Smart-Contract-Icon-midjourney-prompt.webp',
			path: 'template.assets.ACvU.remoteUrl',
		},
	},
	template: {
		type: 'composite',
		id: 'composite-card',
		durationInFrames: 90,
		from: 0,
		left: 0,
		top: 0,
		width: 1118.9020038050057,
		height: 1923,
		originalWidth: 1118.9020038050057,
		originalHeight: 1923,
		opacity: 1,
		rotation: 0,
		borderRadius: 0,
		keepAspectRatio: false,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		isDraggingInTimeline: false,
		transition: {},
		name: 'Composite Card',
		childTimeline: {
			tracks: [
				{
					id: 'JwjZ',
					items: ['YsBP'],
					hidden: false,
					muted: false,
				},
				{
					id: 'zPeL',
					items: ['WADB'],
					hidden: false,
					muted: false,
				},
				{
					id: 'njpy',
					items: ['ewK2'],
					hidden: false,
					muted: false,
				},
				{
					id: '2ue4',
					items: ['qCVx'],
					hidden: false,
					muted: false,
				},
				{
					id: 'LgCs',
					items: ['U1hc'],
					hidden: false,
					muted: false,
				},
				{
					id: 'CFXL',
					items: ['pkrV'],
					hidden: false,
					muted: false,
				},
			],
			items: {
				pkrV: {
					type: 'solid',
					color: '#ffffff',
					durationInFrames: 90,
					from: 0,
					top: 3,
					left: 32,
					width: 1080,
					height: 1920,
					isDraggingInTimeline: false,
					id: 'pkrV',
					opacity: 1,
					borderRadius: 0,
					rotation: 0,
					keepAspectRatio: false,
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					transition: {},
				},
				U1hc: {
					id: 'U1hc',
					durationInFrames: 90,
					top: 0,
					left: 0,
					width: 1118.9020038050057,
					height: 1886,
					from: 0,
					type: 'image',
					opacity: 1,
					borderRadius: 0,
					rotation: 0,
					assetId: 'ACvU',
					isDraggingInTimeline: false,
					keepAspectRatio: false,
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					cropLeft: 0.028319496948583024,
					cropTop: 0.0015052684395383841,
					cropRight: 0.005939762310676235,
					cropBottom: 0.31245384623523287,
					transition: {},
				},
				qCVx: {
					id: 'qCVx',
					durationInFrames: 90,
					from: 0,
					type: 'text',
					text: '{{title}}',
					color: '#000000',
					top: 1381,
					left: 92,
					width: 843,
					height: 96,
					align: 'center',
					opacity: 1,
					rotation: 0,
					fontFamily: 'Yeseva One',
					fontSize: 80,
					lineHeight: 1.2,
					letterSpacing: 0,
					resizeOnEdit: true,
					direction: 'ltr',
					fontStyle: {
						variant: 'normal',
						weight: '400',
					},
					isDraggingInTimeline: false,
					strokeWidth: 0,
					strokeColor: '#000000',
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					background: null,
					transition: {},
				},
				ewK2: {
					id: 'ewK2',
					durationInFrames: 90,
					from: 0,
					type: 'text',
					text: '{{description}}',
					color: '#292929',
					top: 1509,
					left: 92,
					width: 704,
					height: 70,
					align: 'center',
					opacity: 1,
					rotation: 0,
					fontFamily: 'Gelasio',
					fontSize: 58,
					lineHeight: 1.2,
					letterSpacing: 0,
					resizeOnEdit: true,
					direction: 'ltr',
					fontStyle: {
						variant: 'normal',
						weight: '500',
					},
					isDraggingInTimeline: false,
					strokeWidth: 0,
					strokeColor: '#000000',
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					background: null,
					transition: {},
				},
				WADB: {
					id: 'WADB',
					durationInFrames: 90,
					from: 0,
					type: 'text',
					text: '{{helperText1}}',
					color: '#292929',
					top: 1749,
					left: 90,
					width: 361,
					height: 57,
					align: 'left',
					opacity: 1,
					rotation: 0,
					fontFamily: 'Gelasio',
					fontSize: 54,
					lineHeight: 1.2,
					letterSpacing: 0,
					resizeOnEdit: false,
					direction: 'ltr',
					fontStyle: {
						variant: 'normal',
						weight: '400',
					},
					isDraggingInTimeline: false,
					strokeWidth: 0,
					strokeColor: '#000000',
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					background: null,
					transition: {},
				},
				YsBP: {
					id: 'YsBP',
					durationInFrames: 90,
					from: 0,
					type: 'text',
					text: '{{helperText2}}',
					color: '#1e00ff',
					top: 1755,
					left: 693,
					width: 361,
					height: 57,
					align: 'right',
					opacity: 1,
					rotation: 0,
					fontFamily: 'Gelasio',
					fontSize: 54,
					lineHeight: 1.2,
					letterSpacing: 0,
					resizeOnEdit: false,
					direction: 'ltr',
					fontStyle: {
						variant: 'normal',
						weight: '400',
					},
					isDraggingInTimeline: false,
					strokeWidth: 0,
					strokeColor: '#000000',
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					background: null,
					transition: {},
				},
			},
		},
		assets: {
			ACvU: {
				id: 'ACvU',
				type: 'image',
				filename: 'background-image',
				remoteUrl: '{{backgroundImage}}',
				remoteFileKey: null,
				size: 0,
				mimeType: 'image/webp',
				width: null,
				height: null,
				isExternal: true,
				externalErrorCode: 'CORS',
			},
		},
	},
};


// =============================================================================
// TEMPLATE COMPILATION
// =============================================================================

/**
 * Compiles a template by replacing variable placeholders with actual values
 * @param template - The template with variables and template structure
 * @param variableOverrides - Partial variable overrides (optional)
 * @param compositionDimensions - Optional composition dimensions for {{COMPOSITION_WIDTH}} and {{COMPOSITION_HEIGHT}} placeholders
 * @returns Compiled item ready to be added to timeline
 */
export function compileTemplate<T extends VariableTemplate>(
	template: T,
	variableOverrides: Partial<T['variables']> = {},
	compositionDimensions?: {width: number; height: number},
) {
	// Deep clone the template
	const compiledTemplate = JSON.parse(JSON.stringify(template.template));

	// Get composition dimensions from template metadata or provided parameter
	const composition =
		compositionDimensions ||
		(() => {
			if (
				!template.metadata.composition ||
				template.metadata.composition.length === 0
			) {
				throw new Error(
					`Template ${template.id} has no composition dimensions defined`,
				);
			}
			return parseCompositionString(template.metadata.composition[0]);
		})();

	// Context for variable resolution (used in derived expressions)
	// Initialize with composition dimensions
	const context: Record<string, number> = {
		COMPOSITION_WIDTH: composition.width,
		COMPOSITION_HEIGHT: composition.height,
	};

	// Check if variables are organized (new structure) or flat (legacy)
	const isOrganized = isOrganizedVariables(template.variables);

	if (isOrganized) {
		const organizedVars = template.variables as OrganizedVariables;
		const organizedOverrides = variableOverrides as Partial<OrganizedVariables>;

		// Step 1: Process composition variables first
		if (organizedVars.composition) {
			for (const [varKey, varConfig] of Object.entries(
				organizedVars.composition,
			)) {
				const value = resolveVariableValue(
					varConfig,
					varKey,
					organizedOverrides.composition,
					context,
					false,
					'composition',
				);
				setNestedValue(compiledTemplate, varConfig.path, value);
				// Update context with processed value if it's a number
				if (typeof value === 'number') {
					context[varKey] = value;
				}
			}
		}

		// Step 2: Process static variables
		if (organizedVars.static) {
			for (const [varKey, varConfig] of Object.entries(organizedVars.static)) {
				const value = resolveVariableValue(
					varConfig,
					varKey,
					organizedOverrides.static,
					context,
					false,
					'static',
				);
				setNestedValue(compiledTemplate, varConfig.path, value);
				// Update context with processed value if it's a number
				if (typeof value === 'number') {
					context[varKey] = value;
				}
			}
		}

		// Step 3: Process derived variables last (they may depend on composition/static)
		if (organizedVars.derive) {
			for (const [varKey, varConfig] of Object.entries(organizedVars.derive)) {
				const value = resolveVariableValue(
					varConfig,
					varKey,
					organizedOverrides.derive,
					context,
					true, // Enable expression evaluation for derived variables
					'derive',
				);
				setNestedValue(compiledTemplate, varConfig.path, value);
				// Update context with processed value if it's a number
				if (typeof value === 'number') {
					context[varKey] = value;
				}
			}
		}
	} else {
		// Legacy flat structure - process all variables in order
		for (const [varKey, varConfig] of Object.entries(
			template.variables as Record<string, VariableConfig>,
		)) {
			const value = resolveVariableValue(
				varConfig,
				varKey,
				variableOverrides as Record<string, VariableConfig>,
				context,
				false,
				undefined,
			);
			setNestedValue(compiledTemplate, varConfig.path, value);
			// Update context with processed value if it's a number
			if (typeof value === 'number') {
				context[varKey] = value;
			}
		}
	}

	return compiledTemplate;
}

/**
 * Parses a composition string in "width*height" format
 * @param compositionString - String like "1080*1920"
 * @returns Object with width and height
 */
function parseCompositionString(compositionString: string): {
	width: number;
	height: number;
} {
	const [width, height] = compositionString.split('*').map(Number);
	if (isNaN(width) || isNaN(height)) {
		throw new Error(
			`Invalid composition string format: ${compositionString}. Expected "width*height"`,
		);
	}
	return {width, height};
}

/**
 * Checks if variables are in the organized structure
 */
function isOrganizedVariables(
	variables: TemplateVariables,
): variables is OrganizedVariables {
	return (
		typeof variables === 'object' &&
		variables !== null &&
		('composition' in variables ||
			'static' in variables ||
			'derive' in variables)
	);
}

/**
 * Resolves a variable value, handling placeholders and overrides
 * @param varConfig - The variable configuration
 * @param varKey - The variable key/name
 * @param variableOverrides - Overrides for this variable section (composition/static/derive)
 * @param context - Context object with available variable values
 * @param evaluateExpressions - Whether to evaluate mathematical expressions
 * @param section - The section name ('composition', 'static', 'derive', or undefined for flat)
 */
function resolveVariableValue(
	varConfig: VariableConfig,
	varKey: string,
	variableOverrides: Record<string, VariableConfig> | undefined,
	context: Record<string, number>,
	evaluateExpressions: boolean = false,
	_section?: 'composition' | 'static' | 'derive',
): unknown {
	// Check for override first - handle nested structure for organized variables
	let override: VariableConfig | undefined;
	if (variableOverrides) {
		override = variableOverrides[varKey];
	}

	if (override !== undefined) {
		// If override has a value property, use it; otherwise use the override itself
		const overrideValue =
			override.value !== undefined ? override.value : override;

		// If override value is a string with placeholders, resolve them
		if (typeof overrideValue === 'string') {
			let resolvedValue = overrideValue;
			resolvedValue = resolvedValue.replace(
				/\{\{COMPOSITION_WIDTH\}\}/g,
				String(context.COMPOSITION_WIDTH),
			);
			resolvedValue = resolvedValue.replace(
				/\{\{COMPOSITION_HEIGHT\}\}/g,
				String(context.COMPOSITION_HEIGHT),
			);

			// Replace other context variables
			resolvedValue = resolvedValue.replace(
				/\{\{(\w+)\}\}/g,
				(_match: string, varName: string) => {
					if (context[varName] !== undefined) {
						return String(context[varName]);
					}
					return _match;
				},
			);

			// Evaluate expression if needed
			if (evaluateExpressions && /[+\-*/]/.test(resolvedValue)) {
				try {
					const result = new Function('return ' + resolvedValue)();
					return typeof result === 'number' ? result : resolvedValue;
				} catch {
					return resolvedValue;
				}
			}

			// Convert string numbers to actual numbers
			if (/^\d+(\.\d+)?$/.test(resolvedValue.trim())) {
				return parseFloat(resolvedValue);
			}

			return resolvedValue;
		}

		return overrideValue;
	}

	let value:string = varConfig.value as string

	// Replace composition placeholders
	if (typeof value === 'string') {
		value = value.replace(
			/\{\{COMPOSITION_WIDTH\}\}/g,
			String(context.COMPOSITION_WIDTH),
		);
		value = value.replace(
			/\{\{COMPOSITION_HEIGHT\}\}/g,
			String(context.COMPOSITION_HEIGHT),
		);

		// Replace other context variables (for derived expressions)
		value = value.replace(
			/\{\{(\w+)\}\}/g,
			(_match: string, varName: string) => {
				if (context[varName] !== undefined) {
					return String(context[varName]);
				}
				// If variable not in context and we're evaluating expressions, warn by returning 0
				if (evaluateExpressions) {
					console.warn(
						`Variable ${varName} not found in context for expression evaluation`,
					);
					return '0';
				}
				return _match;
			},
		);
	}

	// Evaluate expressions for derived variables
	if (
		evaluateExpressions &&
		typeof value === 'string' &&
		/[+\-*/]/.test(value)
	) {
		try {
			// Safe evaluation: only allow basic math operations with context variables
			const result = new Function('return ' + value)();
			return typeof result === 'number' ? result : value;
		} catch (error) {
			// If evaluation fails, return the original value
			console.warn(`Expression evaluation failed for "${value}":`, error);
			return value;
		}
	}

	// Convert string numbers to actual numbers
	if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) {
		return parseFloat(value);
	}

	return value;
}

// Helper function to set a nested value using dot notation path
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
	const keys = path.replace(/^template\./, '').split('.');
	let current = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		// Create nested objects if they don't exist
		if (!(key in current) || current[key] === null) {
			current[key] = {};
		} else if (typeof current[key] !== 'object') {
			// If it's not an object but we need to go deeper, replace it
			current[key] = {};
		}
		current = current[key] as Record<string, unknown>;
	}

	// Set the final value
	const finalKey = keys[keys.length - 1];
	current[finalKey] = value;
}

/**
 * Text Centered in Background Template
 * Simple composite with centered text on solid background
 */
const textCentredInBgTemplate: CompositeVariableTemplate = {
	id: 'text-centred-in-bg',
	type: 'composite',
	metadata: {
		name: 'Text in Background',
		description:
			'Simple template with centered text on a solid background. Perfect for titles, intros, and text overlays.',
		category: 'text',
		tags: ['text', 'centered', 'background', 'simple', 'title'],
		keywords: ['centered text', 'solid background', 'title card'],
		composition: ['1920*1080'],
		fps: 30,
	},
	variables: {
		text: {
			type: 'string',
			value: 'HELLO',
			path: 'template.childTimeline.items.text_2vjJ.text',
		},
		textColor: {
			type: 'color',
			value: '#000000',
			path: 'template.childTimeline.items.text_2vjJ.color',
		},
		backgroundColor: {
			type: 'color',
			value: '#ffffff',
			path: 'template.childTimeline.items.solid_GfHN.color',
		},
	},
	template: {
		type: 'composite',
		id: 'text-centred-in-bg',
		durationInFrames: 100,
		from: 0,
		left: 0,
		top: 0,
		width: 1920,
		height: 1080,
		originalWidth: 1920,
		originalHeight: 1080,
		opacity: 1,
		rotation: 0,
		borderRadius: 0,
		keepAspectRatio: false,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		isDraggingInTimeline: false,
		transition: {},
		name: 'Text in Background',
		childTimeline: {
			tracks: [
				{
					id: 'track_s56n',
					items: ['text_2vjJ'],
					hidden: false,
					muted: false,
				},
				{
					id: 'track_o4sX',
					items: ['solid_GfHN'],
					hidden: false,
					muted: false,
				},
			],
			items: {
				text_2vjJ: {
					id: 'text_2vjJ',
					durationInFrames: 100,
					from: 0,
					type: 'text',
					text: 'HELLO',
					color: '#000000',
					top: 468,
					left: 769,
					width: 382,
					height: 144,
					align: 'center',
					opacity: 1,
					rotation: 0,
					fontFamily: 'DM Serif Text',
					fontSize: 120,
					lineHeight: 1.2,
					letterSpacing: 5,
					resizeOnEdit: true,
					direction: 'ltr',
					fontStyle: {
						variant: 'normal',
						weight: '400',
					},
					isDraggingInTimeline: false,
					strokeWidth: 0,
					strokeColor: '#000000',
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					background: null,
					transition: {},
					trackId: 'track_s56n',
				},
				solid_GfHN: {
					type: 'solid',
					color: '#ffffff',
					durationInFrames: 100,
					from: 0,
					top: 0,
					left: 0,
					width: 1920,
					height: 1080,
					isDraggingInTimeline: false,
					id: 'solid_GfHN',
					opacity: 1,
					borderRadius: 0,
					rotation: 0,
					keepAspectRatio: false,
					fadeInDurationInSeconds: 0,
					fadeOutDurationInSeconds: 0,
					transition: {},
					trackId: 'track_o4sX',
				},
			},
		},
	},
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * All available templates
 * Organized by type for easy filtering and searching
 */
export const ALL_TEMPLATES: VariableTemplate[] = [
	// Simple item templates
	fullCanvasSolid,
	centeredText,

	// Composite templates
	cardTemplate,

	textCentredInBgTemplate,
];

/**
 * Get templates by type
 */
export function getTemplatesByType(
	type: EditorStarterItem['type'],
): VariableTemplate[] {
	return ALL_TEMPLATES.filter((t) => t.type === type);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): VariableTemplate | undefined {
	return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Search templates by query
 */
export function searchTemplates(
	query: string,
	typeFilter?: EditorStarterItem['type'],
): VariableTemplate[] {
	const lowerQuery = query.toLowerCase();

	return ALL_TEMPLATES.filter((template) => {
		// Type filter
		if (typeFilter && template.type !== typeFilter) {
			return false;
		}

		// Search in name, description, tags, keywords
		const searchableText = [
			template.metadata.name,
			template.metadata.description,
			...template.metadata.tags,
			...(template.metadata.keywords || []),
		]
			.join(' ')
			.toLowerCase();

		return searchableText.includes(lowerQuery);
	});
}



// Named exports for backward compatibility
export {cardTemplate, textCentredInBgTemplate, centeredText, fullCanvasSolid};


