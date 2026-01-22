import React, {memo, useCallback, useMemo} from 'react';
import useEditorStore from '../../../../zustand/editor-store';
import {InspectorSubLabel} from '../../components/inspector-label';
import {BackgroundPresetChip} from './background-preset-chip';
import {BACKGROUND_PRESETS, BackgroundPreset} from './background-presets';

/**
 * Checks if two style objects are equivalent for background purposes.
 * Compares backgroundColor and background properties.
 */
const stylesMatch = (
	a: React.CSSProperties | undefined,
	b: React.CSSProperties,
): boolean => {
	if (!a) return false;

	// Check if both have the same background or backgroundColor
	const aBackground = a.background ?? a.backgroundColor;
	const bBackground = b.background ?? b.backgroundColor;

	return aBackground === bBackground;
};

const BackgroundStylePresetsUnmemoized: React.FC = () => {
	const setState = useEditorStore((state) => state.setState);
	const compositionRootStyles = useEditorStore(
		(state) => state.compositionState.compositionRootStyles,
	);

	const selectedPresetId = useMemo(() => {
		if (!compositionRootStyles) return null;

		const matchingPreset = BACKGROUND_PRESETS.find((preset) =>
			stylesMatch(compositionRootStyles, preset.styles),
		);

		return matchingPreset?.id ?? null;
	}, [compositionRootStyles]);

	const handlePresetSelect = useCallback(
		(preset: BackgroundPreset) => {
			setState((state) => {
				// Merge the preset styles with existing styles (if any)
				// but override background-related properties
				const existingStyles =
					state.compositionState.compositionRootStyles ?? {};

				// Remove existing background properties before applying new ones
				const {
					background: _bg,
					backgroundColor: _bgColor,
					backgroundImage: _bgImg,
					...restStyles
				} = existingStyles;

				state.compositionState.compositionRootStyles = {
					...restStyles,
					...preset.styles,
				};
			});
		},
		[setState],
	);

	return (
		<div className="w-full">
			<InspectorSubLabel>Presets</InspectorSubLabel>
			<div className="grid grid-cols-3 gap-1.5">
				{BACKGROUND_PRESETS.map((preset) => (
					<BackgroundPresetChip
						key={preset.id}
						preset={preset}
						isSelected={selectedPresetId === preset.id}
						onSelect={handlePresetSelect}
					/>
				))}
			</div>
		</div>
	);
};

export const BackgroundStylePresets = memo(BackgroundStylePresetsUnmemoized);
