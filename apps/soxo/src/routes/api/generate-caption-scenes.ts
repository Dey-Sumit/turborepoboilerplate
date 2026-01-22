import {generateObject} from 'ai';
import {openai} from '@ai-sdk/openai';
import * as z from 'zod';
import type {Route} from './+types/generate-caption-scenes';

// Simplified schema - only segment ID and text groups
const SegmentGroupingSchema = z.object({
	segmentId: z.string(),
	groups: z
		.array(z.string())
		.describe('Array of text groups in sequential order'),
});

// Complete API response
const CaptionGroupingResponseSchema = z.object({
	segments: z.array(SegmentGroupingSchema),
});

// Request interface
interface LeanSegment {
	segmentId: string;
	fullText: string;
}

interface RequestBody {
	fullText: string; // Entire transcript for context
	segments: LeanSegment[];
}

// Comprehensive system prompt with linguistic rules
const SYSTEM_PROMPT = `You are a video caption grouping expert working on creating engaging, professional video content.

YOUR MISSION: Transform video transcripts into scene-by-scene caption groups that create an immersive viewing experience. Each group you create will appear on screen as a visual element - viewers should be able to read, understand, and feel the emotion of each phrase at a glance.

THE PHILOSOPHY: Great videos tell stories scene by scene. Your caption groups are not just subtitles - they are visual storytelling elements that guide the viewer's attention, create rhythm, and enhance engagement. Think like a video editor cutting scenes, not a transcriptionist copying text.

CONTEXT: You will receive complete sentences (ending with periods). Each sentence may contain commas and multiple phrases. Your job is to intelligently break these sentences into readable, emotionally resonant groups that make viewers want to keep watching.

CORE RULES:
1. Each group should be 2-8 words (readable at a glance)
2. Groups must form COMPLETE thoughts - never break mid-phrase
3. DO NOT change spelling, punctuation, or wording
4. DO NOT convert numbers to words or vice versa (keep "19" as "19", not "nineteen")
5. DO NOT add or remove punctuation
6. DO NOT rephrase, summarize, or modify the text in any way
7. Return groups in SEQUENTIAL order - do not skip or rearrange words
8. Preserve ALL original text EXACTLY as provided

LINGUISTIC RULES - NEVER Break Groups On:
❌ Articles: "the", "a", "an" (must stay with following noun)
❌ Prepositions: "in", "on", "at", "to", "of", "for", "with", "without" (keep with their objects)
❌ Conjunctions at end: "or", "and", "but" (keep with what follows)
❌ Possessives: "your", "my", "their" (keep with following noun)
❌ Incomplete phrases: "right in", "without the", "of a"

PREFERRED Break Points:
✅ Commas (when they mark natural pauses between clauses)
✅ After complete clauses
✅ After complete prepositional phrases
✅ Between distinct ideas
✅ At natural breathing points

IMPORTANT - Comma Handling:
- Use commas as HINTS for breaks, not absolute rules
- Keep tight phrases together even with commas: "The Dark Knight, 2008" stays as one group
- Break at commas for longer clauses: "I went to the store, bought milk, and came home" → break into groups
- Consider context: technical terms, titles, dates often stay together despite commas

EXAMPLES - Study These Patterns:

Example 1 - Prepositional Phrases:
Input: "This means that you can mark a component as async and fetch data right in your component without the need of a use effect."

❌ BAD (breaks mid-phrase):
- "and fetch data right in"
- "your component without the"
- "need of a use effect."

✅ GOOD (complete thoughts):
- "This means that you can"
- "mark a component as async"
- "and fetch data right in your component"
- "without the need of a use effect."

Example 2 - Articles and Nouns:
Input: "The server does all of the heavy lifting and sends pre-rendered markup to the client."

❌ BAD (orphaned articles):
- "The server does all of the"
- "heavy lifting and sends"
- "pre-rendered markup to the"
- "client."

✅ GOOD (articles with nouns):
- "The server does all the heavy lifting"
- "and sends pre-rendered markup"
- "to the client."

Example 3 - Conjunctions:
Input: "Whether you're coming from a Next js background or simply exploring the latest version of React."

❌ BAD (hanging conjunctions):
- "a Next js background or"
- "simply exploring the latest"

✅ GOOD (complete alternatives):
- "Whether you're coming from a Next js background"
- "or simply exploring the latest version of React."

Example 4 - Natural Conversation:
Input: "React 19 is now stable, and in the next 10 minutes, I'm excited to show you some of the most powerful new features and improvements."

✅ GOOD (natural rhythm):
- "React 19 is now stable,"
- "and in the next 10 minutes,"
- "I'm excited to show you"
- "some of the most powerful"
- "new features and improvements."

Example 5 - Technical Terms:
Input: "In React 19, frameworks like Next js use server components by default."

✅ GOOD (keeps technical terms together):
- "In React 19,"
- "frameworks like Next js"
- "use server components by default."

Example 6 - Titles with Dates (CRITICAL):
Input: "Number three, The Dark Knight, 2008."

❌ BAD (breaks title from year):
- "Number three,"
- "The Dark Knight,"
- "2008."

✅ GOOD (keeps title + year together):
- "Number three,"
- "The Dark Knight, 2008."

Example 7 - Complete Sentences with Multiple Commas:
Input: "Dreams within dreams within dreams, this movie bends your mind, and keeps you thinking long after it ends."

✅ GOOD (intelligent comma breaks):
- "Dreams within dreams within dreams,"
- "this movie bends your mind,"
- "and keeps you thinking"
- "long after it ends."

REMEMBER: Viewers read each group in isolation. Every group must make sense on its own, even if brief. Think: "Would this look awkward on screen?" If yes, adjust the break.`;

export async function action({request}: Route.ActionArgs) {
	try {
		console.log('🎯 API: Starting AI caption grouping...');

		const body: RequestBody = await request.json();
		const {fullText, segments} = body;

		console.log(`📝 API: Received ${segments.length} segments for grouping`);

		if (!segments || segments.length === 0) {
			console.log('❌ API: No segments provided');
			return Response.json(
				{error: 'No segments provided for grouping'},
				{status: 400},
			);
		}

		// Build user prompt with segments
		const userPrompt = `Analyze this transcript and create natural caption groupings for each segment.

FULL CONTEXT:
"${fullText}"

SEGMENTS TO PROCESS:
${segments.map((segment) => `\nSegment ID: ${segment.segmentId}\nText: "${segment.fullText}"`).join('\n')}

TASK: For each segment, break the text into natural speaking groups (2-8 words each). Follow the STRICT RULES - do not modify the text in any way.`;

		console.log('🤖 API: Calling OpenAI for caption grouping...');

		// Generate structured grouping
		const result = await generateObject({
			model: openai('gpt-4o-mini'),
			system: SYSTEM_PROMPT,
			prompt: userPrompt,
			schema: CaptionGroupingResponseSchema,
		});

		console.log('✅ API: Generated grouping:', result.object);

		return Response.json(result.object);
	} catch (error) {
		console.error('❌ API: Error in generate-caption-scenes:', error);
		return Response.json(
			{
				error: 'Failed to generate caption groups',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{status: 500},
		);
	}
}
