import {getGifDurationInSeconds} from '@remotion/gif';
import {IsAnImageError} from '@remotion/media-parser';
import {DropPosition} from '../../assets/add-asset';
import {GifAsset} from '../../assets/assets';
import {cacheAssetLocally} from '../../caching/indexeddb';
import {byDefaultKeepAspectRatioMap} from '../../utils/aspect-ratio';
import {calculateMediaDimensionsForCanvas} from '../../utils/dimension-utils';
import {generateRandomId} from '../../utils/generate-random-id';
import {GifItem} from './gif-item-type';

export const makeGifItem = async ({
	file,
	currentFrame,
	dropPosition,
	err,
	assetId,
	blobUrl,
	fps,
	compositionWidth,
	compositionHeight,
	filename,
	remoteUrl,
	remoteFileKey,
}: {
	file: Blob;
	currentFrame: number;
	dropPosition: DropPosition | null;
	err: IsAnImageError;
	assetId: string;
	blobUrl: string;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
	remoteUrl: string | null;
	remoteFileKey: string | null;
	filename: string;
}): Promise<{item: GifItem; asset: GifAsset}> => {
	const id = generateRandomId('gif');
	await cacheAssetLocally({
		assetId: id,
		value: file,
	});
	const duration = await getGifDurationInSeconds(blobUrl);

	const durationInFrames = Math.floor(duration * fps);

	if (!err.dimensions) {
		throw new Error('No dimensions found for gif');
	}

	const content = calculateMediaDimensionsForCanvas({
		mediaWidth: err.dimensions.width,
		mediaHeight: err.dimensions.height,
		containerWidth: compositionWidth,
		containerHeight: compositionHeight,
		dropPosition,
	});

	const asset: GifAsset = {
		id: assetId,
		type: 'gif',
		durationInSeconds: duration,
		filename: filename,
		remoteUrl,
		remoteFileKey,
		size: file.size,
		mimeType: file.type,
		width: err.dimensions.width,
		height: err.dimensions.height,
	};

	const item: GifItem = {
		id,
		durationInFrames,
		gifStartFromInSeconds: 0,
		top: content.top,
		left: content.left,
		width: content.width,
		height: content.height,
		from: currentFrame,
		type: 'gif',
		opacity: 1,
		borderRadius: 0,
		rotation: 0,
		playbackRate: 1,
		assetId: asset.id,
		isDraggingInTimeline: false,
		keepAspectRatio: byDefaultKeepAspectRatioMap.gif,
		fadeInDurationInSeconds: 0,
		fadeOutDurationInSeconds: 0,
		cropLeft: 0,
		cropTop: 0,
		cropRight: 0,
		cropBottom: 0,
		transition: {
			toNext: undefined,
			toPrev: undefined,
		},
	};

	return {item, asset};
};
