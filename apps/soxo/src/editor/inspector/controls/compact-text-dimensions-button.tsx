import React, {memo, useCallback} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {Compact} from '../../icons/compact';
import {TextItem} from '../../items/text/text-item-type';
import {getCurrentItems} from '../../state/helpers/get-current-timeline';
import {getTextDimensions} from '../../utils/text/measure-text';
import {measureWrappedText} from '../../utils/text/measure-wrapped-text';
import {InspectorIconButton} from '../components/inspector-icon-button';

/**
 * Padding added to compact dimensions to account for measurement inaccuracies.
 * This adds buffer space on each side (left+right for width, top+bottom for height).
 */
const COMPACT_PADDING = 10;

const CompactTextDimensionsButtonUnmemoized: React.FC<{
	item: TextItem;
}> = ({item}) => {
	const setState = useEditorStore((state) => state.setState);
	const itemId = item.id;

	/**
	 * COMPACT TEXT DIMENSIONS - Smart resize button for text items
	 *
	 * This function intelligently adjusts the text item's width and height to fit
	 * its content perfectly. It handles two scenarios:
	 *
	 * SCENARIO 1: Width >= Natural Text Width (text is NOT wrapped)
	 * ─────────────────────────────────────────────────────────────
	 * When the current width is larger than or equal to what the text naturally
	 * needs (no word-wrapping occurring), this shrinks both width AND height to
	 * the minimum required to display the text without any wrapping.
	 *
	 * Example:
	 *   Before: width=1400, height=630, text displays on 1 line with extra space
	 *   After:  width=450, height=144, text still on 1 line but box is tight
	 *
	 * SCENARIO 2: Width < Natural Text Width (text IS wrapped)
	 * ─────────────────────────────────────────────────────────
	 * When the user has manually shrunk the width causing the text to wrap to
	 * multiple lines, this KEEPS the current width but adjusts the height to
	 * fit all the wrapped lines.
	 *
	 * Example:
	 *   Before: width=300, height=144, text wraps but height is too small
	 *   After:  width=300, height=432, height expanded to fit 3 wrapped lines
	 *
	 * POSITION ADJUSTMENT:
	 * ────────────────────
	 * When width changes, the left position is adjusted based on text alignment:
	 *   - Left-aligned:   No adjustment (anchor is left edge)
	 *   - Center-aligned: Adjusts left to keep center point fixed
	 *   - Right-aligned:  Adjusts left to keep right edge fixed
	 *
	 * SIDE EFFECT:
	 * ────────────
	 * Sets `resizeOnEdit: true` so future text edits will auto-resize the box.
	 *
	 * UTILITIES USED:
	 *   - getTextDimensions(): Measures unwrapped/natural text dimensions
	 *   - measureWrappedText(): Measures text wrapped within a max width
	 */
	const onCompact = useCallback(() => {
		setState((state) => {
			const items = getCurrentItems(state);
			const currentItem = items[itemId] as TextItem | undefined;
			if (!currentItem || currentItem.type !== 'text') return;

			// Calculate the natural (unwrapped) dimensions
			const naturalDimensions = getTextDimensions({
				text: currentItem.text,
				fontFamily: currentItem.fontFamily,
				fontSize: currentItem.fontSize,
				lineHeight: currentItem.lineHeight,
				letterSpacing: currentItem.letterSpacing,
				fontStyle: currentItem.fontStyle,
			});

			let newWidth: number;
			let newHeight: number;
			let newLeft = currentItem.left;

			// Add padding to account for measurement inaccuracies
			const paddedNaturalWidth = naturalDimensions.width + COMPACT_PADDING * 2;
			const paddedNaturalHeight = naturalDimensions.height + COMPACT_PADDING * 2;

			if (currentItem.width >= paddedNaturalWidth) {
				// Current width is larger than or equal to natural width
				// Shrink to natural dimensions (unwrap) + padding
				newWidth = paddedNaturalWidth;
				newHeight = paddedNaturalHeight;
			} else {
				// Current width is smaller than natural width (text is wrapped)
				// Keep current width, but adjust height to fit wrapped text + padding
				const wrappedDimensions = measureWrappedText({
					text: currentItem.text,
					fontFamily: currentItem.fontFamily,
					fontSize: currentItem.fontSize,
					lineHeight: currentItem.lineHeight,
					letterSpacing: currentItem.letterSpacing,
					fontStyle: currentItem.fontStyle,
					maxWidth: currentItem.width - COMPACT_PADDING * 2, // Account for padding in wrap calculation
				});
				newWidth = currentItem.width;
				newHeight = wrappedDimensions.height + COMPACT_PADDING * 2;
			}

			// Adjust left position based on text alignment to maintain anchor point
			if (currentItem.align === 'right') {
				// Right-aligned: anchor is at the right edge, adjust left to maintain it
				newLeft = currentItem.left + currentItem.width - newWidth;
			} else if (currentItem.align === 'center') {
				// Center-aligned: anchor is in the middle, adjust left to maintain center
				newLeft = currentItem.left + (currentItem.width - newWidth) / 2;
			}
			// Left-aligned: anchor is at the left edge, no adjustment needed

			items[itemId] = {
				...currentItem,
				width: newWidth,
				height: newHeight,
				left: newLeft,
				// Enable resizeOnEdit so future text changes auto-resize
				resizeOnEdit: true,
			};
		});
	}, [setState, itemId]);

	return (
		<div className="editor-starter-field hover:border-transparent">
			<InspectorIconButton
				className="flex h-full w-8 flex-1 items-center justify-center"
				aria-label="Compact to fit text"
				title="Compact to fit text"
				onClick={onCompact}
			>
				<Compact height={14} width={14} />
			</InspectorIconButton>
		</div>
	);
};

export const CompactTextDimensionsButton = memo(
	CompactTextDimensionsButtonUnmemoized,
);
