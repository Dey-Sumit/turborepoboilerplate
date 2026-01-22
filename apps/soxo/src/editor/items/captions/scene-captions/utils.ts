import {Caption} from '@remotion/captions';

interface CleanCaption {
	id: string;
	endMs: number;
	startMs: number;
	text: string;
	timestampMs: number;
}

// Cleaning the caption to give id, make the units rounded and add missing timestamps(appx), and removing the confidence field(not needed)
export function cleanCaptions(rawCaptions: Caption[]): CleanCaption[] {
	return rawCaptions.map((caption, index) => ({
		id: `cc-${index + 1}`,
		endMs: Math.round(caption.endMs),
		startMs: Math.round(caption.startMs),
		text: caption.text,
		timestampMs: Math.round(
			caption.timestampMs || (caption.startMs + caption.endMs) / 2,
		),
	}));
}

/**
 * Group of captions that render together as a unit
 * Improves UX by reducing individual word animations
 */
interface CaptionGroup {
	captions: CleanCaption[]; // Individual captions in this group
	totalMs: number; // Duration of the entire group
	startMs: number; // When this group starts rendering
	endMs: number; // When this group stops rendering
}

interface Segment {
	id: string; // Unique segment identifier with prefix
	fullText: string; // Complete text of the segment
	captions: CleanCaption[]; // Individual word captions
	totalMs: number; // Original segment duration
	startMs: number; // Original start time
	endMs: number; // Original end time
	adjustedStartMs: number; // Gap-adjusted start time
	adjustedEndMs: number; // Gap-adjusted end time
	adjustedTotalMs: number; // Gap-adjusted total duration
	captionsGroup: CaptionGroup[]; // Grouped captions for animation
}

export function createSegments(captions: CleanCaption[]): {
	segments: Segment[];
	fullRawText: string;
} {
	const segments: Segment[] = [];
	let currentCaptions: CleanCaption[] = [];
	let segmentCounter = 1;

	// Construct the full raw text, including all punctuation, before segmenting
	const fullRawText = captions
		.map((c) => c.text)
		.join(' ')
		.trim();

	for (let i = 0; i < captions.length; i++) {
		const caption = captions[i];
		const nextCaption = captions[i + 1];

		const hasPeriod = caption.text.includes('.');

		// Check if period is a REAL sentence boundary or just part of a word like "Next.js"
		let isRealSentenceBoundary = false;

		if (hasPeriod) {
			if (nextCaption) {
				// Check if next word starts with capital letter (indicates new sentence)
				const nextTextTrimmed = nextCaption.text.trim();
				const firstChar = nextTextTrimmed.charAt(0);
				const isCapitalized =
					firstChar === firstChar.toUpperCase() &&
					firstChar !== firstChar.toLowerCase();

				isRealSentenceBoundary = isCapitalized;
			} else {
				// Last caption with period is a sentence boundary
				isRealSentenceBoundary = true;
			}
		}

		// Add caption to current segment
		if (hasPeriod && !isRealSentenceBoundary) {
			// Period is part of a word (like "Next.js") - remove it
			const textWithoutPeriod = caption.text.replace('.', '');
			currentCaptions.push({
				...caption,
				text: textWithoutPeriod.trim(),
			});
		} else {
			// Keep text as-is (with punctuation preserved)
			currentCaptions.push({
				...caption,
				text: caption.text.trim(),
			});
		}

		// ONLY create segment at real sentence boundary (period + capital next word)
		// Commas are ignored - let AI handle comma-based grouping
		if (isRealSentenceBoundary) {
			if (currentCaptions.length > 0) {
				const fullText = currentCaptions
					.map((cap) => cap.text)
					.join(' ')
					.trim();
				const startMs = currentCaptions[0].startMs;
				const endMs = currentCaptions[currentCaptions.length - 1].endMs;
				const totalMs = endMs - startMs;

				segments.push({
					id: `segment-${segmentCounter++}`,
					fullText,
					captions: currentCaptions,
					totalMs,
					startMs,
					endMs,
					adjustedStartMs: startMs,
					adjustedEndMs: endMs,
					adjustedTotalMs: totalMs,
					captionsGroup: [],
				});
				currentCaptions = [];
			}
		}
	}

	// Handle remaining captions
	if (currentCaptions.length > 0) {
		const fullText = currentCaptions
			.map((cap) => cap.text)
			.join(' ')
			.trim();
		const startMs = currentCaptions[0].startMs;
		const endMs = currentCaptions[currentCaptions.length - 1].endMs;
		const totalMs = endMs - startMs;

		segments.push({
			id: `segment-${segmentCounter++}`,
			fullText,
			captions: currentCaptions,
			totalMs,
			startMs,
			endMs,
			adjustedStartMs: startMs,
			adjustedEndMs: endMs,
			adjustedTotalMs: totalMs,
			captionsGroup: [],
		});
	}

	// Gap adjustment logic (same as before)
	for (let i = 0; i < segments.length; i++) {
		const currentSegment = segments[i];
		const nextSegment = segments[i + 1];

		if (nextSegment) {
			const gap = nextSegment.startMs - currentSegment.endMs;
			if (gap > 0) {
				const halfGap = gap / 2;
				currentSegment.adjustedEndMs = currentSegment.endMs + halfGap;
				nextSegment.adjustedStartMs = nextSegment.startMs - halfGap;
			}
		}
	}

	segments.forEach((segment) => {
		segment.adjustedTotalMs = segment.adjustedEndMs - segment.adjustedStartMs;
	});

	return {segments, fullRawText};
}

/**
 * Repairs problematic caption timestamps within segments
 * Only fixes genuinely broken captions (zero or very short duration)
 * Preserves original Whisper timing - captions show only when words are spoken
 * @param segments - Array of segments with adjusted timing (segments are continuous, but captions preserve gaps)
 * @returns Array of segments with repaired caption timestamps
 */
export function repairSegmentTimestamps(segments: Segment[]): Segment[] {
	return segments.map((segment) => {
		const captions = [...segment.captions]; // Create a copy to avoid mutation

		// Fix genuinely broken captions without creating overlaps
		for (let index = 0; index < captions.length; index++) {
			const caption = captions[index];
			const duration = caption.endMs - caption.startMs;

			// Only fix broken captions (zero or very short duration)
			if (duration === 0 || duration < 50) {
				const nextCaption = captions[index + 1];

				// Calculate desired minimum duration (dynamic based on severity)
				const desiredDuration = duration === 0 ? 150 : 100;

				// Calculate maximum safe duration (don't overlap with next caption)
				let safeDuration = desiredDuration;
				if (nextCaption) {
					// Gap is from current start to next start
					const gapToNext = nextCaption.startMs - caption.startMs;

					// Only repair if there's space (gap > 0)
					if (gapToNext <= 0) {
						// No space to repair without overlap - skip this caption
						console.warn(
							`⚠️ Cannot repair caption "${caption.text}" (id: ${caption.id}) - would overlap with next caption`,
						);
						continue;
					}

					// Use available space, but leave at least 1ms gap to next caption
					safeDuration = Math.min(desiredDuration, gapToNext - 1);
				}

				// Update caption with safe, dynamic duration
				captions[index] = {
					...caption,
					endMs: caption.startMs + safeDuration,
					timestampMs: caption.startMs + safeDuration / 2,
				};
			}
			// Otherwise, keep caption at its original Whisper timing
		}

		// Return segment with fixed captions
		// Note: adjustedStartMs/adjustedEndMs make segments continuous for AI processing
		// But captions inside maintain their original speech timing (may have gaps during silence)
		return {
			...segment,
			captions,
		};
	});
}



// Group with timestamps and full caption data
interface GroupWithTimestamps {
	groupId: string; // Unique identifier for this group
	text: string; // The AI-generated group text
	startMs: number; // Start time from first caption
	endMs: number; // End time from last caption
	totalMs: number; // Duration
	captions: CleanCaption[]; // Full caption objects (not just IDs)
}



/**
 * Normalize text for comparison by removing extra spaces and punctuation variations
 */
function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.replace(/\s+/g, ' ') // Multiple spaces to single space
		.trim();
}

/**
 * Fallback grouping strategy when text matching fails
 * Splits captions evenly based on timing
 */
function timingBasedFallback(
	segmentCaptions: CleanCaption[],
	targetGroupCount: number,
	segmentId: string,
): GroupWithTimestamps[] {
	const result: GroupWithTimestamps[] = [];
	const captionsPerGroup = Math.ceil(segmentCaptions.length / targetGroupCount);

	for (let i = 0; i < targetGroupCount; i++) {
		const startIdx = i * captionsPerGroup;
		const endIdx = Math.min(startIdx + captionsPerGroup, segmentCaptions.length);
		const groupCaptions = segmentCaptions.slice(startIdx, endIdx);

		if (groupCaptions.length === 0) break;

		const firstCaption = groupCaptions[0];
		const lastCaption = groupCaptions[groupCaptions.length - 1];
		const groupText = groupCaptions.map((c) => c.text).join(' ');

		result.push({
			groupId: `${segmentId}-group-${i + 1}`,
			text: groupText,
			startMs: firstCaption.startMs,
			endMs: lastCaption.endMs,
			totalMs: lastCaption.endMs - firstCaption.startMs,
			captions: groupCaptions,
		});
	}

	console.log(
		`ℹ️ Remapping: Used timing-based fallback for ${result.length} groups`,
	);
	return result;
}

/**
 * Remap AI-generated text groups to original captions with timestamps
 * Uses greedy sequential matching to find which captions belong to each group
 * Falls back to timing-based grouping if text matching fails
 * Returns complete group data with full caption objects
 */
export function remapAIGroupsToTimestamps(
	aiGroups: string[],
	segmentCaptions: CleanCaption[],
	segmentId: string,
): GroupWithTimestamps[] {
	const result: GroupWithTimestamps[] = [];
	let currentCaptionIndex = 0;
	let matchFailures = 0;

	for (let groupIndex = 0; groupIndex < aiGroups.length; groupIndex++) {
		const aiGroup = aiGroups[groupIndex];
		const normalizedGroup = normalizeText(aiGroup);
		let accumulatedText = '';
		const captionsInGroup: CleanCaption[] = [];
		let matchFound = false;

		// Keep adding captions until we match the AI group text
		while (currentCaptionIndex < segmentCaptions.length) {
			const caption = segmentCaptions[currentCaptionIndex];
			accumulatedText += caption.text + ' ';
			captionsInGroup.push(caption);

			const normalizedAccumulated = normalizeText(accumulatedText);

			// Check if we've matched the group (with some tolerance)
			if (normalizedAccumulated.includes(normalizedGroup)) {
				// Found match! Create group with full data
				const firstCaption = captionsInGroup[0];
				const lastCaption = captionsInGroup[captionsInGroup.length - 1];

				result.push({
					groupId: `${segmentId}-group-${groupIndex + 1}`,
					text: aiGroup, // Keep original AI text (with punctuation)
					startMs: firstCaption.startMs,
					endMs: lastCaption.endMs,
					totalMs: lastCaption.endMs - firstCaption.startMs,
					captions: captionsInGroup, // Full caption objects
				});

				currentCaptionIndex++;
				matchFound = true;
				break;
			}

			currentCaptionIndex++;

			// Safety: If we've gone too far without matching, something's wrong
			if (accumulatedText.length > aiGroup.length * 2) {
				console.warn(
					`⚠️ Remapping: Could not match AI group "${aiGroup}" to captions`,
				);
				matchFailures++;
				break;
			}
		}

		if (!matchFound) {
			matchFailures++;
		}
	}

	// If too many failures, use timing-based fallback
	const failureRate = matchFailures / aiGroups.length;
	if (failureRate > 0.3) {
		// If more than 30% failed
		console.warn(
			`⚠️ Remapping: ${Math.round(failureRate * 100)}% match failure rate. Using timing-based fallback.`,
		);
		return timingBasedFallback(segmentCaptions, aiGroups.length, segmentId);
	}

	// Validation: Check if all captions were used
	if (currentCaptionIndex < segmentCaptions.length) {
		console.warn(
			`⚠️ Remapping: ${segmentCaptions.length - currentCaptionIndex} captions were not matched to any group`,
		);
	}

	return result;
}

