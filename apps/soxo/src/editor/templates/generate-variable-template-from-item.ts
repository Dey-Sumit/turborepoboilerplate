import {EditorStarterAsset} from '../assets/assets';
import {CompositeItem} from '../items/composite/composite-item-type';
import {EditorStarterItem} from '../items/item-type';
import {VariableTemplate} from './templates-library';

interface GenerateVariableTemplateParams {
	item: EditorStarterItem;
	assets: Record<string, EditorStarterAsset>;
	name: string;
	description: string;
	category: string;
	tags: string[];
}

/**
 * Generates a VariableTemplate from an EditorStarterItem.
 * This produces TypeScript code-ready templates that can be directly
 * added to templates-library.ts.
 */
export function generateVariableTemplateFromItem({
	item,
	assets,
	name,
	description,
	category,
	tags,
}: GenerateVariableTemplateParams): VariableTemplate {
	// Generate a kebab-case ID from the name
	const templateId = name
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, '')
		.replace(/\s+/g, '-')
		.trim() || 'template';

	// Base metadata shared by all templates
	const metadata = {
		name,
		description,
		category,
		tags,
		keywords: tags,
		composition: [`${Math.round(item.width)}*${Math.round(item.height)}`],
		fps: 30,
	};

	if (item.type === 'composite') {
		return generateCompositeVariableTemplate(
			item as CompositeItem,
			templateId,
			metadata,
			assets,
		);
	}

	return generateSingleItemVariableTemplate(item, templateId, metadata);
}

function generateCompositeVariableTemplate(
	item: CompositeItem,
	templateId: string,
	metadata: VariableTemplate['metadata'],
	assets: Record<string, EditorStarterAsset>,
): VariableTemplate {
	// Collect assets used by child items
	const usedAssetIds = new Set<string>();
	Object.values(item.childTimeline.items).forEach((childItem) => {
		if ('assetId' in childItem && childItem.assetId) {
			usedAssetIds.add(childItem.assetId as string);
		}
	});

	// Build template assets
	const templateAssets: Record<string, EditorStarterAsset> = {};
	usedAssetIds.forEach((assetId) => {
		if (assets[assetId]) {
			templateAssets[assetId] = assets[assetId];
		}
	});

	// Build variables object - extract configurable values
	const variables: Record<string, {type: string; value: unknown; path: string}> =
		{};

	// Extract text content as variables
	Object.entries(item.childTimeline.items).forEach(([itemId, childItem]) => {
		if (childItem.type === 'text' && 'text' in childItem) {
			const varName = `text_${itemId}`;
			variables[varName] = {
				type: 'string',
				value: (childItem as {text: string}).text,
				path: `template.childTimeline.items.${itemId}.text`,
			};
		}
		// Extract image/video URLs as variables
		if ('assetId' in childItem && childItem.assetId) {
			const asset = assets[childItem.assetId as string];
			if (asset && 'remoteUrl' in asset) {
				const varName = `asset_${childItem.assetId}`;
				variables[varName] = {
					type: 'URL',
					value: asset.remoteUrl,
					path: `template.assets.${childItem.assetId}.remoteUrl`,
				};
			}
		}
	});

	// Build the template object (matches CompositeItem structure)
	const template = {
		type: 'composite' as const,
		id: templateId,
		durationInFrames: item.durationInFrames,
		from: 0,
		left: 0,
		top: 0,
		width: item.width,
		height: item.height,
		originalWidth: item.originalWidth,
		originalHeight: item.originalHeight,
		opacity: item.opacity,
		rotation: item.rotation,
		borderRadius: item.borderRadius,
		keepAspectRatio: item.keepAspectRatio,
		fadeInDurationInSeconds: item.fadeInDurationInSeconds,
		fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
		isDraggingInTimeline: false,
		transition: {},
		name: item.name,
		childTimeline: item.childTimeline,
		assets: templateAssets,
	};

	return {
		id: templateId,
		type: 'composite',
		metadata,
		variables,
		template,
	} as VariableTemplate;
}

function generateSingleItemVariableTemplate(
	item: EditorStarterItem,
	templateId: string,
	metadata: VariableTemplate['metadata'],
): VariableTemplate {
	// Build variables based on item type
	const variables: Record<string, {type: string; value: unknown; path: string}> =
		{};

	// Common dimension variables
	variables.width = {
		type: 'number',
		value: item.width,
		path: 'template.width',
	};
	variables.height = {
		type: 'number',
		value: item.height,
		path: 'template.height',
	};

	// Type-specific variables
	if (item.type === 'text' && 'text' in item) {
		variables.text = {
			type: 'string',
			value: (item as {text: string}).text,
			path: 'template.text',
		};
	}
	if (item.type === 'solid' && 'color' in item) {
		variables.color = {
			type: 'color',
			value: (item as {color: string}).color,
			path: 'template.color',
		};
	}

	// Create template without id field (will be regenerated)
	const {id: _id, ...itemWithoutId} = item;

	const template = {
		...itemWithoutId,
		id: templateId,
		from: 0,
		left: 0,
		top: 0,
		isDraggingInTimeline: false,
		transition: {},
	};

	return {
		id: templateId,
		type: item.type,
		metadata,
		variables,
		template,
	} as VariableTemplate;
}
