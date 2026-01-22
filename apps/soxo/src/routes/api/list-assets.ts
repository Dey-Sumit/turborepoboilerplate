import {AwsRegion} from '@remotion/lambda';
import {getAwsClient} from '@remotion/lambda/client';
import {requireServerEnv} from '../../editor/utils/server-env';
import {getEndPoint} from './upload';

export interface S3Asset {
	key: string;
	size: number;
	lastModified: string;
	contentType: string;
	url: string;
	category: 'image' | 'video' | 'audio' | 'gif' | 'other';
}

export interface ListAssetsResponse {
	assets: S3Asset[];
	totalCount: number;
}

export interface ListAssetsErrorResponse {
	error: string;
}

const getAssetCategory = (
	contentType: string,
	key: string,
): S3Asset['category'] => {
	if (contentType.startsWith('image/gif') || key.endsWith('.gif')) {
		return 'gif';
	}
	if (contentType.startsWith('image/')) {
		return 'image';
	}
	if (contentType.startsWith('video/')) {
		return 'video';
	}
	if (contentType.startsWith('audio/')) {
		return 'audio';
	}
	return 'other';
};

const listS3Objects = async ({
	bucketName,
	region,
}: {
	bucketName: string;
	region: AwsRegion;
}): Promise<S3Asset[]> => {
	const {REMOTION_AWS_TRANSFER_ACCELERATION} = requireServerEnv();

	const {client, sdk} = getAwsClient({
		region,
		service: 's3',
	});

	const transferAcceleration =
		REMOTION_AWS_TRANSFER_ACCELERATION === 'true' ||
		REMOTION_AWS_TRANSFER_ACCELERATION === '1';

	const endpoint = getEndPoint({
		bucketName,
		region,
		transferAcceleration,
	});

	const command = new sdk.ListObjectsV2Command({
		Bucket: bucketName,
	});

	const response = await client.send(command);

	if (!response.Contents) {
		return [];
	}

	// Get metadata for each object to determine content type
	const assetsWithMetadata = await Promise.all(
		response.Contents.map(async (obj) => {
			if (!obj.Key) return null;

			try {
				const headCommand = new sdk.HeadObjectCommand({
					Bucket: bucketName,
					Key: obj.Key,
				});
				const headResponse = await client.send(headCommand);

				const contentType = headResponse.ContentType || 'application/octet-stream';

				return {
					key: obj.Key,
					size: obj.Size || 0,
					lastModified: obj.LastModified?.toISOString() || '',
					contentType,
					url: `${endpoint}/${obj.Key}`,
					category: getAssetCategory(contentType, obj.Key),
				} satisfies S3Asset;
			} catch {
				// If we can't get metadata, skip this object
				return null;
			}
		}),
	);

	return assetsWithMetadata.filter((asset): asset is S3Asset => asset !== null);
};

export const loader = async () => {
	try {
		const serverEnv = requireServerEnv();

		const assets = await listS3Objects({
			bucketName: serverEnv.REMOTION_AWS_BUCKET_NAME,
			region: serverEnv.REMOTION_AWS_REGION,
		});

		// Sort by lastModified descending (newest first)
		assets.sort((a, b) =>
			new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
		);

		return Response.json({
			assets,
			totalCount: assets.length,
		} satisfies ListAssetsResponse);
	} catch (error) {
		 
		console.error('List assets API error:', error);

		return Response.json(
			{
				error: 'Failed to list assets',
			} satisfies ListAssetsErrorResponse,
			{status: 500},
		);
	}
};
