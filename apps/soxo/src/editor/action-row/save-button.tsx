import React, {
	useCallback,
	useImperativeHandle,
	useMemo,
	useState,
} from 'react';
import {toast} from 'sonner';
import {saveProject} from '../../db/project-service';
import {useProjectIdOptional} from '../context/project-context';
import {SaveIcon} from '../icons/save';
import {
	cleanUpAssetStatus,
	cleanUpStateBeforeSaving,
} from '../state/clean-up-state-before-saving';
import {compositionState} from '../state/types';
import {hasAssetsWithErrors} from '../utils/asset-status-utils';
import {clsx} from '../utils/clsx';
import {hasUploadingAssets} from '../utils/upload-status';
import {useFullState} from '../utils/use-context';

export const saveButtonRef = React.createRef<{
	setLastSavedState: (state: compositionState) => void;
}>();

export const SaveButton = () => {
	const state = useFullState();
	const projectId = useProjectIdOptional();
	const [lastSavedState, setLastSavedState] = useState<compositionState | null>(
		null,
	);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = useCallback(async () => {
		if (!projectId) {
			toast.error('No project loaded');
			return;
		}

		setIsSaving(true);
		try {
			const cleanedUpState = cleanUpAssetStatus(state);
			const stateToSave = cleanUpStateBeforeSaving(
				cleanedUpState.compositionState,
			);

			// Save to Dexie IndexedDB
			await saveProject(projectId, stateToSave);

			setLastSavedState(cleanedUpState.compositionState);
			toast.success('Project saved');
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'An unknown error occurred',
			);
		} finally {
			setIsSaving(false);
		}
	}, [state, projectId]);

	useImperativeHandle(saveButtonRef, () => ({
		setLastSavedState,
	}));

	const isSavedState = lastSavedState === state.compositionState;
	const assetsUploading = hasUploadingAssets(state.assetStatus);
	const assetsWithErrors = hasAssetsWithErrors(state.assetStatus);

	const title = useMemo(() => {
		if (!projectId) {
			return 'No project loaded';
		}
		if (assetsWithErrors) {
			return 'Cannot save: Some assets have errors';
		}
		if (assetsUploading) {
			return 'Cannot save while assets are getting uploaded to the cloud';
		}
		if (isSaving) {
			return 'Saving...';
		}
		if (isSavedState) {
			return 'All changes saved';
		}
		return 'Save project (Ctrl+S)';
	}, [projectId, assetsWithErrors, assetsUploading, isSaving, isSavedState]);

	const isDisabled = useMemo(() => {
		return (
			!projectId ||
			isSavedState ||
			assetsUploading ||
			assetsWithErrors ||
			isSaving
		);
	}, [projectId, isSavedState, assetsUploading, assetsWithErrors, isSaving]);

	return (
		<div className="bg-white/5">
			<button
				data-saved={Boolean(isSavedState)}
				data-uploading={Boolean(assetsUploading)}
				data-has-errors={Boolean(assetsWithErrors)}
				data-saving={Boolean(isSaving)}
				className={clsx(
					'editor-starter-focus-ring flex h-10 w-10 items-center justify-center rounded text-white transition-colors',
					isDisabled && 'opacity-50',
					!isDisabled && 'hover:bg-white/10',
					isSaving && 'animate-pulse',
				)}
				title={title}
				disabled={isDisabled}
				onClick={handleSave}
				aria-label={title}
			>
				<SaveIcon />
			</button>
		</div>
	);
};
