import {IsAnImageError, parseMedia} from '@remotion/media-parser';
import React, {useCallback, useState} from 'react';
import {Img} from 'remotion';
import '../../editor/editor-starter.css';
type ExtractedMetadata = {
	type: 'image' | 'video' | 'audio' | 'gif' | 'unknown';
	width?: number;
	height?: number;
	durationInSeconds?: number;
	mimeType?: string;
	hasAudioTrack?: boolean;
	videoCodec?: string | null;
	audioCodec?: string | null;
	container?: string | null;
	fps?: number | null;
	fileSize?: number | null;
};

type ExtractionState =
	| {status: 'idle'}
	| {status: 'validating'}
	| {status: 'extracting'; progress: number}
	| {status: 'success'; metadata: ExtractedMetadata; timeTaken: number}
	| {status: 'error'; error: string};

const isValidUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

const getImageTypeFromUrl = (url: string): 'gif' | 'image' | null => {
	const pathname = new URL(url).pathname.toLowerCase();
	if (pathname.endsWith('.gif')) return 'gif';
	if (
		pathname.endsWith('.png') ||
		pathname.endsWith('.jpg') ||
		pathname.endsWith('.jpeg') ||
		pathname.endsWith('.webp') ||
		pathname.endsWith('.svg') ||
		pathname.endsWith('.bmp')
	) {
		return 'image';
	}
	return null;
};

export default function ExternalAssetPOC() {
	const [url, setUrl] = useState('');
	const [state, setState] = useState<ExtractionState>({status: 'idle'});

	const handleExtractWithParser = useCallback(async () => {
		if (!url.trim()) {
			setState({status: 'error', error: 'Please enter a URL'});
			return;
		}

		setState({status: 'validating'});

		if (!isValidUrl(url)) {
			setState({
				status: 'error',
				error: 'Invalid URL format. Must be http:// or https://',
			});
			return;
		}

		setState({status: 'extracting', progress: 0});
		const startTime = performance.now();

		try {
			const metadata = await parseMedia({
				src: url,
				fields: {
					slowDurationInSeconds: true,
					dimensions: true,
					videoCodec: true,
					audioCodec: true,
					container: true,
					slowFps: true,
					size: true,
				},
				acknowledgeRemotionLicense: true,
			});

			const timeTaken = performance.now() - startTime;

			// Determine type based on codecs
			let type: ExtractedMetadata['type'] = 'unknown';
			if (metadata.videoCodec === null && metadata.audioCodec) {
				type = 'audio';
			} else if (metadata.videoCodec || metadata.dimensions) {
				type = 'video';
			}

			const extractedMetadata: ExtractedMetadata = {
				type,
				width: metadata.dimensions?.width,
				height: metadata.dimensions?.height,
				durationInSeconds: metadata.slowDurationInSeconds,
				hasAudioTrack: metadata.audioCodec !== null,
				videoCodec: metadata.videoCodec,
				audioCodec: metadata.audioCodec,
				container: metadata.container,
				fps: metadata.slowFps,
				fileSize: metadata.size,
			};

			setState({status: 'success', metadata: extractedMetadata, timeTaken});
		} catch (error) {
			const timeTaken = performance.now() - startTime;

			// Handle image case - parser throws IsAnImageError for images
			if (error instanceof IsAnImageError) {
				const imageType = error.imageType === 'gif' ? 'gif' : 'image';

				const extractedMetadata: ExtractedMetadata = {
					type: imageType,
					width: error.dimensions?.width,
					height: error.dimensions?.height,
					mimeType: error.mimeType ?? undefined,
				};

				setState({status: 'success', metadata: extractedMetadata, timeTaken});
				return;
			}

			setState({
				status: 'error',
				error:
					error instanceof Error ? error.message : 'Unknown error occurred',
			});
		}
	}, [url]);

	const handleExtractWithNative = useCallback(async () => {
		if (!url.trim()) {
			setState({status: 'error', error: 'Please enter a URL'});
			return;
		}

		setState({status: 'validating'});

		if (!isValidUrl(url)) {
			setState({
				status: 'error',
				error: 'Invalid URL format. Must be http:// or https://',
			});
			return;
		}

		// Check if URL is likely an image
		const imageTypeFromUrl = getImageTypeFromUrl(url);
		if (!imageTypeFromUrl) {
			setState({
				status: 'error',
				error:
					'Native extraction only works with image URLs (.png, .jpg, .jpeg, .webp, .svg, .bmp, .gif)',
			});
			return;
		}

		setState({status: 'extracting', progress: 0});
		const startTime = performance.now();

		try {
			const dimensions = await getImageDimensionsNative(url);
			const extractedMetadata: ExtractedMetadata = {
				type: imageTypeFromUrl,
				width: dimensions.width,
				height: dimensions.height,
			};
			setState({
				status: 'success',
				metadata: extractedMetadata,
				timeTaken: performance.now() - startTime,
			});
		} catch (error) {
			setState({
				status: 'error',
				error: error instanceof Error ? error.message : 'Failed to load image',
			});
		}
	}, [url]);

	return (
		<div className="min-h-screen p-8 text-white">
			<div className="mx-auto max-w-4xl">
				{/* Header */}
				<div className="mb-8 text-center">
					<h1 className="mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-4xl font-bold text-transparent">
						External Asset Extractor
					</h1>
					<p className="text-lg text-slate-300">
						Test @remotion/media-parser with external URLs to extract metadata
					</p>
				</div>

				{/* Image Examples Section */}
				<div className="mb-12 grid gap-8 md:grid-cols-2">
					{/* HTML Image Example */}
					<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
						<h3 className="mb-4 text-xl font-semibold text-blue-400">
							HTML &lt;img&gt; Tag
						</h3>
						<div className="aspect-video overflow-hidden rounded-lg bg-slate-700">
							{url ? (
								<img
									src={url}
									alt="Asset preview"
									className="h-full w-full object-cover"
									onError={(e) => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							) : (
								<div className="flex h-full items-center justify-center text-slate-500">
									<span className="text-sm">Enter URL above to preview</span>
								</div>
							)}
						</div>
						<p className="mt-3 text-sm text-slate-400">
							Standard HTML img element with native browser loading
						</p>
					</div>

					{/* Remotion Image Example */}
					<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
						<h3 className="mb-4 text-xl font-semibold text-purple-400">
							Remotion &lt;Img&gt; Component
						</h3>
						<div className="aspect-video overflow-hidden rounded-lg bg-slate-700">
							{url ? (
								<RemotionImageExample src={url} />
							) : (
								<div className="flex h-full items-center justify-center text-slate-500">
									<span className="text-sm">Enter URL above to preview</span>
								</div>
							)}
						</div>
						<p className="mt-3 text-sm text-slate-400">
							Remotion's optimized image component with lazy loading
						</p>
					</div>
				</div>

				{/* Main Content Card */}
				<div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-8 shadow-2xl backdrop-blur-sm">
					{/* URL Input */}
					<div className="mb-6">
						<label
							htmlFor="url-input"
							className="mb-3 block text-sm font-medium text-slate-200"
						>
							Asset URL
						</label>
						<input
							id="url-input"
							type="text"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://example.com/video.mp4"
							className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-4 text-white placeholder-slate-400 backdrop-blur-sm transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none"
						/>
					</div>

					{/* Extraction Methods */}
					<div className="mb-8 grid gap-6 md:grid-cols-2">
						{/* Media Parser Extraction */}
						<div className="rounded-lg border border-blue-700/50 bg-blue-900/10 p-4">
							<h3 className="mb-3 text-lg font-semibold text-blue-400">
								🔧 Media Parser Extraction
							</h3>
							<p className="mb-4 text-sm text-slate-300">
								Uses @remotion/media-parser for comprehensive metadata
								extraction. Supports videos, audio, and images.
							</p>
							<button
								onClick={handleExtractWithParser}
								disabled={
									state.status === 'extracting' || state.status === 'validating'
								}
								className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50"
							>
								{state.status === 'extracting' ||
								state.status === 'validating' ? (
									<div className="flex items-center justify-center space-x-2">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
										<span>Extracting...</span>
									</div>
								) : (
									'Extract with Parser'
								)}
							</button>
						</div>

						{/* Native Image Extraction */}
						<div className="rounded-lg border border-green-700/50 bg-green-900/10 p-4">
							<h3 className="mb-3 text-lg font-semibold text-green-400">
								🖼️ Native Image Extraction
							</h3>
							<p className="mb-4 text-sm text-slate-300">
								Uses native browser Image API for basic image dimensions. Images
								only.
							</p>
							<button
								onClick={handleExtractWithNative}
								disabled={
									state.status === 'extracting' || state.status === 'validating'
								}
								className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-500 hover:to-green-600 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50"
							>
								{state.status === 'extracting' ||
								state.status === 'validating' ? (
									<div className="flex items-center justify-center space-x-2">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
										<span>Extracting...</span>
									</div>
								) : (
									'Extract with Native'
								)}
							</button>
						</div>
					</div>

					{/* Progress */}
					{state.status === 'extracting' && (
						<div className="mb-8">
							<div className="mb-3 flex items-center justify-between text-sm">
								<span className="text-slate-300">Extracting metadata...</span>
								<span className="font-medium text-blue-400">
									{Math.round(state.progress)}%
								</span>
							</div>
							<div className="h-3 overflow-hidden rounded-full bg-slate-700">
								<div
									className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
									style={{width: `${state.progress}%`}}
								/>
							</div>
						</div>
					)}

					{/* Error */}
					{state.status === 'error' && (
						<div className="mb-8 rounded-xl border border-red-700/50 bg-red-900/20 p-6 backdrop-blur-sm">
							<div className="flex items-center space-x-3">
								<div className="flex-shrink-0">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/20">
										<svg
											className="h-4 w-4 text-red-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
								</div>
								<div>
									<p className="font-semibold text-red-400">
										Extraction Failed
									</p>
									<p className="text-sm text-red-300">{state.error}</p>
								</div>
							</div>
						</div>
					)}

					{/* Success - Metadata Display */}
					{state.status === 'success' && (
						<div className="rounded-xl border border-green-700/50 bg-green-900/10 p-6 backdrop-blur-sm">
							<div className="mb-6 flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600/20">
										<svg
											className="h-5 w-5 text-green-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
									<p className="text-xl font-semibold text-green-400">
										Extraction Successful
									</p>
								</div>
								<div className="rounded-full bg-slate-700 px-3 py-1 text-sm font-medium text-slate-300">
									{state.timeTaken.toFixed(0)}ms
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-3">
									<MetadataRow label="Type" value={state.metadata.type} />
									{state.metadata.width && state.metadata.height && (
										<MetadataRow
											label="Dimensions"
											value={`${state.metadata.width} × ${state.metadata.height}`}
										/>
									)}
									{state.metadata.durationInSeconds !== undefined && (
										<MetadataRow
											label="Duration"
											value={`${state.metadata.durationInSeconds.toFixed(2)}s`}
										/>
									)}
									{state.metadata.fps !== undefined &&
										state.metadata.fps !== null && (
											<MetadataRow
												label="FPS"
												value={state.metadata.fps.toFixed(2)}
											/>
										)}
									{state.metadata.mimeType && (
										<MetadataRow
											label="MIME Type"
											value={state.metadata.mimeType}
										/>
									)}
								</div>
								<div className="space-y-3">
									{state.metadata.container && (
										<MetadataRow
											label="Container"
											value={state.metadata.container}
										/>
									)}
									{state.metadata.videoCodec !== undefined && (
										<MetadataRow
											label="Video Codec"
											value={state.metadata.videoCodec ?? 'None'}
										/>
									)}
									{state.metadata.audioCodec !== undefined && (
										<MetadataRow
											label="Audio Codec"
											value={state.metadata.audioCodec ?? 'None'}
										/>
									)}
									{state.metadata.hasAudioTrack !== undefined && (
										<MetadataRow
											label="Has Audio"
											value={state.metadata.hasAudioTrack ? 'Yes' : 'No'}
										/>
									)}
									{state.metadata.fileSize !== undefined &&
										state.metadata.fileSize !== null && (
											<MetadataRow
												label="File Size"
												value={formatBytes(state.metadata.fileSize)}
											/>
										)}
								</div>
							</div>

							{/* Raw JSON */}
							<details className="mt-6">
								<summary className="cursor-pointer text-sm text-slate-400 transition-colors hover:text-slate-300">
									📄 View Raw JSON Data
								</summary>
								<pre className="mt-3 overflow-auto rounded-lg border border-slate-700 bg-slate-800/50 p-4 font-mono text-xs text-slate-300">
									{JSON.stringify(state.metadata, null, 2)}
								</pre>
							</details>
						</div>
					)}
				</div>

				{/* Sample URLs */}
				<div className="mt-12">
					<div className="mb-6 text-center">
						<h2 className="mb-2 text-2xl font-semibold text-slate-200">
							Sample Assets
						</h2>
						<p className="text-slate-400">
							Click any sample below to test metadata extraction
						</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{SAMPLE_URLS.map((sample) => (
							<button
								key={sample.url}
								onClick={() => setUrl(sample.url)}
								className="group rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-700/50"
							>
								<div className="flex items-center space-x-3">
									<div
										className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
											sample.type === 'video'
												? 'bg-blue-600/20 text-blue-400'
												: sample.type === 'image'
													? 'bg-green-600/20 text-green-400'
													: 'bg-purple-600/20 text-purple-400'
										}`}
									>
										{sample.type.toUpperCase()}
									</div>
									<span className="text-slate-300 transition-colors group-hover:text-white">
										{sample.label}
									</span>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

const MetadataRow: React.FC<{label: string; value: string | number}> = ({
	label,
	value,
}) => (
	<div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
		<span className="text-sm text-slate-400">{label}</span>
		<span className="font-mono text-sm text-white">{value}</span>
	</div>
);

const RemotionImageExample: React.FC<{src: string}> = ({src}) => {
	return (
		<Img
			src={src}
			style={{
				width: '100%',
				height: '100%',
				objectFit: 'cover',
			}}
		/>
	);
};

const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getImageDimensionsNative = (
	url: string,
): Promise<{width: number; height: number}> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			resolve({width: img.naturalWidth, height: img.naturalHeight});
		};
		img.onerror = () => {
			reject(new Error('Failed to load image'));
		};
		img.src = url;
	});
};

const SAMPLE_URLS = [
	{
		type: 'video',
		label: 'Big Buck Bunny (MP4)',
		url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
	},
	{
		type: 'video',
		label: 'Sintel Trailer (MP4)',
		url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
	},
	{
		type: 'image',
		label: 'Sample PNG Image',
		url: 'https://www.w3schools.com/css/img_5terre.jpg',
	},
	{
		type: 'image',
		label: 'Unsplash Random Image',
		url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800',
	},
];
