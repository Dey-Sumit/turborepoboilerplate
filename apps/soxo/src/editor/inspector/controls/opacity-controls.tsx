import React, {memo, useCallback, useRef} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {useContinuousUpdate} from '../../../zustand/undo-hooks';
import {EditorStarterItem} from '../../items/item-type';
import {Slider} from '../../../components/ui/slider';
import {InspectorSubLabel} from '../components/inspector-label';
import {useItemOpacity} from '../../selectors/hooks';

// Debounce delay for intermediate updates (ms)
const DEBOUNCE_DELAY = 32; // ~2 frames at 60fps

const OpacityControlsUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const opacity = useItemOpacity(itemId);
	const updateItem = useEditorStore((state) => state.updateItem);
	const tracker = useContinuousUpdate(`opacity-${itemId}`);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const performUpdate = useCallback(
		(newOpacity: number) => {
			updateItem(
				itemId,
				(i) => {
					const prev = i as EditorStarterItem;
					if (prev.opacity === newOpacity) {
						return prev;
					}
					return {
						...prev,
						opacity: newOpacity,
					};
				},
				'updateOpacity',
			);
		},
		[updateItem, itemId],
	);

	// Called on every slider tick during drag
	const handleSliderChange = useCallback(
		(value: number | readonly number[]) => {
			if (typeof value === 'object') {
				return;
			}
			const newOpacity = value / 100;

			// First update - immediate (creates undo point)
			if (!tracker.isActive) {
				tracker.start(() => performUpdate(newOpacity));
				return;
			}

			// Subsequent updates - debounced to reduce state updates
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
			debounceTimerRef.current = setTimeout(() => {
				tracker.update(() => performUpdate(newOpacity));
				debounceTimerRef.current = null;
			}, DEBOUNCE_DELAY);
		},
		[tracker, performUpdate],
	);

	// Called when drag ends (pointerup)
	const handleSliderCommit = useCallback(
		(value: number | readonly number[]) => {
			if (typeof value === 'object') {
				return;
			}
			const newOpacity = value / 100;

			// Cancel any pending debounced update
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}

			// End tracking - this resumes temporal
			tracker.end(() => performUpdate(newOpacity));
		},
		[tracker, performUpdate],
	);

	const opacityPercent = Math.round(opacity * 100);

	return (
		<div>
			<InspectorSubLabel>Opacity</InspectorSubLabel>
			<div className="flex w-full items-center gap-3">
				<Slider
					value={opacityPercent}
					onValueChange={handleSliderChange}
					onValueCommitted={handleSliderCommit}
					min={0}
					max={100}
					step={1}
					className="flex-1"
					title={`Opacity: ${opacityPercent}%`}
				/>
				<div className="min-w-[40px] text-right text-xs text-white/75">
					{opacityPercent}%
				</div>
			</div>
		</div>
	);
};

export const OpacityControls = memo(OpacityControlsUnmemoized);
