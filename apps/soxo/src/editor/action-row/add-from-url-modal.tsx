import * as Dialog from '@radix-ui/react-dialog';
import {PlayerRef} from '@remotion/player';
import React, {useCallback, useState} from 'react';
import {toast} from 'sonner';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';
import {makeExternalImageItem} from '../items/image/make-external-image-item';
import {addAssetToState} from '../state/actions/add-asset-to-state';
import {addItem} from '../state/actions/add-item';
import {clsx} from '../utils/clsx';

const LinkIcon: React.FC<{className?: string}> = ({className}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</svg>
);

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

const isValidUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

type ModalState =
	| {status: 'idle'}
	| {status: 'loading'}
	| {status: 'error'; message: string};

export const AddFromUrlModal: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [url, setUrl] = useState('');
	const [state, setState] = useState<ModalState>({status: 'idle'});
	const editorSetState = useEditorStore((s) => s.setState);

	const handleSubmit = useCallback(async () => {
		const trimmedUrl = url.trim();

		if (!trimmedUrl) {
			setState({status: 'error', message: 'Please enter a URL'});
			return;
		}

		if (!isValidUrl(trimmedUrl)) {
			setState({
				status: 'error',
				message: 'Invalid URL. Must start with http:// or https://',
			});
			return;
		}

		setState({status: 'loading'});

		try {
			const currentState = useEditorStore.getState();
			const {fps, compositionWidth, compositionHeight} =
				currentState.compositionState;
			const currentFrame = playerRef.current?.getCurrentFrame() ?? 0;

			const {item, asset, errorCode} = await makeExternalImageItem({
				url: trimmedUrl,
				currentFrame,
				fps,
				compositionWidth,
				compositionHeight,
			});

			// Add to state
			editorSetState((draft) => {
				addItem({
					state: draft,
					item,
					position: {type: 'front'},
				});
				addAssetToState({state: draft, asset});

				// Mark as uploaded since external assets don't need upload
				draft.assetStatus[asset.id] = {type: 'uploaded'};
			});

			// Select the new item (outside setState)
			useUIStore.getState().setSelectedItems([item.id]);

			// Show appropriate toast
			if (errorCode) {
				toast.warning('Image added with limited metadata', {
					description:
						'Could not extract dimensions due to CORS. You may need to resize manually.',
				});
			} else {
				toast.success('Image added successfully');
			}

			// Reset and close
			setUrl('');
			setState({status: 'idle'});
			setIsOpen(false);
		} catch (error) {
			setState({
				status: 'error',
				message: error instanceof Error ? error.message : 'Failed to add image',
			});
		}
	}, [url, playerRef, editorSetState]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && state.status !== 'loading') {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit, state.status],
	);

	const handleOpenChange = useCallback((open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setUrl('');
			setState({status: 'idle'});
		}
	}, []);

	return (
		<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className={clsx(
						'editor-starter-focus-ring flex h-10 items-center gap-1.5 rounded bg-white/5 px-3 text-white transition-colors hover:bg-white/10',
						isOpen && 'bg-white/10',
					)}
					title="Add from URL"
					aria-label="Add from URL"
				>
					<LinkIcon className="h-4 w-4" />
					<span className="text-sm">URL</span>
				</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60" />
				<Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl focus:outline-none">
					{/* Header */}
					<div className="mb-4 flex items-center justify-between">
						<Dialog.Title className="text-lg font-semibold text-white">
							Add Image from URL
						</Dialog.Title>
						<Dialog.Close asChild>
							<button
								type="button"
								className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
								aria-label="Close"
							>
								<CloseIcon className="h-4 w-4" />
							</button>
						</Dialog.Close>
					</div>

					{/* Description */}
					<Dialog.Description className="mb-4 text-sm text-white/50">
						Enter the URL of an image to add it to your timeline.
					</Dialog.Description>

					{/* URL Input */}
					<div className="mb-4">
						<label
							htmlFor="url-input"
							className="mb-2 block text-sm font-medium text-white/70"
						>
							Image URL
						</label>
						<input
							id="url-input"
							type="text"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="https://example.com/image.jpg"
							disabled={state.status === 'loading'}
							className="w-full rounded border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:border-blue-500 focus:bg-white/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							autoFocus
						/>
					</div>

					{/* Error Message */}
					{state.status === 'error' && (
						<div className="mb-4 rounded border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
							{state.message}
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-2">
						<Dialog.Close asChild>
							<button
								type="button"
								className="rounded bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
								disabled={state.status === 'loading'}
							>
								Cancel
							</button>
						</Dialog.Close>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={state.status === 'loading' || !url.trim()}
							className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600/50"
						>
							{state.status === 'loading' ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
									<span>Adding...</span>
								</>
							) : (
								<span>Add Image</span>
							)}
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
