import {useCallback, useMemo, useState} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import useUIStore from '../../../zustand/ui-store';

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from '../../../components/ui/context-menu';
import {useStyleClipboard} from '../../context/style-clipboard-context';
import {PasteStyleModal} from '../../inspector/paste-style-modal';
import {EditorStarterItem} from '../../items/item-type';
import {setSelectedItems} from '../../state/actions/set-selected-items';
import {TimelineItemContextMenu} from './timeline-item-context-menu';
import { TimelineItemData } from '../../selectors';

export const ItemContextMenuTrigger = ({
	item,
	children,
}: {
	item: EditorStarterItem | TimelineItemData,
	children: React.ReactNode;
}) => {
	const setState = useEditorStore((state) => state.setState);

	const handleContextMenu = useCallback(() => {
		setState((state) => {
			// Get current selection from Zustand store
			const currentSelectedItems = useUIStore.getState().selectedItems;

			// if multiple items are selected, do not select anything
			if (currentSelectedItems.length > 1) {
				return;
			}

			// if only one item is selected, reset the selection
			setSelectedItems(state, [item.id]);
		});
	}, [item.id, setState]);

	const style = useMemo(() => {
		return {
			display: 'contents',
		};
	}, []);

	const [open, setOpen] = useState(false);
	const [isPasteStyleModalOpen, setIsPasteStyleModalOpen] = useState(false);
	const {copiedStyle} = useStyleClipboard();

	// Get selected items for paste modal
	const selectedItems = useUIStore((s) => s.selectedItems);
	const allItems = useEditorStore((s) => s.compositionState.items);

	const targetItemsForPaste = useMemo(() => {
		if (!isPasteStyleModalOpen) return [];
		return selectedItems.map((id) => allItems[id]).filter(Boolean);
	}, [isPasteStyleModalOpen, selectedItems, allItems]);

	return (
		<>
			<ContextMenu onOpenChange={setOpen}>
				<ContextMenuTrigger>
					<div onContextMenu={handleContextMenu} style={style}>
						{children}
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					{open && (
						<TimelineItemContextMenu
						//@ts-expect-error : TODO : fix later
							item={item}
							// onOpenPasteStyleModal={() => setIsPasteStyleModalOpen(true)}
						/>
					)}
				</ContextMenuContent>
			</ContextMenu>

			{/* Render modal at this level so it persists when context menu closes */}
			{isPasteStyleModalOpen &&
				copiedStyle &&
				targetItemsForPaste.length > 0 && (
					<PasteStyleModal
						isOpen={isPasteStyleModalOpen}
						onClose={() => setIsPasteStyleModalOpen(false)}
						copiedStyle={copiedStyle}
						targetItems={targetItemsForPaste}
					/>
				)}
		</>
	);
};
