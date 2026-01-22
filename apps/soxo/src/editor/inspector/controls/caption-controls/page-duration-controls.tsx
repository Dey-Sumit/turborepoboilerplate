import React from 'react';
import useEditorStore from '../../../../zustand/editor-store';
import {ClockIcon} from '../../../icons/clock';
import {updatePageDurationInMillseconds} from '../../../state/actions/update-page-duration';
import {InspectorSubLabel} from '../../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from '../number-controls';

const PageDurationControlsUnmemoized: React.FC<{
	itemId: string;
	pageDurationInMilliseconds: number;
}> = ({pageDurationInMilliseconds, itemId}) => {
	const setState = useEditorStore((state) => state.setState);

	const onPageDurationInMilliseconds: NumberControlUpdateHandler =
		React.useCallback(
			({num, commitToUndoStack}) => {
				const temporalState = useEditorStore.temporal.getState();

				if (!commitToUndoStack) {
					temporalState.pause();
				}

				setState((state) => {
					const item = state.compositionState.items[itemId];
					if (item) {
						updatePageDurationInMillseconds({
							item,
							pageDurationInMilliseconds: num,
						});
					}
				});

				if (!commitToUndoStack) {
					temporalState.resume();
				}
			},
			[setState, itemId],
		);

	return (
		<div>
			<InspectorSubLabel>Page duration (ms)</InspectorSubLabel>
			<div className="flex w-full flex-row gap-2">
				<div className="flex-1">
					<NumberControl
						label={
							<div className="flex items-center gap-1">
								<ClockIcon className="size-3" />
							</div>
						}
						setValue={onPageDurationInMilliseconds}
						value={pageDurationInMilliseconds}
						min={200}
						max={null}
						step={100}
						accessibilityLabel="Page duration"
					/>
				</div>
			</div>
		</div>
	);
};

export const PageDurationControls = React.memo(PageDurationControlsUnmemoized);
