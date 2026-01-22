import {EditorStarterAsset} from '../assets/assets';
import {ChildTimeline} from '../items/composite/composite-item-type';
import {TemplateDefinition} from './template-types';

/**
 * Generates a TemplateDefinition JSON object from a composite's data.
 * This extracts the raw data directly from the composite's state.
 */
export const generateCompositeTemplateConfig = ({
	childTimeline,
	compositeName,
	compositeWidth,
	compositeHeight,
	durationInFrames,
	assets,
}: {
	childTimeline: ChildTimeline;
	compositeName: string;
	compositeWidth: number;
	compositeHeight: number;
	durationInFrames: number;
	assets: Record<string, EditorStarterAsset>;
}): TemplateDefinition => {
	// Collect assets referenced by items in the childTimeline
	const referencedAssets: Record<string, EditorStarterAsset> = {};

	for (const item of Object.values(childTimeline.items)) {
		if ('assetId' in item && item.assetId) {
			const asset = assets[item.assetId];
			if (asset) {
				referencedAssets[asset.id] = asset;
			}
		}
	}

	// Generate template ID from name
	const templateId = compositeName
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');

	return {
		id: templateId,
		name: compositeName,
		description: '', // User can fill this in
		category: 'overlay', // User can change this
		defaultDurationInFrames: durationInFrames,
		width: compositeWidth,
		height: compositeHeight,
		childTimeline,
		assets:
			Object.keys(referencedAssets).length > 0 ? referencedAssets : undefined,
	};
};

/**
 * Copies the composite template config JSON to clipboard.
 * Returns the JSON string.
 */
export const copyCompositeConfigToClipboard = async ({
	childTimeline,
	compositeName,
	compositeWidth,
	compositeHeight,
	durationInFrames,
	assets,
}: {
	childTimeline: ChildTimeline;
	compositeName: string;
	compositeWidth: number;
	compositeHeight: number;
	durationInFrames: number;
	assets: Record<string, EditorStarterAsset>;
}): Promise<string> => {
	const templateConfig = generateCompositeTemplateConfig({
		childTimeline,
		compositeName,
		compositeWidth,
		compositeHeight,
		durationInFrames,
		assets,
	});

	const json = JSON.stringify(templateConfig, null, 2);

	await navigator.clipboard.writeText(json);
	return json;
};
