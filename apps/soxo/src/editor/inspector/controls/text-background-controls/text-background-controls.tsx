import {useCallback} from 'react';
import {Button} from '../../../../components/ui/button';
import useEditorStore from '../../../../zustand/editor-store';
import {
	FEATURE_TEXT_BACKGROUND_BORDER_RADIUS_CONTROL,
	FEATURE_TEXT_BACKGROUND_HORIZONTAL_PADDING_CONTROL,
} from '../../../flags';
import {TextItem} from '../../../items/text/text-item-type';
import {
	addBackground,
	removeBackground,
} from '../../../state/actions/background';
import {changeItem} from '../../../state/actions/change-item';
import {ColorInspector} from '../../color-inspector';
import {InspectorLabel} from '../../components/inspector-label';
import {CollapsableInspectorSection} from '../../components/inspector-section';
import {BorderRadiusControl} from '../border-radius-controls';
import {BackgroundHorizontalPaddingControl} from './background-horizontal-padding-control';
import {useItemForTransition} from '../../../selectors/hooks';

export const TextBackgroundControls: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const item = useItemForTransition(itemId) as TextItem;
	const setState = useEditorStore((state) => state.setState);

	const onRemoveBackground = useCallback(() => {
		setState((state) => {
			changeItem(state, itemId, (i) => {
				return removeBackground({item: i as TextItem});
			});
		});
	}, [setState, itemId]);

	const onAddBackground = useCallback(() => {
		setState((state) => {
			changeItem(state, itemId, (i) => {
				return addBackground({item: i as TextItem});
			});
		});
	}, [setState, itemId]);

	if (!item) {
		return null;
	}

	return (
		<CollapsableInspectorSection
			summary={<InspectorLabel>Background</InspectorLabel>}
			id={`background-${itemId}`}
			defaultOpen={false}
		>
			{item.background ? (
				<>
					<ColorInspector
						color={item.background.color}
						itemId={itemId}
						colorType="backgroundColor"
						accessibilityLabel="Background color"
					/>
					<div className="flex flex-row gap-2">
						{FEATURE_TEXT_BACKGROUND_BORDER_RADIUS_CONTROL ? (
							<BorderRadiusControl
								borderRadiusType="background"
								itemId={itemId}
							/>
						) : null}
						{FEATURE_TEXT_BACKGROUND_HORIZONTAL_PADDING_CONTROL ? (
							<BackgroundHorizontalPaddingControl
								backgroundHorizontalPadding={
									item.background.horizontalPadding ?? 0
								}
								itemId={itemId}
							/>
						) : null}
					</div>
					<div className="h-2" />
					<Button className="w-full" onClick={onRemoveBackground}>
						Remove background
					</Button>
				</>
			) : (
				<Button className="w-full" onClick={onAddBackground}>
					Add Background
				</Button>
			)}
		</CollapsableInspectorSection>
	);
};
