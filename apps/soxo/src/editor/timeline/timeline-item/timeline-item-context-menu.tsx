import {MouseEventHandler, useCallback, useMemo, useState} from 'react';
import {toast} from 'sonner';
import useEditorStore from '../../../zustand/editor-store';
import useUIStore, {useSelectedItemsSet} from '../../../zustand/ui-store';
import {copyToClipboard} from '../../clipboard/copy-to-clipboard';
import {DEFAULT_TRANSITION_DURATION_IN_FRAMES} from '../../constants';
// import {ContextMenuItem, ContextMenuSeparator} from '../../context-menu';
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from '../../../components/ui/context-menu';
import {useStyleClipboard} from '../../context/style-clipboard-context';
import {
	FEATURE_BRING_TO_FRONT,
	FEATURE_COPY_LAYERS,
	FEATURE_CUT_LAYERS,
	FEATURE_DUPLICATE_LAYERS,
	FEATURE_SEND_TO_BACK,
} from '../../flags';
import {PasteStyleModal} from '../../inspector/paste-style-modal';
import {EditorStarterItem} from '../../items/item-type';
import {bringToFrontOrBack} from '../../state/actions/bring-item-to-front-or-back';
import {enterCompositeEditMode} from '../../state/actions/composite-navigation';
import {createCompositeFromSelection} from '../../state/actions/create-composite-from-selection';
import {cutItems} from '../../state/actions/cut-items';
import {duplicateItems} from '../../state/actions/duplicate-items';
import {addTransition} from '../../state/actions/transition';
import {CreateTemplateDialog} from '../../templates/create-template-dialog';
import {EXCLUDED_PROPERTIES} from '../../utils/get-item-property-groups';
import {useAllItems, useAssets, useSelectedItems} from '../../utils/use-context';

export const TimelineItemContextMenu: React.FC<{
	item:  EditorStarterItem;
}> = ({item}) => {
	const setState = useEditorStore((state) => state.setState);
	const tracks = useEditorStore((state) => state.compositionState.tracks);
	const {selectedItems} = useSelectedItems();
	// Use Set for O(1) selection check
	const selectedSet = useSelectedItemsSet();
	const {items: allItems} = useAllItems();
	const {assets} = useAssets();
	const {copiedStyle, setCopiedStyle} = useStyleClipboard();
	const [isPasteStyleModalOpen, setIsPasteStyleModalOpen] = useState(false);
	const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] =
		useState(false);

	// determine if we should operate on multiple items:
	// - multiple items are selected AND
	// - the right-clicked item is part of that selection
	const isMultiSelection = useMemo(
		() => selectedItems.length > 1 && selectedSet.has(item.id),
		[selectedItems.length, selectedSet, item.id],
	);

	// for copy/cut/duplicate: operate on all selected items if conditions are met,
	// otherwise operate only on the right-clicked item
	const targetItems = useMemo(() => {
		return isMultiSelection ? selectedItems.map((id) => allItems[id]) : [item];
	}, [isMultiSelection, selectedItems, item, allItems]);

	// Check if item can have transition added (not the last item in track)
	const canAddTransition = useMemo(() => {
		const track = tracks.find((t) => t.items.includes(item.id));
		if (!track) return false;
		const itemIndex = track.items.indexOf(item.id);
		return itemIndex !== -1 && itemIndex < track.items.length - 1;
	}, [tracks, item.id]);

	// layer ordering operations always work on the individual
	// right-clicked item, not on the selection
	const handleBringToFront: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			setState((state) =>
				bringToFrontOrBack({
					state,
					itemId: item.id, // Always the right-clicked item
					position: 'front',
				}),
			);
		},
		[item.id, setState],
	);

	const handleSendToBack: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			setState((state) =>
				bringToFrontOrBack({
					state,
					itemId: item.id, // Always the right-clicked item
					position: 'back',
				}),
			);
		},
		[item.id, setState],
	);

	const handleCopy: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			copyToClipboard(targetItems);
		},
		[targetItems],
	);

	const handleCut: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			copyToClipboard(targetItems);
			setState((state) =>
				cutItems(
					state,
					targetItems.map((targetItem) => targetItem.id),
				),
			);
		},
		[targetItems, setState],
	);
	const handleDuplicate: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			setState((state) => {
				const duplicatedIds = duplicateItems(
					state,
					targetItems.map((targetItem) => targetItem.id),
				);
				// Update selection outside of the state action
				useUIStore.getState().setSelectedItems(duplicatedIds);
			});
		},
		[targetItems, setState],
	);

	const handleAddTransition: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			// Default transition - slide from left with DEFAULT_TRANSITION_DURATION_IN_FRAMES frames duration
			const defaultTransition = {
				type: 'wipe' as const,
				durationInFrames: DEFAULT_TRANSITION_DURATION_IN_FRAMES,
				direction: 'from-bottom' as const,
			};
			setState((state) =>
				addTransition({
					state,
					itemId: item.id,
					transition: defaultTransition,
				}),
			);
		},
		[item.id, setState],
	);

	// Check if we can create a composite (need at least 2 items selected)
	const canCreateComposite = useMemo(() => {
		// Must have multiple items selected
		if (selectedItems.length < 2) return false;
		// The right-clicked item must be part of the selection
		if (!selectedSet.has(item.id)) return false;
		return true;
	}, [selectedItems.length, selectedSet, item.id]);

	const handleCreateComposite: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			// console.log('handleCreateComposite');

			setState((state) => {
				createCompositeFromSelection(state, selectedItems);
			});
		},
		[selectedItems, setState],
	);

	// Check if we can enter this item (must be a composite)
	const canEnterComposite = item.type === 'composite';

	const handleEnterComposite: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			setState((state) => {
				enterCompositeEditMode(state, item.id);
			});
		},
		[item.id, setState],
	);

	const handleContextMenuPointerDown: MouseEventHandler<HTMLElement> =
		useCallback((e: React.PointerEvent<HTMLDivElement>) => {
			e.stopPropagation();
		}, []);

	const handleCopyStyle: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();

			if (isMultiSelection) {
				toast.error('Select a single item to copy its style');
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
		[item, isMultiSelection, setCopiedStyle],
	);

	const handlePasteStyle: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();

			if (!copiedStyle) {
				toast.error('No style copied');
				return;
			}

			setIsPasteStyleModalOpen(true);
		},
		[copiedStyle],
	);

	// Get target items for paste style modal
	const targetItemsForPaste = useMemo(() => {
		if (!isPasteStyleModalOpen) return [];
		return isMultiSelection
			? selectedItems.map((id) => allItems[id]).filter(Boolean)
			: [item];
	}, [isPasteStyleModalOpen, isMultiSelection, selectedItems, allItems, item]);

	// Check if we can create a template from this item
	// Templates can be created from a single item or a composite
	// Multi-selection is NOT supported (user should create composite first)
	const canCreateTemplate = useMemo(() => {
		// Can't create template from multi-selection
		if (isMultiSelection) return false;
		// Can create from any single item
		return true;
	}, [isMultiSelection]);

	const handleCreateTemplate: MouseEventHandler<HTMLElement> = useCallback(
		(e) => {
			e.stopPropagation();
			setIsCreateTemplateDialogOpen(true);
		},
		[],
	);

	return (
		<>
			{isPasteStyleModalOpen && copiedStyle && targetItemsForPaste.length > 0 && (
				<PasteStyleModal
					isOpen={isPasteStyleModalOpen}
					onClose={() => setIsPasteStyleModalOpen(false)}
					copiedStyle={copiedStyle}
					targetItems={targetItemsForPaste}
				/>
			)}
			{isCreateTemplateDialogOpen && (
				<CreateTemplateDialog
					isOpen={isCreateTemplateDialogOpen}
					onClose={() => setIsCreateTemplateDialogOpen(false)}
					item={item}
					assets={assets}
				/>
			)}
			{FEATURE_CUT_LAYERS ? (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleCut}
					onPointerDown={handleContextMenuPointerDown}
				>
					Cut
				</ContextMenuItem>
			) : null}
			{FEATURE_COPY_LAYERS && (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleCopy}
					onPointerDown={handleContextMenuPointerDown}
				>
					Copy
				</ContextMenuItem>
			)}
			{FEATURE_DUPLICATE_LAYERS && (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleDuplicate}
					onPointerDown={handleContextMenuPointerDown}
				>
					Duplicate
				</ContextMenuItem>
			)}
			{canCreateComposite && (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleCreateComposite}
					onPointerDown={handleContextMenuPointerDown}
				>
					Create Composite
				</ContextMenuItem>
			)}
			{canEnterComposite && (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleEnterComposite}
					onPointerDown={handleContextMenuPointerDown}
				>
					Enter Composite
				</ContextMenuItem>
			)}
			{canCreateTemplate && (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleCreateTemplate}
					onPointerDown={handleContextMenuPointerDown}
				>
					Create Template
				</ContextMenuItem>
			)}
			{canAddTransition && (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleAddTransition}
					onPointerDown={handleContextMenuPointerDown}
				>
					Add Transition to Next
				</ContextMenuItem>
			)}
			<ContextMenuSeparator />
			<ContextMenuItem
				className="flex items-center gap-3"
				onClick={handleCopyStyle}
				onPointerDown={handleContextMenuPointerDown}
				disabled={isMultiSelection}
			>
				Copy Style
				<span className="ml-auto text-xs text-white/30">⇧⌘C</span>
			</ContextMenuItem>
			<ContextMenuItem
				className="flex items-center gap-3"
				onClick={handlePasteStyle}
				onPointerDown={handleContextMenuPointerDown}
				disabled={!copiedStyle}
			>
				Paste Style
				<span className="ml-auto text-xs text-white/30">⇧⌘V</span>
			</ContextMenuItem>
			<ContextMenuSeparator />
			{FEATURE_BRING_TO_FRONT ? (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={(e) => handleBringToFront(e)}
					onPointerDown={handleContextMenuPointerDown}
				>
					Bring to front
				</ContextMenuItem>
			) : null}
			{FEATURE_SEND_TO_BACK ? (
				<ContextMenuItem
					className="flex items-center gap-3"
					onClick={handleSendToBack}
					onPointerDown={handleContextMenuPointerDown}
				>
					Send to back
				</ContextMenuItem>
			) : null}
		</>
	);
};
