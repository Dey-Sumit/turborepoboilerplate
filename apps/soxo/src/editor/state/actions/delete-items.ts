import useUIStore from '../../../zustand/ui-store';
import {getCurrentTimeline} from '../helpers/get-current-timeline';
import {getOrphanedAssetIds} from '../get-orphaned-asset';
import {EditorState} from '../types';
import {resetItemCropToNonNegative} from './item-cropping';

export const deleteItems = (
	state: EditorState,
	idsToDelete: string[],
): void => {
	// Reset itemSelectedForCrop if the cropped item is being deleted
	// IMPORTANT: Must do this BEFORE deleting the item, as resetItemCropToNonNegative
	// needs to access the item via changeItem
	const itemSelectedForCrop = useUIStore.getState().itemSelectedForCrop;
	if (itemSelectedForCrop && idsToDelete.includes(itemSelectedForCrop)) {
		resetItemCropToNonNegative(state);
		useUIStore.getState().setItemSelectedForCrop(null);
	}

	// Get the current timeline (root or composite's childTimeline)
	const currentTimeline = getCurrentTimeline(state.compositionState);

	// Mutate tracks directly - filter out deleted items from each track
	currentTimeline.tracks.forEach((track) => {
		track.items = track.items.filter((itemId) => !idsToDelete.includes(itemId));
	});

	// Remove empty tracks directly
	// Note: We need to mutate the array in place for composites
	const tracksToKeep = currentTimeline.tracks.filter(
		(track) => track.items.length > 0,
	);
	currentTimeline.tracks.splice(
		0,
		currentTimeline.tracks.length,
		...tracksToKeep,
	);

	// Delete items directly from the items object
	for (const id of idsToDelete) {
		delete currentTimeline.items[id];
	}

	// Get orphaned assets after items are deleted
	const orphanedAssetIds = getOrphanedAssetIds({
		items: state.compositionState.items,
		assets: state.compositionState.assets,
	});

	// Delete orphaned assets and track them for cleanup
	for (const assetId of orphanedAssetIds) {
		const asset = state.compositionState.assets[assetId.id];
		if (!asset) {
			throw new Error('Asset not found');
		}

		// Check if already in deletedAssets
		const exists = state.compositionState.deletedAssets.find(
			(deletedAsset) => deletedAsset.assetId === assetId.id,
		);

		if (!exists) {
			// Push to deletedAssets directly
			state.compositionState.deletedAssets.push({
				assetId: assetId.id,
				remoteUrl: asset.remoteUrl,
				remoteFileKey: asset.remoteFileKey,
				statusAtDeletion: state.assetStatus[assetId.id],
			});
		}

		// Delete asset directly
		delete state.compositionState.assets[assetId.id];
	}

	// Update UI store - filter out deleted items from selection
	const currentSelectedItems = useUIStore.getState().selectedItems;
	const newSelectedItems = currentSelectedItems.filter(
		(id: string) => !idsToDelete.includes(id),
	);

	// Update itemsBeingTrimmed in UI store
	const currentItemsBeingTrimmed = useUIStore.getState().itemsBeingTrimmed;
	useUIStore
		.getState()
		.setItemsBeingTrimmed(
			currentItemsBeingTrimmed.filter((i) => !idsToDelete.includes(i.itemId)),
		);

	// Update selection in UI store
	useUIStore.getState().setSelectedItems(newSelectedItems);
};
