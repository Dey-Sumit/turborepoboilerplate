import {
	BaseItem,
	CanHaveBorderRadius,
	CanHaveCrop,
	CanHaveRotation,
} from '../shared';

export type VideoItem = BaseItem &
	CanHaveBorderRadius &
	CanHaveCrop &
	CanHaveRotation & {
		type: 'video';
		videoStartFromInSeconds: number;
		decibelAdjustment: number;
		playbackRate: number;
		audioFadeInDurationInSeconds: number;
		audioFadeOutDurationInSeconds: number;
		fadeInDurationInSeconds: number;
		fadeOutDurationInSeconds: number;
		assetId: string;
		keepAspectRatio: boolean;
		/** Reference to the generated caption asset (if captions were generated for this video) */
		captionAssetId?: string;
		/** Reference to the generated scene caption asset (if scene captions were generated for this video) */
		sceneCaptionAssetId?: string;
	};
