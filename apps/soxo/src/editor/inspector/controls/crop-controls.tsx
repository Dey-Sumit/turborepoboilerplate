import React, {memo, useCallback, useMemo} from 'react';
import {Slider} from '../../../components/ui/slider';
import useEditorStore from '../../../zustand/editor-store';
import {
	updateCropBottom,
	updateCropLeft,
	updateCropRight,
	updateCropTop,
} from '../../state/actions/item-cropping';
import {getCropFromItem} from '../../utils/get-crop-from-item';
import {useItemCrop} from '../../selectors/hooks';
import {InspectorSubLabel} from '../components/inspector-label';
import {EditorStarterItem} from '../../items/item-type';

const CropControlsUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const setState = useEditorStore((state) => state.setState);
	const cropData = useItemCrop(itemId);
	const {width, height} = cropData;
	const crop = useMemo(
		() => getCropFromItem(cropData as EditorStarterItem),
		[cropData],
	);

	if (!crop) {
		throw new Error('Crop controls not supported for this item type');
	}

	const setCropLeft = useCallback(
		(newValue: number) => {
			setState((state) => {
				updateCropLeft({state, itemId, cropLeft: newValue});
			});
		},
		[setState, itemId],
	);

	const setCropTop = useCallback(
		(newValue: number) => {
			setState((state) => {
				updateCropTop({state, itemId, cropTop: newValue});
			});
		},
		[setState, itemId],
	);

	const setCropRight = useCallback(
		(newValue: number) => {
			setState((state) => {
				updateCropRight({state, itemId, cropRight: newValue});
			});
		},
		[setState, itemId],
	);

	const setCropBottom = useCallback(
		(newValue: number) => {
			setState((state) => {
				updateCropBottom({state, itemId, cropBottom: newValue});
			});
		},
		[setState, itemId],
	);

	const handleLeftChange = useCallback(
		(value: number) => {
			const newValue = value / 100;
			setCropLeft(newValue);
		},
		[setCropLeft],
	);

	const handleTopChange = useCallback(
		(value: number) => {
			const newValue = value / 100;
			setCropTop(newValue);
		},
		[setCropTop],
	);

	const handleRightChange = useCallback(
		(value: number) => {
			const newValue = value / 100;
			setCropRight(newValue);
		},
		[setCropRight],
	);

	const handleBottomChange = useCallback(
		(value: number) => {
			const newValue = value / 100;
			setCropBottom(newValue);
		},
		[setCropBottom],
	);

	const leftPercent = Math.max(0, Math.round(crop.cropLeft * 100));
	const topPercent = Math.max(0, Math.round(crop.cropTop * 100));
	const rightPercent = Math.max(0, Math.round(crop.cropRight * 100));
	const bottomPercent = Math.max(0, Math.round(crop.cropBottom * 100));

	return (
		<div className="space-y-2">
			<div>
				<InspectorSubLabel>Left</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={leftPercent}
						//@ts-expect-error : type mismatch
						onValueChange={handleLeftChange}
						min={0}
						max={100}
						step={1}
						className="flex-1"
						title={`Left: ${leftPercent}%`}
					/>
					<div className="min-w-[40px] text-right text-xs text-white/75">
						{Math.max(0, Math.round(crop.cropLeft * width))}px
					</div>
				</div>
			</div>

			<div>
				<InspectorSubLabel>Top</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={topPercent}
						//@ts-expect-error : type mismatch
						onValueChange={handleTopChange}
						min={0}
						max={100}
						step={1}
						className="flex-1"
						title={`Top: ${topPercent}%`}
					/>
					<div className="min-w-[40px] text-right text-xs text-white/75">
						{Math.max(0, Math.round(crop.cropTop * height))}px
					</div>
				</div>
			</div>

			<div>
				<InspectorSubLabel>Right</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={rightPercent}
						//@ts-expect-error : type mismatch
						onValueChange={handleRightChange}
						min={0}
						max={100}
						step={1}
						className="flex-1"
						title={`Right: ${Math.round(crop.cropRight * width)}px`}
					/>
					<div className="min-w-[40px] text-right text-xs text-white/75">
						{Math.max(0, Math.round(crop.cropRight * width))}px
					</div>
				</div>
			</div>

			<div>
				<InspectorSubLabel>Bottom</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={bottomPercent}
						//@ts-expect-error : type mismatch
						onValueChange={handleBottomChange}
						min={0}
						max={100}
						step={1}
						className="flex-1"
						title={`Bottom: ${Math.round(crop.cropBottom * height)}px`}
					/>
					<div className="min-w-[40px] text-right text-xs text-white/75">
						{Math.max(0, Math.round(crop.cropBottom * height))}px
					</div>
				</div>
			</div>
		</div>
	);
};

export const CropControls = memo(CropControlsUnmemoized);
