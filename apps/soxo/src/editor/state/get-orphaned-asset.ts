import {EditorStarterAsset} from '../assets/assets';
import {getAssetFromItem} from '../assets/utils';
import {getAllItemsInHierarchy} from './helpers/get-current-timeline';
import {EditorState} from './types';

export const getOrphanedAssetIds = ({
	assets,
	items,
}: {
	items: EditorState['compositionState']['items'];
	assets: EditorState['compositionState']['assets'];
}): EditorStarterAsset[] => {
	const usedAssets = new Set<string>();

	// Get ALL items including those nested inside composites
	const allItems = getAllItemsInHierarchy(items);
	const assetIds = Object.keys(assets);

	for (const item of allItems) {
		const asset = getAssetFromItem({item, assets});

		if (asset) {
			usedAssets.add(asset.id);
		}
	}

	const orphanedAssets: EditorStarterAsset[] = [];
	for (const assetId of assetIds) {
		if (!usedAssets.has(assetId)) {
			orphanedAssets.push(assets[assetId]);
		}
	}

	return orphanedAssets;
};
