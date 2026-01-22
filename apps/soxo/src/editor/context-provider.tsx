import React, {useCallback, useEffect} from 'react';
import {toast} from 'sonner';
import useEditorStore from '../zustand/editor-store';
import {EditorStarterAsset} from './assets/assets';
import {getKeys} from './caching/indexeddb';
import {loadToBlobUrlOnce} from './caching/load-to-blob-url';
import {StyleClipboardProvider} from './context/style-clipboard-context';
import {createAssetStatusFromcompositionState} from './utils/asset-status-utils';

type EditorWrapperProps = {
	children: React.ReactNode;
};

export const EditorWrapper = ({children}: EditorWrapperProps) => {
	const setState = useEditorStore((state) => state.setState);
	const loadAssetsFromCache = useCallback(
		async (assets: Record<string, EditorStarterAsset>) => {
			const keys = await getKeys();
			const assetIds = Object.keys(assets);
			for (const assetId of assetIds) {
				const isDownloaded = keys.includes(assetId);

				if (isDownloaded) {
					await loadToBlobUrlOnce(assets[assetId]);
				}
			}
		},
		[],
	);
	useEffect(() => {
		let toastId: number | string | undefined = undefined;
		const initialize = async () => {
			toastId = toast.loading('Initializing editor...');
			const {compositionState, assetStatus: initialAssetStatus} =
				useEditorStore.getState();

			// Only initialize if we have assets and assetStatus is empty
			const hasAssets = Object.keys(compositionState.assets).length > 0;
			const hasAssetStatus = Object.keys(initialAssetStatus).length > 0;

			if (hasAssets && !hasAssetStatus) {
				toast.loading('Loading assets...', {id: toastId});
				await loadAssetsFromCache(compositionState.assets);
				const assetStatus =
					await createAssetStatusFromcompositionState(compositionState);
				setState((draft) => {
					draft.assetStatus = assetStatus;
					draft.initialized = true;
				});
			} else {
				setState((draft) => {
					draft.initialized = true;
				});
			}

			// Clear undo history after initialization to prevent
			// spurious undo points from the loading process
			useEditorStore.temporal.getState().clear();

			toast.success('Editor initialized', {id: toastId});
		};
		initialize().catch((error) => toast.error(error.message, {id: toastId}));
	}, [loadAssetsFromCache, setState]);

	// TODO : will do this later
	//useUndoRedo(setStateWithoutHistory);

	return <StyleClipboardProvider>{children}</StyleClipboardProvider>;
};
