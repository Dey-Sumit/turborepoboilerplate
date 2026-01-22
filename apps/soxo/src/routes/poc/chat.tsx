/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import '../../editor/editor-starter.css';

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {Loader} from '@/components/ai-elements/loader';
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from '@/components/ai-elements/message';
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputHeader,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from '@/components/ai-elements/sources';
import {useChat} from '@ai-sdk/react';
import {DefaultChatTransport} from 'ai';
import {CopyIcon, GlobeIcon, RefreshCcwIcon} from 'lucide-react';
import {useState} from 'react';
import {CodeBlock} from '../../components/ai-elements/code-block';
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from '../../components/ai-elements/tool';
import {VideoCreationUIMessage} from '../api/chat';
const models = [
	{
		name: 'GPT 4o',
		value: 'openai/gpt-4o',
	},
	{
		name: 'Deepseek R1',
		value: 'deepseek/deepseek-r1',
	},
];
const _messages: VideoCreationUIMessage[] = [
	{
		parts: [
			{
				type: 'text',
				text: 'top 5 movies of hollywood this year',
			},
		],
		id: 'rlVNZfYWftUhFVwU',
		role: 'user',
	},
	{
		id: 'YH1Ky4yxOqRhzlDn',
		role: 'assistant',
		parts: [
			{
				type: 'step-start',
			},
			{
				type: 'tool-guardrails',
				toolCallId: 'call_w2ISCk8V4F7nMEBgUhHUPOsD',
				state: 'output-available',
				input: {
					userMessage: 'top 5 movies of hollywood this year',
				},
				output: {
					isValid: 1,
					requestType: 'fresh_creation',
					reason:
						'The user is requesting a video listing the top 5 Hollywood movies of this year, which is a clear request to create new video content.',
				},
				callProviderMetadata: {
					openai: {
						itemId: 'fc_097db54018df43e00069544f73e8a88195b89a9f11833a0aec',
					},
				},
			},
			{
				type: 'step-start',
			},
			{
				type: 'tool-web_search',
				toolCallId: 'call_xJT0M6xcAInNUfZBeJAmIqd3',
				state: 'output-available',
				input: {
					query: 'top 5 Hollywood movies 2024',
				},
				output: [
					{
						type: 'text',
						text: 'I appreciate your question, but I need to clarify what I can do here. I\'m not performing a new web search for you—I\'ve been provided with existing search results that cover best movies of 2024. I can synthesize information from those results to answer your query about top Hollywood movies from 2024.\n\nBased on the search results provided, here are the most frequently cited top-performing movies of 2024:\n\n**"Anora"** is ranked as the #1 best movie of 2024 by SlashFilm, described as "a blend of screwball comedy, whirling romance, keen satire, and high-stress thriller" by writer/director Sean Baker.[2]\n\n**"The Brutalist"** by Brady Corbet is prominently featured across multiple sources and expected to be named best film of 2024 by many outlets, characterized as "epic" and "wildly accomplished."[1][2] The film also features Adrien Brody in one of his finest performances.[2]\n\n**"I Saw the TV Glow"** ranks #1 on Cinephile Corner\'s list and #17 on SlashFilm\'s ranking, praised as a showcase of independent filmmaking by young auteur Jane Schoenbrun.[1][2]\n\n**"Dune: Part Two"** ranks #6 on Cinephile Corner\'s list and is described as offering "one of the best theatergoing experiences of 2024."[1]\n\n**"Wicked"** appears as #13 on SlashFilm\'s list and grossed $758.8 million worldwide, making it one of the highest-grossing films of the year.[2][3]\n\nIf you need a fresh web search with specific formatting, you would need to use a search engine directly, as I work with pre-provided search results.',
					},
					{
						type: 'source',
						sourceType: 'url',
						id: 'cAS8GwT1JxZuSvjn',
						url: 'https://cinephilecorner.com/lists/best-movies-of-2024/',
					},
					{
						type: 'source',
						sourceType: 'url',
						id: 'rrFzbUncBMMgff4N',
						url: 'https://www.slashfilm.com/1739189/best-movies-2024-ranked/',
					},
					{
						type: 'source',
						sourceType: 'url',
						id: 'KABZU00weEDJ31eb',
						url: 'https://www.boxofficemojo.com/year/world/2024/',
					},
					{
						type: 'source',
						sourceType: 'url',
						id: 'iW4kB8zQzS2cPDG2',
						url: 'https://www.metacritic.com/pictures/best-movies-of-2024/',
					},
					{
						type: 'source',
						sourceType: 'url',
						id: 'Vo0gihJzEJxLj7nG',
						url: 'https://editorial.rottentomatoes.com/guide/best-2024-movies-every-certified-fresh/',
					},
				],
				callProviderMetadata: {
					openai: {
						itemId: 'fc_097db54018df43e00069544f76f888819585580ed3bd1eace1',
					},
				},
			},
			{
				type: 'step-start',
			},
			{
				type: 'tool-script_writer',
				toolCallId: 'call_0sBjENguTxBgyFxrn9h3S8Xq',
				state: 'output-available',
				input: {
					topic: 'Top 5 Hollywood Movies of 2024',
					webResults: [
						{
							title: 'Best Movies of 2024 - Cinephile Corner',
							snippet:
								'"Anora" is ranked as the #1 best movie of 2024 by SlashFilm, described as a blend of screwball comedy, whirling romance, keen satire, and high-stress thriller by writer/director Sean Baker.',
							url: 'https://cinephilecorner.com/lists/best-movies-of-2024/',
						},
						{
							title: 'Best Movies 2024 Ranked - SlashFilm',
							snippet:
								'The Brutalist by Brady Corbet is prominently featured, acclaimed as epic and wildly accomplished, featuring Adrien Brody in a top performance.',
							url: 'https://www.slashfilm.com/1739189/best-movies-2024-ranked/',
						},
						{
							title: 'Box Office Mojo - 2024 Movies',
							snippet:
								'"Wicked" grossed $758.8 million worldwide, making it one of the highest-grossing films of the year.',
							url: 'https://www.boxofficemojo.com/year/world/2024/',
						},
						{
							title: 'Metacritic - Best Movies of 2024',
							snippet:
								'Dune: Part Two is described as offering one of the best theatergoing experiences of 2024.',
							url: 'https://www.metacritic.com/pictures/best-movies-of-2024/',
						},
						{
							title: 'Rotten Tomatoes - Best 2024 Movies',
							snippet:
								'I Saw the TV Glow is praised as a showcase of independent filmmaking, highly ranked on top movie lists.',
							url: 'https://editorial.rottentomatoes.com/guide/best-2024-movies-every-certified-fresh/',
						},
					],
				},
				output: {
					hook: "Think you know 2024's best Hollywood movies? Wait 'til you see this!",
					body: 'Let\'s dive into the top 5 films you can\'t miss this year! First up, the quirky and thrilling "Anora"—a wild mix of romance, comedy, and high-stress fun by Sean Baker. Then there\'s "The Brutalist," featuring Adrien Brody—an epic, gripping performance you’ll be talking about. Next, the blockbuster "Wicked" smashed the box office with over $750 million worldwide—can you believe that? Don’t forget "Dune: Part Two," offering one of the most incredible theater experiences of 2024. Lastly, indie gem "I Saw the TV Glow" is winning hearts and critics alike. Which one’s your must-watch? Hit me in the comments! And hey—if you love movies, smash that follow button! Let’s keep the conversation rolling.',
				},
				callProviderMetadata: {
					openai: {
						itemId: 'fc_097db54018df43e00069544f7f6dd081959478d57e4bff2405',
					},
				},
			},
			{
				type: 'step-start',
			},
			{
				type: 'tool-scene_builder',
				toolCallId: 'call_pIbpNQajAnEktm7I2QnDOIIi',
				state: 'output-available',
				input: {
					script: {
						hook: "Think you know 2024's best Hollywood movies? Wait 'til you see this!",
						body: 'Let\'s dive into the top 5 films you can\'t miss this year! First up, the quirky and thrilling "Anora"—a wild mix of romance, comedy, and high-stress fun by Sean Baker. Then there\'s "The Brutalist," featuring Adrien Brody—an epic, gripping performance you’ll be talking about. Next, the blockbuster "Wicked" smashed the box office with over $750 million worldwide—can you believe that? Don’t forget "Dune: Part Two," offering one of the most incredible theater experiences of 2024. Lastly, indie gem "I Saw the TV Glow" is winning hearts and critics alike. Which one’s your must-watch? Hit me in the comments! And hey—if you love movies, smash that follow button! Let’s keep the conversation rolling.',
					},
				},
				output: {
					scenes: [
						{
							compositeDescription: 'title card with animation',
							sceneDescription:
								'Animated bold hook text on energetic background',
							sceneContent:
								"Think you know 2024's best Hollywood movies? Wait 'til you see this!",
							sceneAssets: [
								{
									url: 'https://example.com/animated-cinema-background.mp4',
									description:
										'Energetic moving background with film reels and lights animation',
								},
								{
									url: 'https://example.com/animated-hook-text.mp4',
									description: 'Animated text graphic of the hook line',
								},
							],
							estimatedDurationFrames: 120,
						},
						{
							compositeDescription: 'image with text overlay',
							sceneDescription:
								"Poster of the movie 'Anora' with overlay text describing the film and director",
							sceneContent:
								'First up, the quirky and thrilling “Anora” — a wild mix of romance, comedy, and high-stress fun by Sean Baker.',
							sceneAssets: [
								{
									url: 'https://images.example.com/movies/anora-poster.jpg',
									description: "Official poster of the movie 'Anora'",
								},
								{
									url: 'https://example.com/sean-baker-photo.jpg',
									description: 'Portrait image of director Sean Baker',
								},
							],
							estimatedDurationFrames: 150,
						},
						{
							compositeDescription: 'image with text overlay',
							sceneDescription:
								"Poster of 'The Brutalist' highlighting Adrien Brody's performance with dramatic background",
							sceneContent:
								"Then there's “The Brutalist,” featuring Adrien Brody — an epic, gripping performance you’ll be talking about.",
							sceneAssets: [
								{
									url: 'https://images.example.com/movies/the-brutalist-poster.jpg',
									description: "Movie poster for 'The Brutalist'",
								},
								{
									url: 'https://images.example.com/actors/adrien-brody.jpg',
									description: 'Headshot of actor Adrien Brody',
								},
							],
							estimatedDurationFrames: 150,
						},
						{
							compositeDescription: 'statistic display',
							sceneDescription:
								"'Wicked' movie poster beside impressive box office revenue numbers",
							sceneContent:
								'Next, the blockbuster “Wicked” smashed the box office with over $750 million worldwide — can you believe that?',
							sceneAssets: [
								{
									url: 'https://images.example.com/movies/wicked-poster.jpg',
									description: "Poster of 'Wicked'",
								},
								{
									url: 'https://example.com/box-office-chart.png',
									description:
										'Graph showing box office earnings surpassing $750 million',
								},
							],
							estimatedDurationFrames: 180,
						},
						{
							compositeDescription: 'image with text overlay',
							sceneDescription:
								"Cinematic still from 'Dune: Part Two' emphasizing immersive theater experience",
							sceneContent:
								'Don’t forget “Dune: Part Two,” offering one of the most incredible theater experiences of 2024.',
							sceneAssets: [
								{
									url: 'https://images.example.com/movies/dune-part-two-still.jpg',
									description: "Epic still image from 'Dune: Part Two'",
								},
							],
							estimatedDurationFrames: 150,
						},
						{
							compositeDescription: 'image with text overlay',
							sceneDescription:
								"Artistic poster of indie film 'I Saw the TV Glow' with critic quotes",
							sceneContent:
								'Lastly, indie gem “I Saw the TV Glow” is winning hearts and critics alike.',
							sceneAssets: [
								{
									url: 'https://images.example.com/movies/i-saw-the-tv-glow-poster.jpg',
									description: "Poster of 'I Saw the TV Glow'",
								},
								{
									url: 'https://example.com/critics-quotes.png',
									description: 'Overlay graphic with critic praise quotes',
								},
							],
							estimatedDurationFrames: 150,
						},
						{
							compositeDescription: 'video clip with subtitle',
							sceneDescription:
								'Host inviting viewers to comment and follow, with casual background',
							sceneContent:
								'Which one’s your must-watch? Hit me in the comments! And hey — if you love movies, smash that follow button! Let’s keep the conversation rolling.',
							sceneAssets: [
								{
									url: 'https://videos.example.com/host-inviting-viewers.mp4',
									description:
										'Video clip of host speaking to camera in casual setting',
								},
								{
									url: 'https://example.com/follow-button-animation.gif',
									description: "Animated 'Follow' button graphic",
								},
							],
							estimatedDurationFrames: 180,
						},
					],
				},
				callProviderMetadata: {
					openai: {
						itemId: 'fc_097db54018df43e00069544f9080308195a2eb45127149689d',
					},
				},
			},
		],
	},
];
const ChatBotDemo = () => {
	const [input, setInput] = useState('');
	const [webSearch, setWebSearch] = useState(false);
	const {messages, sendMessage, status, regenerate} =
		useChat<VideoCreationUIMessage>({
			transport: new DefaultChatTransport({
				api: '/api/chat',
			}),
		});
	// console.log({messages});

	const handleSubmit = (message: PromptInputMessage) => {
		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);
		if (!(hasText || hasAttachments)) {
			return;
		}
		sendMessage(
			{
				text: message.text || 'Sent with attachments',
				files: message.files,
			},
			{
				body: {
					// model: model,
					webSearch: webSearch,
				},
			},
		);
		setInput('');
	};
	return (
		<div className="relative mx-auto size-full h-screen max-w-3xl border p-6">
			<div className="flex h-full flex-col">
				<Conversation className="h-full">
					<ConversationContent>
						{messages.map((message) => (
							<div key={message.id}>
								{message.role === 'assistant' &&
									message.parts.filter((part) => part.type === 'source-url')
										.length > 0 && (
										<Sources>
											<SourcesTrigger
												count={
													message.parts.filter(
														(part) => part.type === 'source-url',
													).length
												}
											/>
											{message.parts
												.filter((part) => part.type === 'source-url')
												.map((part, i) => (
													<SourcesContent key={`${message.id}-${i}`}>
														<Source
															key={`${message.id}-${i}`}
															href={part.url}
															title={part.url}
														/>
													</SourcesContent>
												))}
										</Sources>
									)}
								{message.parts.map((part, i) => {
									switch (part.type) {
										case 'text':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<MessageContent>
														<MessageResponse>{part.text}</MessageResponse>
													</MessageContent>
													{message.role === 'assistant' &&
														i === messages.length - 1 && (
															<MessageActions>
																<MessageAction
																	onClick={() => regenerate()}
																	label="Retry"
																>
																	<RefreshCcwIcon className="size-3" />
																</MessageAction>
																<MessageAction
																	onClick={() =>
																		navigator.clipboard.writeText(part.text)
																	}
																	label="Copy"
																>
																	<CopyIcon className="size-3" />
																</MessageAction>
															</MessageActions>
														)}
												</Message>
											);
										case 'reasoning':
											return (
												<Reasoning
													key={`${message.id}-${i}`}
													className="w-full"
													isStreaming={
														status === 'streaming' &&
														i === message.parts.length - 1 &&
														message.id === messages.at(-1)?.id
													}
												>
													<ReasoningTrigger />
													<ReasoningContent>{part.text}</ReasoningContent>
												</Reasoning>
											);

										case 'tool-guardrails':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<Tool defaultOpen={true}>
														<ToolHeader
															type="tool-guardrails"
															state={part.state}
														/>
														<ToolContent>
															<ToolInput input={part.input} />
															<ToolOutput
																output={
																	<CodeBlock
																		code={JSON.stringify(part.output, null, 2)}
																		language="json"
																	/>
																}
																errorText={part.errorText}
															/>
														</ToolContent>
													</Tool>
												</Message>
											);

										case 'tool-web_search':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<MessageContent className="p-2">
														{/* <Sources>
															<SourcesTrigger
																className="text-blue-600"
																count={
																	part.output?.filter(
																		(p) => p.type === 'source',
																	).length || 0
																}
															/>
															<SourcesContent className="text-blue-100">
																{part.output?.content
																	?.filter(
																		(p) =>
																			p.type === 'source' &&
																			p.sourceType === 'url',
																	)
																	.map((source) => (
																		<Source
																			href={source.url}
																			key={source.id}
																			title={source.url}
																		/>
																	))}
															</SourcesContent>
														</Sources> */}

														{part.output?.map((p) => {
															if (p.type === 'text') {
																return (
																	<MessageResponse>{p.text}</MessageResponse>
																);
															}

															return null;
														})}
													</MessageContent>
												</Message>
											);

										case 'tool-script_writer':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<Tool defaultOpen={true}>
														<ToolHeader
															type="tool-script-writer"
															state={part.state}
														/>
														<ToolContent>
															{/* <ToolInput input={part.input} /> */}
															<ToolOutput
																output={
																	<MessageContent className="p-4">
																		<MessageResponse>
																			{part.output?.hook}
																		</MessageResponse>
																		<MessageResponse>
																			{part.output?.body}
																		</MessageResponse>
																	</MessageContent>
																}
																errorText={part.errorText}
															/>
														</ToolContent>
													</Tool>
												</Message>
											);

										case 'tool-scene_builder':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<Tool defaultOpen={true}>
														<ToolHeader
															type="tool-script-writer"
															state={part.state}
														/>
														<ToolContent>
															{/* <ToolInput input={part.input} /> */}
															<ToolOutput
																output={
																	<MessageContent>
																		{/* <pre className="font-mono text-xs whitespace-pre-wrap">
																			{JSON.stringify(part.output, null, 2)}
																		</pre> */}

																		<CodeBlock
																			className="text-xs"
																			code={JSON.stringify(
																				part.output,
																				null,
																				2,
																			)}
																			language="json"
																		/>
																	</MessageContent>
																}
																errorText={part.errorText}
															/>
														</ToolContent>
													</Tool>
												</Message>
											);
										case 'tool-composite_builder':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<Tool defaultOpen={true}>
														<ToolHeader
															type="tool-composite_builder"
															state={part.state}
														/>
														<ToolContent>
															{/* <ToolInput input={part.input} /> */}
															<ToolOutput
																output={
																	<MessageContent>
																		<CodeBlock
																			className="text-xs"
																			code={JSON.stringify(
																				part.output,
																				null,
																				2,
																			)}
																			language="json"
																		/>
																	</MessageContent>
																}
																errorText={part.errorText}
															/>
														</ToolContent>
													</Tool>
												</Message>
											);
										default:
											return null;
									}
								})}
							</div>
						))}
						{status === 'submitted' && <Loader />}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
				<PromptInput
					onSubmit={handleSubmit}
					className="mt-4"
					globalDrop
					multiple
				>
					<PromptInputHeader>
						<PromptInputAttachments>
							{(attachment) => <PromptInputAttachment data={attachment} />}
						</PromptInputAttachments>
					</PromptInputHeader>
					<PromptInputBody>
						<PromptInputTextarea
							onChange={(e) => setInput(e.target.value)}
							value={input}
						/>
					</PromptInputBody>
					<PromptInputFooter>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>
									<PromptInputActionAddAttachments />
								</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<PromptInputButton
								variant={webSearch ? 'default' : 'ghost'}
								onClick={() => setWebSearch(!webSearch)}
							>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
						</PromptInputTools>
						<PromptInputSubmit disabled={!input && !status} status={status} />
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
};
export default ChatBotDemo;

/* 

case 'tool-web_search_1':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<Tool defaultOpen={true}>
														<ToolHeader
															type="tool-web-search"
															state={part.state}
														/>
														<ToolContent>
															<ToolInput input={part.input} />
															<ToolOutput
																output={
																	<MessageContent className="p-2">
																		<Sources>
																			<SourcesTrigger
																				count={
																					part.output?.filter(
																						(p) => p.type === 'source',
																					).length || 0
																				}
																			/>
																			<SourcesContent>
																				{part.output
																					?.filter(
																						(p) =>
																							p.type === 'source' &&
																							p.sourceType === 'url',
																					)
																					.map((source) => (
																						<Source
																							href={source.url}
																							key={source.id}
																							title={source.url}
																						/>
																					))}
																			</SourcesContent>
																		</Sources>

																		{part.output?.map((p) => {
																			if (p.type === 'text') {
																				return (
																					<MessageResponse>
																						{p.text}
																					</MessageResponse>
																				);
																			}
																			if (p.type === 'source') {
																				const sources = p;
																				return null;
																				// <Sources>
																				// 	<SourcesTrigger
																				// 		count={sources.length}
																				// 	/>
																				// 	<SourcesContent>
																				// 		{sources.map((source) => (
																				// 			<Source
																				// 				href={source.href}
																				// 				key={source.href}
																				// 				title={source.title}
																				// 			/>
																				// 		))}
																				// 	</SourcesContent>
																				// </Sources>
																			}
																			return null;
																		})}
																	</MessageContent>
																}
																errorText={part.errorText}
															/>
														</ToolContent>
													</Tool>
												</Message>
											); */
