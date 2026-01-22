import {
	IsAnImageError,
	parseMediaOnWebWorker,
} from '@remotion/media-parser/worker';
import {PlayerRef} from '@remotion/player';
import {DropPosition} from '../assets/add-asset';
import {EditorStarterAsset} from '../assets/assets';
import {cacheAssetLocally} from '../caching/indexeddb';
import {setLocalUrl} from '../caching/load-to-blob-url';
import {generateRandomId} from '../utils/generate-random-id';
import {getSvgDimensions} from '../utils/get-svg-dimensions';
import {makeAudioItem} from './audio/make-audio-item';
import {makeGifItem} from './gif/make-gif-item';
import {makeImageItem} from './image/make-image-item';
import {EditorStarterItem} from './item-type';
import {makeVideoItem} from './video/make-video-item';

export const makeItem = async ({
	file,
	playerRef,
	dropPosition,
	fps,
	compositionWidth,
	compositionHeight,
	filename,
	remoteUrl,
	remoteFileKey,
}: {
	file: Blob;
	playerRef: React.RefObject<PlayerRef | null>;
	dropPosition: DropPosition | null;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
	remoteUrl: string | null;
	remoteFileKey: string | null;
	filename: string;
}): Promise<{item: EditorStarterItem; asset: EditorStarterAsset}> => {
	const assetId = generateRandomId('asset');
	const url = URL.createObjectURL(file);
	setLocalUrl(assetId, url);

	await cacheAssetLocally({
		assetId: assetId,
		value: file,
	});

	try {
		const metadata = await parseMediaOnWebWorker({
			src: file,
			fields: {
				slowDurationInSeconds: true,
				dimensions: true,
				videoCodec: true,
				audioCodec: true,
			},
			acknowledgeRemotionLicense: true,
		});

		if (metadata.videoCodec === null && metadata.audioCodec) {
			const {item, asset} = makeAudioItem({
				file,
				fps,
				durationInSeconds: metadata.slowDurationInSeconds,
				currentFrame: playerRef.current?.getCurrentFrame() ?? 0,
				size: file.size,
				assetId,
				filename,
				remoteUrl,
				remoteFileKey,
			});

			return {item, asset};
		}

		if (!metadata.dimensions) {
			throw new Error('cannot get video dimensions');
		}

		const {item, asset} = makeVideoItem({
			file,
			fps,
			compositionWidth,
			compositionHeight,
			durationInSeconds: metadata.slowDurationInSeconds,
			dimensions: metadata.dimensions,
			currentFrame: playerRef.current?.getCurrentFrame() ?? 0,
			dropPosition,
			assetId,
			hasAudioTrack: metadata.audioCodec !== null,
			filename,
			remoteUrl,
			remoteFileKey,
		});

		return {item, asset};
	} catch (error) {
		if (error instanceof IsAnImageError) {
			if (error.imageType === 'gif') {
				const {item, asset} = await makeGifItem({
					file,
					fps,
					compositionWidth,
					compositionHeight,
					currentFrame: playerRef.current?.getCurrentFrame() ?? 0,
					dropPosition,
					err: error,
					assetId,
					blobUrl: url,
					filename,
					remoteUrl,
					remoteFileKey,
				});
				return {item, asset};
			}

			if (!error.dimensions) {
				throw new Error('Could not get dimensions for image');
			}

			const {item, asset} = await makeImageItem({
				file,
				fps,
				compositionWidth,
				compositionHeight,
				currentFrame: playerRef.current?.getCurrentFrame() ?? 0,
				dropPosition,
				assetId,
				filename,
				remoteUrl,
				remoteFileKey,
				dimensions: error.dimensions,
			});

			return {item, asset};
		}

		if (file.type === 'image/svg+xml') {
			// handle svg
			// get svg dimensions
			const svgText = await file.text();
			const dimensions = getSvgDimensions(svgText);
			const {item, asset} = await makeImageItem({
				file,
				fps,
				compositionWidth,
				compositionHeight,
				currentFrame: playerRef.current?.getCurrentFrame() ?? 0,
				dropPosition,
				dimensions,
				assetId,
				filename,
				remoteUrl,
				remoteFileKey,
			});

			return {item, asset};
		}

		throw new Error('Unknown asset type');
	}
};
