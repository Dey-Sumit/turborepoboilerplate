import React, {memo} from 'react';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import useEditorStore from '../../../zustand/editor-store';
import {RoundnessIcon} from '../../icons/roundness';
import {
	changeBackgroundBorderRadius,
	changeBorderRadius,
} from '../../state/actions/change-border-radius';
import {InspectorSubLabel} from '../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';
import {useItemBorderRadius} from '../../selectors/hooks';

const BorderRadiusControlUnmemoized: React.FC<{
	borderRadiusType: 'fill' | 'background';
	itemId: string;
}> = ({borderRadiusType, itemId}) => {
	const borderRadius = useItemBorderRadius(itemId);
	const updateItem = useEditorStore((state) => state.updateItem);

	const undoTracker = React.useMemo(() => createContinuousUpdateTracker(), []);

	const onRadius: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (borderRadiusType === 'fill') {
						return changeBorderRadius({item: i, borderRadius: num});
					}
					if (borderRadiusType === 'background') {
						return changeBackgroundBorderRadius({item: i, borderRadius: num});
					}
					throw new Error('Invalid border radius type');
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
		[updateItem, itemId, borderRadiusType, undoTracker],
	);

	return (
		<div className="flex-1">
			<InspectorSubLabel>Corner Radius</InspectorSubLabel>
			<NumberControl
				label={
					<div className="flex items-center gap-1">
						<RoundnessIcon />
					</div>
				}
				setValue={onRadius}
				value={borderRadius}
				min={0}
				max={null}
				step={1}
				accessibilityLabel="Corner radius"
			/>
		</div>
	);
};

export const BorderRadiusControl = memo(BorderRadiusControlUnmemoized);
