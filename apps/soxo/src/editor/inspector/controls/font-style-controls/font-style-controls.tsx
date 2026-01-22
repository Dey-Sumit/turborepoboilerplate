import React, {memo, useCallback, useEffect, useState} from 'react';
import useEditorStore from '../../../../zustand/editor-store';
import {FontStyle} from '../../../items/text/text-item-type';
import {
	Select,
	SelectContent,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '../../../select';
import {changeItem} from '../../../state/actions/change-item';
import {editAndRelayoutText} from '../../../state/actions/edit-and-relayout-text';
import {setTextItemHoverPreview} from '../../../state/actions/set-hover-preview';
import {
	getFontVariants,
	loadFontFromTextItem,
	loadFontInfoFromApi,
} from '../../../utils/text/load-font-from-text-item';
import {
	FontStyleSelectionItem,
	renderVariant,
	renderWeight,
	serializeFontStyle,
} from './font-style-selection-item';

export const turnFontStyleIntoCss = (
	fontStyle: FontStyle,
): React.CSSProperties => {
	return {
		...(fontStyle.variant.toLowerCase().includes('italic')
			? {fontStyle: 'italic'}
			: {}),
		fontWeight: fontStyle.weight,
	};
};

const FontStyleControlsUnmemoized: React.FC<{
	fontFamily: string;
	fontStyle: FontStyle;
	itemId: string;
}> = ({fontFamily, fontStyle, itemId}) => {
	const setState = useEditorStore((state) => state.setState);
	const [variants, setVariants] = useState<FontStyle[][] | null>([]);

	useEffect(() => {
		setVariants(null);
		loadFontInfoFromApi(fontFamily)
			.then((infos) => {
				const loadedVariants = getFontVariants(infos);
				setVariants(loadedVariants);
			})
			 
			.catch(console.error);
	}, [fontFamily]);

	const applyFontStyle = useCallback(
		(value: string) => {
			const [variant, weight] = value.split('-');

			setState((state) => {
				changeItem(state, itemId, (i) => {
					if (i.type === 'text') {
						return editAndRelayoutText(i, () => {
							if (
								i.fontStyle.variant === variant &&
								i.fontStyle.weight === weight
							) {
								return i;
							}

							return {
								...i,
								fontStyle: {
									variant,
									weight,
								},
							};
						});
					}
					if (i.type === 'captions') {
						return {
							...i,
							fontStyle: {
								variant,
								weight,
							},
						};
					}

					throw new Error(
						`Font style can only be changed for text and captions items`,
					);
				});
			});

			setTextItemHoverPreview(null);
		},
		[setState, itemId],
	);

	const onValueChange = useCallback(
		async (value: string) => {
			const [variant, weight] = value.split('-');
			await loadFontFromTextItem({
				fontFamily: fontFamily,
				fontVariant: variant,
				fontWeight: weight,
				fontInfosDuringRendering: null,
			});
			applyFontStyle(value);
		},
		[applyFontStyle, fontFamily],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				applyFontStyle(serializeFontStyle(fontStyle));
			}
		},
		[applyFontStyle, fontStyle],
	);

	const resetFontStyle = useCallback(() => {
		setTextItemHoverPreview(null);
	}, []);

	const previewFontStyle = useCallback(
		(newFontStyle: FontStyle) => {
			setTextItemHoverPreview({
				itemId,
				type: 'font-style',
				fontStyle: newFontStyle,
			});
		},
		[itemId],
	);

	if (!variants) {
		return null;
	}

	return (
		<div className="mt-2 flex flex-col">
			<Select
				value={serializeFontStyle(fontStyle)}
				onValueChange={onValueChange}
				onOpenChange={onOpenChange}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Font Style">
						{[renderVariant(fontStyle.variant), renderWeight(fontStyle.weight)]
							.filter(Boolean)
							.join(' ')}
					</SelectValue>
				</SelectTrigger>
				<SelectContent className="w-full">
					{variants.map((variantGroup, i) => (
						<React.Fragment key={i}>
							{variantGroup.map((variant) => (
								<FontStyleSelectionItem
									key={serializeFontStyle(variant)}
									variant={variant}
									fontFamily={fontFamily}
									applyFontStyle={applyFontStyle}
									previewFontStyle={previewFontStyle}
									resetFontStyle={resetFontStyle}
								/>
							))}
							{i < variants.length - 1 && <SelectSeparator />}
						</React.Fragment>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export const FontStyleControls = memo(FontStyleControlsUnmemoized);
