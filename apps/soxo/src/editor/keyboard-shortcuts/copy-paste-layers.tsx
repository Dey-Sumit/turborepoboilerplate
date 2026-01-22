import {PlayerRef} from '@remotion/player';
import React, {useCallback, useEffect} from 'react';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';
import {addAsset} from '../assets/add-asset';
import {copyToClipboard} from '../clipboard/copy-to-clipboard';
import {parseItemsFromClipboardTextHtml} from '../clipboard/parse-items';
import {
	FEATURE_COPY_LAYERS,
	FEATURE_CUT_LAYERS,
	FEATURE_PASTE_ASSETS,
	FEATURE_PASTE_TEXT,
} from '../flags';
import {createTextItem} from '../items/text/create-text-item';
import {addItem} from '../state/actions/add-item';
import {cutItems} from '../state/actions/cut-items';
import {pasteItems} from '../state/actions/paste-items';
import {
	getCurrentItems,
	getCurrentTracks,
} from '../state/helpers/get-current-timeline';
import {isEventTargetInputElement} from '../utils/is-event-target-input-element';
import {truthy} from '../utils/truthy';

export const CopyPasteLayers: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const setState = useEditorStore((state) => state.setState);

	const performCopy = useCallback(async (e: ClipboardEvent) => {
		if (!e.clipboardData) {
			return;
		}

		const selectedItems = useUIStore.getState().selectedItems;

		if (selectedItems.length === 0) {
			return;
		}

		const currentState = useEditorStore.getState();
		// Get items from current timeline context (could be inside a composite)
		const currentItems = getCurrentItems(currentState);
		const itemsToCopy = selectedItems
			.map((s: string) => currentItems[s])
			.filter(truthy);

		e.preventDefault();
		copyToClipboard(itemsToCopy);
	}, []);

	const handleCopy = useCallback(
		async (e: ClipboardEvent) => {
			// Avoid interfering with native copy in input elements
			if (isEventTargetInputElement(e)) {
				return;
			}

			performCopy(e);
		},
		[performCopy],
	);

	const handleCut = useCallback(
		async (e: ClipboardEvent) => {
			// Avoid interfering with native cut in input elements
			if (isEventTargetInputElement(e)) {
				return;
			}

			const selectedItems = useUIStore.getState().selectedItems;
			if (selectedItems.length === 0) {
				return;
			}

			performCopy(e);

			setState((state) => cutItems(state, selectedItems));
		},
		[performCopy, setState],
	);

	const handlePaste = useCallback(
		async (e: ClipboardEvent) => {
			// Avoid overriding paste inside form fields
			if (isEventTargetInputElement(e)) {
				return;
			}
			if (!e.clipboardData) {
				return;
			}

			e.preventDefault();

			if (e.clipboardData.types.includes('text/html')) {
				const text = e.clipboardData.getData('text/html');
				const parsedAsItems = parseItemsFromClipboardTextHtml(text);
				if (parsedAsItems) {
					setState((state) =>
						pasteItems({
							state,
							copiedItems: parsedAsItems,
							from: playerRef.current?.getCurrentFrame() ?? 0,
							position: null,
						}),
					);
					return;
				}
			}
			const text = e.clipboardData.getData('text/plain');

			if (FEATURE_PASTE_TEXT && text.trim() !== '') {
				const currentState = useEditorStore.getState();
				const {compositionWidth, compositionHeight} =
					currentState.compositionState;
				const item = await createTextItem({
					xOnCanvas: compositionWidth / 2,
					yOnCanvas: compositionHeight / 2,
					from: playerRef.current?.getCurrentFrame() ?? 0,
					text,
					align: 'center',
				});

				setState((state) => {
					addItem({
						state,
						item,
						position: {type: 'front'},
					});
				});
				// Select outside setState
				useUIStore.getState().setSelectedItems([item.id]);
				return;
			}

			const currentState = useEditorStore.getState();
			const fps = currentState.compositionState.fps;
			// Get tracks from current timeline context (could be inside a composite)
			const tracks = getCurrentTracks(currentState);

			const hasFiles = e.clipboardData.types.includes('Files');
			if (hasFiles && FEATURE_PASTE_ASSETS) {
				const {compositionHeight, compositionWidth} =
					currentState.compositionState;
				for (const file of e.clipboardData.files) {
					await addAsset({
						file,
						compositionHeight,
						compositionWidth,
						fps,
						tracks,
						setState: setState,
						playerRef,
						dropPosition: null,
						filename: file.name,
					});
				}
				return;
			}
		},
		[playerRef, setState],
	);

	useEffect(() => {
		if (!FEATURE_COPY_LAYERS) {
			return;
		}

		document.addEventListener('copy', handleCopy);
		document.addEventListener('paste', handlePaste);

		return () => {
			document.removeEventListener('copy', handleCopy);
			document.removeEventListener('paste', handlePaste);
		};
	}, [handleCopy, handleCut, handlePaste]);

	useEffect(() => {
		if (!FEATURE_CUT_LAYERS) {
			return;
		}

		document.addEventListener('cut', handleCut);

		return () => {
			document.removeEventListener('cut', handleCut);
		};
	}, [handleCut]);

	return null;
};
