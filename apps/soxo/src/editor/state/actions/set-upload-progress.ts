import {AssetUploadProgress, EditorStarterAsset} from '../../assets/assets';
import {EditorState} from '../types';

// Immer version - mutate state directly
export const setUploadProgress = ({
	asset,
	uploadProgress,
	state,
}: {
	state: EditorState;
	asset: EditorStarterAsset;
	uploadProgress: AssetUploadProgress;
}): void => {
	state.assetStatus[asset.id] = {
		type: 'in-progress',
		progress: uploadProgress,
	};
};
