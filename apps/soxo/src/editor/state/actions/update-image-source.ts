import {EditorState} from '../types';

export const updateImageSource = (
	state: EditorState,
	params: {
		itemId: string;
		url: string;
		width: number | null;
		height: number | null;
		filename: string;
		mimeType: string;
	},
): EditorState => {
	const item = state.compositionState.items[params.itemId];

	if (!item || item.type !== 'image') {
		throw new Error('Item is not an image');
	}

	const existingAsset = state.compositionState.assets[item.assetId];

	if (!existingAsset || existingAsset.type !== 'image') {
		throw new Error('Asset not found or is not an image');
	}

	// Update the existing asset with new URL and metadata
	const updatedAsset = {
		...existingAsset,
		remoteUrl: params.url,
		filename: params.filename,
		mimeType: params.mimeType,
		width: params.width,
		height: params.height,
	};

	return {
		...state,
		compositionState: {
			...state.compositionState,
			assets: {
				...state.compositionState.assets,
				[item.assetId]: updatedAsset,
			},
		},
		assetStatus: {
			...state.assetStatus,
			[item.assetId]: {type: 'uploaded'},
		},
	};
};
