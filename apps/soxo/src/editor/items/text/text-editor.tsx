import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {useTextItemHoverPreview} from '../../../zustand/ui-store';
import {turnFontStyleIntoCss} from '../../inspector/controls/font-style-controls/font-style-controls';
import {changeItem} from '../../state/actions/change-item';
import {deleteItems} from '../../state/actions/delete-items';
import {editTextAction} from '../../state/actions/edit-text';
import {unmarkTextAsEditing} from '../../state/actions/text-item-editing';
import {loadFontFromTextItem} from '../../utils/text/load-font-from-text-item';
import {overrideTextItemWithHoverPreview} from './override-text-item-with-hover-preview';
import {TextItem} from './text-item-type';

export const CanvasTextEditor: React.FC<{
	item: TextItem;
}> = ({item: itemWithoutHoverPreview}) => {
	const textItemHoverPreview = useTextItemHoverPreview();

	const item = useMemo(
		() =>
			overrideTextItemWithHoverPreview({
				textItem: itemWithoutHoverPreview,
				hoverPreview: textItemHoverPreview,
			}),
		[itemWithoutHoverPreview, textItemHoverPreview],
	);

	const setState = useEditorStore((s) => s.setState);
	const [editText, setEditText] = useState(item.text);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	loadFontFromTextItem({
		fontFamily: item.fontFamily,
		fontVariant: item.fontStyle.variant,
		fontWeight: item.fontStyle.weight,
		fontInfosDuringRendering: null,
	});

	// Focus and select text when editor becomes active
	useEffect(() => {
		if (!textareaRef.current) return;

		textareaRef.current.focus();
		textareaRef.current.select();

		// auto-height for textarea
		if (!item.resizeOnEdit) {
			textareaRef.current.style.height = 'auto'; // Reset first
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [item.resizeOnEdit]);

	const handleSave = useCallback(() => {
		const textarea = textareaRef.current;

		if (!textarea) {
			return;
		}

		if (editText.trim() === '') {
			setState((state) => {
				deleteItems(state, [item.id]);
			});
			unmarkTextAsEditing();
			return;
		}

		setState((state) => {
			changeItem(state, item.id, (i) =>
				editTextAction({item: i, editText: editText.trimEnd()}),
			);
		});
		unmarkTextAsEditing();
	}, [setState, editText, item.id]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			e.stopPropagation();
			if (e.key === 'Escape') {
				e.preventDefault();
				handleSave();
			}
		},
		[handleSave],
	);

	const handleBlur = useCallback(() => {
		handleSave();
	}, [handleSave]);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			if (!textareaRef.current) {
				return;
			}

			const newValue = e.target.value;

			setEditText(newValue);

			if (item.resizeOnEdit) {
				const temporalState = useEditorStore.temporal.getState();
				temporalState.pause();
				setState((state) =>
					changeItem(state, item.id, (i) =>
						editTextAction({
							item: i,
							editText: newValue,
						}),
					),
				);
				temporalState.resume();
			}
		},
		[setState, item],
	);

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
	}, []);

	const textareaStyle = useMemo((): React.CSSProperties => {
		return {
			position: 'absolute',
			left: item.left,
			top: item.top,
			width: item.width,
			height: item.lineHeight * editText.split('\n').length * item.fontSize,
			fontSize: item.fontSize,
			fontFamily: item.fontFamily,
			...turnFontStyleIntoCss(item.fontStyle),
			color: item.color,
			lineHeight: String(item.lineHeight),
			textAlign: item.align,
			resize: 'none',
			opacity: item.opacity,
			transform: `rotate(${item.rotation}deg)`,
			background: 'transparent',
			padding: '0px',
			outline: `none`,
			boxSizing: 'border-box',
			whiteSpace: 'pre-wrap',
			letterSpacing: `${item.letterSpacing}px`,
			overflow: 'hidden',
			WebkitTextStroke: item.strokeWidth
				? `${item.strokeWidth}px ${item.strokeColor}`
				: '0',
			paintOrder: 'stroke',
		};
	}, [
		item.align,
		item.color,
		item.fontFamily,
		item.fontSize,
		item.fontStyle,
		item.left,
		item.letterSpacing,
		item.lineHeight,
		item.opacity,
		item.rotation,
		item.top,
		item.width,
		editText,
		item.strokeWidth,
		item.strokeColor,
	]);

	// Trigger the native context menu when editing, not the
	// Editor Starter one
	const onContextMenu = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
	}, []);

	return (
		<textarea
			ref={textareaRef}
			value={editText}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
			onBlur={handleBlur}
			onPointerDown={onPointerDown}
			onContextMenu={onContextMenu}
			style={textareaStyle}
			dir={item.direction}
			className="field-sizing-content"
		/>
	);
};
