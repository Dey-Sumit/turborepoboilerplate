import React, {useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';
import {useStyleClipboard} from '../context/style-clipboard-context';
import {PasteStyleModal} from '../inspector/paste-style-modal';
import {EXCLUDED_PROPERTIES} from '../utils/get-item-property-groups';
import {isEventTargetInputElement} from '../utils/is-event-target-input-element';
import {useAllItems, useSelectedItems} from '../utils/use-context';

export const CopyPasteStyle: React.FC = () => {
	const {copiedStyle, setCopiedStyle} = useStyleClipboard();
	const {selectedItems} = useSelectedItems();
	const {items} = useAllItems();
	const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

	const handleCopyStyle = useCallback(
		(e: KeyboardEvent) => {
			// Avoid interfering with native copy in input elements
			if (isEventTargetInputElement(e)) {
				return;
			}

			if (selectedItems.length !== 1) {
				toast.error('Select a single item to copy its style');
				return;
			}

			e.preventDefault();

			const item = items[selectedItems[0]];
			if (!item) {
				return;
			}

			// Extract all properties except excluded ones
			const properties: Record<string, unknown> = {};
			Object.entries(item).forEach(([key, value]) => {
				if (!EXCLUDED_PROPERTIES.has(key)) {
					properties[key] = value;
				}
			});

			setCopiedStyle({
				sourceType: item.type,
				sourceItemId: item.id,
				properties,
			});

			toast.success('Style copied');
		},
		[selectedItems, items, setCopiedStyle],
	);

	const handlePasteStyle = useCallback(
		(e: KeyboardEvent) => {
			// Avoid interfering with native paste in input elements
			if (isEventTargetInputElement(e)) {
				return;
			}

			if (!copiedStyle) {
				toast.error('No style copied');
				return;
			}

			if (selectedItems.length === 0) {
				toast.error('Select items to paste style to');
				return;
			}

			e.preventDefault();
			setIsPasteModalOpen(true);
		},
		[copiedStyle, selectedItems],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMac = window.navigator.platform.startsWith('Mac');
			const modifierKey = isMac ? e.metaKey : e.ctrlKey;

			// Ctrl/Cmd + Shift + C - Copy Style
			if (
				modifierKey &&
				e.shiftKey &&
				e.key.toLowerCase() === 'c' &&
				!e.altKey
			) {
				handleCopyStyle(e);
			}

			// Ctrl/Cmd + Shift + V - Paste Style
			if (
				modifierKey &&
				e.shiftKey &&
				e.key.toLowerCase() === 'v' &&
				!e.altKey
			) {
				handlePasteStyle(e);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleCopyStyle, handlePasteStyle]);

	// Only render modal if it should be open AND we have copied style
	if (!isPasteModalOpen || !copiedStyle) {
		return null;
	}

	const targetItems = selectedItems.map((id) => items[id]).filter(Boolean);

	if (targetItems.length === 0) {
		return null;
	}

	return (
		<PasteStyleModal
			isOpen={isPasteModalOpen}
			onClose={() => setIsPasteModalOpen(false)}
			copiedStyle={copiedStyle}
			targetItems={targetItems}
		/>
	);
};
