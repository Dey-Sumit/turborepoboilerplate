import React from 'react';
import {AssetState, EditorStarterAsset} from '../assets/assets';
import {CaptioningTask, SceneCaptioningTask} from '../captioning/caption-state';
import {EditorStarterItem} from '../items/item-type';
import {RenderingTask} from '../rendering/render-state';

// Re-export Transition type and schema from the central schemas file
export type {Transition} from '../items/schemas';
export {transitionSchema} from '../items/schemas';

// The shape of the state is explained here:
// https://remotion.dev/docs/editor-starter/state-management

export type TrackType = {
	items: string[];
	id: string;
	hidden: boolean;
	muted: boolean;
};

/**
 * TimelineViewStack tracks the current navigation path through the timeline hierarchy.
 *
 * - At root level: [{type: 'ROOT'}]
 * - Inside composite A: [{type: 'ROOT'}, {type: 'COMPOSITE', compositeId: 'A'}]
 * - Inside composite B (nested in A): [{type: 'ROOT'}, {type: 'COMPOSITE', compositeId: 'A'}, {type: 'COMPOSITE', compositeId: 'B'}]
 *
 * This stack is part of undoable state, so undo/redo naturally handles navigation.
 */
export type TimelineViewStackEntry =
	| {type: 'ROOT'}
	| {type: 'COMPOSITE'; compositeId: string};

export type TimelineViewStack = TimelineViewStackEntry[];

type DeletedAsset = {
	remoteUrl: string | null;
	remoteFileKey: string | null;
	assetId: string;
	statusAtDeletion: AssetState;
};

// Undoable state: https://remotion.dev/docs/editor-starter/state-management#undoable-state
export type compositionState = {
	tracks: TrackType[];
	assets: Record<string, EditorStarterAsset>;
	items: Record<string, EditorStarterItem>;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
	deletedAssets: DeletedAsset[];

	/**
	 * Navigation stack for composite editing.
	 * Tracks the current position in the timeline hierarchy.
	 * Default value: [{type: 'ROOT'}]
	 */
	timelineViewStack: TimelineViewStack;

	/**
	 * Styles applied to the composition root element (AbsoluteFill).
	 * Used for properties like background color.
	 */
	compositionRootStyles?: React.CSSProperties;
};

export type EditorState = {
	compositionState: compositionState;
	// selectedItems: MIGRATED TO ZUSTAND UI STORE
	// textItemEditing: MIGRATED TO ZUSTAND UI STORE
	// textItemHoverPreview: MIGRATED TO ZUSTAND UI STORE
	// itemSelectedForCrop: MIGRATED TO ZUSTAND UI STORE
	renderingTasks: RenderingTask[];
	captioningTasks: CaptioningTask[];
	sceneCaptioningTasks: SceneCaptioningTask[];
	initialized: boolean;
	// itemsBeingTrimmed: MIGRATED TO ZUSTAND UI STORE
	// loop: MIGRATED TO ZUSTAND UI STORE
	// timelineHeight: MIGRATED TO ZUSTAND UI STORE
	assetStatus: Record<string, AssetState>;
	// isSnappingEnabled: MIGRATED TO ZUSTAND UI STORE
	// activeSnapPoint: MIGRATED TO ZUSTAND UI STORE
	// activeCanvasSnapPoints: MIGRATED TO ZUSTAND UI STORE
};

