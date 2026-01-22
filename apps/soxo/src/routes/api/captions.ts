import {getAwsClient} from '@remotion/lambda/client';
import {
	OpenAiVerboseTranscription,
	openAiWhisperApiToCaptions,
} from '@remotion/openai-whisper';
import OpenAI from 'openai';
import {GetCaptionsResponse} from '../../editor/captioning/types';
import {requireServerEnv} from '../../editor/utils/server-env';
import {Route} from './+types/captions';

export const action = async ({request}: Route.ActionArgs) => {
	try {
		const serverEnv = requireServerEnv();

		if (!serverEnv.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY is not set');
		}

		const openai = new OpenAI({
			apiKey: serverEnv.OPENAI_API_KEY,
		});

		const json = await request.json();

		if (!json.fileKey) {
			throw new Error('fileKey is required');
		}

		const {client, sdk} = getAwsClient({
			region: serverEnv.REMOTION_AWS_REGION,
			service: 's3',
		});

		const command = new sdk.GetObjectCommand({
			Bucket: serverEnv.REMOTION_AWS_BUCKET_NAME,
			Key: json.fileKey,
		});

		const response = await client.send(command);
		if (!response.Body) {
			throw new Error('No file content received from S3');
		}

		const arrayBuffer = await response.Body.transformToByteArray();
		// @ts-ignore: Blob constructor accepts ArrayBuffer
		const blob = new Blob([arrayBuffer], {type: 'audio/wav'});
		const file = new File([blob], 'audio.wav', {type: 'audio/wav'});

		const transcription = await openai.audio.transcriptions.create({
			file: file,
			model: 'whisper-1',
			response_format: 'verbose_json',
			timestamp_granularities: ['word'],
		});

		const {captions} = openAiWhisperApiToCaptions({
			transcription: transcription as OpenAiVerboseTranscription,
		});

		// Delete the audio file from S3 after successful processing
		const deleteCommand = new sdk.DeleteObjectCommand({
			Bucket: serverEnv.REMOTION_AWS_BUCKET_NAME,
			Key: json.fileKey,
		});

		await client.send(deleteCommand);

		const captionResponse: GetCaptionsResponse = {
			captions,
		};

		return Response.json(captionResponse);
	} catch (error) {
		 
		console.error('Captions API error:', error);
		return Response.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'Caption service unavailable',
			},
			{status: 500},
		);
	}
};
