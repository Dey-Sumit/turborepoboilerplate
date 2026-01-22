import {EditorStarterAsset} from '../assets/assets';
import {
	ChildTimeline,
	CompositeItem,
} from '../items/composite/composite-item-type';
import {EditorStarterItem} from '../items/item-type';
import {generateRandomId} from '../utils/generate-random-id';
import {TemplateDefinition} from './template-types';

/**
 * Parameters for generating a template from an item
 */
interface GenerateTemplateParams {
	item: EditorStarterItem;
	assets: Record<string, EditorStarterAsset>;
	name: string;
	description: string;
	category: string;
	tags: string[];
}

/**
 * Collects all assets referenced by items in a childTimeline
 */
function collectReferencedAssets(
	childTimeline: ChildTimeline,
	allAssets: Record<string, EditorStarterAsset>,
): Record<string, EditorStarterAsset> {
	const referencedAssets: Record<string, EditorStarterAsset> = {};

	for (const childItem of Object.values(childTimeline.items)) {
		if ('assetId' in childItem && childItem.assetId) {
			const asset = allAssets[childItem.assetId];
			if (asset) {
				referencedAssets[asset.id] = asset;
			}
		}

		// If the child item is also a composite, recursively collect its assets
		if (childItem.type === 'composite') {
			const nestedAssets = collectReferencedAssets(
				(childItem as CompositeItem).childTimeline,
				allAssets,
			);
			Object.assign(referencedAssets, nestedAssets);
		}
	}

	return referencedAssets;
}

/**
 * Generates a TemplateDefinition from a composite item
 */
function generateTemplateFromComposite(
	composite: CompositeItem,
	allAssets: Record<string, EditorStarterAsset>,
	name: string,
	description: string,
	category: string,
): TemplateDefinition {
	const referencedAssets = collectReferencedAssets(
		composite.childTimeline,
		allAssets,
	);

	const templateId = name
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');

	return {
		id: templateId || generateRandomId('template'),
		name,
		description,
		category: category as TemplateDefinition['category'],
		defaultDurationInFrames: composite.durationInFrames,
		width: composite.originalWidth,
		height: composite.originalHeight,
		childTimeline: composite.childTimeline,
		assets:
			Object.keys(referencedAssets).length > 0 ? referencedAssets : undefined,
	};
}

/**
 * Generates a TemplateDefinition from a single (non-composite) item.
 * Wraps the item in a childTimeline structure to maintain consistency.
 */
function generateTemplateFromSingleItem(
	item: EditorStarterItem,
	allAssets: Record<string, EditorStarterAsset>,
	name: string,
	description: string,
	category: string,
): TemplateDefinition {
	const templateId = name
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');

	// Create a single track with the item
	const trackId = generateRandomId('track');

	// Clone the item and make coordinates relative (0, 0 since single item)
	const relativeItem = {
		...item,
		left: 0,
		top: 0,
		from: 0,
		trackId,
	};

	// Create childTimeline structure
	const childTimeline: ChildTimeline = {
		tracks: [
			{
				id: trackId,
				items: [item.id],
				hidden: false,
				muted: false,
			},
		],
		items: {
			[item.id]: relativeItem,
		},
	};

	// Collect assets referenced by this item
	const referencedAssets: Record<string, EditorStarterAsset> = {};
	if ('assetId' in item && item.assetId) {
		const asset = allAssets[item.assetId];
		if (asset) {
			referencedAssets[asset.id] = asset;
		}
	}

	return {
		id: templateId || generateRandomId('template'),
		name,
		description,
		category: category as TemplateDefinition['category'],
		defaultDurationInFrames: item.durationInFrames,
		width: item.width,
		height: item.height,
		childTimeline,
		assets:
			Object.keys(referencedAssets).length > 0 ? referencedAssets : undefined,
	};
}

/**
 * Generates a TemplateDefinition from any EditorStarterItem.
 *
 * For composite items: Uses the existing childTimeline structure
 * For single items: Creates a wrapper childTimeline with one track containing the item
 *
 * @param params - Generation parameters including item, assets, and metadata
 * @returns A TemplateDefinition that can be serialized to JSON
 */
export function generateTemplateFromItem({
	item,
	assets,
	name,
	description,
	category,
	tags,
}: GenerateTemplateParams): TemplateDefinition & {tags?: string[]} {
	let template: TemplateDefinition;

	if (item.type === 'composite') {
		template = generateTemplateFromComposite(
			item as CompositeItem,
			assets,
			name,
			description,
			category,
		);
	} else {
		template = generateTemplateFromSingleItem(
			item,
			assets,
			name,
			description,
			category,
		);
	}

	// Add tags if provided (extending the base TemplateDefinition)
	return {
		...template,
		tags: tags.length > 0 ? tags : undefined,
	} as TemplateDefinition & {tags?: string[]};
}
