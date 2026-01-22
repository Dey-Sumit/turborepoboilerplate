import {EditorStarterItem} from '../../items/item-type';

// Immer version - mutate item directly
export const updatePageDurationInMillseconds = ({
	item,
	pageDurationInMilliseconds,
}: {
	item: EditorStarterItem;
	pageDurationInMilliseconds: number;
}): void => {
	if (item.type !== 'captions') {
		throw new Error('Item is not a captions');
	}

	if (item.pageDurationInMilliseconds === pageDurationInMilliseconds) {
		return;
	}

	item.pageDurationInMilliseconds = pageDurationInMilliseconds;
};
