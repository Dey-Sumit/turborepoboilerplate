import {EditorStarterAsset} from '../assets/assets';
import {ChildTimeline} from '../items/composite/composite-item-type';

/**
 * Template definition - pure JSON data, no functions.
 * Can be stored in a database and fetched remotely.
 */
export type TemplateDefinition = {
	/** Unique identifier for the template */
	id: string;
	/** Display name shown in the dropdown */
	name: string;
	/** Brief description of what the template does */
	description: string;
	/** Category for grouping templates */
	category: 'lower-third' | 'intro' | 'outro' | 'overlay' | 'transition';
	/** Preview thumbnail (optional - can be a data URL or path) */
	thumbnail?: string;
	/** Default duration in frames (at 30fps, will be scaled to target FPS) */
	defaultDurationInFrames: number;
	/** Default width of the composite */
	width: number;
	/** Default height of the composite */
	height: number;
	/**
	 * The child timeline data - items and tracks.
	 * IDs here are "template IDs" that will be remapped to unique IDs on instantiation.
	 */
	childTimeline: ChildTimeline;
	/**
	 * Assets used by items in this template.
	 * Keys are "template asset IDs" referenced by items' assetId.
	 * On instantiation, these get new IDs and are added to state.
	 */
	assets?: Record<string, EditorStarterAsset>;
};

/**
 * Parameters passed when instantiating a template.
 */
export type TemplateInstantiationParams = {
	/** Target FPS for the composition */
	fps: number;
	/** Composition width (for positioning) */
	compositionWidth: number;
	/** Composition height (for positioning) */
	compositionHeight: number;
	/** Current playhead position in frames */
	playheadPosition: number;
};

/**
 * Result of instantiating a template.
 * Contains the remapped child timeline and assets ready to add to state.
 */
export type InstantiatedTemplate = {
	/** Child timeline with all IDs remapped to unique values */
	childTimeline: ChildTimeline;
	/** Assets with new IDs, ready to add to state */
	assets: Record<string, EditorStarterAsset>;
	/** Scaled duration based on target FPS */
	scaledDuration: number;
};
