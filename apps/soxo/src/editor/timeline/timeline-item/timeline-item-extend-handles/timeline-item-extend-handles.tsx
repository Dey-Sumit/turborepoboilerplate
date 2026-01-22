import React, {memo, useCallback, useMemo, useState} from 'react';
import useEditorStore from '../../../../zustand/editor-store';
import {isLeftClick} from '../../../utils/is-left-click';
import {useTimelineContainerAutoScroll} from '../../../utils/use-timeline-container-auto-scroll';
import {TimelineItemExtendHandle} from '../timeline-item-extend-handle';
import {onExtendHandler} from './on-extend-handler';
import { TimelineItemData } from '../../../selectors';

interface TimelineItemExtendHandles {
	item: TimelineItemData;
	timelineWidth: number;
	width: number;
	height: number;
}

const EXTEND_HANDLE_TARGET_WIDTH = 6;

export const TimelineItemExtendHandles = memo(
	({item, timelineWidth, width, height}: TimelineItemExtendHandles) => {
		const setState = useEditorStore((state) => state.setState);
		const [isDragging, setIsDragging] = useState(false);

		useTimelineContainerAutoScroll({
			isDragging,
			edgeThreshold: 10,
			maxScrollSpeed: 5,
			xAxis: true,
			yAxis: false,
		});

		const onPointerDownHandleLeft = useCallback(
			(pointerDownEvent: React.PointerEvent<HTMLDivElement>) => {
				if (!isLeftClick(pointerDownEvent)) {
					return;
				}

				setIsDragging(true);

				pointerDownEvent.preventDefault();
				pointerDownEvent.stopPropagation();
				onExtendHandler({
					pointerDownEvent,
					setState: setState,
					timelineWidth,
					extend: {
						type: 'left',
						clickedItemId: item.id,
					},
					height,
					onDragEnd: () => setIsDragging(false),
				});
			},
			[setState, timelineWidth, item.id, height],
		);

		const onPointerDownHandleRight = useCallback(
			(pointerDownEvent: React.PointerEvent<HTMLDivElement>) => {
				if (!isLeftClick(pointerDownEvent)) {
					return;
				}

				pointerDownEvent.preventDefault();
				pointerDownEvent.stopPropagation();

				setIsDragging(true);

				onExtendHandler({
					pointerDownEvent,
					setState: setState,
					timelineWidth,
					extend: {
						type: 'right',
						clickedItemId: item.id,
					},
					height,
					onDragEnd: () => setIsDragging(false),
				});
			},
			[setState, timelineWidth, item.id, height],
		);

		const leftStyle = useMemo(() => {
			return {
				width: Math.max(1, Math.min(width / 2, EXTEND_HANDLE_TARGET_WIDTH)),
				left: 8, // Offset from left edge to position handle inside the element
			};
		}, [width]);

		const rightStyle = useMemo(() => {
			return {
				width: Math.max(1, Math.min(width / 2, EXTEND_HANDLE_TARGET_WIDTH)),
				right: 8, // Offset from right edge to position handle inside the element
			};
		}, [width]);

		return (
			<>
				<TimelineItemExtendHandle
					className="cursor-e-resize"
					onPointerDown={onPointerDownHandleLeft}
					style={leftStyle}
				/>
				<TimelineItemExtendHandle
					className="cursor-w-resize"
					onPointerDown={onPointerDownHandleRight}
					style={rightStyle}
				/>
			</>
		);
	},
);

TimelineItemExtendHandles.displayName = 'TimelineItemActions';
