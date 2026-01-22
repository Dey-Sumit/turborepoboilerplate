import {AssetState} from '../assets/assets';
import {FEATURE_SAVE_BUTTON} from '../flags';
import {hasAssetsWithErrors} from '../utils/asset-status-utils';
import {hasUploadingAssets} from '../utils/upload-status';
import {compositionState} from './types';

const key = 'remotion-editor-starter-state-v3';

/**
 * Migrate state to add trackId to items that don't have it.
 * This handles loading saved states from before trackId was added.
 */
export const migrateStateWithTrackIds = (
	state: compositionState,
): compositionState => {
	// Build a map of itemId -> trackId from the tracks array
	for (const track of state.tracks) {
		for (const itemId of track.items) {
			const item = state.items[itemId];
			if (item && !item.trackId) {
				item.trackId = track.id;
			}
		}
	}

	// Note: The following optional fields were added for bidirectional asset linking.
	// Existing projects without these links will work fine - users can regenerate
	// captions to establish the links:
	// - captionAssetId on video/audio items: links to generated raw caption asset
	// - sourceAssetId on caption assets: links back to source audio/video asset
	// - sceneCaptionAssetId on video/audio items: links to generated scene caption asset
	// - sceneCaptionAssetId on caption assets: links to generated scene caption asset
	// - SceneCaptionAsset.sourceAssetId: links to source audio/video asset
	// - SceneCaptionAsset.captionAssetId: links to original raw caption asset

	return state;
};

export const loadState = (): compositionState | null => {
	if (!FEATURE_SAVE_BUTTON) {
		throw new Error('Save button feature flag is disabled');
	}

	if (typeof localStorage === 'undefined') {
		return null;
	}

	const state = localStorage.getItem(key);
	if (!state) {
		return null;
	}

	const parsedState = JSON.parse(state) as compositionState;

	// Migrate to add trackId if missing
	return migrateStateWithTrackIds(parsedState);
};

export const saveState = (
	state: compositionState,
	assetStatus: Record<string, AssetState>,
) => {
	if (!FEATURE_SAVE_BUTTON) {
		throw new Error('Save button feature flag is disabled');
	}

	const assetsUploading = hasUploadingAssets(assetStatus);
	if (assetsUploading) {
		throw new Error(
			'Cannot save while assets are getting uploaded to the cloud',
		);
	}

	if (hasAssetsWithErrors(assetStatus)) {
		throw new Error(
			'Cannot save: Some assets have errors. Please fix them before saving.',
		);
	}

	localStorage.setItem(key, JSON.stringify(state));
	 
	console.log('Saved state to Local Storage.', state);
};
