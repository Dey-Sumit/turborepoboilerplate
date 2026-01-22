import {useMemo} from 'react';
import {FEATURE_CROP_BACKGROUNDS} from '../flags';
import {getCropFromItem} from '../utils/get-crop-from-item';
import {getRectAfterCrop} from '../utils/get-dimensions-after-crop';
import {useItemSelectedForCrop} from '../utils/use-context';
import {EditorStarterItem} from './item-type';

export const useCroppableLayer = ({
	item,
	rotation,
	opacity,
	borderRadius,
	cropBackground,
	cssStyles = {},
}: {
	item: EditorStarterItem;
	rotation: number;
	opacity: number;
	borderRadius: number;
	cropBackground: boolean;
	cssStyles?: React.CSSProperties;
}) => {
	const itemSelectedForCrop = useItemSelectedForCrop();
	const itemIsBeingCropped = item.id === itemSelectedForCrop;

	const rectAfterCrop = useMemo(() => {
		if (cropBackground) {
			return {
				left: item.left,
				top: item.top,
				width: item.width,
				height: item.height,
			};
		}

		return getRectAfterCrop(item);
	}, [item, cropBackground]);
	const crop = useMemo(() => getCropFromItem(item), [item]);

	if (!crop) {
		throw new Error('Crop not implemented for this item type');
	}

	const innerStyle: React.CSSProperties = useMemo(() => {
		return {
			width: item.width,
			left: cropBackground ? 0 : -(crop.cropLeft * item.width),
			top: cropBackground ? 0 : -(crop.cropTop * item.height),
			height: item.height,
			position: 'absolute',
			objectFit: 'cover',
			maxWidth: 'unset',
		};
	}, [crop.cropLeft, crop.cropTop, item.height, item.width, cropBackground]);

	const outerStyle: React.CSSProperties = useMemo(() => {
		return {
			position: 'absolute',
			left: rectAfterCrop.left,
			top: rectAfterCrop.top,
			transform: `rotate(${rotation}deg)`,
			// https://www.remotion.dev/docs/editor-starter/cropping#crop-backgrounds
			opacity: cropBackground
				? 0.3
				: itemIsBeingCropped && FEATURE_CROP_BACKGROUNDS
					? 1
					: opacity,
			overflow: 'hidden',
			width: rectAfterCrop.width,
			height: rectAfterCrop.height,
			borderRadius: cropBackground ? 0 : borderRadius,
			// Apply custom CSS styles, but don't override critical positioning properties
			...cssStyles,
		};
	}, [
		borderRadius,
		rotation,
		opacity,
		rectAfterCrop.height,
		rectAfterCrop.left,
		rectAfterCrop.top,
		rectAfterCrop.width,
		itemIsBeingCropped,
		cropBackground,
		cssStyles,
	]);

	return useMemo(() => {
		return {
			innerStyle,
			outerStyle,
		};
	}, [innerStyle, outerStyle]);
};
