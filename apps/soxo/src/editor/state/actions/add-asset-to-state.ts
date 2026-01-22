import {type EditorStarterAsset} from '../../assets/assets';
import {type EditorState} from '../types';

export const addAssetToState = ({
	state,
	asset,
}: {
	state: EditorState;
	asset: EditorStarterAsset;
}): void => {
	// Add asset to compositionState.assets
	state.compositionState.assets[asset.id] = asset;

	// Add asset status
	state.assetStatus[asset.id] = {
		type: 'pending-upload',
	};
};
