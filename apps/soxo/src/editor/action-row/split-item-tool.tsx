import {PlayerRef} from '@remotion/player';
import React, {memo, useCallback, useMemo} from 'react';
import useEditorStore from '../../zustand/editor-store';
import useUIStore from '../../zustand/ui-store';
import {ScissorsIcon} from '../icons/scissors';
import {useTimelineItems} from '../selectors/hooks';
import {splitItem} from '../state/actions/split-item';
import {useTimelinePosition} from '../utils/use-timeline-position';

const SplitItemToolUnmemoized = ({
	playerRef,
}: {
	playerRef: React.RefObject<PlayerRef | null>;
}) => {
	const setState = useEditorStore((state) => state.setState);

	const selectedItems = useUIStore((state) => state.selectedItems);
	const timelineItems = useTimelineItems();

	const currentFrame = useTimelinePosition({playerRef});

	const splittableRanges = useMemo(() => {
		if (selectedItems.length === 0) return [];

		const ranges = [];

		for (const itemId of selectedItems) {
			const item = timelineItems[itemId];
			if (!item) continue;

			if (item.durationInFrames <= 1) continue;

			ranges.push({
				itemId,
				start: item.from,
				end: item.from + item.durationInFrames,
			});
		}

		return ranges;
	}, [selectedItems, timelineItems]);

	const canSplit = useMemo(() => {
		return splittableRanges.some(
			(range) => currentFrame > range.start && currentFrame < range.end,
		);
	}, [currentFrame, splittableRanges]);

	const handleSplitClip = useCallback(() => {
		if (!canSplit) return;

		setState((state) => {
			for (const itemId of selectedItems) {
				const item = timelineItems[itemId];
				if (!item) continue;

				const itemStart = item.from;
				const itemEnd = itemStart + item.durationInFrames;

				if (currentFrame > itemStart && currentFrame < itemEnd) {
					splitItem({
						state,
						idToSplit: itemId,
						framePosition: currentFrame,
					});
				}
			}
		});
	}, [canSplit, setState, selectedItems, timelineItems, currentFrame]);

	return (
		<button
			onClick={handleSplitClip}
			disabled={!canSplit}
			className="editor-starter-focus-ring flex h-10 w-10 cursor-pointer items-center justify-center text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
			title="Split Clip at Playhead"
			aria-label="Split Clip at Playhead"
		>
			<ScissorsIcon className="w-4" />
		</button>
	);
};

export const SplitItemTool = memo(SplitItemToolUnmemoized);
SplitItemTool.displayName = 'SplitItemTool';
