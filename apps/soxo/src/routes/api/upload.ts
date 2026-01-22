import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {AwsRegion} from '@remotion/lambda';
import {getAwsClient} from '@remotion/lambda/client';
import {
	PresignErrorCode,
	PresignErrorResponse,
	PresignResponse,
} from '../../editor/assets/types';
import {formatBytes} from '../../editor/utils/format-bytes';
import {requireServerEnv} from '../../editor/utils/server-env';
import {Route} from './+types/upload';

interface GetFileUrlParams {
	key: string;
	bucketName: string;
	region: AwsRegion;
	transferAcceleration: boolean;
}

export const getEndPoint = ({
	bucketName,
	region,
	transferAcceleration,
}: {
	bucketName: string;
	region: AwsRegion;
	transferAcceleration: boolean;
}) => {
	if (transferAcceleration) {
		return `https://${bucketName}.s3-accelerate.amazonaws.com`;
	}

	return `https://${bucketName}.s3.${region}.amazonaws.com`;
};

export const getReadUrl = ({
	key,
	bucketName,
	region,
	transferAcceleration,
}: GetFileUrlParams) => {
	return `${getEndPoint({bucketName, region, transferAcceleration})}/${key}`;
};

export interface UploadResponse {
	presignedUrl: string;
	readUrl: string;
	fileKey: string;
}

export interface UploadErrorResponse {
	code: PresignErrorCode;
	message: string;
}

class UploadError extends Error {
	code: PresignErrorCode;

	constructor(code: PresignErrorCode, message: string) {
		super(message);
		this.name = 'UploadError';
		this.code = code;
	}
}

const generatePresignedUrl = async ({
	contentType,
	contentLength,
	expiresIn,
	bucketName,
	region,
}: {
	contentType: string;
	contentLength: number;
	expiresIn: number;
	bucketName: string;
	region: AwsRegion;
}): Promise<PresignResponse> => {
	const {REMOTION_AWS_TRANSFER_ACCELERATION} = requireServerEnv();

	const {client, sdk} = getAwsClient({
		region,
		service: 's3',
	});

	const fileKey = crypto.randomUUID();

	const command = new sdk.PutObjectCommand({
		Bucket: bucketName,
		Key: fileKey,
		ACL: 'public-read',
		ContentLength: contentLength,
		ContentType: contentType,
	});

	const presignedUrl = await getSignedUrl(client, command, {
		expiresIn,
	});

	const transferAcceleration =
		REMOTION_AWS_TRANSFER_ACCELERATION === 'true' ||
		REMOTION_AWS_TRANSFER_ACCELERATION === '1';

	// The location of the asset after the upload
	const readUrl = getReadUrl({
		key: fileKey,
		bucketName,
		region,
		transferAcceleration,
	});

	return {presignedUrl, readUrl, fileKey};
};

const MAX_FILE_UPLOAD_SIZE_IN_MB = 1000;

export const action = async ({request}: Route.ActionArgs) => {
	try {
		const serverEnv = requireServerEnv();

		const json = await request.json();
		if (!Number.isFinite(json.size)) {
			throw new Error('size is not a number');
		}
		if (typeof json.contentType !== 'string') {
			throw new Error('contentType is not a string');
		}

		if (json.size > 1024 * 1024 * MAX_FILE_UPLOAD_SIZE_IN_MB) {
			return Response.json(
				{
					code: 'FILE_TOO_LARGE',
					message: `File may not be over ${MAX_FILE_UPLOAD_SIZE_IN_MB}MB. Yours is ${formatBytes(json.size)}.`,
				},
				{status: 413},
			);
		}

		const response = await generatePresignedUrl({
			contentType: json.contentType,
			contentLength: json.size,
			expiresIn: 60 * 60 * 24 * 7,
			bucketName: serverEnv.REMOTION_AWS_BUCKET_NAME,
			region: serverEnv.REMOTION_AWS_REGION,
		});

		return Response.json(response);
	} catch (error) {
		if (error instanceof UploadError) {
			return Response.json(
				{
					code: error.code,
					message: error.message,
				},
				{status: 400},
			);
		}

		const errorResponse: PresignErrorResponse = {
			code: 'UNKNOWN_ERROR',
			message: 'Upload service unavailable',
		};

		 
		console.error('Upload API error:', error);
		return Response.json(errorResponse, {status: 500});
	}
};
