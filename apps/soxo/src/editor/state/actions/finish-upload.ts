import {EditorStarterAsset} from '../../assets/assets';
import {EditorState} from '../types';

// Immer version - mutate state directly
export const finishUpload = ({
	asset,
	remoteUrl,
	state,
	remoteFileKey,
}: {
	state: EditorState;
	asset: EditorStarterAsset;
	remoteUrl: string;
	remoteFileKey: string;
}): void => {
	state.compositionState.assets[asset.id] = {
		...state.compositionState.assets[asset.id],
		remoteUrl,
		remoteFileKey,
	};
	state.assetStatus[asset.id] = {type: 'uploaded'};
};
