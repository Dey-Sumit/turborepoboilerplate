import React, {useCallback, useMemo, useRef} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {ITEM_BORDERS} from '../../constants';
import {enterCompositeEditMode} from '../../state/actions/composite-navigation';
import {clsx} from '../../utils/clsx';
import {useItemDrag} from '../utils/drag/use-timeline-item-drag';
import { TimelineItemData } from '../../selectors';

export const TIMELINE_ITEM_BORDER_WIDTH = 1;

// Double-click detection with manual timing (to work with pointer events)
const DOUBLE_CLICK_THRESHOLD = 300; // ms

export function TimelineItemContainer({
	children,
	isSelected,
	item,
}: {
	children: React.ReactNode;
	isSelected: boolean;
	item: TimelineItemData;
}) {
	const timelineItemRef = useRef<HTMLDivElement>(null);
	const setState = useEditorStore((state) => state.setState);
	const lastClickTimeRef = useRef<number>(0);
	const lastClickItemRef = useRef<string | null>(null);

	const {onPointerDown: originalOnPointerDown, onClick} = useItemDrag({
		draggedItem: item,
	});

	// Wrap onPointerDown to detect double-clicks manually
	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const now = Date.now();
			const timeSinceLastClick = now - lastClickTimeRef.current;
			const sameItem = lastClickItemRef.current === item.id;

			// Check if this is a double-click (two clicks on same item within threshold)
			if (sameItem && timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
				// Double-click detected!
				if (item.type === 'composite') {
					e.stopPropagation();
					e.preventDefault();
					setState((state) => {
						enterCompositeEditMode(state, item.id);
					});
					// Reset to prevent triple-click triggering another double-click
					lastClickTimeRef.current = 0;
					lastClickItemRef.current = null;
					return;
				}
			}

			// Update last click tracking
			lastClickTimeRef.current = now;
			lastClickItemRef.current = item.id;

			// Call the original handler
			originalOnPointerDown(e);
		},
		[item.id, item.type, setState, originalOnPointerDown],
	);

	const style = useMemo(() => {
		return {
			// borderWidth: TIMELINE_ITEM_BORDER_WIDTH,
			borderColor: isSelected
				? '#fff'
				: 
					ITEM_BORDERS[item.type] || 'rgba(255, 255, 255, 0.2)',
		};
	}, [item.type, isSelected]);

	return (
		<div
			ref={timelineItemRef}
			onPointerDown={onPointerDown}
			onClick={onClick}
			className={clsx(
				'absolute box-border h-full w-full cursor-pointer overflow-hidden rounded-[8px] border select-none hover:border-white',
			)}
			style={style}
		>
			{children}
		</div>
	);
}
