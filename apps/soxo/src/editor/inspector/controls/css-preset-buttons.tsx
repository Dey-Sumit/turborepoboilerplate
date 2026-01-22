import {Button} from '@/components/ui/button';
import React, {memo, useCallback} from 'react';
import {toast} from 'sonner';
import useEditorStore from '../../../zustand/editor-store';
import {EditorStarterItem} from '../../items/item-type';
import {InspectorSubLabel} from '../components/inspector-label';
import {useItemCss} from '../../selectors/hooks';
import {
	applyCssPreset,
	CSS_PRESETS,
	CssPresetCategory,
	getPresetsByCategory,
} from './css-presets';

interface CssPresetButtonsProps {
	itemId: string;
}

const CssPresetButtonsUnmemoized: React.FC<CssPresetButtonsProps> = ({
	itemId,
}) => {
	const currentCss = useItemCss(itemId);
	const updateItem = useEditorStore((state) => state.updateItem);

	const handleApplyPreset = useCallback(
		(presetId: string) => {
			const preset = CSS_PRESETS.find((p) => p.id === presetId);
			if (!preset) return;

			const newCss = applyCssPreset(currentCss, preset);

			updateItem(itemId, (item: EditorStarterItem) => ({
				...item,
				css: newCss,
			}));

			toast.success(`Applied "${preset.name}"`);
		},
		[itemId, currentCss, updateItem],
	);

	const renderCategoryPresets = (category: CssPresetCategory, label: string) => {
		const presets = getPresetsByCategory(category);
		if (presets.length === 0) return null;

		return (
			<div className="space-y-2">
				<InspectorSubLabel>{label}</InspectorSubLabel>
				<div className="grid grid-cols-2 gap-2">
					{presets.map((preset) => (
						<Button
							key={preset.id}
							type="button"
							variant="outline"
							size="sm"
							onClick={() => handleApplyPreset(preset.id)}
							className="h-auto py-2 text-xs"
							title={preset.description}
						>
							{preset.name}
						</Button>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-4">
			{renderCategoryPresets('overlay', 'Overlays')}
			{renderCategoryPresets('shadow', 'Shadows')}
			{renderCategoryPresets('border', 'Borders')}
			{renderCategoryPresets('filter', 'Filters')}
		</div>
	);
};

export const CssPresetButtons = memo(CssPresetButtonsUnmemoized);
