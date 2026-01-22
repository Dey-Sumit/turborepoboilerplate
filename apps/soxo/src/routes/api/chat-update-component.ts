import {devToolsMiddleware} from '@ai-sdk/devtools';
import {anthropic} from '@ai-sdk/anthropic';
import {
	convertToModelMessages,
	InferUITools,
	smoothStream,
	stepCountIs,
	streamText,
	tool,
	ToolSet,
	UIMessage,
	wrapLanguageModel,
} from 'ai';
import {
	addTextItemSchema,
	editTextItemSchema,
	addSolidItemSchema,
	editSolidItemSchema,
	getItemInfoSchema,
	addTransitionsSchema,
} from './ai-schemas';

// ============================================
// SCHEMA DOCUMENTATION FOR LLM (string format)
// ============================================

const BASE_ITEM_SCHEMA_DOC = `BaseItem properties (included in all items):
- top, left: number (position in pixels, top=y, left=x)
- durationInFrames: number (length in frames)
- opacity: number (0-1)
- animation: { type, delay, duration, target?, stagger? }`;

const TEXT_ITEM_SCHEMA_DOC = `TextItem properties:
- text: string
- x, y: number (position on canvas, x=left edge, y=top edge)
- color: string (hex "#FFFFFF")
- fontSize: number (default 120)
- fontFamily: string
- fontStyle: { variant: 'normal'|'italic', weight: '400'|'700' }
- align: 'left' | 'center' | 'right' (text alignment within box, NOT position)
- direction: 'ltr' | 'rtl'
- lineHeight: number (default 1.2)
- letterSpacing: number
- strokeWidth, strokeColor: number, string
- background: { color, horizontalPadding, borderRadius } | null
- fadeInDurationInSeconds, fadeOutDurationInSeconds: number
- rotation: number (degrees)
- opacity: number (0-1)
- durationInFrames: number
- animation: { type, delay, duration, target:"word", stagger:5 } // target word and stagger 5 is default`;

const SOLID_ITEM_SCHEMA_DOC = `SolidItem properties (colored rectangle/shape):
- x, y: number (position on canvas)
- width, height: number (size in pixels)
- color: string (hex "#FFFFFF", default white)
- opacity: number (0-1)
- rotation: number (degrees)
- borderRadius: number (rounded corners, 0 = sharp)
- fadeInDurationInSeconds, fadeOutDurationInSeconds: number
- durationInFrames: number`;

// ============================================
// CONFIGURATION & TYPES
// ============================================

/**
 * Context sent from the client with each request.
 * This provides the AI with information about the current editor state.
 */
export interface EditorContext {
	/** Current playhead position in frames */
	currentFrame: number;
	/** Canvas width in pixels */
	canvasWidth: number;
	/** Canvas height in pixels */
	canvasHeight: number;
	/** Frames per second */
	fps: number;
}

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

interface SystemPromptParams {
	context: EditorContext;
}

function createSystemPrompt({context}: SystemPromptParams): string {
	return `<task-context>
You are an expert Video Creation AI Assistant that can both CREATE new content and EDIT existing items.

Canvas: ${context.canvasWidth}x${context.canvasHeight} pixels, ${context.fps} FPS
</task-context>

<schemas>
${BASE_ITEM_SCHEMA_DOC}

${TEXT_ITEM_SCHEMA_DOC}

${SOLID_ITEM_SCHEMA_DOC}
</schemas>

<operation-modes>
1. CREATE MODE: User wants to add new content ("add", "create", "insert", "new")
   - For text: use add_text_item tool
   - For shapes/rectangles/backgrounds: use add_solid_item tool
   - Provide x, y coordinates directly (not nested in position object)

2. EDIT MODE: User wants to modify existing items ("change", "update", "make", "set")
   - For text items: use text_editor tool
   - For solid items: use solid_editor tool
   - Provide itemId + properties to change directly at root level (not nested in changes object)
   - The user message will include selectedItemIds when items are selected
   - If no selectedItemIds provided, ask user to select an item first

3. QUERY MODE: Need item info before editing
   - Use: get_item_info tool (works for any item type)
</operation-modes>

<important-instructions>
- Position vs Alignment: When user says "center", "put in center", "move to center" - modify position (left, top) NOT text align. Text align only affects how text wraps within its bounding box. Only change align when user explicitly says "align left/center/right" or "text alignment".
- Position coordinates: x/left=0 is left edge, y/top=0 is top edge. Center of canvas is x=${context.canvasWidth / 2}, y=${context.canvasHeight / 2}.
- Color format: Always use hex format (e.g. "#FF0000" for red, "#FFFFFF" for white).
- All properties are at root level - do NOT nest in "changes", "styling", or "position" objects.
</important-instructions>

<transitions-vs-item-effects>
CRITICAL DISTINCTION - These are DIFFERENT concepts:

1. ITEM EFFECTS (fadeInDurationInSeconds, fadeOutDurationInSeconds):
   - Properties on individual items
   - fadeInDurationInSeconds: Item gradually appears when it STARTS
   - fadeOutDurationInSeconds: Item gradually disappears when it ENDS
   - These are INDEPENDENT of other items - just visual entrance/exit effects
   - Use when: "fade in the text", "make it fade out", "add fade effect to this item"

2. TRANSITIONS (between two sequential items on SAME track):
   - Visual connection between the END of item A and START of item B
   - Requires TWO items on the SAME timeline track, placed sequentially
   - Types: fade, slide, wipe, flip, clockwipe, iris
   - Use add_transition tool (NOT fadeIn/fadeOut properties)
   - Use when: "add transition between clips", "fade transition to next video", "slide transition"

EXAMPLES:
- "Add fade to the title" → use fadeInDurationInSeconds on the text item
- "Make the text fade out" → use fadeOutDurationInSeconds on the text item
- "Add fade transition between video 1 and video 2" → use add_transition tool with type='fade'
- "Slide transition to next clip" → use add_transition tool with type='slide'
</transitions-vs-item-effects>`;
}

// ============================================
// VIDEO CREATION TOOLS (using flat AI schemas)
// ============================================

export const videoCreationTools = {
	// TEXT - CREATE
	add_text_item: tool({
		description: `Creates a new text item. Required: text, x, y. All other properties optional at root level.
${TEXT_ITEM_SCHEMA_DOC}`,
		inputSchema: addTextItemSchema,
	}),

	// TEXT - EDIT
	text_editor: tool({
		description: `Edits existing text item. Required: itemId. All properties to change at root level (not nested).
For position changes use: left (x position), top (y position).
${TEXT_ITEM_SCHEMA_DOC}`,
		inputSchema: editTextItemSchema,
	}),

	// SOLID - CREATE
	add_solid_item: tool({
		description: `Creates a new solid (rectangle/shape). Required: x, y, width, height. Use for backgrounds, colored shapes, dividers.
${SOLID_ITEM_SCHEMA_DOC}`,
		inputSchema: addSolidItemSchema,
	}),

	// SOLID - EDIT
	solid_editor: tool({
		description: `Edits existing solid item. Required: itemId. All properties at root level.
${SOLID_ITEM_SCHEMA_DOC}`,
		inputSchema: editSolidItemSchema,
	}),

	// QUERY - Generic (works for any item type)
	get_item_info: tool({
		description:
			'Get detailed information about any item by itemId. Use when you need current values before making changes. Works for text, solid, image, video items.',
		inputSchema: getItemInfoSchema,
	}),

	// TRANSITIONS - Add transitions between sequential items
	add_transitions: tool({
		description: `Add visual transitions between sequential items on the SAME track.
NOT for item fade effects (use fadeInDurationInSeconds/fadeOutDurationInSeconds for those).

IMPORTANT: Items must be on the same track and sequential (item A ends, item B starts).
You can add multiple transitions at once.

Input format:
{
  transitions: [
    { itemIds: ["fromItemId", "toItemId"], transition: { type: "fade" } },
    { itemIds: ["itemB", "itemC"], transition: { type: "slide", direction: "from-left" } }
  ]
}

Transition types:
- fade: Simple crossfade
- slide: Slides in from direction (from-left, from-right, from-top, from-bottom)
- wipe: Wipes in from direction
- flip: 3D flip from direction
- clockwipe: Clock-style circular wipe
- iris: Iris/circle reveal

WORKFLOW for "create 5 items with transitions":
1. First call add_solid_item/add_text_item for each item (get itemIds from responses)
2. Then call add_transitions with the itemIds from step 1`,
		inputSchema: addTransitionsSchema,
	}),
} satisfies ToolSet;

// Export the type for the tools - this enables end-to-end type safety
export type VideoCreationUIMessageV2 = UIMessage<
	never,
	never,
	InferUITools<typeof videoCreationTools>
>;

// Default context values (fallback if client doesn't send context)
const defaultContext: EditorContext = {
	currentFrame: 0,
	canvasWidth: 1080,
	canvasHeight: 1920,
	fps: 30,
};

export async function action({request}: {request: Request}) {
	try {
		const {
			messages,
			context,
		}: {
			messages: UIMessage[];
			context?: EditorContext;
		} = await request.json();

		// Merge with defaults in case some fields are missing
		const editorContext: EditorContext = {
			...defaultContext,
			...context,
		};

		// Create system prompt with context
		const systemPrompt = createSystemPrompt({
			context: editorContext,
		});

		const model = wrapLanguageModel({
			model: anthropic('claude-sonnet-4-5'),
			middleware: devToolsMiddleware(),
		});

		const result = streamText({
			model,
			messages: await convertToModelMessages(messages),
			system: systemPrompt,
			tools: videoCreationTools,
			experimental_transform: smoothStream({
				delayInMs: 30,
			}),
			stopWhen: [stepCountIs(12)],
		});

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
