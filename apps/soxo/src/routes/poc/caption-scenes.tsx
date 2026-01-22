/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import {useState} from 'react';
import {Button} from '../../components/ui/button';
import '../../editor/editor-starter.css';
import {
	CAPTION_REACT_19,
	CAPTION_TOP_3_MOVIES,
} from '../../editor/items/captions/scene-captions/__mock_data__/caption-data';
import {
	cleanCaptions,
	createSegments,
	repairSegmentTimestamps,
	remapAIGroupsToTimestamps,
} from '../../editor/items/captions/scene-captions/utils';
import {
	Accordion,
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '../../components/ui/accordion';
import {Separator} from '../../components/ui/separator';

import {
	RAW_CAPTION_ALCOHOL_SHORTS,
	CAPTION_GROUPING_RESPONSE_FROM_AI_FOR_ALCOHOL_SHORTs,
} from '../../editor/items/captions/scene-captions/__mock_data__/caption/alcohol';
import { AICaptionGroupingResponse } from '../../editor/captioning/caption-section';
import { RemappedCaptionSegment } from '../../editor/items/captions/scene-captions/__mock_data__/api-response-caption-grouping';



const rawCaptions = RAW_CAPTION_ALCOHOL_SHORTS;
const CaptionScenes = () => {
	const [cleanedCaptions, setCleanedCaptions] = useState<
		ReturnType<typeof cleanCaptions>
	>([]);

	const [level1SegmentsData, setLevel1SegmentsData] =
		useState<ReturnType<typeof createSegments>>();

	// level 2 of segments
	const [repairedSegmentsData, setRepairedSegmentsData] =
		useState<ReturnType<typeof repairSegmentTimestamps>>();

	// AI-generated groups
	const [aiGroupsData, setAiGroupsData] = useState<AICaptionGroupingResponse>(
		CAPTION_GROUPING_RESPONSE_FROM_AI_FOR_ALCOHOL_SHORTs,
	);

	// Remapped groups with timestamps
	const [remappedGroupsData, setRemappedGroupsData] =
		useState<RemappedCaptionSegment[]>();
	console.log({remappedGroupsData});

	const handleGenerateAIGroups = async () => {
		if (!repairedSegmentsData) {
			alert('Please repair segments first!');
			return;
		}

		// Prepare data for API
		const segments = repairedSegmentsData.map((seg) => ({
			segmentId: seg.id,
			fullText: seg.fullText,
		}));

		const fullRawText = level1SegmentsData?.fullRawText;
		console.log({
			fullText: fullRawText,
			segments,
		});
		// if (1 === 1) return;
		try {
			const response = await fetch('/api/generate-caption-scenes', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					fullText: fullRawText,
					segments,
				}),
			});

			const data = await response.json();
			setAiGroupsData(data);
		} catch (error) {
			console.error('Error generating AI groups:', error);
			alert('Failed to generate AI groups');
		}
	};

	const handleRemapToTimestamps = () => {
		if (!aiGroupsData || !repairedSegmentsData) {
			alert('Please generate AI groups first!');
			return;
		}

		// Remap each segment's groups to timestamps with complete data
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const remappedSegments = aiGroupsData.segments.map((aiSegment: any) => {
			const originalSegment = repairedSegmentsData.find(
				(seg) => seg.id === aiSegment.segmentId,
			);

			if (!originalSegment) {
				console.warn(`Segment ${aiSegment.segmentId} not found`);
				return null;
			}

			const groups = remapAIGroupsToTimestamps(
				aiSegment.groups,
				originalSegment.captions,
				aiSegment.segmentId,
			);

			// Build complete final structure - single source of truth
			return {
				// Segment identification
				segmentId: aiSegment.segmentId,
				fullText: originalSegment.fullText,

				// Segment container timing (continuous, gap-filled)
				adjustedStartMs: originalSegment.adjustedStartMs,
				adjustedEndMs: originalSegment.adjustedEndMs,
				adjustedTotalMs: originalSegment.adjustedTotalMs,

				// Original speech timing (where captions actually exist)
				originalStartMs: originalSegment.startMs,
				originalEndMs: originalSegment.endMs,
				originalTotalMs: originalSegment.totalMs,

				// AI-generated groups with full caption data
				groups,
			};
		});

		console.log('🎉 Final remapped segments:', remappedSegments);
		//@ts-expect-error type issue
		setRemappedGroupsData(remappedSegments.filter(Boolean));
	};

	return (
		<div className="min-h-screen gap-4 border p-4">
			<div className="grid grid-cols-4 gap-4">
				<div className="col-span-2 w-full border p-4">
					<pre className="max-h-[90vh] overflow-y-scroll text-xs">
						{JSON.stringify(rawCaptions, null, 3)}
					</pre>
				</div>
				<div className="col-span-2 flex flex-col gap-2 border p-4">
					<Button
						onClick={() => {
							setCleanedCaptions(cleanCaptions(rawCaptions));
						}}
					>
						Clean captions
					</Button>
					<Accordion className="border px-2">
						<AccordionItem value="item-1">
							<AccordionTrigger>Clean Captions</AccordionTrigger>
							<AccordionContent>
								<pre className="max-h-[30vh] overflow-y-scroll text-xs">
									{JSON.stringify(cleanedCaptions, null, 3)}
								</pre>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<Separator />

					<Button
						onClick={() => {
							setLevel1SegmentsData(createSegments(cleanedCaptions));
						}}
					>
						Generate Level 1 Segments From CleanCaptions
					</Button>
					<Accordion className="border px-2">
						<AccordionItem value="item-1">
							<AccordionTrigger>Level 1 Segments</AccordionTrigger>
							<AccordionContent>
								<pre className="max-h-[30vh] overflow-y-scroll text-xs">
									{JSON.stringify(level1SegmentsData, null, 3)}
								</pre>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
					<Button
						onClick={() => {
							setRepairedSegmentsData(
								repairSegmentTimestamps(level1SegmentsData?.segments || []),
							);
						}}
					>
						Repair Segments Timestamps
					</Button>
					<Accordion className="border px-2">
						<AccordionItem value="item-1">
							<AccordionTrigger>Repaired Segments</AccordionTrigger>
							<AccordionContent>
								<pre className="max-h-[30vh] overflow-y-scroll text-xs">
									{JSON.stringify(repairedSegmentsData, null, 3)}
								</pre>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<Separator />

					<Button onClick={handleGenerateAIGroups}>
						Generate AI Groups (OpenAI)
					</Button>
					<Accordion className="border px-2">
						<AccordionItem value="item-1">
							<AccordionTrigger>AI Generated Groups</AccordionTrigger>
							<AccordionContent>
								<pre className="max-h-[30vh] overflow-y-scroll text-xs">
									{JSON.stringify(aiGroupsData, null, 3)}
								</pre>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<Separator />

					<Button onClick={handleRemapToTimestamps}>
						Remap AI Groups to Timestamps
					</Button>
					<Accordion className="border px-2">
						<AccordionItem value="item-1">
							<AccordionTrigger>
								Remapped Groups (Final with Timestamps)
							</AccordionTrigger>
							<AccordionContent>
								<pre className="max-h-[30vh] overflow-y-scroll text-xs">
									{JSON.stringify(remappedGroupsData, null, 3)}
								</pre>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</div>
	);
};

export default CaptionScenes;
