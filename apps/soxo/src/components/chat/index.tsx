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

import {useChat} from '@ai-sdk/react';
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import {CopyIcon, GlobeIcon, RefreshCcwIcon} from 'lucide-react';
import {useEffect, useState} from 'react';

import {
	EditorContext,
	VideoCreationUIMessageV2,
} from '../../routes/api/chat-update-component';
import useUIStore from '../../zustand/ui-store';
import useEditorStore from '../../zustand/editor-store';
import {createTextItem} from '../../editor/items/text/create-text-item';
import {addItem} from '../../editor/state/actions/add-item';
import {TextShimmer} from '../ui/text-shimmer';
import {generateRandomId} from '../../editor/utils/generate-random-id';
import {SolidItem} from '../../editor/items/solid/solid-item-type';
import {addTransition} from '../../editor/state/actions/transition';
import {Transition} from '../../editor/state/types';

// Generic handler for get_item_info (works for any item type)
const GetItemInfoHandler = ({
	part,
	addToolOutput,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-get_item_info'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
}) => {
	useEffect(() => {
		if (part.state !== 'input-available') return;

		const {itemId} = part.input;
		const item = useEditorStore.getState().compositionState?.items[itemId];

		addToolOutput({
			toolCallId: part.toolCallId,
			tool: 'get_item_info',
			output: item ? {itemData: item} : {error: 'Item not found'},
		});
	}, [part, addToolOutput]);

	switch (part.state) {
		case 'input-streaming':
			return (
				<TextShimmer duration={2} className="text-sm">
					Fetching item info...
				</TextShimmer>
			);
		case 'input-available':
			return <div className="text-sm">Fetching: {part.input.itemId}</div>;
		case 'output-available':
			return (
				<div className="my-2 border border-green-600 bg-green-500/30 p-2 text-sm">
					Item info shared: {part.input.itemId}
				</div>
			);
		case 'output-error':
			return <div className="text-red-500">{part.errorText}</div>;
		default:
			return null;
	}
};

const TextEditor = ({
	part,
	addToolOutput,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-text_editor'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
	sendMessage: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['sendMessage'];
}) => {
	// const compositionState = useEditorStore.getState().compositionState;
	const callId = part.toolCallId;
	switch (part.state) {
		case 'input-streaming':
			return <TextShimmer duration={2}>Updating text item...</TextShimmer>;
		case 'input-available': {
			// Flat schema: itemId + all properties at root level (no "changes" wrapper)
			const {itemId, ...changes} = part.input;
			return (
				<div key={callId} className="flex flex-col gap-4">
					<pre>{JSON.stringify({itemId, ...changes}, null, 2)}</pre>
					<UpdateTextInputAvailable part={part} addToolOutput={addToolOutput} />
				</div>
			);
		}

		case 'output-error':
			return <div key={callId}>Error:{part.errorText}</div>;
		default:
			return null;
	}
};

const UpdateTextInputAvailable = ({
	part,
	addToolOutput,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-text_editor'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
}) => {
	useEffect(() => {
		if (part.state === 'input-available') {
			// Flat schema: itemId + all properties at root level
			const {itemId, ...changes} = part.input;
			const updateItem = useEditorStore.getState().updateItem;

			updateItem(itemId, (item) => {
				console.log('Updating text item:', itemId, item, changes);
				return {
					...item,
					...changes,
				};
			});
			addToolOutput({
				toolCallId: part.toolCallId,
				tool: 'text_editor',
				output: {success: true},
			});
		}
	}, [part, addToolOutput]);

	return null;
};

// Handler for add_text_item tool
const AddTextItemHandler = ({
	part,
	addToolOutput,
	context,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-add_text_item'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
	context: EditorContext;
}) => {
	useEffect(() => {
		const handleAddTextItem = async () => {
			if (part.state !== 'input-available') return;

			const {text, x, y, ...overrides} = part.input;
			const setState = useEditorStore.getState().setState;

			try {
				const item = await createTextItem({
					xOnCanvas: x,
					yOnCanvas: y,
					from: context.currentFrame,
					text,
					align: overrides.align === 'left' ? 'left' : 'center',
				});

				// Spread all overrides - flat schema matches TextItem properties
				Object.assign(item, overrides);

				// Add item to timeline
				setState((state) => {
					addItem({
						state,
						item,
						position: {type: 'front'},
					});
				});

				// Select the new item
				useUIStore.getState().setSelectedItems([item.id]);

				// Return success to AI
				addToolOutput({
					toolCallId: part.toolCallId,
					tool: 'add_text_item',
					output: {success: true, itemId: item.id},
				});
			} catch (error) {
				addToolOutput({
					toolCallId: part.toolCallId,
					tool: 'add_text_item',
					output: {success: false, error: String(error)},
				});
			}
		};

		handleAddTextItem();
	}, [part, addToolOutput, context]);

	const callId = part.toolCallId;
	switch (part.state) {
		case 'input-streaming':
			return (
				<TextShimmer duration={2} className="text-sm">
					Adding text item...
				</TextShimmer>
			);
		case 'input-available':
			return (
				<div key={callId} className="text-green-600">
					Adding text: "{part.input.text}"
				</div>
			);
		case 'output-error':
			return <div key={callId}>Error: {part.errorText}</div>;
		default:
			return null;
	}
};

// Handler for add_solid_item tool
const AddSolidItemHandler = ({
	part,
	addToolOutput,
	context,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-add_solid_item'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
	context: EditorContext;
}) => {
	useEffect(() => {
		if (part.state !== 'input-available') return;

		const {x, y, width, height, ...overrides} = part.input;
		const setState = useEditorStore.getState().setState;

		try {
			const id = generateRandomId('solid');
			const item: SolidItem = {
				type: 'solid',
				id,
				left: x,
				top: y,
				width,
				height,
				from: context.currentFrame,
				durationInFrames: overrides.durationInFrames ?? context.fps * 5,
				color: overrides.color ?? '#ffffff',
				opacity: overrides.opacity ?? 1,
				rotation: overrides.rotation ?? 0,
				borderRadius: overrides.borderRadius ?? 0,
				fadeInDurationInSeconds: overrides.fadeInDurationInSeconds ?? 0,
				fadeOutDurationInSeconds: overrides.fadeOutDurationInSeconds ?? 0,
				isDraggingInTimeline: false,
				keepAspectRatio: false,
				transition: {},
			};

			setState((state) => {
				addItem({state, item, position: {type: 'front'}});
			});

			useUIStore.getState().setSelectedItems([item.id]);

			addToolOutput({
				toolCallId: part.toolCallId,
				tool: 'add_solid_item',
				output: {success: true, itemId: item.id},
			});
		} catch (error) {
			addToolOutput({
				toolCallId: part.toolCallId,
				tool: 'add_solid_item',
				output: {success: false, error: String(error)},
			});
		}
	}, [part, addToolOutput, context]);

	switch (part.state) {
		case 'input-streaming':
			return (
				<TextShimmer duration={2} className="text-sm">
					Adding solid...
				</TextShimmer>
			);
		case 'input-available':
			return (
				<div className="text-green-600 text-sm">
					Adding solid: {part.input.width}x{part.input.height}
				</div>
			);
		case 'output-error':
			return <div className="text-red-500">{part.errorText}</div>;
		default:
			return null;
	}
};

// Handler for solid_editor tool
const SolidEditorHandler = ({
	part,
	addToolOutput,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-solid_editor'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
}) => {
	useEffect(() => {
		if (part.state !== 'input-available') return;

		const {itemId, ...changes} = part.input;
		const updateItem = useEditorStore.getState().updateItem;

		updateItem(itemId, (item) => ({...item, ...changes}));

		addToolOutput({
			toolCallId: part.toolCallId,
			tool: 'solid_editor',
			output: {success: true},
		});
	}, [part, addToolOutput]);

	switch (part.state) {
		case 'input-streaming':
			return <TextShimmer duration={2}>Updating solid...</TextShimmer>;
		case 'input-available': {
			const {itemId, ...changes} = part.input;
			return (
				<div className="text-sm">
					Updating solid {itemId}: {JSON.stringify(changes)}
				</div>
			);
		}
		case 'output-error':
			return <div className="text-red-500">{part.errorText}</div>;
		default:
			return null;
	}
};

// Handler for add_transitions tool
const AddTransitionsHandler = ({
	part,
	addToolOutput,
}: {
	part: Extract<
		VideoCreationUIMessageV2['parts'][number],
		{type: 'tool-add_transitions'}
	>;
	addToolOutput: ReturnType<
		typeof useChat<VideoCreationUIMessageV2>
	>['addToolOutput'];
}) => {
	useEffect(() => {
		if (part.state !== 'input-available') return;

		const {transitions} = part.input;
		const setState = useEditorStore.getState().setState;

		const results: Array<{
			fromItem: string;
			toItem: string;
			success: boolean;
			error?: string;
		}> = [];

		setState((state) => {
			for (const {itemIds, transition} of transitions) {
				const [fromItemId, toItemId] = itemIds;

				try {
					// Build the transition object matching Transition type
					const transitionConfig: Transition = {
						type: transition.type,
						durationInFrames: transition.durationInFrames,
						...(transition.direction && {direction: transition.direction}),
					} as Transition;

					addTransition({
						state,
						itemId: fromItemId,
						transition: transitionConfig,
					});

					results.push({
						fromItem: fromItemId,
						toItem: toItemId,
						success: true,
					});
				} catch (error) {
					results.push({
						fromItem: fromItemId,
						toItem: toItemId,
						success: false,
						error: String(error),
					});
				}
			}
		});

		addToolOutput({
			toolCallId: part.toolCallId,
			tool: 'add_transitions',
			output: {
				results,
				totalAdded: results.filter((r) => r.success).length,
				totalFailed: results.filter((r) => !r.success).length,
			},
		});
	}, [part, addToolOutput]);

	switch (part.state) {
		case 'input-streaming':
			return (
				<TextShimmer duration={2} className="text-sm">
					Adding transitions...
				</TextShimmer>
			);
		case 'input-available':
			return (
				<div className="text-sm">
					Adding {part.input.transitions.length} transition(s)...
				</div>
			);
		case 'output-available':
			return (
				<div className="my-2 border border-green-600 bg-green-500/30 p-2 text-sm">
					Transitions added: {part.input.transitions.length}
				</div>
			);
		case 'output-error':
			return <div className="text-red-500">{part.errorText}</div>;
		default:
			return null;
	}
};

const ChatBot = () => {
	const [input, setInput] = useState('');
	const [webSearch, setWebSearch] = useState(false);
	const {messages, sendMessage, status, regenerate, addToolOutput} =
		useChat<VideoCreationUIMessageV2>({
			transport: new DefaultChatTransport({
				api: '/api/chat-update-component',
			}),
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
		});
	console.log({messages});

	// Get current editor context for the AI
	const getEditorContext = (): EditorContext => {
		const editorState = useEditorStore.getState();

		return {
			currentFrame: 0, // TODO: Get from player ref when available
			canvasWidth: editorState.compositionState.compositionWidth,
			canvasHeight: editorState.compositionState.compositionHeight,
			fps: editorState.compositionState.fps,
		};
	};

	// Store context for tool handlers

	const handleSubmit = (message: PromptInputMessage) => {
		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);
		if (!(hasText || hasAttachments)) {
			return;
		}

		// Get fresh context before sending
		const context = getEditorContext();

		// Build user message - include selectedItemIds in the message text, not in system prompt
		const selectedItems = useUIStore.getState().selectedItems;
		const messageText = selectedItems?.length
			? `${message.text || ''}\n\n[selectedItemIds: ${JSON.stringify(selectedItems)}]`
			: message.text || '';

		sendMessage(
			{
				text: messageText,
			},
			{
				body: {
					context, // Send editor context to the API (canvas size, fps, currentFrame)
				},
			},
		);
		setInput('');
	};
	return (
		<div className="relative mx-auto size-full">
			<div className="flex h-full flex-col">
				<Conversation className="h-full">
					<ConversationContent>
						{messages.map((message) => (
							<div key={message.id}>
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

										case 'tool-get_item_info':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<GetItemInfoHandler
														part={part}
														addToolOutput={addToolOutput}
													/>
												</Message>
											);

										case 'tool-text_editor':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<TextEditor
														part={part}
														addToolOutput={addToolOutput}
														sendMessage={sendMessage}
													/>
												</Message>
											);

										case 'tool-add_text_item':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<AddTextItemHandler
														part={part}
														addToolOutput={addToolOutput}
														context={getEditorContext()}
													/>
												</Message>
											);

										case 'tool-add_solid_item':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<AddSolidItemHandler
														part={part}
														addToolOutput={addToolOutput}
														context={getEditorContext()}
													/>
												</Message>
											);

										case 'tool-solid_editor':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<SolidEditorHandler
														part={part}
														addToolOutput={addToolOutput}
													/>
												</Message>
											);

										case 'tool-add_transitions':
											return (
												<Message key={`${message.id}-${i}`} from={message.role}>
													<AddTransitionsHandler
														part={part}
														addToolOutput={addToolOutput}
													/>
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

export default ChatBot;
/* "animation": {
    "type": "blur-in",
    "delay": 0,
    "duration": 1
  } */
//   animation: {
//           type: 'blur-in',
//           delay: 0,
//           duration: 20,
//           target: 'word',
//           stagger: 5
//         }
