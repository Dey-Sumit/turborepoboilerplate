'use client';

import * as React from 'react';
import {PlayerRef} from '@remotion/player';
import {
	Search,
	Box,
	Type,
	Image,
	FileImage,
	Music,
	Layers,
	Subtitles,
	Code,
	Shapes,
} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {
	ALL_TEMPLATES,
	VariableTemplate,
} from '@/editor/templates/templates-library';
import {addVariableTemplate} from '@/editor/templates/add-template';
import {EditorStarterItem} from '@/editor/items/item-type';
import useEditorStore from '@/zustand/editor-store';

// Icon mapping for each item type
const typeIcons: Record<EditorStarterItem['type'], React.ElementType> = {
	composite: Layers,
	text: Type,
	solid: Box,
	image: Image,
	video: FileImage,
	audio: Music,
	gif: FileImage,
	captions: Subtitles,
	code: Code,
	shape: Shapes,
};

// Type labels for display
const typeLabels: Record<EditorStarterItem['type'], string> = {
	composite: 'Composites',
	text: 'Text',
	solid: 'Solid Colors',
	image: 'Images',
	video: 'Videos',
	audio: 'Audio',
	gif: 'GIFs',
	captions: 'Captions',
	code: 'Code',
	shape: 'Shapes',
};

interface TemplatesPanelProps {
	playerRef: React.RefObject<PlayerRef | null>;
	onClose?: () => void;
}

export function TemplatesPanel({playerRef, onClose}: TemplatesPanelProps) {
	const [searchQuery, setSearchQuery] = React.useState('');
	const setState = useEditorStore((state) => state.setState);

	// Filter templates based on search
	const filteredTemplates = React.useMemo(() => {
		if (!searchQuery) return ALL_TEMPLATES;

		const lowerQuery = searchQuery.toLowerCase();
		return ALL_TEMPLATES.filter((template) => {
			const searchableText = [
				template.metadata.name,
				template.metadata.description,
				...template.metadata.tags,
				...(template.metadata.keywords || []),
			]
				.join(' ')
				.toLowerCase();
			return searchableText.includes(lowerQuery);
		});
	}, [searchQuery]);

	// Group templates by type
	const templatesByType = React.useMemo(() => {
		return filteredTemplates.reduce(
			(acc, template) => {
				const type = template.type;
				if (!acc[type]) {
					acc[type] = [];
				}
				acc[type].push(template);
				return acc;
			},
			{} as Record<EditorStarterItem['type'], VariableTemplate[]>,
		);
	}, [filteredTemplates]);

	const handleTemplateSelect = (template: VariableTemplate) => {
		const currentFrame = playerRef.current?.getCurrentFrame() ?? 0;

		setState((state) => {
			addVariableTemplate({
				state,
				template,
				variableValues: {},
				playheadPosition: currentFrame,
			});
		});

		onClose?.();
	};

	return (
		<div className="flex h-full flex-col">
			{/* Sticky search bar */}
			<div className="bg-background sticky top-0 z-10 pb-3">
				<div className="relative">
					<Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
					<Input
						placeholder="Search templates..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8"
					/>
				</div>
			</div>

			{/* Templates list */}
			<ScrollArea className="flex-1">
				{filteredTemplates.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12">
						<Layers className="text-muted-foreground/50 mb-3 size-12" />
						<p className="text-muted-foreground text-sm">
							No templates found
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{Object.entries(templatesByType).map(([type, templates]) => {
							const Icon = typeIcons[type as EditorStarterItem['type']];
							return (
								<div key={type}>
									<h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
										<Icon className="size-3" />
										{typeLabels[type as EditorStarterItem['type']]}
									</h3>
									<div className="space-y-2">
										{templates.map((template) => {
											const TemplateIcon =
												typeIcons[template.type as EditorStarterItem['type']];
											return (
												<div
													key={template.id}
													onClick={() => handleTemplateSelect(template)}
													className="border-border bg-muted/30 hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
												>
													<div className="flex size-10 shrink-0 items-center justify-center rounded bg-white/10">
														<TemplateIcon className="size-5 text-white/60" />
													</div>
													<div className="min-w-0 flex-1">
														<p className="text-foreground truncate text-sm font-medium">
															{template.metadata.name}
														</p>
														{template.metadata.description && (
															<p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
																{template.metadata.description}
															</p>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</ScrollArea>

			{/* Footer with count */}
			<div className="border-border border-t pt-3">
				<p className="text-muted-foreground text-xs">
					{filteredTemplates.length} template
					{filteredTemplates.length !== 1 ? 's' : ''} available
				</p>
			</div>
		</div>
	);
}
