import {SceneCaptionAsset, SceneCaptionSegment} from '../../assets/assets';
import {generateRandomId} from '../../utils/generate-random-id';
import {EditorState} from '../types';
import {addAssetToState} from './add-asset-to-state';

export const addSceneCaptionAsset = ({
	state,
	segments,
	filename,
	sourceAssetId,
	captionAssetId,
}: {
	state: EditorState;
	/** AI-enriched scene caption segments */
	segments: SceneCaptionSegment[];
	filename: string;
	/** The ID of the source audio/video asset */
	sourceAssetId: string;
	/** The ID of the original raw caption asset */
	captionAssetId: string;
}): SceneCaptionAsset => {
	const assetId = generateRandomId('asset');

	const asset: SceneCaptionAsset = {
		id: assetId,
		type: 'scene-caption',
		segments,
		filename,
		remoteUrl: null,
		remoteFileKey: null,
		size: new Blob([JSON.stringify(segments)]).size,
		mimeType: 'application/json',
		sourceAssetId,
		captionAssetId,
	};

	// Add asset using Immer version
	addAssetToState({state, asset});

	// Scene caption assets are immediately uploaded (no actual upload needed)
	state.assetStatus[asset.id] = {
		type: 'uploaded',
	};

	return asset;
};
