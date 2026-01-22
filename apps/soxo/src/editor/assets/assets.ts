import {Caption} from '@remotion/captions';

export type AssetUploadProgress = {
	progress: number;
	loadedBytes: number;
	totalBytes: number;
};

export type AssetState =
	| {
			type: 'pending-upload';
	  }
	| {
			type: 'in-progress';
			progress: AssetUploadProgress;
	  }
	| {
			type: 'uploaded';
	  }
	| {
			type: 'error';
			error: Error;
			canRetry: boolean;
	  };

export type AssetUploadTask = {
	type: 'uploading';
	assetId: string;
	asset: EditorStarterAsset;
	status: AssetUploadProgress;
	startedAt: number;
	id: string;
};

// Error codes for external asset metadata extraction
export type ExternalAssetErrorCode = 'CORS' | 'NETWORK' | 'INVALID_URL';

type BaseAsset = {
	filename: string;
	id: string;
	size: number;
	remoteUrl: string | null;
	remoteFileKey: string | null;
	mimeType: string;
	// External URL support
	isExternal?: boolean;
	externalErrorCode?: ExternalAssetErrorCode | null;
};

export type ImageAsset = BaseAsset & {
	type: 'image';
	width: number | null;
	height: number | null;
};

export type VideoAsset = BaseAsset & {
	type: 'video';
	durationInSeconds: number;
	hasAudioTrack: boolean;
	width: number;
	height: number;
};

export type GifAsset = BaseAsset & {
	type: 'gif';
	durationInSeconds: number;
	width: number;
	height: number;
};

export type AudioAsset = BaseAsset & {
	type: 'audio';
	durationInSeconds: number;
};

export type CaptionAsset = BaseAsset & {
	type: 'caption';
	captions: Caption[];
	/** Reference to the source audio/video asset this caption was generated from */
	sourceAssetId?: string;
	/** Reference to the scene caption asset generated from this caption (if scene captions were generated) */
	sceneCaptionAssetId?: string;
};

/** Scene caption data types - AI-enriched captions grouped by scenes */
export type SceneCaption = {
	id: string;
	startMs: number;
	endMs: number;
	text: string;
	timestampMs: number;
};

export type SceneCaptionGroup = {
	groupId: string;
	text: string;
	startMs: number;
	endMs: number;
	totalMs: number;
	captions: SceneCaption[];
};

export type SceneCaptionSegment = {
	segmentId: string;
	fullText: string;
	adjustedStartMs: number;
	adjustedEndMs: number;
	adjustedTotalMs: number;
	originalStartMs: number;
	originalEndMs: number;
	originalTotalMs: number;
	groups: SceneCaptionGroup[];
};

export type SceneCaptionAsset = BaseAsset & {
	type: 'scene-caption';
	/** AI-enriched scene caption segments */
	segments: SceneCaptionSegment[];
	/** Reference to the source audio/video asset */
	sourceAssetId: string;
	/** Reference to the original raw caption asset */
	captionAssetId: string;
};

export type EditorStarterAsset =
	| ImageAsset
	| VideoAsset
	| GifAsset
	| AudioAsset
	| CaptionAsset
	| SceneCaptionAsset;
