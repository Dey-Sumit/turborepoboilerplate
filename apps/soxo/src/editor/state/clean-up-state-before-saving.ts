import {AssetState, EditorStarterAsset} from '../assets/assets';
import {getAssetFromItem} from '../assets/utils';
import {getAllItemsInHierarchy} from './helpers/get-current-timeline';
import {EditorState, compositionState} from './types';

export const cleanUpStateBeforeSaving = (
	state: compositionState,
): compositionState => {
	const newAssets: Record<string, EditorStarterAsset> = {};

	// Get ALL items in the entire hierarchy (including those inside composites)
	const allItems = getAllItemsInHierarchy(state.items);

	// Remove assets that are unused
	for (const item of allItems) {
		const asset = getAssetFromItem({
			item,
			assets: state.assets,
		});
		if (asset) {
			newAssets[asset.id] = asset;
		}
	}

	return {
		...state,
		assets: newAssets,
	};
};

export const cleanUpAssetStatus = (state: EditorState): EditorState => {
	const usedAssetIds = new Set<string>();

	// Get ALL items in the entire hierarchy (including those inside composites)
	const allItems = getAllItemsInHierarchy(state.compositionState.items);

	// Find all used asset IDs
	for (const item of allItems) {
		const asset = getAssetFromItem({
			item,
			assets: state.compositionState.assets,
		});
		if (asset) {
			usedAssetIds.add(asset.id);
		}
	}

	// Keep only status for used assets
	const newAssetStatus: Record<string, AssetState> = {};
	for (const assetId of usedAssetIds) {
		if (state.assetStatus[assetId]) {
			newAssetStatus[assetId] = state.assetStatus[assetId];
		}
	}

	return {
		...state,
		assetStatus: newAssetStatus,
	};
};
