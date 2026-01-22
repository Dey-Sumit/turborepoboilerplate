import React, {useCallback, useMemo, useState} from 'react';
import {toast} from 'sonner';
import {Alert, AlertDescription} from '../../components/ui/alert';
import {Button} from '../../components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../components/ui/dialog';
import {Label} from '../../components/ui/label';
import {ScrollArea} from '../../components/ui/scroll-area';
import {Separator} from '../../components/ui/separator';
import useEditorStore from '../../zustand/editor-store';
import {CopiedStyle} from '../context/style-clipboard-context';
import {EditorStarterItem} from '../items/item-type';
import {pasteStyleToItems} from '../state/actions/paste-style-to-items';
import {
	EXCLUDED_PROPERTIES,
	formatPropertyName,
	formatPropertyValue,
	getItemPropertyGroups,
} from '../utils/get-item-property-groups';

export const PasteStyleModal: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	copiedStyle: CopiedStyle;
	targetItems: EditorStarterItem[];
}> = ({isOpen, onClose, copiedStyle, targetItems}) => {
	const setState = useEditorStore((s) => s.setState);

	// Get available properties (exclude system properties)
	const availableProperties = useMemo(() => {
		const props = new Set<string>();
		Object.keys(copiedStyle.properties).forEach((key) => {
			if (!EXCLUDED_PROPERTIES.has(key)) {
				props.add(key);
			}
		});
		return props;
	}, [copiedStyle.properties]);

	// Get property groups based on source type
	const propertyGroups = useMemo(
		() => getItemPropertyGroups(copiedStyle.sourceType, availableProperties),
		[copiedStyle.sourceType, availableProperties],
	);

	// Initialize all properties as selected
	const [selectedProps, setSelectedProps] = useState<Set<string>>(
		() => new Set(availableProperties),
	);

	// Check if any target items have different types
	const isDifferentType = useMemo(
		() => targetItems.some((item) => item.type !== copiedStyle.sourceType),
		[targetItems, copiedStyle.sourceType],
	);

	// Check if all properties are selected
	const allSelected = selectedProps.size === availableProperties.size;

	const toggleAll = useCallback(() => {
		if (allSelected) {
			setSelectedProps(new Set());
		} else {
			setSelectedProps(new Set(availableProperties));
		}
	}, [allSelected, availableProperties]);

	const toggleProp = useCallback((prop: string) => {
		setSelectedProps((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(prop)) {
				newSet.delete(prop);
			} else {
				newSet.add(prop);
			}
			return newSet;
		});
	}, []);

	const handlePaste = useCallback(() => {
		if (selectedProps.size === 0) {
			toast.error('Please select at least one property to paste');
			return;
		}

		const propertiesToPaste: Record<string, unknown> = {};
		selectedProps.forEach((prop) => {
			if (copiedStyle.properties[prop] !== undefined) {
				propertiesToPaste[prop] = copiedStyle.properties[prop];
			}
		});

		setState((state) =>
			pasteStyleToItems(state, {
				targetItemIds: targetItems.map((i) => i.id),
				properties: propertiesToPaste,
			}),
		);

		toast.success(
			`Style pasted to ${targetItems.length} item${targetItems.length > 1 ? 's' : ''}`,
		);
		onClose();
	}, [
		selectedProps,
		copiedStyle.properties,
		targetItems,
		setState,
		onClose,
	]);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Paste Style</DialogTitle>
					<DialogDescription>
						Select properties to paste to {targetItems.length} item
						{targetItems.length > 1 ? 's' : ''}.
					</DialogDescription>
				</DialogHeader>

				{/* Warning for different types */}
				{isDifferentType && (
					<Alert>
						<AlertDescription>
							⚠️ Copying from {copiedStyle.sourceType} to different item
							type(s). Some properties may not apply.
						</AlertDescription>
					</Alert>
				)}

				{/* Select All */}
				<div className="flex items-center gap-2 py-2">
					<input
						type="checkbox"
						id="select-all"
						checked={allSelected}
						onChange={toggleAll}
						className="h-4 w-4"
					/>
					<Label htmlFor="select-all" className="cursor-pointer font-medium">
						Select All Properties
					</Label>
				</div>

				<Separator />

				{/* Property Groups */}
				<ScrollArea className="max-h-96">
					<div className="flex flex-col gap-4 py-2">
						{Object.entries(propertyGroups).map(([key, group]) => (
							<div key={key} className="flex flex-col gap-2">
								<div className="text-sm font-medium">{group.label}</div>
								<div className="flex flex-col gap-1 pl-2">
									{group.properties.map((prop) => (
										<label
											key={prop}
											className="flex cursor-pointer items-center gap-2 py-1 text-xs hover:opacity-80"
										>
											<input
												type="checkbox"
												checked={selectedProps.has(prop)}
												onChange={() => toggleProp(prop)}
												className="h-3.5 w-3.5"
											/>
											<span className="flex-1">{formatPropertyName(prop)}</span>
											<span className="text-muted-foreground">
												{formatPropertyValue(copiedStyle.properties[prop])}
											</span>
										</label>
									))}
								</div>
							</div>
						))}
					</div>
				</ScrollArea>

				{/* Actions */}
				<DialogFooter>
					<Button nativeButton type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						nativeButton
						type="button"
						onClick={handlePaste}
						disabled={selectedProps.size === 0}
					>
						Paste to {targetItems.length} item
						{targetItems.length > 1 ? 's' : ''}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
