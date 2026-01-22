import React, {memo, useCallback} from 'react';
import {BackgroundPreset} from './background-presets';

type BackgroundPresetChipProps = {
	preset: BackgroundPreset;
	isSelected: boolean;
	onSelect: (preset: BackgroundPreset) => void;
};

const BackgroundPresetChipUnmemoized: React.FC<BackgroundPresetChipProps> = ({
	preset,
	isSelected,
	onSelect,
}) => {
	const handleClick = useCallback(() => {
		onSelect(preset);
	}, [onSelect, preset]);

	return (
		<button
			type="button"
			onClick={handleClick}
			data-active={isSelected}
			className="editor-starter-focus-ring group relative aspect-square w-full cursor-pointer overflow-hidden rounded-md border border-neutral-700 transition-all hover:border-neutral-500 data-[active=true]:border-blue-500 data-[active=true]:ring-1 data-[active=true]:ring-blue-500"
			title={preset.name}
			aria-label={`${preset.name} background`}
			aria-pressed={isSelected}
		>
			{/* Background preview */}
			<div
				className="absolute inset-0"
				style={preset.previewStyles ?? preset.styles}
			/>

			{/* Hover overlay with name */}
			<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
				<span className="text-[10px] font-medium text-white drop-shadow-md">
					{preset.name}
				</span>
			</div>

			{/* Selected checkmark */}
			{isSelected && (
				<div className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500">
					<svg
						width="8"
						height="8"
						viewBox="0 0 12 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M2.5 6L5 8.5L9.5 3.5"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			)}
		</button>
	);
};

export const BackgroundPresetChip = memo(BackgroundPresetChipUnmemoized);
