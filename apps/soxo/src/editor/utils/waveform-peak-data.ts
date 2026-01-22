export type PeakLevel = {
	samplesPerPeak: number;
	peaks: Float32Array;
};

export type PeakData = {
	levels: PeakLevel[];
	originalSampleCount: number;
};

export type AudioDataWithPeaks = {
	channelWaveforms: Float32Array[];
	sampleRate: number;
	durationInSeconds: number;
	numberOfChannels: number;
	resultId: string;
	isRemote: boolean;
	peakData: PeakData;
};

/**
 * Generates peak data at multiple resolution levels for efficient waveform rendering
 */
export function generateDownsampledPeakData(rawPeaks: Float32Array): PeakData {
	const originalSampleCount = rawPeaks.length;

	// Define downsampling levels - each level reduces data by 10x
	const downsampleFactors = [10, 100, 1000, 10000];
	const levels: PeakLevel[] = [];

	for (const factor of downsampleFactors) {
		const samplesPerPeak = factor;
		const numPeaks = Math.ceil(originalSampleCount / samplesPerPeak);
		const peaks = new Float32Array(numPeaks);

		for (let i = 0; i < numPeaks; i++) {
			const startSample = i * samplesPerPeak;
			const endSample = Math.min(
				startSample + samplesPerPeak,
				originalSampleCount,
			);

			let peak = 0;
			for (let s = startSample; s < endSample; s++) {
				const value = Math.abs(rawPeaks[s]);
				if (value > peak) {
					peak = value;
				}
			}

			peaks[i] = peak;
		}

		levels.push({
			samplesPerPeak,
			peaks,
		});
	}

	return {
		levels,
		originalSampleCount,
	};
}

/**
 * Selects the best peak level for drawing the waveform
 *
 * GOAL: Find the right balance between visual quality and performance
 * - Too few peaks = blocky/square waveform (bad quality)
 * - Too many peaks = slow rendering (bad performance)
 *
 * SWEET SPOT: 0.5 to 4 peaks per pixel on screen
 */
export function selectPeakLevel(
	peakData: PeakData,
	visualWidth: number,
): PeakLevel {
	const minAcceptableRatio = 0.5;
	const maxAcceptableRatio = 4.0;

	let bestLevel = peakData.levels[0]; // Start with first level
	let bestScore = -Infinity;

	for (const level of peakData.levels) {
		const ratio = level.peaks.length / visualWidth;

		// Calculate score: prefer levels in acceptable range, then by efficiency
		let score: number;

		if (ratio >= minAcceptableRatio && ratio <= maxAcceptableRatio) {
			// in acceptable range: prefer fewer peaks (higher efficiency)
			score = 1000 - ratio; // Higher score for lower ratio
		} else if (ratio > maxAcceptableRatio) {
			// too dense: still usable but penalized
			score = 500 - ratio;
		} else {
			// too sparse: heavily penalized, prefer higher ratios
			score = ratio;
		}

		if (score > bestScore) {
			bestLevel = level;
			bestScore = score;
		}
	}

	return bestLevel;
}
