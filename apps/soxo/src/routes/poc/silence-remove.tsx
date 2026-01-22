'use client';

import {useEffect, useRef, useState} from 'react';
import {Label} from '../../components/ui/label';
import {Input as InputComponent} from '../../components/ui/input';
import {Button} from '../../components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '../../components/ui/card';
import {
	Input,
	ALL_FORMATS,
	BlobSource,
	Output,
	AudioSample,
	WavOutputFormat,
	BufferTarget,
	AudioSampleSource,
} from 'mediabunny';
import {AudioSampleSink} from 'mediabunny'; // For raw PCM samples
// =========================================
// HELPER FUNCTIONS
// =========================================
/**
 * Remove silence frame ranges from one audio chunk
 */
function cutSilenceFromChunk(
	data: Float32Array,
	chunkStartFrame: number,
	silences: {startFrame: number; endFrame: number}[],
): Float32Array {
	const kept = [];
	for (let i = 0; i < data.length; i++) {
		const frame = chunkStartFrame + i;
		const isSilent = silences.some(
			(s) => frame >= s.startFrame && frame < s.endFrame,
		);
		if (!isSilent) kept.push(data[i]);
	}
	return new Float32Array(kept);
}

/**
 * Calculates RMS (energy) over a window of samples
 * @param samples - Float32Array channel data
 * @param start - Starting index
 * @param length - Window size
 */
function calculateRMS(
	samples: Float32Array,
	start: number,
	length: number,
): number {
	let sum = 0;
	for (let i = start; i < start + length; i++) {
		sum += samples[i] * samples[i];
	}
	return Math.sqrt(sum / length);
}

/**
 * Analyzes one audio sample for silence windows
 * @returns silence segments in this sample only
 */
function analyzeSampleSilence(
	channelData: Float32Array,
	currentFrame: number,
	silenceThreshold: number,
	windowSize: number,
	windowStep: number,
	minSilenceMs: number,
	sampleRate: number,
): {startFrame: number; endFrame: number}[] {
	const silenceSegments: {startFrame: number; endFrame: number}[] = [];
	let silenceStartFrame = -1;
	let windowCount = 0;
	let silentWindowCount = 0;

	for (
		let windowStart = 0;
		windowStart < channelData.length;
		windowStart += windowStep
	) {
		const windowEnd = Math.min(windowStart + windowSize, channelData.length);
		const actualWindowSize = windowEnd - windowStart;
		const rms = calculateRMS(channelData, windowStart, actualWindowSize);
		const isSilent = rms < silenceThreshold;

		windowCount++;
		if (isSilent) silentWindowCount++;

		// Debug logging for first sample only
		if (
			SAMPLE_RMS_LOGGING &&
			currentFrame === 0 &&
			windowStart < 5 * WINDOW_STEP
		) {
			console.log(
				`   Window ${windowCount} [${windowStart}-${windowEnd}]: RMS=${rms.toFixed(6)} ${isSilent ? 'SILENT' : 'audio'}`,
			);
		}

		if (isSilent) {
			if (silenceStartFrame === -1) {
				silenceStartFrame = currentFrame + windowStart;
			}
		} else {
			if (silenceStartFrame !== -1) {
				const candidateSegment = {
					startFrame: silenceStartFrame,
					endFrame: currentFrame + windowStart,
				};
				const durationMs =
					((candidateSegment.endFrame - candidateSegment.startFrame) /
						sampleRate) *
					1000;
				const meetsMinimum = meetsMinDuration(
					candidateSegment,
					minSilenceMs,
					sampleRate,
				);

				if (SAMPLE_RMS_LOGGING && currentFrame === 0) {
					console.log(
						`   → Silence candidate: ${candidateSegment.startFrame}-${candidateSegment.endFrame} (${durationMs.toFixed(1)}ms) - ${meetsMinimum ? 'KEPT' : 'REJECTED (too short)'}`,
					);
				}

				if (meetsMinimum) {
					silenceSegments.push(candidateSegment);
				} else {
					// Track rejected segments
					rejectedSegmentsCount++;
					rejectedSegmentsDurations.push(durationMs);
				}
				silenceStartFrame = -1;
			}
		}
	}

	// Handle silence that extends to end of sample
	if (silenceStartFrame !== -1) {
		const candidateSegment = {
			startFrame: silenceStartFrame,
			endFrame: currentFrame + channelData.length,
		};
		if (meetsMinDuration(candidateSegment, minSilenceMs, sampleRate)) {
			silenceSegments.push(candidateSegment);
		}
	}

	// Log summary for first few samples
	if (SAMPLE_RMS_LOGGING && currentFrame < 5 * 1152) {
		console.log(
			`Sample analysis complete: ${silentWindowCount}/${windowCount} windows silent, ${silenceSegments.length} segments found`,
		);
	}

	return silenceSegments;
}

/**
 * Checks if silence segment meets minimum duration requirement
 */
function meetsMinDuration(
	segment: {startFrame: number; endFrame: number},
	minSilenceMs: number,
	sampleRate: number,
): boolean {
	const durationMs =
		((segment.endFrame - segment.startFrame) / sampleRate) * 1000;
	return durationMs >= minSilenceMs;
}
const SILENCE_THRESHOLD = 0.005; // Lower: more sensitive
const SAMPLE_RMS_LOGGING = true; // Debug

const WINDOW_SIZE = 512; // ~12ms windows
const WINDOW_STEP = 256; // 50% overlap

// Global counter for rejected segments (for debugging)
let rejectedSegmentsCount = 0;
let rejectedSegmentsDurations: number[] = [];
const SilenceRemove = () => {
	const [file, setFile] = useState<File | null>(null);
	const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
	const [minSilenceDuration, setMinSilenceDuration] = useState(0.02);
	const [processing, setProcessing] = useState(false);
	const inputRef = useRef<Input | null>(null);
	const debugLogRef = useRef<HTMLDivElement>(null);
	const [result, setResult] = useState<{
		originalDuration: number;
		processedDuration: number;
		downloadUrl: string;
	} | null>(null);
	const [metadata, setMetadata] = useState<{
		size: string;
		duration?: number;
		track?: {
			sampleRate: number;
			channels: number;
			codec: string | null; // Allow null
		};
	} | null>(null);

	const [error, setError] = useState<string | null>(null);
	const [debugLog, setDebugLog] = useState<string[]>([]);

	// Debug logger helper
	const addLog = (message: string) => {
		console.log(message);
		setDebugLog((prev) => [...prev, message]);
	};

	// Auto-scroll debug log to bottom when new logs are added
	useEffect(() => {
		if (debugLogRef.current) {
			debugLogRef.current.scrollTop = debugLogRef.current.scrollHeight;
		}
	}, [debugLog]);

	// Cleanup blob URLs on unmount to prevent memory leaks
	useEffect(() => {
		return () => {
			if (originalAudioUrl) {
				URL.revokeObjectURL(originalAudioUrl);
			}
			if (result?.downloadUrl) {
				URL.revokeObjectURL(result.downloadUrl);
			}
		};
	}, [originalAudioUrl, result?.downloadUrl]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile || !selectedFile.type.startsWith('audio/')) {
			setError('Please select a valid audio file.');
			setFile(null);
			setMetadata(null);
			setResult(null);
			setOriginalAudioUrl(null);
			return;
		}

		setFile(selectedFile);
		setMetadata(null);
		setError(null);
		setResult(null);

		// Create blob URL for audio player
		const audioUrl = URL.createObjectURL(selectedFile);
		setOriginalAudioUrl(audioUrl);

		try {
			const input = new Input({
				source: new BlobSource(selectedFile),
				formats: ALL_FORMATS,
			});

			// Display file metadata
			const duration = await input.computeDuration();
			setMetadata({
				size: formatFileSize(selectedFile.size),
				duration: duration ?? undefined,
			});

			// Extract audio track info (Step 4 preview)
			const audioTrack = await input.getPrimaryAudioTrack();
			if (audioTrack) {
				setMetadata((prev) =>
					prev
						? {
								...prev,
								track: {
									sampleRate: audioTrack.sampleRate,
									channels: audioTrack.numberOfChannels,
									codec: audioTrack.codec ?? 'unknown', // Handle null
								},
							}
						: null,
				);
				inputRef.current = input;
			} else {
				throw new Error('No audio track found in file');
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to read file';
			setError(message);
			console.error('File read error:', err);
		}
	};

	const handleProcess = async () => {
		// =========================================
		// EARLY VALIDATION (Early returns)
		// =========================================
		if (!file) {
			setError('No file selected.');
			return;
		}
		if (!inputRef.current) {
			setError('No valid audio input loaded. Please select a file first.');
			return;
		}

		// =========================================
		// SETUP
		// =========================================
		setProcessing(true);
		setError(null);
		setResult(null);
		setDebugLog([]); // Clear previous logs

		try {
			const input = inputRef.current;

			// =========================================
			// STEP 4: GET audio TRACK
			// =========================================
			addLog('📂 Step 4: Loading audio track...');
			const audioTrack = await input.getPrimaryAudioTrack();
			if (!audioTrack) {
				setError('No audio track found in file.');
				return;
			}

			const duration = await input.computeDuration();
			addLog(
				`✅ Audio track loaded: ${audioTrack.numberOfChannels}ch, ${audioTrack.sampleRate}Hz, ${duration?.toFixed(1)}s`,
			);

			// =========================================
			// STEP 6: SILENCE DETECTION PARAMETERS
			// =========================================
			const MIN_SILENCE_MS = minSilenceDuration * 1000; // User setting
			addLog('🔍 Step 6: Starting silence detection...');
			addLog(`   Threshold: ${SILENCE_THRESHOLD}`);
			addLog(`   Min duration: ${MIN_SILENCE_MS}ms`);
			addLog(`   Window size: ${WINDOW_SIZE} samples`);

			const silenceSegments: {startFrame: number; endFrame: number}[] = [];

			// =========================================
			// STEP 6: 1ST PASS - DETECT SILENCE SEGMENTS
			// =========================================
			addLog('🔍 1st pass: Detecting silence segments...');

			// Reset rejected segments tracking
			rejectedSegmentsCount = 0;
			rejectedSegmentsDurations = [];

			const detectSink = new AudioSampleSink(audioTrack);
			let detectFrame = 0;
			let sampleCount = 0;
			let minRMS = Infinity;
			let maxRMS = -Infinity;
			const rmsValues: number[] = [];

			for await (const sample of detectSink.samples()) {
				const audioBuffer = sample.toAudioBuffer();
				const channelData = audioBuffer.getChannelData(0);

				// Calculate RMS for this entire sample to show in logs
				const sampleRMS = calculateRMS(channelData, 0, channelData.length);

				// Track RMS statistics
				minRMS = Math.min(minRMS, sampleRMS);
				maxRMS = Math.max(maxRMS, sampleRMS);
				rmsValues.push(sampleRMS);

				// Log first few samples with RMS values
				if (sampleCount < 5) {
					addLog(
						`   Sample ${sampleCount}: ${channelData.length} frames, RMS: ${sampleRMS.toFixed(6)}, ${sampleRMS < SILENCE_THRESHOLD ? 'SILENT' : 'audio'}`,
					);
				}

				// Analyze this sample for silence windows
				const sampleSilences = analyzeSampleSilence(
					channelData,
					detectFrame,
					SILENCE_THRESHOLD,
					WINDOW_SIZE,
					WINDOW_STEP,
					MIN_SILENCE_MS,
					audioTrack.sampleRate,
				);

				if (sampleSilences.length > 0) {
					addLog(
						`   Sample ${sampleCount}: Found ${sampleSilences.length} silence segment(s)`,
					);
				}

				silenceSegments.push(...sampleSilences);

				detectFrame += channelData.length;
				sampleCount++;
				sample.close();
			}

			// Calculate RMS statistics
			const sortedRMS = [...rmsValues].sort((a, b) => a - b);
			const p10 = sortedRMS[Math.floor(sortedRMS.length * 0.1)];
			const p50 = sortedRMS[Math.floor(sortedRMS.length * 0.5)];
			const avgRMS =
				rmsValues.reduce((sum, val) => sum + val, 0) / rmsValues.length;

			addLog(
				`✅ 1st pass complete: Analyzed ${sampleCount} samples, ${detectFrame} total frames`,
			);
			addLog(`   RMS Statistics:`);
			addLog(`      Min RMS: ${minRMS.toFixed(6)}`);
			addLog(`      10th percentile: ${p10.toFixed(6)}`);
			addLog(`      Median RMS: ${p50.toFixed(6)}`);
			addLog(`      Average RMS: ${avgRMS.toFixed(6)}`);
			addLog(`      Max RMS: ${maxRMS.toFixed(6)}`);
			addLog(`      Current threshold: ${SILENCE_THRESHOLD}`);
			addLog(`   Found ${silenceSegments.length} silence segments`);

			// Provide helpful suggestion if no silence found
			if (silenceSegments.length === 0 && p10 > SILENCE_THRESHOLD) {
				const suggestedThreshold = (p10 * 1.5).toFixed(6);
				addLog('');
				addLog(`💡 SUGGESTION: No silence detected with current threshold.`);
				addLog(`   Your quietest parts have RMS ~${p10.toFixed(6)}`);
				addLog(`   Try increasing the threshold to ~${suggestedThreshold}`);
				addLog(`   (Edit line 118: SILENCE_THRESHOLD = ${suggestedThreshold})`);
			}

			// Show rejected segments statistics
			if (rejectedSegmentsCount > 0) {
				const avgRejected =
					rejectedSegmentsDurations.reduce((sum, d) => sum + d, 0) /
					rejectedSegmentsCount;
				const maxRejected = Math.max(...rejectedSegmentsDurations);
				addLog('');
				addLog(
					`   🚫 Rejected ${rejectedSegmentsCount} silence segments (too short):`,
				);
				addLog(`      Average duration: ${avgRejected.toFixed(1)}ms`);
				addLog(`      Longest rejected: ${maxRejected.toFixed(1)}ms`);
				addLog(`      Current minimum: ${MIN_SILENCE_MS}ms`);
			}

			if (silenceSegments.length > 0) {
				addLog('');
				addLog('   ✅ Silence segments (meeting minimum duration):');
				silenceSegments.forEach((seg, i) => {
					const durationMs =
						((seg.endFrame - seg.startFrame) / audioTrack.sampleRate) * 1000;
					addLog(
						`      ${i + 1}. Frames ${seg.startFrame}-${seg.endFrame} (${durationMs.toFixed(0)}ms)`,
					);
				});
			} else {
				addLog('');
				addLog(
					'   ⚠️ No silence segments met the minimum duration requirement',
				);
				addLog(
					`   Try reducing minimum silence duration to < ${MIN_SILENCE_MS}ms`,
				);
			}

			// =========================================
			// STEP 7: 2ND PASS - CUT SILENCE FRAMES
			// =========================================
			addLog('✂️ Step 7: Cutting silence from audio...');

			if (silenceSegments.length === 0) {
				addLog('⚠️  No silence segments found - keeping original audio');
			}

			const keptAudioChunks: Float32Array[] = [];
			let currentFrame = 0; // FIX: Use cumulative frame counting like 1st pass

			const cutSink = new AudioSampleSink(audioTrack);
			let cutSampleCount = 0;

			for await (const sample of cutSink.samples()) {
				const audioBuffer = sample.toAudioBuffer();
				const channelData = audioBuffer.getChannelData(0);

				// FIX: Use cumulative frame count, not timestamp-based
				const sampleStartFrame = currentFrame;
				const sampleEndFrame = currentFrame + channelData.length;

				// Log first sample in cutting pass
				if (cutSampleCount === 0) {
					addLog(
						`   First cut sample: frames ${sampleStartFrame}-${sampleEndFrame}`,
					);
				}

				// Check if this sample overlaps any silence
				const overlappingSegments = silenceSegments.filter((seg) => {
					return (
						sampleStartFrame < seg.endFrame && sampleEndFrame > seg.startFrame
					);
				});

				if (overlappingSegments.length === 0) {
					// KEEP WHOLE SAMPLE
					keptAudioChunks.push(channelData.slice());
					if (cutSampleCount < 3) {
						addLog(
							`   Sample ${cutSampleCount}: KEPT (no silence overlap) - ${channelData.length} frames`,
						);
					}
				} else {
					// CUT SILENCE PORTIONS FROM THIS SAMPLE
					addLog(
						`   Sample ${cutSampleCount}: Overlaps ${overlappingSegments.length} silence segment(s)`,
					);

					const keptChunk = cutSilenceFromChunk(
						channelData,
						sampleStartFrame,
						silenceSegments,
					);

					if (keptChunk.length > 0) {
						keptAudioChunks.push(keptChunk);
						addLog(
							`      Kept ${keptChunk.length}/${channelData.length} frames after cutting`,
						);
					} else {
						addLog(`      Entire sample was silence - discarded`);
					}
				}

				currentFrame += channelData.length;
				cutSampleCount++;
				sample.close();
			}

			const totalKeptLength = keptAudioChunks.reduce(
				(sum, chunk) => sum + chunk.length,
				0,
			);

			addLog(
				`✅ Step 7 complete: Processed ${cutSampleCount} samples, kept ${keptAudioChunks.length} chunks`,
			);
			addLog(`   Total kept frames: ${totalKeptLength}/${currentFrame}`);

			// Store globally for Step 8 encoding
			(window as unknown as Record<string, unknown>).keptAudioChunks =
				keptAudioChunks;
			(window as unknown as Record<string, unknown>).finalSampleRate =
				audioTrack.sampleRate;

			// =========================================
			// FINAL STATISTICS
			// =========================================
			const totalSilenceFrames = silenceSegments.reduce(
				(sum, seg) => sum + (seg.endFrame - seg.startFrame),
				0,
			);

			const originalDuration = currentFrame / audioTrack.sampleRate;
			const processedDuration = totalKeptLength / audioTrack.sampleRate;
			const removedDuration =
				(currentFrame - totalKeptLength) / audioTrack.sampleRate;
			const removedPercent = (
				(removedDuration / originalDuration) *
				100
			).toFixed(1);

			addLog('');
			addLog('📊 === SILENCE REMOVAL SUMMARY ===');
			addLog(`   Original duration: ${originalDuration.toFixed(2)}s`);
			addLog(`   Processed duration: ${processedDuration.toFixed(2)}s`);
			addLog(`   Removed: ${removedDuration.toFixed(2)}s (${removedPercent}%)`);
			addLog(`   Silence frames removed: ${totalSilenceFrames}`);
			addLog(`   Kept frames: ${totalKeptLength}`);
			addLog('✅ Processing complete!');

			// =========================================
			// STEP 8: ENCODE TO WAV IMMEDIATELY
			// =========================================
			addLog('');
			addLog('💾 Step 8: Encoding to WAV...');

			// Concatenate all chunks
			const concatenated = new Float32Array(totalKeptLength);
			let offset = 0;
			for (const chunk of keptAudioChunks) {
				concatenated.set(chunk, offset);
				offset += chunk.length;
			}

			// Create WAV output
			const target = new BufferTarget();
			const output = new Output({
				format: new WavOutputFormat(),
				target,
			});

			const audioSource = new AudioSampleSource({
				codec: 'pcm-f32',
			});

			output.addAudioTrack(audioSource);
			await output.start();

			// Create and add audio sample
			const audioSample = new AudioSample({
				data: concatenated,
				format: 'f32-planar',
				numberOfChannels: 1,
				sampleRate: audioTrack.sampleRate,
				timestamp: 0,
				duration: totalKeptLength / audioTrack.sampleRate,
			});

			await audioSource.add(audioSample);
			audioSample.close();
			audioSource.close();

			await output.finalize();

			const buffer = output.target.buffer;
			if (!buffer) {
				throw new Error('Failed to get audio buffer');
			}
			const blob = new Blob([buffer], {type: 'audio/wav'});
			const downloadUrl = URL.createObjectURL(blob);

			addLog(`✅ Encoding complete! Size: ${formatFileSize(blob.size)}`);

			// Set result with audio ready to play
			setResult({
				originalDuration: Math.round(originalDuration),
				processedDuration: Math.round(processedDuration),
				downloadUrl,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Processing failed';
			setError(message);
			addLog(`❌ Error: ${message}`);
			console.error('❌ Process error:', err);
		} finally {
			setProcessing(false);
		}
	};

	const handleDownload = async () => {
		addLog('');
		addLog('💾 Step 8: Encoding processed audio to WAV...');

		try {
			// Retrieve stored audio data
			const keptAudioChunks = (window as unknown as Record<string, unknown>)
				.keptAudioChunks as Float32Array[];
			const finalSampleRate = (window as unknown as Record<string, unknown>)
				.finalSampleRate as number;

			if (!keptAudioChunks || !finalSampleRate) {
				setError('No processed audio data found. Please process audio first.');
				return;
			}

			addLog(
				`   Concatenating ${keptAudioChunks.length} audio chunks into single buffer...`,
			);

			// Concatenate all chunks into one Float32Array
			const totalLength = keptAudioChunks.reduce(
				(sum, chunk) => sum + chunk.length,
				0,
			);
			const concatenated = new Float32Array(totalLength);
			let offset = 0;
			for (const chunk of keptAudioChunks) {
				concatenated.set(chunk, offset);
				offset += chunk.length;
			}

			addLog(`   Total samples: ${totalLength}`);
			addLog(`   Creating WAV output with BufferTarget...`);

			// Create BufferTarget to accumulate output
			const target = new BufferTarget();

			// Create Output for WAV file
			const output = new Output({
				format: new WavOutputFormat(),
				target,
			});

			addLog(`   Setting up audio source with PCM-F32 codec...`);

			// Create AudioSampleSource with PCM codec for WAV
			const audioSource = new AudioSampleSource({
				codec: 'pcm-f32', // 32-bit float PCM for WAV
			});

			// Add audio track with the source
			output.addAudioTrack(audioSource);

			// Start the output
			addLog(`   Starting output...`);
			await output.start();

			addLog(`   Encoding audio data...`);

			// Create AudioSample from concatenated data and feed it
			const audioSample = new AudioSample({
				data: concatenated,
				format: 'f32-planar',
				numberOfChannels: 1,
				sampleRate: finalSampleRate,
				timestamp: 0,
				duration: totalLength / finalSampleRate,
			});

			// Feed the sample to the source
			await audioSource.add(audioSample);
			audioSample.close();

			// Close the source to signal end of stream
			audioSource.close();

			// Finalize output
			addLog(`   Finalizing WAV file...`);
			await output.finalize();

			// Get buffer from target and create blob
			const buffer = output.target.buffer;
			if (!buffer) {
				throw new Error('Failed to get audio buffer from output');
			}
			const blob = new Blob([buffer], {type: 'audio/wav'});

			addLog(`✅ Encoding complete! File size: ${formatFileSize(blob.size)}`);

			// Create blob URL for download and audio player
			const url = URL.createObjectURL(blob);

			// Update result with processed audio URL
			setResult((prev) => (prev ? {...prev, downloadUrl: url} : null));

			// Also trigger download
			const a = document.createElement('a');
			a.href = url;
			a.download = `${file?.name.replace(/\.[^/.]+$/, '')}_silence_removed.wav`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			addLog(`💾 Download started: ${a.download}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Download failed';
			setError(message);
			addLog(`❌ Download error: ${message}`);
			console.error('Download error:', err);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-8">
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle className="text-2xl">Audio Silence Removal</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* File Upload */}
					<div className="space-y-2">
						<Label htmlFor="audio-file">Audio File</Label>
						<InputComponent
							id="audio-file"
							type="file"
							accept="audio/*"
							onChange={handleFileChange}
							disabled={processing}
						/>
						{file && (
							<p className="text-muted-foreground text-sm">
								Selected: {file.name} ({formatFileSize(file.size)})
							</p>
						)}
					</div>

					{/* Silence Duration Input */}
					<div className="space-y-2">
						<Label htmlFor="silence-duration">
							Minimum Silence Duration (seconds)
						</Label>
						<InputComponent
							id="silence-duration"
							type="number"
							min="0.1"
							max="5"
							step="0.1"
							value={minSilenceDuration}
							onChange={(e) =>
								setMinSilenceDuration(parseFloat(e.target.value))
							}
							disabled={processing}
						/>
						<p className="text-muted-foreground text-sm">
							Silence shorter than this will be preserved
						</p>
					</div>

					{/* Process Button */}
					<Button
						onClick={handleProcess}
						disabled={!file || processing}
						className="w-full"
					>
						{processing ? 'Processing...' : 'Remove Silence'}
					</Button>

					{/* Error Display */}
					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4">
							<p className="text-sm text-red-700">❌ {error}</p>
						</div>
					)}

					{/* Processing Status */}
					{processing && (
						<div className="bg-muted rounded-lg p-4 text-center">
							<p className="text-sm">Processing your audio file...</p>
						</div>
					)}

					{/* Debug Log */}
					{debugLog.length > 0 && (
						<div className="absolute top-8 right-4 w-96 border border-gray-200 bg-slate-100 p-2 shadow-lg">
							<div
								className="h-[700px] space-y-1 overflow-y-auto border border-gray-200 bg-slate-50 p-2 font-mono text-xs shadow-2xl"
								ref={debugLogRef}
							>
								{debugLog.map((log, i) => (
									<div key={i} className="text-slate-700">
										{log}
									</div>
								))}
							</div>
						</div>
					)}

					{file && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Original Audio</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2 text-xs">
									<p className="text-muted-foreground">
										{file.name} ({metadata?.size})
									</p>
									{metadata?.duration && (
										<p className="text-muted-foreground">
											Duration: {metadata.duration.toFixed(1)}s
										</p>
									)}
									{metadata?.track && (
										<p className="text-muted-foreground">
											{metadata.track.channels}ch, {metadata.track.sampleRate}
											Hz, {metadata.track.codec}
										</p>
									)}
								</div>
								{originalAudioUrl && (
									<audio
										controls
										src={originalAudioUrl}
										className="w-full"
										preload="metadata"
									>
										Your browser does not support the audio element.
									</audio>
								)}
							</CardContent>
						</Card>
					)}

					{/* Results */}
					{result && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Processed Audio</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2 text-xs">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Original Duration:
										</span>
										<span className="font-medium">
											{result.originalDuration}s
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Processed Duration:
										</span>
										<span className="font-medium">
											{result.processedDuration}s
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Removed:</span>
										<span className="font-medium text-green-600">
											{result.originalDuration - result.processedDuration}s (
											{(
												((result.originalDuration - result.processedDuration) /
													result.originalDuration) *
												100
											).toFixed(1)}
											%)
										</span>
									</div>
								</div>

								{result.downloadUrl && (
									<audio
										controls
										src={result.downloadUrl}
										className="w-full"
										preload="metadata"
									>
										Your browser does not support the audio element.
									</audio>
								)}

								<Button
									className="w-full"
									variant="default"
									onClick={handleDownload}
								>
									Download Final Audio (WAV)
								</Button>
							</CardContent>
						</Card>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default SilenceRemove;
