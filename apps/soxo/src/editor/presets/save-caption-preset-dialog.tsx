'use client';

import React, {useCallback, useState} from 'react';
import {Button} from '../../components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../components/ui/dialog';
import {Input} from '../../components/ui/input';
import {Label} from '../../components/ui/label';
import {CaptionsItem} from '../items/captions/captions-item-type';
import {CaptionPreset} from './caption-presets-db';
import {extractCaptionStyle, generatePresetId} from './caption-preset-utils';
import {usePresetActions} from './use-caption-presets';

interface SaveCaptionPresetDialogProps {
	isOpen: boolean;
	onClose: () => void;
	captionItem: CaptionsItem;
}

export const SaveCaptionPresetDialog: React.FC<SaveCaptionPresetDialogProps> = ({
	isOpen,
	onClose,
	captionItem,
}) => {
	const [name, setName] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const {savePreset} = usePresetActions();

	const handleSave = useCallback(async () => {
		if (!name.trim()) {
			return;
		}

		setIsSaving(true);

		try {
			const style = extractCaptionStyle(captionItem);
			const now = Date.now();

			const preset: CaptionPreset = {
				id: generatePresetId(),
				name: name.trim(),
				createdAt: now,
				updatedAt: now,
				...style,
			};

			await savePreset(preset);

			// Reset form and close
			setName('');
			onClose();
		} catch (error) {
			console.error('Failed to save preset:', error);
		} finally {
			setIsSaving(false);
		}
	}, [name, captionItem, savePreset, onClose]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				setName('');
				onClose();
			}
		},
		[onClose],
	);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Save Caption Preset</DialogTitle>
					<DialogDescription>
						Save the current caption style as a reusable preset. You can apply
						this preset to other caption items later.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Preview of current styles */}
					<div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
						<div className="flex items-center justify-center">
							<span
								className="text-center font-medium"
								style={{
									fontFamily: captionItem.fontFamily,
									fontSize: '24px',
									color: captionItem.color,
									WebkitTextStroke: `${captionItem.strokeWidth}px ${captionItem.strokeColor}`,
								}}
							>
								Preview Text
							</span>
						</div>
						<div className="mt-2 flex flex-col gap-1 text-xs text-neutral-400">
							<div className="flex items-center justify-between">
								<span>Font:</span>
								<span className="font-medium text-neutral-200">
									{captionItem.fontFamily}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Size:</span>
								<span className="font-medium text-neutral-200">
									{captionItem.fontSize}px
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Stroke:</span>
								<span className="font-medium text-neutral-200">
									{captionItem.strokeWidth}px
								</span>
							</div>
						</div>
					</div>

					{/* Name input */}
					<div className="grid gap-2">
						<Label htmlFor="preset-name">Preset Name</Label>
						<Input
							id="preset-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Bold Yellow Captions"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === 'Enter' && name.trim()) {
									handleSave();
								}
							}}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isSaving}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving || !name.trim()}>
						{isSaving ? 'Saving...' : 'Save Preset'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
