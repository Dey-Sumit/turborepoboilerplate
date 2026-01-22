import {EditorStarterAsset} from '../../assets/assets';
import {EditorState} from '../types';

// Immer version - mutates state directly
export const setUploadError = ({
	asset,
	error,
	canRetry = true,
	state,
}: {
	state: EditorState;
	asset: EditorStarterAsset;
	error: Error;
	canRetry: boolean;
}): void => {
	state.assetStatus[asset.id] = {
		type: 'error',
		error,
		canRetry,
	};
};
