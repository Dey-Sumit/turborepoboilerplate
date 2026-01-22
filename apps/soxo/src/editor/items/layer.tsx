import React, {useMemo} from 'react';
import {FEATURE_CROP_BACKGROUNDS} from '../flags';
import {useItem, useItemSelectedForCrop} from '../utils/use-context';
import {InnerLayer} from './inner-layer';

export const Layer: React.FC<{
	itemId: string;
	trackMuted: boolean;
	previousItemId?: string;
}> = ({itemId, trackMuted, previousItemId}) => {
	const item = useItem(itemId);
	const itemSelectedForCrop = useItemSelectedForCrop();
	const itemIsBeingCropped = item.id === itemSelectedForCrop;

	const sequenceStyle: React.CSSProperties = useMemo(
		() => ({
			display: 'contents',
		}),
		[],
	);

	return (
		<div style={sequenceStyle}>
			{itemIsBeingCropped && FEATURE_CROP_BACKGROUNDS ? (
				// https://www.remotion.dev/docs/editor-starter/cropping#crop-backgrounds
				<InnerLayer
					cropBackground={true}
					item={item}
					trackMuted
					previousItemId={previousItemId}
				/>
			) : null}
			<InnerLayer
				cropBackground={false}
				item={item}
				trackMuted={trackMuted}
				previousItemId={previousItemId}
			/>
		</div>
	);
};
