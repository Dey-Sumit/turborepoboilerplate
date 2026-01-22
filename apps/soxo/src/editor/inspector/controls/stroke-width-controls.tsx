import React, {memo} from 'react';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import useEditorStore from '../../../zustand/editor-store';
import {RotateIcon} from '../../icons/rotate';
import {InspectorSubLabel} from '../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';

export const StrokeWidthControlsUnmemoized: React.FC<{
	strokeWidth: number;
	itemId: string;
}> = ({strokeWidth, itemId}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const undoTracker = React.useMemo(() => createContinuousUpdateTracker(), []);

	const onStrokeWidth: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'text' && i.type !== 'captions') {
						throw new Error('Item is not a text or caption');
					}
					return {
						...i,
						strokeWidth: num,
					};
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
		<div>
			<InspectorSubLabel>Width</InspectorSubLabel>
			<NumberControl
				accessibilityLabel="Stroke width"
				label={
					<div className="flex items-center gap-1">
						<RotateIcon className="size-3" />
					</div>
				}
				value={strokeWidth}
				setValue={onStrokeWidth}
				min={0}
				max={100}
				step={1}
			/>
		</div>
	);
};

export const StrokeWidthControls = memo(StrokeWidthControlsUnmemoized);
