import {IsAnImageError, parseMedia} from '@remotion/media-parser';
import {ExternalAssetErrorCode, ImageAsset} from '../../assets/assets';
import {setLocalUrl} from '../../caching/load-to-blob-url';
import {byDefaultKeepAspectRatioMap} from '../../utils/aspect-ratio';
import {calculateMediaDimensionsForCanvas} from '../../utils/dimension-utils';
import {generateRandomId} from '../../utils/generate-random-id';
import {ImageItem} from './image-item-type';

type ExternalImageResult = {
	item: ImageItem;
	asset: ImageAsset;
	errorCode: ExternalAssetErrorCode | null;
};

// Default dimensions when we can't extract metadata
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1920;

const extractFilenameFromUrl = (url: string): string => {
	try {
		const pathname = new URL(url).pathname;
		const segments = pathname.split('/');
		const lastSegment = segments[segments.length - 1];
		// If it looks like a filename with extension, use it
		if (lastSegment && lastSegment.includes('.')) {
			return lastSegment;
		}
		// Otherwise use a generic name
		return 'external-image';
	} catch {
		return 'external-image';
	}
};

const getMimeTypeFromUrl = (url: string): string => {
	try {
		const pathname = new URL(url).pathname.toLowerCase();
		if (pathname.endsWith('.png')) return 'image/png';
		if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg'))
			return 'image/jpeg';
		if (pathname.endsWith('.webp')) return 'image/webp';
		if (pathname.endsWith('.gif')) return 'image/gif';
		if (pathname.endsWith('.svg')) return 'image/svg+xml';
		if (pathname.endsWith('.bmp')) return 'image/bmp';
		return 'image/unknown';
	} catch {
		return 'image/unknown';
	}
};

export const makeExternalImageItem = async ({
	url,
	currentFrame,
	fps,
	compositionWidth,
	compositionHeight,
}: {
	url: string;
	currentFrame: number;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
}): Promise<ExternalImageResult> => {
	const assetId = generateRandomId('asset');
	const itemId = generateRandomId('image');
	const durationInFrames = fps * 2;
	const filename = extractFilenameFromUrl(url);
	const mimeType = getMimeTypeFromUrl(url);

	let width: number | null = null;
	let height: number | null = null;
	let errorCode: ExternalAssetErrorCode | null = null;

	// Try to extract metadata using @remotion/media-parser
	try {
		await parseMedia({
			src: url,
			fields: {
				dimensions: true,
			},
			acknowledgeRemotionLicense: true,
		});
		// If we get here for an image, something went wrong
		// parseMedia throws IsAnImageError for images
	} catch (error) {
		if (error instanceof IsAnImageError) {
			// Successfully parsed image metadata
			if (error.dimensions) {
				width = error.dimensions.width;
				height = error.dimensions.height;
			}
		} else if (error instanceof Error) {
			// Check for CORS error
			if (
				error.message.includes('Failed to fetch') ||
				error.message.includes('CORS') ||
				error.message.includes('NetworkError') ||
				error.message.includes('cross-origin')
			) {
				errorCode = 'CORS';
			} else if (
				error.message.includes('network') ||
				error.message.includes('timeout')
			) {
				errorCode = 'NETWORK';
			} else {
				errorCode = 'CORS'; // Default to CORS for unknown fetch errors
			}
		}
	}

	// Set the URL as the local URL for the asset (for preview)
	setLocalUrl(assetId, url);

	// Calculate dimensions for canvas placement
	const effectiveWidth = width ?? DEFAULT_WIDTH;
	const effectiveHeight = height ?? DEFAULT_HEIGHT;

	const content = calculateMediaDimensionsForCanvas({
		mediaWidth: effectiveWidth,
		mediaHeight: effectiveHeight,
		containerWidth: compositionWidth,
		containerHeight: compositionHeight,
		dropPosition: null,
	});

	const asset: ImageAsset = {
		id: assetId,
		type: 'image',
		filename,
		remoteUrl: url,
		remoteFileKey: null, // No S3 key for external URLs
		size: 0, // Unknown size
		mimeType,
		width,
		height,
		isExternal: true,
		externalErrorCode: errorCode,
	};

	const item: ImageItem = {
		id: itemId,
		durationInFrames,
		top: content.top,
		left: content.left,
		width: content.width,
		height: content.height,
		from: currentFrame,
		type: 'image',
		opacity: 1,
		borderRadius: 0,
		rotation: 0,
		assetId: asset.id,
		isDraggingInTimeline: false,
		keepAspectRatio: byDefaultKeepAspectRatioMap.image,
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

	return {item, asset, errorCode};
};
