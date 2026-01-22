import React, {memo, useCallback, useMemo} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {
	updateCropBottom,
	updateCropLeft,
	updateCropRight,
	updateCropTop,
} from '../state/actions/item-cropping';
import {getCurrentItems} from '../state/helpers/get-current-timeline';
import {useCanvasTransformationScale} from '../utils/canvas-transformation-context';
import {clamp} from '../utils/clamp';
import {getCropFromItem} from '../utils/get-crop-from-item';
import {getRectAfterCrop} from '../utils/get-dimensions-after-crop';
import {isLeftClick} from '../utils/is-left-click';
import {useItem} from '../utils/use-context';

const CROP_HANDLE_THICKNESS = 5;
const CROP_HANDLE_LENGTH = 20;

type CropType =
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right'
	| 'top'
	| 'right'
	| 'bottom'
	| 'left';

const CropHandleUnmemoized: React.FC<{
	type: CropType;
	itemId: string;
}> = ({type, itemId}) => {
	const scale = useCanvasTransformationScale();
	const item = useItem(itemId);
	const rectAfterCrop = useMemo(() => getRectAfterCrop(item), [item]);

	const thickness = Math.round(CROP_HANDLE_THICKNESS / scale);
	const length = Math.min(
		Math.round(CROP_HANDLE_LENGTH / scale),
		rectAfterCrop.height / 4,
		rectAfterCrop.width / 4,
	);

	const style: React.CSSProperties = useMemo(() => {
		const baseStyle: React.CSSProperties = {
			position: 'absolute',
			pointerEvents: 'auto',
		};

		const borderStyle = `${thickness}px solid var(--color-editor-starter-accent)`;

		// Corner handles - L-shaped using borders
		if (type === 'top-left') {
			return {
				...baseStyle,
				left: 0,
				top: 0,
				width: length,
				height: length,
				borderLeft: borderStyle,
				borderTop: borderStyle,
				cursor: 'nwse-resize',
			};
		}
		if (type === 'top-right') {
			return {
				...baseStyle,
				right: 0,
				top: 0,
				width: length,
				height: length,
				borderRight: borderStyle,
				borderTop: borderStyle,
				cursor: 'nesw-resize',
			};
		}
		if (type === 'bottom-left') {
			return {
				...baseStyle,
				left: 0,
				bottom: 0,
				width: length,
				height: length,
				borderLeft: borderStyle,
				borderBottom: borderStyle,
				cursor: 'nesw-resize',
			};
		}
		if (type === 'bottom-right') {
			return {
				...baseStyle,
				right: 0,
				bottom: 0,
				width: length,
				height: length,
				borderRight: borderStyle,
				borderBottom: borderStyle,
				cursor: 'nwse-resize',
			};
		}

		// Edge handles - single bars
		if (type === 'top') {
			return {
				...baseStyle,
				left: rectAfterCrop.width / 2 - length / 2,
				top: 0,
				width: length,
				height: 0,
				borderTop: borderStyle,
				cursor: 'ns-resize',
			};
		}
		if (type === 'bottom') {
			return {
				...baseStyle,
				left: rectAfterCrop.width / 2 - length / 2,
				bottom: 0,
				width: length,
				height: 0,
				borderBottom: borderStyle,
				cursor: 'ns-resize',
			};
		}
		if (type === 'left') {
			return {
				...baseStyle,
				left: 0,
				top: rectAfterCrop.height / 2 - length / 2,
				width: 0,
				height: length,
				borderLeft: borderStyle,
				cursor: 'ew-resize',
			};
		}
		if (type === 'right') {
			return {
				...baseStyle,
				right: 0,
				top: rectAfterCrop.height / 2 - length / 2,
				width: 0,
				height: length,
				borderRight: borderStyle,
				cursor: 'ew-resize',
			};
		}

		throw new Error(`Unknown type: ${JSON.stringify(type satisfies never)}`);
	}, [thickness, length, type, rectAfterCrop.width, rectAfterCrop.height]);

	const setState = useEditorStore((state) => state.setState);

	const onPointerDown = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!isLeftClick(e)) {
				return;
			}

			const initialX = e.clientX;
			const initialY = e.clientY;

			// Get item from current timeline context (could be inside a composite)
			const currentItems = getCurrentItems(useEditorStore.getState());
			const initialItem = currentItems[itemId];

			const initialCrop = getCropFromItem(initialItem);
			if (!initialCrop) {
				throw new Error('Item cannot be cropped');
			}

			const initialCropLeft = initialCrop.cropLeft;
			const initialCropTop = initialCrop.cropTop;
			const initialCropRight = initialCrop.cropRight;
			const initialCropBottom = initialCrop.cropBottom;
			const initialWidth = initialItem.width;
			const initialHeight = initialItem.height;

			let isCropActive = false;

			const performCropUpdate = (
				offsetX: number,
				offsetY: number,
			): void => {
				setState((state) => {
					if (
						type === 'left' ||
						type === 'bottom-left' ||
						type === 'top-left'
					) {
						const x = offsetX / initialWidth;
						const newCropLeft = clamp({
							min: 0,
							// Total crop per direction must leave at least 1px of the original item visible
							max: 1 - initialCropRight - 1 / initialWidth,
							value: initialCropLeft + x,
						});

						updateCropLeft({
							state,
							itemId,
							cropLeft: newCropLeft,
						});
					}

					if (type === 'top' || type === 'top-left' || type === 'top-right') {
						const y = offsetY / initialHeight;
						const newCropTop = clamp({
							min: 0,
							max: 1 - initialCropBottom - 1 / initialHeight,
							value: initialCropTop + y,
						});
						updateCropTop({
							state,
							itemId,
							cropTop: newCropTop,
						});
					}

					if (
						type === 'right' ||
						type === 'bottom-right' ||
						type === 'top-right'
					) {
						const x = offsetX / initialWidth;
						const newCropRight = clamp({
							min: 0,
							max: 1 - initialCropLeft - 1 / initialWidth,
							value: initialCropRight - x,
						});
						updateCropRight({
							state,
							itemId,
							cropRight: newCropRight,
						});
					}

					if (
						type === 'bottom' ||
						type === 'bottom-left' ||
						type === 'bottom-right'
					) {
						const y = offsetY / initialHeight;
						const newCropBottom = clamp({
							min: 0,
							max: 1 - initialCropTop - 1 / initialHeight,
							value: initialCropBottom - y,
						});
						updateCropBottom({
							state,
							itemId,
							cropBottom: newCropBottom,
						});
					}
				});
			};

			const onPointerMove = (pointerMoveEvent: PointerEvent) => {
				const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
				const offsetY = (pointerMoveEvent.clientY - initialY) / scale;

				if (!isCropActive) {
					// FIRST move: execute update (creates undo point), THEN pause
					performCropUpdate(offsetX, offsetY);
					useEditorStore.temporal.getState().pause();
					isCropActive = true;
				} else {
					// Subsequent moves: just update (paused, no undo point)
					performCropUpdate(offsetX, offsetY);
				}
			};

			const onPointerUp = () => {
				if (isCropActive) {
					// End: resume temporal (final state already set from last move)
					useEditorStore.temporal.getState().resume();
					isCropActive = false;
				}

				window.removeEventListener('pointermove', onPointerMove);
			};

			window.addEventListener('pointermove', onPointerMove, {passive: true});
			window.addEventListener('pointerup', onPointerUp, {
				once: true,
			});
		},
		[itemId, scale, setState, type],
	);

	return <div style={style} onPointerDown={onPointerDown}></div>;
};

export const CropHandle = memo(CropHandleUnmemoized);
