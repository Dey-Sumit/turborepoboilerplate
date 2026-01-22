import {devToolsMiddleware} from '@ai-sdk/devtools';
import {openai} from '@ai-sdk/openai';
import {perplexity} from '@ai-sdk/perplexity';
import {
	convertToModelMessages,
	generateText,
	hasToolCall,
	InferUITools,
	Output,
	smoothStream,
	stepCountIs,
	streamText,
	tool,
	ToolSet,
	UIMessage,
	wrapLanguageModel,
} from 'ai';
import {z} from 'zod';

// ============================================
// CONFIGURATION
// ============================================

interface VideoConfig {
	canvasSize: {
		aspectRatio: '9:16'; // Vertical videos for Instagram Reels/YouTube Shorts
		dimensions: {
			width: number; // 1080
			height: number; // 1920
		};
	};
	fps: number; // 30
}

const defaultConfig: VideoConfig = {
	canvasSize: {
		aspectRatio: '9:16',
		dimensions: {
			width: 1080,
			height: 1920,
		},
	},
	fps: 30,
};

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

interface SystemPromptParams {
	config: VideoConfig;
}

function createSystemPrompt({config}: SystemPromptParams): string {
	return `<task-context>
You are an expert Video Creation AI Assistant specialized in creating fresh videos based on user prompts.

CANVAS CONFIGURATION:
- Aspect Ratio: ${config.canvasSize.aspectRatio} (Vertical videos for Instagram Reels/YouTube Shorts)
- Dimensions: ${config.canvasSize.dimensions.width}x${config.canvasSize.dimensions.height} pixels
- FPS: ${config.fps}
- All videos must be created for this vertical format
</task-context>

<workflow>
Follow this exact sequence:

1. ALWAYS call the guardrails tool FIRST for every user message to validate the request
2. If guardrails returns isValid: 1, use web_search tool to gather information
3. Pass the web search results to the script_writer tool to generate a video script
4. Pass the script to the scene_builder tool to create structured scenes with assets and timing
5. Pass the scenes to the composite_builder tool to create the final state
6. Pass the state to the video_finalizer tool to conclude the process
7. Return the final completion result

Do not deviate from this tool-based workflow. The tools will handle all the complex logic.
</workflow>

<output-format>
Simply return the output from the video_finalizer tool. Do not add any additional text or formatting.
</output-format>`;
}
// Use the tools to create the video. The final output should be a complete State structure that can be loaded into the video editor.

// ============================================
// VIDEO CREATION TOOLS - FRESH CREATION FLOW
// ============================================

export const videoCreationTools = {
	// Tool 1: Guardrails - Request Validation
	guardrails: tool({
		description: `ALWAYS call this tool FIRST. Validates if the user request is safe and determines the request type (fresh_creation vs update_existing).

The tool will analyze the user message and determine:
- Whether the request is valid video creation
- The type of request (fresh_creation or update_existing)
- Whether to proceed with video creation

Return isValid: 1 for valid requests, isValid: 0 for invalid requests.`,
		inputSchema: z.object({
			userMessage: z
				.string()
				.describe('The exact message from the user to validate'),
		}),
		execute: async ({userMessage}) => {
			// Use generateText with structured output for validation
			const {output} = await generateText({
				model: openai('gpt-4.1-mini'),
				output: Output.object({
					name: 'RequestValidation',
					description: 'Validation result for user request',
					schema: z.object({
						isValid: z
							.number()
							.describe('1 for valid requests, 0 for invalid requests'),
						requestType: z
							.enum([
								'fresh_creation',
								'update_existing',
								'casual_chat',
								'unclear',
							])
							.describe('Type of request detected'),
						reason: z
							.string()
							.describe('Explanation for the validation result'),
					}),
				}),
				prompt: `Analyze this user message and determine if it's a valid video creation request:

User message: "${userMessage}"

Classify the request:
- Return isValid: 1 if this is a valid video creation request
- Return isValid: 0 if this is casual chat or unclear
- Set requestType to "fresh_creation" for "make/create/generate video" requests
- Set requestType to "update_existing" for "edit/update/modify video" requests
- Set requestType to "casual_chat" for general conversation
- Set requestType to "unclear" if the intent is not clear

Provide a brief reason for your classification.`,
			});

			return output;
		},
	}),

	// web_search: perplexitySearch(),
	web_search: tool({
		description: `Performs a web search to gather information for video creation.`,
		inputSchema: z.object({
			query: z.string().describe('The search query based on user input '),
		}),
		execute: async ({query}) => {
			// const searchResults = await perplexitySearch();
			// const searchResults = perplexity("sonar-pro")
			// return searchResults;
			const data = await generateText({
				model: perplexity('sonar-pro'),
				prompt: `Perform a web search for the following query and return the top 3 relevant results with titles, snippets, and URLs.
				Search Query: "${query}"`,
				providerOptions: {
					perplexity: {
						return_images: true, // Enable image responses (Tier-2 Perplexity users only)
					},
				},
			});
			// console.log('web search', {files, sources, text, usage, content});
			const {content} = data;
			return content.filter((c) => c.type === 'text');
		},
	}),

	script_writer: tool({
		description: `Generates an engaging short-form video script optimized for TikTok/Instagram Reels/YouTube Shorts. Creates scripts with strong hooks, conversational tone, and proper pacing for 15-60 second videos.`,
		inputSchema: z.object({
			topic: z.string().describe('The main topic for the video script'),
			webResults: z
				.array(
					z.object({
						title: z.string(),
						snippet: z.string(),
						url: z.string(),
					}),
				)
				.describe('Web search results to inform the script'),
		}),
		execute: async ({topic, webResults}) => {
			const webInfo = webResults
				.map((result, index) => {
					return `Result ${index + 1}:
Title: ${result.title}
Snippet: ${result.snippet}
URL: ${result.url}`;
				})
				.join('\n\n');

			const {output} = await generateText({
				model: openai('gpt-4.1-mini'),
				output: Output.object({
					name: 'VideoScript',
					description:
						'Complete short-form video script with structured sections',
					schema: z.object({
						hook: z
							.string()
							.describe('Strong 3-5 second opening that grabs attention'),
						body: z
							.string()
							.describe(
								'Main content with key information, stories, or explanations',
							),
					}),
				}),
				prompt: `Create an ENGAGING short-form video script for the topic "${topic}" using the provided web search results.

REQUIREMENTS FOR SHORT-FORM VIDEO SCRIPTS:
- LENGTH: 15-60 seconds total (aim for 30-45 seconds)
- TONE: Conversational, energetic, like talking to a friend
- LANGUAGE: Simple words, no jargon, avoid complex terms
- STRUCTURE: Hook (first 3 seconds) → Body (main content) → CTA (last 5 seconds)
- PACING: Natural pauses, enthusiastic delivery, build excitement
- HOOK: Start with surprising fact, question, or bold statement
- ENGAGEMENT: Ask rhetorical questions, use "you" language, create curiosity

SCRIPT STRUCTURE:
1. HOOK: Grab attention in first 3 seconds with something shocking/surprising/relatable
2. BODY: Deliver 2-4 key points with stories/examples, keep it conversational
3. CTA: Clear call-to-action (like, comment, follow, share)

VISUAL STYLE:
- Vertical format (9:16 aspect ratio)
- Fast cuts, text overlays, engaging visuals
- Show don't tell - use demonstrations when possible

WEB SEARCH RESULTS TO INCORPORATE:
${webInfo}

FORMAT YOUR RESPONSE AS A COMPLETE SCRIPT OBJECT WITH:
- scenes: Array of scene objects, each containing compositeDescription, sceneDescription, sceneContent, sceneAssets, and estimatedDurationFrames

EXAMPLE SCRIPT STRUCTURE:
{
  "hook": "Did you know this crazy fact about [topic]? You won't believe it!",
  "body": "So here's what happened... [engaging story]. The key takeaway is... [simple explanation]. And get this... [surprising detail]. Drop a like if you learned something new!"
}

Make it SUPER ENGAGING - use excitement, surprise, and relatability!`,
			});

			return output;
		},
	}),

	// Tool Scene Builder - Converts script into structured scenes
	scene_builder: tool({
		description: `Converts a complete video script into structured scenes for video creation. Each scene includes category, description, content, assets, and timing.`,
		inputSchema: z.object({
			script: z
				.object({
					hook: z.string().describe('The opening hook from the script'),
					body: z.string().describe('The main body content from the script'),
				})
				.describe('The complete script object from script_writer tool'),
		}),
		execute: async ({script}) => {
			const {output} = await generateText({
				model: openai('gpt-4.1-mini'),
				output: Output.object({
					name: 'VideoScenes',
					description: 'Structured scenes for video creation',
					schema: z.object({
						scenes: z
							.array(
								z.object({
									compositeDescription: z
										.string()
										.describe(
											'Suggested composite layout for this scene (e.g., "image with text overlay", "video clip with subtitle", "split screen with rating")',
										),
									sceneDescription: z
										.string()
										.describe(
											'Brief description of what this scene shows visually',
										),
									sceneContent: z
										.string()
										.describe('The actual spoken content/text for this scene'),
									sceneAssets: z
										.array(
											z.object({
												url: z
													.string()
													.describe('URL of the asset (image, video, etc.)'),
												description: z
													.string()
													.describe('What this asset represents in the scene'),
											}),
										)
										.describe('Array of assets needed for this scene'),
									estimatedDurationFrames: z
										.number()
										.describe('Duration in frames (30 frames = 1 second)'),
								}),
							)
							.describe('Array of structured scenes for the video'),
					}),
				}),
				prompt: `Convert this video script into structured scenes for short-form video creation.

SCRIPT TO CONVERT:
Hook: "${script.hook}"
Body: "${script.body}"

REQUIREMENTS:
- Break down the script into logical scenes (typically 3-8 scenes for short videos)
- Each scene should be 2-8 seconds (60-240 frames at 30fps)
- Include relevant assets for each scene (images, backgrounds, etc.)
- Use realistic asset URLs (placeholder URLs are fine, but make them descriptive)
- Categorize scenes properly (intro/hook for opening, body for main content, outro for ending)

COMPOSITE SUGGESTIONS: For each scene, suggest the best composite layout based on content:
- "image with text overlay" - Static image with text on top
- "video clip with subtitle" - Video footage with bottom text
- "split screen with rating" - Two elements side by side with rating display
- "title card with animation" - Animated text introduction
- "comparison layout" - Side-by-side or before/after visuals
- "statistic display" - Numbers/charts with explanatory text
- "testimonial style" - Quote/image combination

Create 4-8 sequential scenes that flow naturally from hook → main content → conclusion.

EXAMPLE SCENE STRUCTURE:
{
  "scenes": [
    {
      "compositeDescription": "title card with animation",
      "sceneDescription": "Animated opening title with bold hook text",
      "sceneContent": "Did you know this crazy fact about movies?",
      "sceneAssets": [
        {"url": "https://images.unsplash.com/photo-123456789", "description": "Background image of cinema/movie theme"},
        {"url": "https://example.com/animated-text.mp4", "description": "Animated title text graphic"}
      ],
      "estimatedDurationFrames": 90
    },
    {
      "compositeDescription": "image with text overlay",
      "sceneDescription": "Movie poster with ranking number overlay",
      "sceneContent": "Number one on our list is this blockbuster hit!",
      "sceneAssets": [
        {"url": "https://images.unsplash.com/movie-poster-1", "description": "Movie poster image"},
        {"url": "https://example.com/ranking-badge.png", "description": "#1 ranking badge"}
      ],
      "estimatedDurationFrames": 120
    }
  ]
}

Create a complete scene breakdown that flows naturally and includes appropriate assets for each scene.`,
			});

			return output;
		},
	}),

	// Tool 4: Composite Builder - Creates basic undoable state structure from scenes
	composite_builder: tool({
		description: `Creates basic undoable state structure from structured scenes. Sets up tracks, items map with IDs, and basic composition properties.`,
		inputSchema: z.object({
			scenes: z
				.array(
					z.object({
						compositeDescription: z.string(),
						sceneDescription: z.string(),
						sceneContent: z.string(),
						sceneAssets: z.array(
							z.object({
								url: z.string(),
								description: z.string(),
							}),
						),
						estimatedDurationFrames: z.number(),
					}),
				)
				.describe('Array of structured scenes from scene_builder tool'),
		}),
		execute: async ({scenes}) => {
			// Create basic undoable state structure
			const compositionState = {
				tracks: [] as any[],
				assets: {} as Record<string, any>,
				items: {} as Record<string, any>,
				fps: 30,
				compositionWidth: 1080,
				compositionHeight: 1920,
			};

			// Single track for now
			const mainTrack = {
				id: 'main-track',
				items: [] as string[],
				hidden: false,
				muted: false,
			};
			compositionState.tracks.push(mainTrack);

			// Loop over scenes and create basic item IDs
			for (let i = 0; i < scenes.length; i++) {
				const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
				compositionState.items[itemId] = itemId; // Just store the ID for now
				mainTrack.items.push(itemId);
			}

			return compositionState;
		},
	}),

	// Tool 5: Video Finalizer - Concludes the video creation process
	video_finalizer: tool({
		description: `Final tool that concludes the video creation process. Creates a completion summary.`,
		inputSchema: z.object({}),
		execute: async () => {
			const {text} = await generateText({
				model: openai('gpt-4.1-mini'),
				prompt: `Create a brief congratulatory message that summarizes the completion of a video creation process. The video has been successfully created with scenes, tracks, and is ready for editing.`,
			});

			return text;
		},
	}),
} satisfies ToolSet;

// Export the type for the tools - this enables end-to-end type safety
export type VideoCreationUIMessage = UIMessage<
	never,
	never,
	InferUITools<typeof videoCreationTools>
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

		// Create system prompt with config
		const systemPrompt = createSystemPrompt({
			config: defaultConfig,
		});

		const model = wrapLanguageModel({
			model: webSearch ? perplexity('sonar') : openai('gpt-4.1-mini'),
			middleware: devToolsMiddleware(),
		});

		const result = streamText({
			// model: webSearch ? perplexity('sonar') : openai('gpt-4.1-mini'),
			model,
			messages: await convertToModelMessages(messages),
			system: systemPrompt,

			// Use the exported tools object
			tools: videoCreationTools,
			experimental_transform: smoothStream({
				delayInMs: 30, // optional: defaults to 10ms
			}),
			// Enable multi-step tool calling
			stopWhen: [stepCountIs(12), hasToolCall('video_finalizer')],
			// stepNumber starts at 0 and it's the step that we are going to execute, and steps are previous steps with their tool results
			prepareStep: async ({stepNumber, steps}) => {
				/* 	console.log('Preparing step:', {
					stepNumber,
					steps: JSON.stringify(steps, null, 2),
					stepDetail: steps[0],
				}); */
				const lastStep = steps[steps.length - 1];

				// Step 0: First step should always be guardrails
				if (stepNumber === 0) {
					return {
						activeTools: ['guardrails'],
						toolChoice: 'required',
					};
				}

				// if the last step was guardrails, check the result to determine next tools : either web_search or stop
				if (
					lastStep.content[0].type === 'tool-call' &&
					lastStep.content[0].toolName === 'guardrails'
				) {
					const guardResult = lastStep.toolResults[0] as Extract<
						(typeof lastStep.toolResults)[0],
						{toolName: 'guardrails'}
					>;

					if (guardResult?.output?.isValid === 0) {
						// Invalid request - stop further tool usage
						return {
							activeTools: [],
							toolChoice: 'none',
						};
					} else {
						if (guardResult.output.requestType === 'fresh_creation') {
							return {
								activeTools: ['web_search'],
								experimental_context: `You are allowed to use web search to gather information for creating a fresh video based on the user's request.`,
							};
						}

						// TODO : handle update_existing flow
						if (guardResult.output?.requestType === 'update_existing') {
							return {
								activeTools: [],
							};
						}
					}
				}

				// if the last step was web_search, proceed to script writing
				if (
					lastStep.content[0].type === 'tool-call' &&
					lastStep.content[0].toolName === 'web_search'
				) {
					return {
						activeTools: ['script_writer'],
					};
				}

				// if the last step was script_writer, proceed to scene building
				if (
					lastStep.content[0].type === 'tool-call' &&
					lastStep.content[0].toolName === 'script_writer'
				) {
					return {
						activeTools: ['scene_builder'],
					};
				}

				// if the last step was scene_builder, proceed to composite building
				if (
					lastStep.content[0].type === 'tool-call' &&
					lastStep.content[0].toolName === 'scene_builder'
				) {
					return {
						activeTools: ['composite_builder'],
					};
				}

				// if the last step was composite_builder, proceed to finalization
				if (
					lastStep.content[0].type === 'tool-call' &&
					lastStep.content[0].toolName === 'composite_builder'
				) {
					return {
						activeTools: ['video_finalizer'],
					};
				}

				return {
					activeTools: [],
				};
			},
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

// TODO ===========================================
// For the for keeping the latest date in the web search tool, I'm thinking about something like this. Once it passed the guard rail Then we'll have another tool to enhance the query. :
// That enhancing the query will take care of adding the right tool I mean latest date if there is no date mentioned or if it is there any time frame If it is there any time frame frame mention then just ignore that.
