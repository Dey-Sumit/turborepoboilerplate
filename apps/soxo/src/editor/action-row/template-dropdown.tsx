import * as Popover from '@radix-ui/react-popover';
import {PlayerRef} from '@remotion/player';
import React, {useCallback, useState} from 'react';
import {VariableTemplate, cardTemplate} from '../templates/templates-library';
import {TemplateDialog} from '../templates/template-dialog';
import {clsx} from '../utils/clsx';

const TemplateIcon: React.FC<{className?: string}> = ({className}) => (
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
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<path d="M3 9h18" />
		<path d="M9 21V9" />
	</svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
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
		<path d="m6 9 6 6 6-6" />
	</svg>
);

type TemplateItemProps = {
	template: VariableTemplate;
	onSelect: (template: VariableTemplate) => void;
};

const TemplateItem: React.FC<TemplateItemProps> = ({template, onSelect}) => {
	const handleClick = useCallback(() => {
		onSelect(template);
	}, [template, onSelect]);

	return (
		<button
			type="button"
			onClick={handleClick}
			className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
		>
			<div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded bg-white/10">
				<TemplateIcon className="h-5 w-5 text-white/60" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium text-white">
					{template.metadata.name}
				</div>
				<div className="truncate text-xs text-white/50">
					{template.metadata.description}
				</div>
			</div>
		</button>
	);
};

type TemplateCategoryProps = {
	category: string;
	templates: VariableTemplate[];
	onSelect: (template: VariableTemplate) => void;
};

const TemplateCategory: React.FC<TemplateCategoryProps> = ({
	category,
	templates,
	onSelect,
}) => {
	return (
		<div className="mb-3">
			<div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
				{category}
			</div>
			<div className="space-y-0.5">
				{templates.map((template) => (
					<TemplateItem
						key={template.id}
						template={template}
						onSelect={onSelect}
					/>
				))}
			</div>
		</div>
	);
};

export const TemplateDropdown: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<VariableTemplate | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleSelectTemplate = useCallback(
		(template: VariableTemplate) => {
			setSelectedTemplate(template);
			setDialogOpen(true);
			setIsOpen(false);
		},
		[],
	);

	// Group templates by category
	const templatesByCategory = new Map([
		['card', [cardTemplate]],
		
	]);

	return (
		<>
			<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
				<Popover.Trigger asChild>
					<button
						type="button"
						className={clsx(
							'editor-starter-focus-ring flex h-10 items-center gap-1.5 rounded bg-white/5 px-3 text-white transition-colors hover:bg-white/10',
							isOpen && 'bg-white/10',
						)}
						title="Add Template"
						aria-label="Add Template"
					>
						<TemplateIcon className="h-4 w-4" />
						<span className="text-sm">Templates</span>
						<ChevronDownIcon className="h-3.5 w-3.5 text-white/50" />
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						side="bottom"
						align="start"
						sideOffset={8}
						className="z-50 w-80 rounded-lg border border-white/10 bg-[#1a1a1a] p-3 shadow-2xl"
					>
						<div className="mb-3 border-b border-white/10 pb-2">
							<h3 className="text-sm font-semibold text-white">
								Add Composite Template
							</h3>
							<p className="text-xs text-white/50">
								Pre-built composites you can customize
							</p>
						</div>
						<div className="max-h-[400px] overflow-y-auto">
							{Array.from(templatesByCategory.entries()).map(
								([category, templates]) => (
									<TemplateCategory
										key={category}
										category={category}
										templates={templates}
										onSelect={handleSelectTemplate}
									/>
								),
							)}
						</div>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>

			<TemplateDialog
				template={selectedTemplate}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				playheadPosition={playerRef.current?.getCurrentFrame() ?? 0}
			/>
		</>
	);
};
