import * as Popover from '@radix-ui/react-popover';
import {useVirtualizer} from '@tanstack/react-virtual';
import React, {
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {flushSync} from 'react-dom';
import useEditorStore from '../../../../zustand/editor-store';
import {
	useFavoriteFonts,
	useToggleFavoriteFont,
} from '../../../../zustand/ui-store';
import {scrollbarStyle} from '../../../constants';
import {GOOGLE_FONTS_LIST} from '../../../data/google-fonts-list';
import {
	FEATURE_FONT_FAMILY_CONTROLS_PREVIEW_ON_HOVER,
	FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT,
} from '../../../flags';
import {changeItem} from '../../../state/actions/change-item';
import {editAndRelayoutText} from '../../../state/actions/edit-and-relayout-text';
import {setTextItemHoverPreview} from '../../../state/actions/set-hover-preview';
import {loadFontFromTextItem} from '../../../utils/text/load-font-from-text-item';
import {makeFontPreviewName} from '../../../utils/text/load-font-preview';
import {useFontPreviewLoader} from '../../../utils/text/use-font-preview-loader';
import {InspectorSubLabel} from '../../components/inspector-label';
import {FontFamilySelectionItem} from './font-family-selection-item';

const FONT_ITEM_HEIGHT = 30;

const FontFamilyControlUnmemoized: React.FC<{
	fontFamily: string;
	itemId: string;
}> = ({fontFamily, itemId}) => {
	const [search, setSearch] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const {loadFontForPreview, loadedFonts} = useFontPreviewLoader();
	const setState = useEditorStore((s) => s.setState);
	const favoriteFonts = useFavoriteFonts();
	const toggleFavoriteFont = useToggleFavoriteFont();

	const favoriteFontsSet = useMemo(
		() => new Set(favoriteFonts),
		[favoriteFonts],
	);

	const sortedFonts = useMemo(() => {
		// Create a list with favorites first, then all fonts alphabetically
		const favorites = GOOGLE_FONTS_LIST.filter((font) =>
			favoriteFontsSet.has(font.fontFamily),
		);
		// All fonts includes favorites too for easy A-Z traversal
		const allFonts = GOOGLE_FONTS_LIST;

		return {
			favorites,
			all: allFonts,
			combined: [...favorites, ...allFonts],
			favoritesCount: favorites.length,
		};
	}, [favoriteFontsSet]);

	const filteredFonts = useMemo(() => {
		if (!search) return sortedFonts.combined;

		const searchLower = search.toLowerCase();
		const filteredFavorites = sortedFonts.favorites.filter((font) =>
			font.fontFamily.toLowerCase().includes(searchLower),
		);
		const filteredAll = sortedFonts.all.filter((font) =>
			font.fontFamily.toLowerCase().includes(searchLower),
		);

		return [...filteredFavorites, ...filteredAll];
	}, [search, sortedFonts]);

	const favoritesCountInFiltered = useMemo(() => {
		if (!search) return sortedFonts.favoritesCount;

		const searchLower = search.toLowerCase();
		return sortedFonts.favorites.filter((font) =>
			font.fontFamily.toLowerCase().includes(searchLower),
		).length;
	}, [search, sortedFonts]);

	useEffect(() => {
		setHighlightedIndex(-1);
	}, [search]);

	const listRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: filteredFonts.length,
		getScrollElement: () => listRef.current,
		estimateSize: () => FONT_ITEM_HEIGHT,
		overscan: 30,
	});

	const virtualItems = virtualizer.getVirtualItems();

	const selectedFontIndex = useMemo(() => {
		return filteredFonts.findIndex((font) => font.importName === fontFamily);
	}, [filteredFonts, fontFamily]);

	useEffect(() => {
		if (!isOpen) return;

		const loadVisibleFonts = async () => {
			const fontsToLoad = virtualItems.map(
				(item) => filteredFonts[item.index]?.fontFamily,
			);

			await Promise.all(
				fontsToLoad.map((fontFamilyToLoad) =>
					loadFontForPreview(fontFamilyToLoad),
				),
			);
		};

		loadVisibleFonts();
	}, [isOpen, virtualItems, filteredFonts, loadFontForPreview]);

	useEffect(() => {
		loadFontForPreview(fontFamily);
	}, [fontFamily, loadFontForPreview]);

	const fontPreviewStyle = useMemo(() => {
		return {
			fontFamily: FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT
				? makeFontPreviewName(fontFamily)
				: 'inherit',
		};
	}, [fontFamily]);

	const applyFontFamily = useCallback(
		(newFontFamily: string) => {
			setState((state) => {
				changeItem(state, itemId, (i) => {
					if (i.type === 'text') {
						return editAndRelayoutText(i, () => {
							if (
								i.fontFamily === newFontFamily &&
								i.fontStyle.variant === 'normal' &&
								i.fontStyle.weight === '400'
							) {
								return i;
							}

							return {
								...i,
								fontFamily: newFontFamily,
								fontStyle: {
									variant: 'normal',
									weight: '400',
								},
							};
						});
					}
					if (i.type === 'captions') {
						if (
							i.fontFamily === newFontFamily &&
							i.fontStyle.variant === 'normal' &&
							i.fontStyle.weight === '400'
						) {
							return i;
						}

						return {
							...i,
							fontFamily: newFontFamily,
							fontStyle: {
								variant: 'normal',
								weight: '400',
							},
						};
					}
					throw new Error(
						'Item type does not implement font change: ' + JSON.stringify(i),
					);
				});
			});

			setTextItemHoverPreview(null);
		},
		[itemId, setState],
	);

	const onFontChange = useCallback(
		async (family: string) => {
			await loadFontFromTextItem({
				fontFamily: family,
				fontVariant: 'normal',
				fontWeight: '400',
				fontInfosDuringRendering: null,
			});
			applyFontFamily(family);
		},
		[applyFontFamily],
	);

	const closePopover = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	const handleFontSelect = useCallback(
		(newFontFamily: string) => {
			onFontChange(newFontFamily);
			closePopover();
		},
		[onFontChange, closePopover],
	);

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			// here we wait first until popover is open before measuring the virtualizer
			flushSync(() => setIsOpen(newOpen));

			// Scroll to selected font when opening
			if (newOpen) {
				// measure the virtualizer in sync mode to ensure the virtualizer is ready before scrolling
				flushSync(() => {
					virtualizer.measure();
				});

				if (selectedFontIndex !== -1) {
					virtualizer.scrollToIndex(selectedFontIndex, {
						align: 'center',
						behavior: 'auto',
					});
					// Set the highlighted index to the selected font
					setHighlightedIndex(selectedFontIndex);
				} else {
					// If no font is selected, highlight the first font
					setHighlightedIndex(0);
				}
			} else {
				setTextItemHoverPreview(null);

				// Reset highlighted index when closing
				setHighlightedIndex(-1);
			}
		},
		[selectedFontIndex, virtualizer],
	);

	const previewedFont = useRef<string | null>(null);

	const previewFont = useCallback(
		async (fontFamilyToPreview: string) => {
			if (!FEATURE_FONT_FAMILY_CONTROLS_PREVIEW_ON_HOVER) {
				return;
			}

			previewedFont.current = fontFamilyToPreview;
			await loadFontFromTextItem({
				fontFamily: fontFamilyToPreview,
				fontVariant: 'normal',
				fontWeight: '400',
				fontInfosDuringRendering: null,
			});

			if (previewedFont.current === fontFamilyToPreview) {
				setTextItemHoverPreview({
					itemId,
					fontFamily: fontFamilyToPreview,
					type: 'font-family',
				});
			}
		},
		[itemId],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!isOpen) return;

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					setHighlightedIndex((prev) => {
						const newIndex =
							prev === -1 ? 0 : Math.min(prev + 1, filteredFonts.length - 1);
						previewFont(filteredFonts[newIndex].fontFamily);
						virtualizer.scrollToIndex(newIndex, {
							align: 'center',
							behavior: 'auto',
						});
						return newIndex;
					});
					break;
				case 'ArrowUp':
					e.preventDefault();
					setHighlightedIndex((prev) => {
						const newIndex =
							prev === -1 ? filteredFonts.length - 1 : Math.max(prev - 1, 0);
						previewFont(filteredFonts[newIndex].fontFamily);
						virtualizer.scrollToIndex(newIndex, {
							align: 'center',
							behavior: 'auto',
						});
						return newIndex;
					});
					break;
				case 'Enter':
					e.preventDefault();
					if (
						highlightedIndex >= 0 &&
						highlightedIndex < filteredFonts.length
					) {
						const selectedFont = filteredFonts[highlightedIndex];
						if (selectedFont) {
							handleFontSelect(selectedFont.fontFamily);
						}
					}
					break;
				case 'Escape':
					e.preventDefault();
					closePopover();
					break;
			}
		},
		[
			isOpen,
			filteredFonts,
			highlightedIndex,
			virtualizer,
			handleFontSelect,
			closePopover,
			previewFont,
		],
	);

	const onPointerDownOutside = useCallback(
		(e: CustomEvent<{originalEvent: PointerEvent}>) => {
			closePopover();
			e.stopPropagation();
		},
		[closePopover],
	);

	const resetFontFamily = useCallback(() => {
		setTextItemHoverPreview(null);
	}, []);

	return (
		<div>
			<InspectorSubLabel>Font</InspectorSubLabel>
			<Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
				<Popover.Trigger asChild>
					<button
						type="button"
						className="editor-starter-field w-full truncate px-2 py-2 text-left text-xs text-neutral-300"
						style={fontPreviewStyle}
						aria-label="Font Family"
					>
						{fontFamily}
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<>
						<div className="absolute inset-0"></div>
						<Popover.Content
							onPointerDownOutside={onPointerDownOutside}
							side="left"
							sideOffset={5}
							align="start"
							collisionBoundary={null}
							className="bg-editor-starter-panel z-50 w-64 overflow-hidden rounded border border-white/10 shadow-xl"
							style={{
								maxHeight: '300px',
							}}
							onKeyDown={handleKeyDown}
						>
							<div className="border-b border-white/10">
								<input
									type="text"
									placeholder="Search fonts..."
									value={search}
									aria-label="Search fonts"
									onChange={(e) => setSearch(e.target.value)}
									className="editor-starter-field w-full appearance-none border-none px-3 py-2 text-xs text-neutral-300"
									autoFocus
								/>
							</div>
							<div
								ref={listRef}
								className="overflow-y-scroll"
								style={{
									maxHeight: '240px',
									minHeight: filteredFonts.length > 0 ? '100px' : '0',
									...scrollbarStyle,
								}}
							>
								<div
									style={{
										height: `${virtualizer.getTotalSize() + 8 + (favoritesCountInFiltered > 0 ? 24 : 0) + (favoritesCountInFiltered > 0 && filteredFonts.length > favoritesCountInFiltered ? 24 : 0)}px`,
										width: '100%',
										position: 'relative',
										paddingTop: 4,
										paddingBottom: 4,
									}}
								>
									{favoritesCountInFiltered > 0 && (
									<div
										className="absolute left-0 right-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500"
										style={{
											transform: 'translateY(0px)',
										}}
									>
										Favorites
									</div>
								)}
								{favoritesCountInFiltered > 0 &&
									filteredFonts.length > favoritesCountInFiltered && (
										<div
											className="absolute left-0 right-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500"
											style={{
												transform: `translateY(${favoritesCountInFiltered * FONT_ITEM_HEIGHT + 20}px)`,
											}}
										>
											All Fonts
										</div>
									)}
								{virtualItems.map((virtualItem) => {
									const font = filteredFonts[virtualItem.index];

									if (!font) {
										throw new Error(
											'Font not found for virtual item: ' + virtualItem.index,
										);
									}

									const isSelected = fontFamily === font.fontFamily;
									const isHighlighted =
										highlightedIndex === virtualItem.index;
									const isLoaded = FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT
										? loadedFonts.has(font.fontFamily)
										: true;
									const isFavorite = favoriteFontsSet.has(font.fontFamily);

									// Adjust start position to account for section headers
									let adjustedStart = virtualItem.start;
									if (favoritesCountInFiltered > 0) {
										// Add space for "Favorites" header
										adjustedStart += 24;
										if (
											virtualItem.index >= favoritesCountInFiltered &&
											filteredFonts.length > favoritesCountInFiltered
										) {
											// Add space for "All Fonts" header
											adjustedStart += 24;
										}
									}

									return (
										<FontFamilySelectionItem
											fontFamily={font.fontFamily}
											isLoaded={isLoaded}
											start={adjustedStart}
											size={virtualItem.size}
											isHighlighted={isHighlighted}
											isSelected={isSelected}
											isFavorite={isFavorite}
											applyFontFamily={applyFontFamily}
											setIsOpen={setIsOpen}
											previewedFont={previewedFont}
											key={`${virtualItem.index < favoritesCountInFiltered ? 'fav-' : 'all-'}${font.fontFamily}`}
											resetFontFamily={resetFontFamily}
											previewFont={previewFont}
											onToggleFavorite={toggleFavoriteFont}
										/>
									);
								})}
								</div>
							</div>
							{filteredFonts.length === 0 && (
								<div className="px-3 py-2 text-sm text-gray-400">
									No fonts found
								</div>
							)}
						</Popover.Content>
					</>
				</Popover.Portal>
			</Popover.Root>
		</div>
	);
};

export const FontFamilyControl = memo(FontFamilyControlUnmemoized);
