import {useCallback, useMemo} from 'react';
import {
	forceSpecificCursor,
	stopForcingSpecificCursor,
} from './force-specific-cursor';
import {
	getMaxTimelineHeight,
	getMinTimelineHeight,
} from './state/timeline-height-persistance';
import {clamp} from './utils/clamp';
import {isLeftClick} from './utils/is-left-click';
import {Z_INDEX_TIMELINE_RESIZER} from './z-indices';
import useUIStore from '../zustand/ui-store';

const RESIZER_HEIGHT = 5;

export const TimelineResizer = () => {
	const setTimelineHeight = useUIStore((state) => state.setTimelineHeight);

	const style = useMemo((): React.CSSProperties => {
		return {
			transformOrigin: 'bottom',
			cursor: 'row-resize',
			height: RESIZER_HEIGHT,
			zIndex: Z_INDEX_TIMELINE_RESIZER,
		};
	}, []);

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (!isLeftClick(e)) {
				return;
			}

			const initialY = e.clientY;
			const initialHeight = useUIStore.getState().timelineHeight;

			forceSpecificCursor('row-resize');

			const onPointerMove = (moveEvent: PointerEvent) => {
				const deltaY = initialY - moveEvent.clientY;

				const newTimelineHeight = clamp({
					value: initialHeight + deltaY,
					min: getMinTimelineHeight(),
					max: getMaxTimelineHeight(),
				});

				// setTimelineHeight already persists to localStorage
				setTimelineHeight(newTimelineHeight);
			};

			const onPointerUp = () => {
				window.removeEventListener('pointermove', onPointerMove);
				stopForcingSpecificCursor();
			};

			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp, {once: true});
		},
		[setTimelineHeight],
	);

	return (
		<div className="relative w-full">
			<div
				className="absolute w-full flex-shrink-0 select-none"
				style={style}
				onPointerDown={onPointerDown}
			/>
		</div>
	);
};
