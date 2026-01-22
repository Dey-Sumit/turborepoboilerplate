'use client';

import React, {useCallback, useMemo, useState} from 'react';
import {toast} from 'sonner';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../components/ui/select';
import {Textarea} from '../../components/ui/textarea';
import {EditorStarterAsset} from '../assets/assets';
import {CompositeItem} from '../items/composite/composite-item-type';
import {EditorStarterItem} from '../items/item-type';
import {generateTemplateFromItem} from './generate-template-from-item';
import {generateVariableTemplateFromItem} from './generate-variable-template-from-item';

const TEMPLATE_CATEGORIES = [
	{value: 'lower-third', label: 'Lower Third'},
	{value: 'intro', label: 'Intro'},
	{value: 'outro', label: 'Outro'},
	{value: 'overlay', label: 'Overlay'},
	{value: 'transition', label: 'Transition'},
	{value: 'background', label: 'Background'},
	{value: 'text', label: 'Text'},
	{value: 'graphic', label: 'Graphic'},
	{value: 'custom', label: 'Custom'},
] as const;

type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]['value'];

interface CreateTemplateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	item: EditorStarterItem;
	assets: Record<string, EditorStarterAsset>;
}

export const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({
	isOpen,
	onClose,
	item,
	assets,
}) => {
	// Form state
	const [name, setName] = useState(() => {
		if (item.type === 'composite') {
			return (item as CompositeItem).name || 'My Template';
		}
		return `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Template`;
	});
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<TemplateCategory>('custom');
	const [tags, setTags] = useState('');
	const [isCopying, setIsCopying] = useState(false);

	// Get item stats for display
	const itemStats = useMemo(() => {
		if (item.type === 'composite') {
			const composite = item as CompositeItem;
			return {
				type: 'Composite',
				itemCount: Object.keys(composite.childTimeline.items).length,
				trackCount: composite.childTimeline.tracks.length,
			};
		}
		return {
			type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
			itemCount: 1,
			trackCount: 1,
		};
	}, [item]);

	// Generate variable name from template name
	const generateVariableName = useCallback((templateName: string): string => {
		const sanitized = templateName
			.toUpperCase()
			.replace(/[^A-Z0-9\s]/g, '')
			.replace(/\s+/g, '_')
			.trim();
		const shortId = Math.random().toString(36).substring(2, 6);
		return `${sanitized || 'TEMPLATE'}_${shortId}`;
	}, []);

	// Handle copy to clipboard (JSON format)
	const handleCopyTemplate = useCallback(async () => {
		setIsCopying(true);

		try {
			const templateConfig = generateTemplateFromItem({
				item,
				assets,
				name: name.trim() || 'Untitled Template',
				description: description.trim(),
				category,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
			});

			const json = JSON.stringify(templateConfig, null, 2);
			await navigator.clipboard.writeText(json);

			toast.success('Template copied to clipboard!', {
				description: 'You can now paste it into your templates library.',
			});

			onClose();
		} catch (error) {
			console.error('Failed to copy template:', error);
			toast.error('Failed to copy template');
		} finally {
			setIsCopying(false);
		}
	}, [item, assets, name, description, category, tags, onClose]);

	// Handle copy as TypeScript code (for templates-library.ts)
	const handleCopyAsCode = useCallback(async () => {
		setIsCopying(true);

		try {
			const variableTemplate = generateVariableTemplateFromItem({
				item,
				assets,
				name: name.trim() || 'Untitled Template',
				description: description.trim(),
				category,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
			});

			const variableName = generateVariableName(name.trim() || 'Untitled Template');
			const templateType = `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}VariableTemplate`;
			const code = `const ${variableName}: ${templateType} = ${JSON.stringify(variableTemplate, null, 2)};`;

			await navigator.clipboard.writeText(code);

			toast.success('Template code copied!', {
				description: `Variable: ${variableName}`,
			});

			onClose();
		} catch (error) {
			console.error('Failed to copy template code:', error);
			toast.error('Failed to copy template code');
		} finally {
			setIsCopying(false);
		}
	}, [item, assets, name, description, category, tags, onClose, generateVariableName]);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create Template</DialogTitle>
					<DialogDescription>
						Create a reusable template from this {itemStats.type.toLowerCase()}.
						Fill in the details below and copy the configuration.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Item Info */}
					<div className="bg-muted/50 rounded-lg p-3">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Type</span>
							<span className="font-medium">{itemStats.type}</span>
						</div>
						{item.type === 'composite' && (
							<>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Items</span>
									<span className="font-medium">{itemStats.itemCount}</span>
								</div>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Tracks</span>
									<span className="font-medium">{itemStats.trackCount}</span>
								</div>
							</>
						)}
					</div>

					{/* Name */}
					<div className="grid gap-2">
						<Label htmlFor="template-name">Name</Label>
						<Input
							id="template-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter template name"
						/>
					</div>

					{/* Description */}
					<div className="grid gap-2">
						<Label htmlFor="template-description">Description</Label>
						<Textarea
							id="template-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe what this template does..."
							rows={3}
						/>
					</div>

					{/* Category */}
					<div className="grid gap-2">
						<Label htmlFor="template-category">Category</Label>
						<Select
							value={category}
							onValueChange={(value) => setCategory(value as TemplateCategory)}
						>
							<SelectTrigger id="template-category">
								<SelectValue>
									{TEMPLATE_CATEGORIES.find((cat) => cat.value === category)?.label}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{TEMPLATE_CATEGORIES.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Tags */}
					<div className="grid gap-2">
						<Label htmlFor="template-tags">Tags</Label>
						<Input
							id="template-tags"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							placeholder="tag1, tag2, tag3 (comma separated)"
						/>
						<p className="text-muted-foreground text-xs">
							Add tags to help others find your template
						</p>
					</div>
				</div>

				<DialogFooter className="flex-col gap-2 sm:flex-row">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="secondary"
						onClick={handleCopyAsCode}
						disabled={isCopying || !name.trim()}
					>
						{isCopying ? 'Copying...' : 'Copy as Code'}
					</Button>
					<Button onClick={handleCopyTemplate} disabled={isCopying || !name.trim()}>
						{isCopying ? 'Copying...' : 'Copy as JSON'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
