// MIGRATED TO ZUSTAND UI STORE
// This file now re-exports from ui-store for backwards compatibility
import {useSetZoom, useZoom} from '../../../zustand/ui-store';

export const useTimelineZoom = () => {
	const zoom = useZoom();
	const setZoom = useSetZoom();

	return {zoom, setZoom};
};
