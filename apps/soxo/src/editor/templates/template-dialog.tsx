/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import useEditorStore from '../../zustand/editor-store';
import {addVariableTemplate} from './add-template';
import {VariableTemplate} from './templates-library';
import {VariableForm} from './variable-form';

interface TemplateDialogProps {
	template: VariableTemplate | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	playheadPosition: number;
}

export function TemplateDialog({
	template,
	open,
	onOpenChange,
	playheadPosition,
}: TemplateDialogProps) {
	const handleSubmit = async (values: Record<string, any>) => {
		if (!template) return;

		try {
			// Update editor state with the new template
			useEditorStore.getState().setState((currentState) => {
				const newState = {...currentState};
				addVariableTemplate({
					state: newState,
					template,
					variableValues: values,
					playheadPosition,
				});
				return newState;
			});

			onOpenChange(false);
		} catch (error) {
			console.error('Failed to add template:', error);
		}
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	if (!template) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[70vh] w-full overflow-y-auto rounded-[6px]">
				<DialogHeader>
					<DialogTitle>Customize Template</DialogTitle>
				</DialogHeader>
				<VariableForm
					template={template}
					onSubmit={handleSubmit}
					onCancel={handleCancel}
				/>
			</DialogContent>
		</Dialog>
	);
}
