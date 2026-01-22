import {openai} from '@ai-sdk/openai';
import {perplexity} from '@ai-sdk/perplexity';
import {
	convertToModelMessages,
	InferUITools,
	stepCountIs,
	streamText,
	tool,
	UIMessage,
} from 'ai';
import {z} from 'zod';

// ============================================
// ZUMA SCHEMAS FOR UNDOABLE STATE
// ============================================

const TrackSchema = z.object({
	id: z.string(),
	items: z.array(z.string()).describe('Array of item IDs in this track'),
	hidden: z.boolean().default(false),
	muted: z.boolean().default(false),
});

const TransitionSchema = z.object({
	toNext: z
		.object({
			type: z.enum(['slide', 'fade', 'wipe', 'flip', 'clockwipe']),
			durationInFrames: z.number().optional(),
		})
		.optional(),
	toPrev: z
		.object({
			type: z.enum(['slide', 'fade', 'wipe', 'flip', 'clockwipe']),
			durationInFrames: z.number().optional(),
		})
		.optional(),
});

const BaseItemSchema = z.object({
	id: z.string(),
	from: z.number().describe('Start time in frames'),
	durationInFrames: z.number(),
	top: z.number().describe('Y position on canvas'),
	left: z.number().describe('X position on canvas'),
	width: z.number(),
	height: z.number(),
	opacity: z.number().min(0).max(1).default(1),
	isDraggingInTimeline: z.boolean().default(false),
	transition: TransitionSchema.default({toNext: undefined, toPrev: undefined}),
});

const TextItemSchema = BaseItemSchema.extend({
	type: z.literal('text'),
	text: z.string(),
	color: z.string().default('#ffffff'),
	fontSize: z.number().default(80),
	fontFamily: z.string().default('Roboto'),
	fontStyle: z
		.object({
			variant: z.string().default('normal'),
			weight: z.string().default('400'),
		})
		.default({variant: 'normal', weight: '400'}),
	align: z.enum(['left', 'center', 'right']).default('center'),
	lineHeight: z.number().default(1.2),
	letterSpacing: z.number().default(0),
	rotation: z.number().default(0),
	resizeOnEdit: z.boolean().default(true),
	direction: z.enum(['ltr', 'rtl']).default('ltr'),
	strokeWidth: z.number().default(0),
	strokeColor: z.string().default('#000000'),
	fadeInDurationInSeconds: z.number().default(0),
	fadeOutDurationInSeconds: z.number().default(0),
	background: z
		.object({
			color: z.string(),
			horizontalPadding: z.number(),
			borderRadius: z.number(),
		})
		.nullable()
		.default(null),
});

const SolidItemSchema = BaseItemSchema.extend({
	type: z.literal('solid'),
	color: z.string().default('#000000'),
	borderRadius: z.number().default(0),
});

const ImageItemSchema = BaseItemSchema.extend({
	type: z.literal('image'),
	assetId: z.string(),
	borderRadius: z.number().default(0),
	rotation: z.number().default(0),
	cropLeft: z.number().default(0),
	cropTop: z.number().default(0),
	cropRight: z.number().default(0),
	cropBottom: z.number().default(0),
	fadeInDurationInSeconds: z.number().default(0),
	fadeOutDurationInSeconds: z.number().default(0),
	keepAspectRatio: z.boolean().default(true),
});

const ItemSchema = z.discriminatedUnion('type', [
	TextItemSchema,
	SolidItemSchema,
	ImageItemSchema,
]);

const compositionStateSchema = z.object({
	tracks: z.array(TrackSchema),
	items: z.record(z.string(), ItemSchema).describe('Object with itemId as key'),
	assets: z.record(z.string(), z.any()).default({}),
	fps: z.number().default(30),
	compositionWidth: z.number().default(1920),
	compositionHeight: z.number().default(1080),
	deletedAssets: z.array(z.any()).default([]),
	timelineViewStack: z
		.array(z.object({type: z.literal('ROOT')}))
		.default([{type: 'ROOT'}]),
});

// ============================================
// VIDEO EDITOR TOOLS
// ============================================

export const videoEditorTools = {
	// Tool 1: Validate Request (Guardrail)
	validateRequest: tool({
		description:
			'ALWAYS call this tool FIRST before any video creation. Validates if the user request is a valid video creation request or just casual chat. Returns whether to proceed with video creation or respond conversationally.',
		inputSchema: z.object({
			userMessage: z
				.string()
				.describe('The exact message from the user to validate'),
		}),
		execute: async ({userMessage}) => {
			const lowerMessage = userMessage.toLowerCase();

			// Check for casual chat patterns
			const casualPatterns = [
				'how are you',
				'what is your name',
				'who are you',
				'hello',
				'hi ',
				'hey ',
				'thanks',
				'thank you',
				'what can you do',
				'help me',
			];

			const isCasualChat = casualPatterns.some((pattern) =>
				lowerMessage.includes(pattern),
			);

			// Check for video creation patterns
			const videoPatterns = [
				'create a video',
				'make a video',
				'generate a video',
				'video about',
				'video on',
			];

			const isVideoRequest = videoPatterns.some((pattern) =>
				lowerMessage.includes(pattern),
			);

			if (isCasualChat && !isVideoRequest) {
				return {
					valid: false,
					reason: 'casual_chat',
					message:
						'This appears to be a casual conversation, not a video creation request.',
				};
			}

			if (!isVideoRequest) {
				return {
					valid: false,
					reason: 'unclear_intent',
					message:
						'The request does not clearly indicate video creation intent.',
				};
			}

			return {
				valid: true,
				intent: 'create_video',
				message: 'Valid video creation request detected.',
			};
		},
	}),

	// Tool 2: Create Video Skeleton (Master Tool)
	createVideoSkeleton: tool({
		description: `CREATE THE COMPLETE VIDEO STRUCTURE. This is the MASTER tool that creates the entire video state.
    
    IMPORTANT: You must return a COMPLETE compositionState structure with:
    - tracks: Array of tracks, each containing item IDs
    - items: Object/Record where keys are item IDs and values are complete item objects
    - composition settings (fps, width, height)
    
    Think creatively about the video structure, timing, and layout.
    Generate unique IDs for each item (e.g., "text-1", "solid-bg", etc.)
    Position items thoughtfully on the canvas (top, left, width, height)
    Set appropriate durations in FRAMES (fps * seconds)
    
    For a 10-second video at 30fps, use durationInFrames: 300`,
		inputSchema: z.object({
			request: z
				.string()
				.describe(
					'The user video creation request (e.g., "Make a video on top 5 Tarantino movies")',
				),
			preferredDuration: z
				.number()
				.optional()
				.describe('Preferred video duration in seconds (optional)'),
			videoState: compositionStateSchema.describe(
				'The complete video state structure with tracks, items, and composition settings',
			),
		}),
		execute: async ({request, preferredDuration, videoState}) => {
			// The videoState contains the complete structure from AI
			// You can add validation or processing logic here
			console.log('Video skeleton created:', {
				request,
				preferredDuration,
				tracksCount: videoState.tracks.length,
				itemsCount: Object.keys(videoState.items).length,
			});

			return {
				success: true,
				message: `Video skeleton created for: "${request}"`,
				videoState: videoState,
			};
		},
	}),

	// Keep existing tools (not used yet, but available)
	createTextItem: tool({
		description:
			'Create a text item/layer in the video editor. Use this when the user wants to add text, titles, captions, or any written content to the video.',
		inputSchema: z.object({
			text: z.string().describe('The text content to display'),
			x: z.number().describe('X position on canvas (0-100)').default(50),
			y: z.number().describe('Y position on canvas (0-100)').default(50),
		}),
		execute: async ({text, x, y}) => {
			const itemId = `text-${Date.now()}`;
			return {
				id: itemId,
				type: 'text' as const,
				text,
				x,
				y,
				message: `Created text item "${text}" at position (${x}, ${y})`,
			};
		},
	}),

	createImageItem: tool({
		description:
			'Create an image item/layer in the video editor. Use this when the user wants to add images, photos, or visual elements to the video.',
		inputSchema: z.object({
			url: z.string().url().describe('URL of the image to add'),
			x: z.number().describe('X position on canvas (0-100)').default(50),
			y: z.number().describe('Y position on canvas (0-100)').default(50),
		}),
		execute: async ({url, x, y}) => {
			const itemId = `image-${Date.now()}`;
			return {
				id: itemId,
				type: 'image' as const,
				url,
				x,
				y,
				message: `Created image item from ${url} at position (${x}, ${y})`,
			};
		},
	}),

	createSolidItem: tool({
		description:
			'Create a solid color rectangle/background in the video editor. Use this when the user wants to add colored backgrounds, shapes, or fill areas with solid colors.',
		inputSchema: z.object({
			color: z
				.string()
				.describe('Hex color code (e.g., #FF0000 for red)')
				.default('#000000'),
			width: z.number().describe('Width of the solid (0-100)').default(100),
			height: z.number().describe('Height of the solid (0-100)').default(100),
		}),
		execute: async ({color, width, height}) => {
			const itemId = `solid-${Date.now()}`;
			return {
				id: itemId,
				type: 'solid' as const,
				color,
				width,
				height,
				message: `Created solid color (${color}) with size ${width}x${height}`,
			};
		},
	}),
};

// Export the type for the tools - this enables end-to-end type safety
export type MyUIMessage = UIMessage<
	never,
	never,
	InferUITools<typeof videoEditorTools>
>;

export async function action({request}: {request: Request}) {
	try {
		const {
			messages,
			webSearch,
		}: {
			messages: UIMessage[];
			model: string;
			webSearch: boolean;
		} = await request.json();

		console.log('API received messages:', messages);

		const result = streamText({
			model: webSearch ? perplexity('sonar') : openai('gpt-4.1-mini'),
			messages: await convertToModelMessages(messages),
			system: `You are an expert video editor AI assistant specialized in creating video projects programmatically.

WORKFLOW - FOLLOW THIS STRICTLY:

1. ALWAYS call validateRequest tool FIRST for every user message
   - If valid: false, respond conversationally
   - If valid: true, proceed to step 2

2. For valid video requests, call createVideoSkeleton tool
   - Think deeply about the video structure
   - Create a complete compositionState with tracks and items
   - Be creative with layouts, timing, and positioning
   
IMPORTANT RULES FOR createVideoSkeleton:
- Return COMPLETE structure matching compositionState schema
- tracks: Array with track objects containing item IDs
- items: Object/Record with itemId as keys (e.g., {"text-1": {...}, "solid-bg": {...}})
- Generate unique IDs (text-1, text-2, solid-bg, etc.)
- Use FRAMES for timing (30fps standard: 10sec = 300 frames)
- Position items on 1920x1080 canvas (top, left, width, height in pixels)
- Create visually appealing layouts

EXAMPLE for "Make a video on top 5 movies":
- Create background solid (full screen, entire duration)
- Create title text (centered, first 3 seconds)
- Create 5 text items for each movie (staggered timing)
- Organize into logical tracks

Keep explanations concise. Focus on creating great video structures.`,

			// Use the exported tools object
			tools: videoEditorTools,

			// Enable multi-step tool calling
			stopWhen: stepCountIs(10),
		});

		// send sources and reasoning back to the client
		return result.toUIMessageStreamResponse({
			sendSources: true,
			sendReasoning: true,
		});
	} catch (error) {
		console.error('AI Chat Error:', error);
		return Response.json(
			{error: 'Failed to process chat request'},
			{status: 500},
		);
	}
}
