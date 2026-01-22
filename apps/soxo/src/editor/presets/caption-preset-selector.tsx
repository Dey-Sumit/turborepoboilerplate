import React, {memo, useCallback, useMemo} from 'react';
import {CaptionsItem} from '../items/captions/captions-item-type';
import {CaptionPresetChip} from './caption-preset-chip';
import {CaptionPreset} from './caption-presets-db';
import {doesItemMatchPreset} from './caption-preset-utils';
import {useCaptionPresets, usePresetActions} from './use-caption-presets';

interface CaptionPresetSelectorProps {
	currentItem: CaptionsItem;
	onPresetApply: (preset: CaptionPreset) => void;
}

const CaptionPresetSelectorUnmemoized: React.FC<CaptionPresetSelectorProps> = ({
	currentItem,
	onPresetApply,
}) => {
	const {presets, loading} = useCaptionPresets();
	const {deletePreset} = usePresetActions();

	// Find which preset matches the current item (if any)
	const selectedPresetId = useMemo(() => {
		const matchingPreset = presets.find((preset) =>
			doesItemMatchPreset(currentItem, preset),
		);
		return matchingPreset?.id ?? null;
	}, [presets, currentItem]);

	const handlePresetSelect = useCallback(
		(preset: CaptionPreset) => {
			onPresetApply(preset);
		},
		[onPresetApply],
	);

	const handlePresetDelete = useCallback(
		async (id: string) => {
			// Simple confirmation - could be replaced with a proper dialog
			if (window.confirm('Are you sure you want to delete this preset?')) {
				await deletePreset(id);
			}
		},
		[deletePreset],
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-4 text-sm text-neutral-500">
				Loading presets...
			</div>
		);
	}

	if (presets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-700 bg-neutral-900/50 py-6 px-4">
				<p className="text-center text-sm text-neutral-400">
					No presets saved yet
				</p>
				<p className="mt-1 text-center text-xs text-neutral-500">
					Customize your caption and save it as a preset
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-2">
			{presets.map((preset) => (
				<CaptionPresetChip
					key={preset.id}
					preset={preset}
					isSelected={selectedPresetId === preset.id}
					onSelect={handlePresetSelect}
					onDelete={handlePresetDelete}
				/>
			))}
		</div>
	);
};

export const CaptionPresetSelector = memo(CaptionPresetSelectorUnmemoized);
