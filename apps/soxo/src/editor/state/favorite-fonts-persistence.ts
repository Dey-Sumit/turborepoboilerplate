const key = 'remotion-editor-starter.favorite-fonts';

export const DEFAULT_FAVORITE_FONTS: string[] = [];

export const loadFavoriteFonts = (): string[] => {
	if (typeof localStorage === 'undefined') {
		return DEFAULT_FAVORITE_FONTS;
	}

	const value = localStorage.getItem(key);
	if (value === null) {
		return DEFAULT_FAVORITE_FONTS;
	}

	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) {
			return parsed;
		}
		return DEFAULT_FAVORITE_FONTS;
	} catch {
		return DEFAULT_FAVORITE_FONTS;
	}
};

export const saveFavoriteFonts = (fonts: string[]) => {
	localStorage.setItem(key, JSON.stringify(fonts));
};
