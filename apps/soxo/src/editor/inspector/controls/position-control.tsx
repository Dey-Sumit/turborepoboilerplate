import React, {memo, useMemo} from 'react';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import useEditorStore from '../../../zustand/editor-store';
import {
	setPositionLeft,
	setPositionTop,
} from '../../state/actions/set-position';
import {getRectAfterCrop} from '../../utils/get-dimensions-after-crop';
import {useItemPosition} from '../../selectors/hooks';
import {InspectorSubLabel} from '../components/inspector-label';
import {ControlsPadding} from './controls-padding';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';
import {EditorStarterItem} from '../../items/item-type';

const PositionControlUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const updateItem = useEditorStore((state) => state.updateItem);
	const position = useItemPosition(itemId);

	const rectAfterCrop = useMemo(() => getRectAfterCrop(position as unknown as EditorStarterItem), [position]);

	const undoTrackerLeft = React.useMemo(() => createContinuousUpdateTracker(), []);
	const undoTrackerTop = React.useMemo(() => createContinuousUpdateTracker(), []);

	const onLeft: NumberControlUpdateHandler = React.useCallback(
		({num: _leftAfterCrop, commitToUndoStack}) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const currentRectAfterCrop = getRectAfterCrop(i);
					const diff = i.left - currentRectAfterCrop.left;
					const num = _leftAfterCrop + diff;

					return setPositionLeft({item: i, left: num});
				});
			};

			if (commitToUndoStack) {
				undoTrackerLeft.endTracking(performUpdate);
			} else {
				if (!undoTrackerLeft.isTracking()) {
					undoTrackerLeft.startTracking(performUpdate);
				} else {
					undoTrackerLeft.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, undoTrackerLeft],
	);

	const onTop: NumberControlUpdateHandler = React.useCallback(
		({num: _topAfterCrop, commitToUndoStack}) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const currentRectAfterCrop = getRectAfterCrop(i);
					const diff = i.top - currentRectAfterCrop.top;
					const num = _topAfterCrop + diff;

					return setPositionTop({item: i, top: num});
				});
			};

			if (commitToUndoStack) {
				undoTrackerTop.endTracking(performUpdate);
			} else {
				if (!undoTrackerTop.isTracking()) {
					undoTrackerTop.startTracking(performUpdate);
				} else {
					undoTrackerTop.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, undoTrackerTop],
	);

	return (
		<div>
			<InspectorSubLabel>Position</InspectorSubLabel>
			<div className="flex gap-2">
				<div className="flex-1">
					<NumberControl
						label="X"
						setValue={onLeft}
						value={Math.floor(rectAfterCrop.left)}
						min={null}
						max={null}
						step={1}
						accessibilityLabel="X"
					/>
				</div>
				<div className="flex-1">
					<NumberControl
						label="Y"
						setValue={onTop}
						value={Math.floor(rectAfterCrop.top)}
						min={null}
						max={null}
						step={1}
						accessibilityLabel="Y"
					/>
				</div>
				<ControlsPadding />
			</div>
		</div>
	);
};

export const PositionControl = memo(PositionControlUnmemoized);
