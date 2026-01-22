import {IconStar, IconStarFilled} from '@tabler/icons-react';
import {useCallback, useMemo} from 'react';
import {
	FEATURE_CHANGE_FONT_FAMILY_ON_HOVER,
	FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT,
} from '../../../flags';
import {CheckIcon} from '../../../icons/check';
import {loadFontFromTextItem} from '../../../utils/text/load-font-from-text-item';
import {makeFontPreviewName} from '../../../utils/text/load-font-preview';

export const FontFamilySelectionItem: React.FC<{
	fontFamily: string;
	isLoaded: boolean;
	start: number;
	size: number;
	isHighlighted: boolean;
	isSelected: boolean;
	isFavorite: boolean;
	applyFontFamily: (fontFamily: string) => void;
	setIsOpen: (isOpen: boolean) => void;
	previewedFont: React.RefObject<string | null>;
	resetFontFamily: () => void;
	previewFont: (fontFamilyToPreview: string) => Promise<void>;
	onToggleFavorite: (fontFamily: string) => void;
}> = ({
	fontFamily,
	isLoaded,
	start,
	size,
	isHighlighted,
	isSelected,
	isFavorite,
	applyFontFamily,
	setIsOpen,
	previewedFont,
	resetFontFamily,
	previewFont,
	onToggleFavorite,
}) => {
	const onClick = useCallback(() => {
		applyFontFamily(fontFamily);
		setIsOpen(false);
	}, [fontFamily, applyFontFamily, setIsOpen]);

	const onMouseEnter = useCallback(async () => {
		previewedFont.current = fontFamily;
		await loadFontFromTextItem({
			fontFamily,
			fontVariant: 'normal',
			fontWeight: '400',
			fontInfosDuringRendering: null,
		});
		if (previewedFont.current !== fontFamily) {
			return;
		}

		previewFont(fontFamily);
	}, [previewedFont, fontFamily, previewFont]);

	const onMouseLeave = useCallback(() => {
		previewedFont.current = null;
		resetFontFamily();
	}, [previewedFont, resetFontFamily]);

	const style = useMemo(() => {
		return {
			height: `${size}px`,
			left: 4,
			right: 4,
			transform: `translateY(${start}px)`,
			fontFamily: FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT
				? makeFontPreviewName(fontFamily)
				: 'inherit',
			opacity: isLoaded ? 1 : 0,
		};
	}, [size, start, fontFamily, isLoaded]);

	const handleFavoriteClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onToggleFavorite(fontFamily);
		},
		[fontFamily, onToggleFavorite],
	);

	return (
		<button
			type="button"
			onClick={onClick}
			className={`absolute flex items-center justify-between rounded px-3 py-2 text-left text-xs text-neutral-300 hover:bg-white/5 focus:outline-none ${isHighlighted ? 'bg-white/5' : ''}`}
			style={style}
			onMouseEnter={
				FEATURE_CHANGE_FONT_FAMILY_ON_HOVER ? onMouseEnter : undefined
			}
			onMouseLeave={
				FEATURE_CHANGE_FONT_FAMILY_ON_HOVER ? onMouseLeave : undefined
			}
			aria-label={fontFamily}
		>
			<span className="truncate">{fontFamily}</span>
			<div className="flex items-center gap-1.5">
				<span
					role="button"
					tabIndex={0}
					onClick={handleFavoriteClick}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.stopPropagation();
							onToggleFavorite(fontFamily);
						}
					}}
					className={`flex size-5 items-center justify-center rounded transition-colors hover:bg-white/10 ${
						isFavorite ? 'text-yellow-400' : 'text-neutral-500 hover:text-neutral-300'
					}`}
					aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
				>
					{isFavorite ? (
						<IconStarFilled className="size-3.5" />
					) : (
						<IconStar className="size-3.5" />
					)}
				</span>
				{isSelected && <CheckIcon className="size-3 text-neutral-300" />}
			</div>
		</button>
	);
};
