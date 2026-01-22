import {EditorStarterAsset} from '../assets/assets';
import {ChildTimelineItem} from '../items/composite/composite-item-type';
import {generateRandomId} from '../utils/generate-random-id';
import {
	InstantiatedTemplate,
	TemplateDefinition,
	TemplateInstantiationParams,
} from './template-types';

/**
 * Instantiates a template by:
 * 1. Generating new unique IDs for all items, tracks, and assets
 * 2. Remapping all references (item IDs in tracks, asset IDs in items)
 * 3. Scaling durations based on target FPS
 *
 * This allows the same template to be added multiple times,
 * each instance having unique IDs.
 */
export function instantiateTemplate(
	template: TemplateDefinition,
	params: TemplateInstantiationParams,
): InstantiatedTemplate {
	const {fps} = params;

	// Build ID mappings: templateId -> newId
	const itemIdMap = new Map<string, string>();
	const trackIdMap = new Map<string, string>();
	const assetIdMap = new Map<string, string>();

	// Generate new IDs for all items
	for (const itemId of Object.keys(template.childTimeline.items)) {
		itemIdMap.set(itemId, generateRandomId('misc'));
	}

	// Generate new IDs for all tracks
	for (const track of template.childTimeline.tracks) {
		trackIdMap.set(track.id, generateRandomId('track'));
	}

	// Generate new IDs for all assets (if any)
	if (template.assets) {
		for (const assetId of Object.keys(template.assets)) {
			assetIdMap.set(assetId, generateRandomId('asset'));
		}
	}

	// Calculate FPS scale factor (templates assume 30fps)
	const fpsScale = fps / 30;

	// Build a map of old item ID -> old track ID for trackId assignment
	const itemToTrackMap = new Map<string, string>();
	for (const track of template.childTimeline.tracks) {
		for (const itemId of track.items) {
			itemToTrackMap.set(itemId, track.id);
		}
	}

	// Clone and remap items (with new trackId)
	const newItems: Record<string, ChildTimelineItem> = {};
	for (const [oldId, item] of Object.entries(template.childTimeline.items)) {
		const newId = itemIdMap.get(oldId)!;
		const oldTrackId = itemToTrackMap.get(oldId);
		const newTrackId = oldTrackId ? trackIdMap.get(oldTrackId) : undefined;
		const clonedItem = cloneAndRemapItem(
			item,
			newId,
			assetIdMap,
			fpsScale,
			newTrackId,
		);
		newItems[newId] = clonedItem;
	}

	// Clone and remap tracks
	const newTracks = template.childTimeline.tracks.map((track) => ({
		id: trackIdMap.get(track.id)!,
		items: track.items.map((itemId) => itemIdMap.get(itemId)!),
		hidden: track.hidden,
		muted: track.muted,
	}));

	// Clone and remap assets
	const newAssets: Record<string, EditorStarterAsset> = {};
	if (template.assets) {
		for (const [oldId, asset] of Object.entries(template.assets)) {
			const newId = assetIdMap.get(oldId)!;
			newAssets[newId] = {
				...asset,
				id: newId,
			};
		}
	}

	// Scale duration based on FPS
	const scaledDuration = Math.round(
		template.defaultDurationInFrames * fpsScale,
	);

	return {
		childTimeline: {
			tracks: newTracks,
			items: newItems,
		},
		assets: newAssets,
		scaledDuration,
	};
}

/**
 * Clone an item with a new ID and remap asset references.
 * Also scales frame-based durations to target FPS and sets trackId.
 */
function cloneAndRemapItem(
	item: ChildTimelineItem,
	newId: string,
	assetIdMap: Map<string, string>,
	fpsScale: number,
	newTrackId?: string,
): ChildTimelineItem {
	// Deep clone the item
	const cloned = JSON.parse(JSON.stringify(item)) as ChildTimelineItem;

	// Update the ID
	cloned.id = newId;

	// Set the trackId if provided
	if (newTrackId) {
		cloned.trackId = newTrackId;
	}

	// Scale frame-based properties
	cloned.from = Math.round(cloned.from * fpsScale);
	cloned.durationInFrames = Math.round(cloned.durationInFrames * fpsScale);

	// Remap asset ID if present
	if ('assetId' in cloned && cloned.assetId) {
		const newAssetId = assetIdMap.get(cloned.assetId);
		if (newAssetId) {
			(cloned as {assetId: string}).assetId = newAssetId;
		}
	}

	return cloned;
}
