import React, {memo, useCallback} from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import useEditorStore from '../../../zustand/editor-store';
import {
	HighlightStyle,
	HIGHLIGHT_STYLE_LABELS,
} from '../../items/captions/highlight-styles';
import {InspectorSubLabel} from '../components/inspector-label';

const HighlightStyleControlsUnmemoized: React.FC<{
	highlightStyle: HighlightStyle;
	itemId: string;
}> = ({highlightStyle, itemId}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const handleHighlightStyleChange = useCallback(
		(newStyle: HighlightStyle) => {
			updateItem(itemId, (i) => {
				if (i.type !== 'captions') {
					throw new Error('Highlight style can only be changed for captions');
				}

				return {
					...i,
					highlightStyle: newStyle,
				};
			});
		},
		[updateItem, itemId],
	);

	const allHighlightStyles: HighlightStyle[] = [
		'highlight',
		'pop-in',
		'scale',
		'glow',
		'bounce',
	];

	return (
		<div>
			<InspectorSubLabel>Highlight Style</InspectorSubLabel>
			<Select
				value={highlightStyle}
				onValueChange={(value) =>
					value && handleHighlightStyleChange(value as HighlightStyle)
				}
			>
				<SelectTrigger className="editor-starter-field w-full">
					<SelectValue>{HIGHLIGHT_STYLE_LABELS[highlightStyle]}</SelectValue>
				</SelectTrigger>
				<SelectContent className="bg-editor-starter-panel">
					{allHighlightStyles.map((style) => (
						<SelectItem key={style} value={style}>
							{HIGHLIGHT_STYLE_LABELS[style]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export const HighlightStyleControls = memo(HighlightStyleControlsUnmemoized);
