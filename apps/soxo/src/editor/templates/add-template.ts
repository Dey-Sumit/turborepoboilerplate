
// @ts-nocheck
// NOTE: The following imports and the design of this file were implemented as part of a proof-of-concept (POC).
// There may be issues related to TypeScript types, correctness, and long-term maintainability.
// This code needs a careful review to address any TypeScript errors and architectural concerns before production use.

import useUIStore from '../../zustand/ui-store';
import {makeCompositeItem} from '../items/composite/make-composite-item';
import {addAssetToState} from '../state/actions/add-asset-to-state';

import {addItem} from '../state/actions/add-item';
import {EditorState} from '../state/types';
import {generateRandomId} from '../utils/generate-random-id';
import {VariableTemplate, compileTemplate} from './templates-library';

/**
 * Adds a variable template to the current timeline.
 *
 * Supports all item types: composite, solid, text, image, video, audio, gif, captions, code.
 * The template is compiled with user-provided variable values and runtime context (canvas dimensions).
 * Assets are added to state and marked as uploaded (they use existing URLs).
 */
export const addVariableTemplate = ({
	state,
	template,
	variableValues = {},
	playheadPosition,
}: {
	state: EditorState;
	template: VariableTemplate;
	variableValues?: Record<string, unknown>;
	playheadPosition: number;
}): void => {
	// Compile the template with user values
	const compiledItem = compileTemplate(template, variableValues) as Record<
		string,
		unknown
	> & {
		id: string;
		childTimeline?: {
			items?: Record<string, Record<string, unknown>>;
			tracks?: {items: string[]}[];
		};
		assets?: Record<string, Record<string, unknown>>;
	};

	// Generate a new ID for the compiled item
	compiledItem.id = generateRandomId('template');

	// Handle composite-specific logic (assets and child items)
	if (template.type === 'composite' && compiledItem.childTimeline) {
		const childTimeline = compiledItem.childTimeline;

		// Regenerate IDs for all child items
		if (childTimeline.items) {
			const oldToNewIdMap: Record<string, string> = {};

			for (const [oldId, item] of Object.entries(childTimeline.items)) {
				const newId = generateRandomId('composite');
				oldToNewIdMap[oldId] = newId;
				item.id = newId;
			}

			// Update track references to use new IDs
			if (childTimeline.tracks) {
				for (const track of childTimeline.tracks) {
					track.items = track.items.map(
						(oldId: string) => oldToNewIdMap[oldId] || oldId,
					);
				}
			}
		}

		// Regenerate IDs for assets
		if (compiledItem.assets) {
			const oldToNewAssetIdMap: Record<string, string> = {};

			for (const [oldId, asset] of Object.entries(compiledItem.assets)) {
				const newId = generateRandomId('asset');
				oldToNewAssetIdMap[oldId] = newId;
				asset.id = newId;

				// Add asset to state
				addAssetToState({state, asset});
				// Mark as uploaded since template assets already have valid URLs
				state.assetStatus[asset.id] = {type: 'uploaded'};
			}

			// Update asset references in child items
			if (childTimeline.items) {
				for (const item of Object.values(
					childTimeline.items,
				)) {
					if (item.assetId && oldToNewAssetIdMap[item.assetId]) {
						item.assetId = oldToNewAssetIdMap[item.assetId];
					}
				}
			}
		}
	}

	// Set position and timing from compiled template
	compiledItem.from = playheadPosition;

	// For composite items, create using makeCompositeItem
	let finalItem = compiledItem;
	if (template.type === 'composite') {
		finalItem = makeCompositeItem({
			childTimeline: compiledItem.childTimeline,
			from: playheadPosition,
			durationInFrames: compiledItem.durationInFrames,
			left: compiledItem.left,
			top: compiledItem.top,
			width: compiledItem.width,
			height: compiledItem.height,
			name: template.metadata.name,
		});
	}

	// Add the item to the current timeline
	addItem({
		state,
		item: finalItem,
		position: {type: 'front'},
	});

	// Select the new item (outside of state mutation)
	useUIStore.getState().setSelectedItems([finalItem.id]);
};

/**
 * Legacy function for backward compatibility with old template system.
 * @deprecated Use addVariableTemplate instead
 */
export const addTemplate = ({
	state: _state,
	template: _template,
	playheadPosition: _playheadPosition,
}: {
	state: EditorState;
	template: unknown; // Legacy TemplateDefinition (deprecated)
	playheadPosition: number;
}): void => {
	// This would need to be updated to handle old template format
	throw new Error(
		'Legacy addTemplate function. Use addVariableTemplate instead.',
	);
};
