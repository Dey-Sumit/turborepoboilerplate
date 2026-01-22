import {
	getRenderProgress,
	speculateFunctionName,
} from '@remotion/lambda/client';
import {
	GetProgressPayload,
	GetProgressResponse,
} from '../../editor/rendering/types';
import {requireServerEnv} from '../../editor/utils/server-env';
import {
	DISK_SIZE_IN_MB,
	MEM_SIZE_IN_MB,
	TIMEOUT_IN_SECONDS,
} from '../../remotion/constants';
import {Route} from './+types/progress';

export const action = async ({request}: Route.ActionArgs) => {
	try {
		const serverEnv = requireServerEnv();

		const body = (await request.json()) as GetProgressPayload;

		if (typeof body.bucketName !== 'string') {
			throw new Error('bucketName is not set');
		}

		if (typeof body.renderId !== 'string') {
			throw new Error('renderId is not set');
		}

		const progress = await getRenderProgress({
			bucketName: body.bucketName,
			renderId: body.renderId,
			functionName: speculateFunctionName({
				diskSizeInMb: DISK_SIZE_IN_MB,
				memorySizeInMb: MEM_SIZE_IN_MB,
				timeoutInSeconds: TIMEOUT_IN_SECONDS,
			}),
			region: serverEnv.REMOTION_AWS_REGION,
			// Can enable in 4.0.222
			skipLambdaInvocation: false,
		});

		if (progress.done) {
			const response: GetProgressResponse = {
				type: 'done',
				outputFile: progress.outputFile as string,
				outputSizeInBytes: progress.outputSizeInBytes as number,
				outputName:
					(progress.renderMetadata?.downloadBehavior.type === 'download'
						? progress.renderMetadata.downloadBehavior.fileName
						: null) ?? (progress.outKey as string),
			};

			return Response.json(response);
		}

		if (progress.fatalErrorEncountered) {
			const response: GetProgressResponse = {
				type: 'error',
				error: progress.errors[0].message,
			};

			return Response.json(response);
		}

		const response: GetProgressResponse = {
			type: 'in-progress',
			overallProgress: progress.overallProgress,
		};

		return Response.json(response);
	} catch (error) {
		 
		console.error('Progress API error:', error);
		return Response.json(
			{
				type: 'error',
				error:
					error instanceof Error
						? error.message
						: 'Progress service unavailable',
			} as GetProgressResponse,
			{status: 500},
		);
	}
};
