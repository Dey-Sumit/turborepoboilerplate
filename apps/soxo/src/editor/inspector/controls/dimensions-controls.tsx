import React, {memo, useMemo} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {getAssetFromItem} from '../../assets/utils';
import {FEATURE_KEEP_ASPECT_RATIO_CONTROL} from '../../flags';
import {TextItem} from '../../items/text/text-item-type';
import {
	updateItemHeight,
	updateItemWidth,
} from '../../state/actions/update-item-dimensions';
import {getCurrentItems} from '../../state/helpers/get-current-timeline';
import {
	canKeepAspectRatioMap,
	getKeepAspectRatio,
	getOriginalAspectRatio,
} from '../../utils/aspect-ratio';
import {getRectAfterCrop} from '../../utils/get-dimensions-after-crop';
import {useItemDimensions} from '../../selectors/hooks';
import {InspectorSubLabel} from '../components/inspector-label';
import {CompactTextDimensionsButton} from './compact-text-dimensions-button';
import {ControlsPadding} from './controls-padding';
import {KeepAspectRatioControls} from './keep-aspect-ratio-controls';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';
import {EditorStarterItem} from '../../items/item-type';

const DimensionsControlsUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const setState = useEditorStore((state) => state.setState);
	const dimensions = useItemDimensions(itemId);
	// Get full item only for conditional rendering at the end
	const item = useEditorStore((state) => {
		const items = getCurrentItems(state);
		return items[itemId];
	});

	const rectAfterCrop = useMemo(() => getRectAfterCrop(dimensions as unknown as EditorStarterItem), [dimensions]);

	const onHeight: NumberControlUpdateHandler = React.useCallback(
		({num: _heightAfterCrop, commitToUndoStack: _commitToUndoStack}) => {
			setState((state) => {
				// Get items from current timeline context (could be inside a composite)
				const items = getCurrentItems(state);
				const i = items[itemId];
				if (!i) return;

				const currentRectAfterCrop = getRectAfterCrop(i);
				const diff = i.height - currentRectAfterCrop.height;
				const num = _heightAfterCrop + diff;

				const keepAspectRatio = getKeepAspectRatio(i);
				if (!keepAspectRatio) {
					const updatedItem = updateItemHeight({
						item: i,
						height: num,
						stopTextEditing: true,
					});
					items[itemId] = updatedItem;
					return;
				}

				const asset = getAssetFromItem({
					item: i,
					assets: state.compositionState.assets,
				});
				const aspectRatio = getOriginalAspectRatio({item: i, asset});
				const newWidth = Math.round(num * aspectRatio);

				let updatedItem = updateItemHeight({
					item: i,
					height: num,
					stopTextEditing: true,
				});
				updatedItem = updateItemWidth({
					item: updatedItem,
					width: newWidth,
					stopTextEditing: true,
				});
				items[itemId] = updatedItem;
			});
		},
		[setState, itemId],
	);

	const onWidth: NumberControlUpdateHandler = React.useCallback(
		({num: _widthAfterCrop, commitToUndoStack: _commitToUndoStack}) => {
			setState((state) => {
				// Get items from current timeline context (could be inside a composite)
				const items = getCurrentItems(state);
				const i = items[itemId];
				if (!i) return;

				const currentRectAfterCrop = getRectAfterCrop(i);
				const diff = i.width - currentRectAfterCrop.width;
				const num = _widthAfterCrop + diff;

				const keepAspectRatio = getKeepAspectRatio(i);
				if (!keepAspectRatio) {
					const updatedItem = updateItemWidth({
						item: i,
						width: num,
						stopTextEditing: true,
					});
					items[itemId] = updatedItem;
					return;
				}

				const asset = getAssetFromItem({
					item: i,
					assets: state.compositionState.assets,
				});
				const aspectRatio = getOriginalAspectRatio({item: i, asset});
				const newHeight = Math.round(num / aspectRatio);

				let updatedItem = updateItemWidth({
					item: i,
					width: num,
					stopTextEditing: true,
				});
				updatedItem = updateItemHeight({
					item: updatedItem,
					height: newHeight,
					stopTextEditing: true,
				});
				items[itemId] = updatedItem;
			});
		},
		[setState, itemId],
	);

	return (
		<div>
			<InspectorSubLabel>Dimensions</InspectorSubLabel>
			<div className="flex w-full flex-row gap-2">
				<div className="flex-1">
					<NumberControl
						label="W"
						setValue={onWidth}
						value={Math.floor(rectAfterCrop.width)}
						min={1}
						max={null}
						step={1}
						accessibilityLabel="Width"
					/>
				</div>
				<div className="flex-1">
					<NumberControl
						label="H"
						setValue={onHeight}
						value={Math.floor(rectAfterCrop.height)}
						min={1}
						max={null}
						step={1}
						accessibilityLabel="Height"
					/>
				</div>
				{item.type === 'text' ? (
					<CompactTextDimensionsButton item={item as TextItem} />
				) : FEATURE_KEEP_ASPECT_RATIO_CONTROL &&
				  canKeepAspectRatioMap[item.type] ? (
					<KeepAspectRatioControls
						keepAspectRatio={getKeepAspectRatio(item)}
						itemId={itemId}
					/>
				) : (
					<ControlsPadding />
				)}
			</div>
		</div>
	);
};

export const DimensionsControls = memo(DimensionsControlsUnmemoized);
