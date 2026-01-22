import {Caption} from '@remotion/captions';
import {CaptionAsset} from '../../assets/assets';
import {generateRandomId} from '../../utils/generate-random-id';
import {EditorState} from '../types';
import {addAssetToState} from './add-asset-to-state';

export const addCaptionAsset = ({
	state,
	captions,
	filename,
	sourceAssetId,
}: {
	state: EditorState;
	captions: Caption[];
	filename: string;
	/** The ID of the audio/video asset this caption was generated from */
	sourceAssetId?: string;
}): CaptionAsset => {
	const assetId = generateRandomId('asset');

	const asset: CaptionAsset = {
		id: assetId,
		type: 'caption',
		captions,
		filename,
		remoteUrl: null,
		remoteFileKey: null,
		size: new Blob([JSON.stringify(captions)]).size,
		mimeType: 'application/json',
		sourceAssetId,
	};

	// Add asset using Immer version
	addAssetToState({state, asset});

	// Caption assets are immediately uploaded (no actual upload needed)
	state.assetStatus[asset.id] = {
		type: 'uploaded',
	};

	return asset;
};
