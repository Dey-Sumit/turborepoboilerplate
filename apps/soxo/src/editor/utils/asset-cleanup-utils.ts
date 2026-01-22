import {AssetState} from '../assets/assets';
import {compositionState} from '../state/types';

/**
 * Update asset status after cleanup by removing status for deleted assets
 */
export const updateAssetStatusAfterCleanup = (
	assetStatus: Record<string, AssetState>,
	cleanedState: compositionState,
): Record<string, AssetState> => {
	const updatedAssetStatus = {...assetStatus};
	Object.keys(assetStatus).forEach((assetId) => {
		if (!cleanedState.assets[assetId]) {
			delete updatedAssetStatus[assetId];
		}
	});
	return updatedAssetStatus;
};
