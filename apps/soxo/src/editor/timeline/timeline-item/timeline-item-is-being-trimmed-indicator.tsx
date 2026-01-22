import React from 'react';
import {useItemsBeingTrimmed} from '../../../zustand/ui-store';
import {ItemSide} from '../../items/trim-indicator';
import { TimelineItemData } from '../../selectors';

export const TimelineItemIsBeingTrimmedIndicator: React.FC<{
	item: TimelineItemData;
	side: ItemSide;
}> = ({item, side}) => {
	const itemsBeingTrimmed = useItemsBeingTrimmed();

	const isBeingTrimmed = itemsBeingTrimmed.find(
		(trimmedItem) =>
			trimmedItem.itemId === item.id && trimmedItem.side === side,
	);

	const style: React.CSSProperties = React.useMemo(() => {
		return {
			width: 5,
			height: '100%',
			position: 'absolute',
			background: `linear-gradient(to ${side}, transparent, var(--color-editor-starter-accent))`,
			...(side === 'left' ? {left: 0} : {right: 0}),
		};
	}, [side]);

	if (!isBeingTrimmed) {
		return null;
	}

	return <div style={style}></div>;
};
