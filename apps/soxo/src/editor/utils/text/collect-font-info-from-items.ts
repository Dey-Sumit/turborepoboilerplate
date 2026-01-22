import {FontInfo} from '@remotion/google-fonts/index';
import {GOOGLE_FONTS_DATABASE} from '../../data/google-fonts';
import {EditorStarterItem} from '../../items/item-type';
import {getAllItemsInHierarchy} from '../../state/helpers/get-current-timeline';

export const collectFontInfoFromItems = (items: EditorStarterItem[]) => {
	const fontInfos: Record<string, FontInfo> = {};

	// Build a record from the items array to use with getAllItemsInHierarchy
	const itemsRecord: Record<string, EditorStarterItem> = {};
	for (const item of items) {
		itemsRecord[item.id] = item;
	}

	// Get all items including those nested inside composites
	const allItems = getAllItemsInHierarchy(itemsRecord);

	for (const item of allItems) {
		if (item.type === 'text' || item.type === 'captions') {
			const info = GOOGLE_FONTS_DATABASE.find(
				(font) => font.fontFamily === item.fontFamily,
			);
			if (!info) {
				throw new Error(`Font ${item.fontFamily} not found`);
			}

			fontInfos[item.fontFamily] = info;
		} else if (
			// Type safety check, add item types here that don't have text here
			item.type === 'audio' ||
			item.type === 'gif' ||
			item.type === 'image' ||
			item.type === 'solid' ||
			item.type === 'video' ||
			item.type === 'composite' ||
			item.type === 'code'
		) {
			continue;
		} else {
			throw new Error('Invalid item type: ' + (item ));
		}
	}

	return fontInfos;
};
