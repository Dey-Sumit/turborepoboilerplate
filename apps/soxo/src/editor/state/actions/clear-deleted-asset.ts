import {EditorState} from '../types';

// Perform this state update when a deleted asset has been cleaned up.
// https://remotion.dev/docs/editor-starter/asset-cleanup
export const clearDeletedAsset = ({
	state,
	assetId,
}: {
	state: EditorState;
	assetId: string;
}) => {
	const newDeletedAssets = state.compositionState.deletedAssets.filter(
		(asset) => asset.assetId !== assetId,
	);

	if (newDeletedAssets.length === state.compositionState.deletedAssets.length) {
		return state;
	}

	const newState = {
		...state,
		compositionState: {
			...state.compositionState,
			deletedAssets: newDeletedAssets,
		},
	};

	return newState;
};
