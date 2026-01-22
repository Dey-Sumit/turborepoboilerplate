import {memo, useCallback} from 'react';
import useEditorStore from '../../../../zustand/editor-store';
import {HorizontalPaddingIcon} from '../../../icons/horizontal-padding';
import {changeItem} from '../../../state/actions/change-item';
import {editAndRelayoutText} from '../../../state/actions/edit-and-relayout-text';
import {InspectorSubLabel} from '../../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from '../number-controls';

const BACKGROUND_HORIZONTAL_PADDING_MIN = 0;
const BACKGROUND_HORIZONTAL_PADDING_MAX = 100;
const BACKGROUND_HORIZONTAL_PADDING_STEP = 1;

const BackgroundHorizontalPaddingControlUnmemoized: React.FC<{
	backgroundHorizontalPadding: number;
	itemId: string;
}> = ({backgroundHorizontalPadding, itemId}) => {
	const setState = useEditorStore((state) => state.setState);

	const onBackgroundHorizontalPaddingChange: NumberControlUpdateHandler =
		useCallback(
			({num, commitToUndoStack}) => {
				// Ensure backgroundHorizontalPadding is within reasonable bounds
				const validBackgroundHorizontalPadding = Math.max(
					BACKGROUND_HORIZONTAL_PADDING_MIN,
					Math.min(BACKGROUND_HORIZONTAL_PADDING_MAX, num),
				);

				const temporalState = useEditorStore.temporal.getState();

				if (!commitToUndoStack) {
					temporalState.pause();
				}

				setState((state) => {
					changeItem(state, itemId, (i) => {
						if (i.type === 'text') {
							return editAndRelayoutText(i, () => {
								if (!i.background) {
									throw new Error('Text item has no background');
								}

								if (
									i.background.horizontalPadding ===
									validBackgroundHorizontalPadding
								) {
									return i;
								}

								return {
									...i,
									background: {
										...i.background,
										horizontalPadding: validBackgroundHorizontalPadding,
									},
								};
							});
						}

						throw new Error(
							'Background horizontal padding can only be changed for text items',
						);
					});
				});

				if (!commitToUndoStack) {
					temporalState.resume();
				}
			},
			[setState, itemId],
		);

	return (
		<div className="flex-1">
			<InspectorSubLabel>Horizontal Padding</InspectorSubLabel>
			<NumberControl
				label={
					<div className="flex items-center gap-1">
						<HorizontalPaddingIcon className="size-3" />
					</div>
				}
				setValue={onBackgroundHorizontalPaddingChange}
				value={backgroundHorizontalPadding}
				min={BACKGROUND_HORIZONTAL_PADDING_MIN}
				max={BACKGROUND_HORIZONTAL_PADDING_MAX}
				step={BACKGROUND_HORIZONTAL_PADDING_STEP}
				accessibilityLabel="Background horizontal padding"
			/>
		</div>
	);
};

export const BackgroundHorizontalPaddingControl = memo(
	BackgroundHorizontalPaddingControlUnmemoized,
);
