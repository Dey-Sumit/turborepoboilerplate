import {BaseItem} from '../shared';

export type AudioItem = BaseItem & {
	type: 'audio';
	audioStartFromInSeconds: number;
	decibelAdjustment: number;
	playbackRate: number;
	audioFadeInDurationInSeconds: number;
	audioFadeOutDurationInSeconds: number;
	assetId: string;
	/** Reference to the generated caption asset (if captions were generated for this audio) */
	captionAssetId?: string;
	/** Reference to the generated scene caption asset (if scene captions were generated for this audio) */
	sceneCaptionAssetId?: string;
};
