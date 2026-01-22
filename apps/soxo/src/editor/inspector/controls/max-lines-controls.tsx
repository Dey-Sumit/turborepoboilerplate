import {memo, useCallback} from 'react';
import React from 'react';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import useEditorStore from '../../../zustand/editor-store';
import {relayoutCaptions} from '../../state/actions/relayout-captions';
import {InspectorSubLabel} from '../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';

const MaxLinesControlsUnmemoized: React.FC<{
	maxLines: number;
	itemId: string;
}> = ({maxLines, itemId}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const undoTracker = React.useMemo(() => createContinuousUpdateTracker(), []);

	const onMaxLinesChange: NumberControlUpdateHandler = useCallback(
		({num, commitToUndoStack}) => {
			const validMaxLines = Math.max(1, Math.min(10, Math.round(num)));

			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type === 'captions') {
						if (i.maxLines === validMaxLines) {
							return i;
						}

						const newItem = {
							...i,
							maxLines: validMaxLines,
						};

						return relayoutCaptions(newItem);
					}

					throw new Error('Max lines can only be changed for captions items');
				});
			};

			if (commitToUndoStack) {
				undoTracker.endTracking(performUpdate);
			} else {
				if (!undoTracker.isTracking()) {
					undoTracker.startTracking(performUpdate);
				} else {
					undoTracker.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, undoTracker],
	);

	return (
		<div className="flex-1">
			<InspectorSubLabel>Max Lines</InspectorSubLabel>
			<NumberControl
				label={
					<div className="flex items-center gap-1">
						<span className="text-xs">#</span>
					</div>
				}
				setValue={onMaxLinesChange}
				value={maxLines}
				min={1}
				max={10}
				step={1}
				accessibilityLabel="Max lines"
			/>
		</div>
	);
};

export const MaxLinesControls = memo(MaxLinesControlsUnmemoized);
