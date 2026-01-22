import {memo, useCallback} from 'react';
import React from 'react';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import useEditorStore from '../../../zustand/editor-store';
import {LineHeightIcon} from '../../icons/line-height';
import {editAndRelayoutText} from '../../state/actions/edit-and-relayout-text';
import {relayoutCaptions} from '../../state/actions/relayout-captions';
import {InspectorSubLabel} from '../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';

const LineHeightControlsUnmemoized: React.FC<{
	lineHeight: number;
	itemId: string;
}> = ({lineHeight, itemId}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const undoTracker = React.useMemo(() => createContinuousUpdateTracker(), []);

	const onLineHeightChange: NumberControlUpdateHandler = useCallback(
		({num, commitToUndoStack}) => {
			const validLineHeight = Math.max(0.1, Math.min(5, num));

			const performUpdate = () => {
				updateItem(itemId, (i) => {
						if (i.type === 'text') {
							return editAndRelayoutText(i, () => {
								if (i.lineHeight === validLineHeight) {
									return i;
								}

								return {
									...i,
									lineHeight: validLineHeight,
								};
							});
						}

						if (i.type === 'captions') {
							if (i.lineHeight === validLineHeight) {
								return i;
							}

							const newItem = {
								...i,
								lineHeight: validLineHeight,
							};

							return relayoutCaptions(newItem);
						}

						throw new Error(
							'Line height can only be changed for text and captions items',
						);
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
			<InspectorSubLabel>Line Height</InspectorSubLabel>
			<NumberControl
				label={
					<div className="flex items-center gap-1">
						<LineHeightIcon className="size-3" />
					</div>
				}
				setValue={onLineHeightChange}
				value={lineHeight}
				min={0.5}
				max={5}
				step={0.1}
				accessibilityLabel="Line height"
			/>
		</div>
	);
};

export const LineHeightControls = memo(LineHeightControlsUnmemoized);
