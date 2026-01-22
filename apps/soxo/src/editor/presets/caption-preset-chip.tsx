import {Trash2Icon} from 'lucide-react';
import React, {memo, useCallback, useState} from 'react';
import {CaptionPreset} from './caption-presets-db';

interface CaptionPresetChipProps {
	preset: CaptionPreset;
	isSelected: boolean;
	onSelect: (preset: CaptionPreset) => void;
	onDelete: (id: string) => void;
}

const CaptionPresetChipUnmemoized: React.FC<CaptionPresetChipProps> = ({
	preset,
	isSelected,
	onSelect,
	onDelete,
}) => {
	const [isHovering, setIsHovering] = useState(false);

	const handleClick = useCallback(() => {
		onSelect(preset);
	}, [onSelect, preset]);

	const handleDelete = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onDelete(preset.id);
		},
		[onDelete, preset.id],
	);

	return (
		<button
			type="button"
			onClick={handleClick}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			data-active={isSelected}
			className="editor-starter-focus-ring group relative flex h-20 w-full cursor-pointer flex-col overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 transition-all hover:border-neutral-500 data-[active=true]:border-blue-500 data-[active=true]:ring-1 data-[active=true]:ring-blue-500"
			title={preset.name}
			aria-label={`${preset.name} caption preset`}
			aria-pressed={isSelected}
		>
			{/* Preview area with sample text */}
			<div className="flex flex-1 items-center justify-center px-3 py-2">
				<span
					className="text-center font-medium"
					style={{
						fontFamily: preset.fontFamily,
						fontSize: '18px',
						color: preset.color,
						WebkitTextStroke: `${preset.strokeWidth}px ${preset.strokeColor}`,
						textAlign: preset.align,
					}}
				>
					Aa
				</span>
			</div>

			{/* Preset name and font info */}
			<div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-2 py-1.5">
				<div className="flex flex-col items-start overflow-hidden">
					<span className="max-w-full truncate text-[10px] font-medium text-neutral-200">
						{preset.name}
					</span>
					<span className="max-w-full truncate text-[9px] text-neutral-500">
						{preset.fontFamily}
					</span>
				</div>

				{/* Delete button - appears on hover */}
				{isHovering && (
					<button
						type="button"
						onClick={handleDelete}
						className="editor-starter-focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-red-500/20"
						aria-label={`Delete ${preset.name}`}
					>
						<Trash2Icon className="h-3 w-3 text-red-400" />
					</button>
				)}
			</div>

			{/* Selected checkmark */}
			{isSelected && (
				<div className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500">
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

export const CaptionPresetChip = memo(CaptionPresetChipUnmemoized);
