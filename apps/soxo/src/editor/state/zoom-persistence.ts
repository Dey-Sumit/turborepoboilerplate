import {MIN_TIMELINE_ZOOM} from '../constants';

const key = 'remotion-editor-starter.timeline-zoom';

export const DEFAULT_ZOOM = MIN_TIMELINE_ZOOM;

export const loadZoom = (): number => {
	if (typeof localStorage === 'undefined') {
		return DEFAULT_ZOOM;
	}

	const value = localStorage.getItem(key);
	if (value === null) {
		return DEFAULT_ZOOM;
	}

	const parsed = parseFloat(value);
	if (Number.isNaN(parsed)) {
		return DEFAULT_ZOOM;
	}

	// Ensure zoom is at least MIN_TIMELINE_ZOOM
	return Math.max(parsed, MIN_TIMELINE_ZOOM);
};

export const saveZoom = (value: number) => {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(key, value.toString());
};
