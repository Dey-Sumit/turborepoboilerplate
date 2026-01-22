import {PlayerRef} from '@remotion/player';
import {useCallback, useContext} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import useEditorStore from '../../zustand/editor-store';
import useUIStore, {useSetEditMode} from '../../zustand/ui-store';
import {PreviewSizeContext} from '../preview-size';
import {addItem} from '../state/actions/add-item';
import {byDefaultKeepAspectRatioMap} from '../utils/aspect-ratio';
import {calculateScale} from '../utils/calculate-canvas-transformation';
import {generateRandomId} from '../utils/generate-random-id';
import {CanvasSizeContext} from './canvas-size';

const SHAPE_DURATION_IN_FRAMES = 90;

export const SolidDrawingTool: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const setState = useEditorStore((state) => state.setState);
	const updateItem = useEditorStore((state) => state.updateItem);

	const {width, height} = useVideoConfig();
	const {size} = useContext(PreviewSizeContext);
	const setEditMode = useSetEditMode();
	const canvasSize = useContext(CanvasSizeContext);

	const onPointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			event.preventDefault();
			event.stopPropagation();

			if (!canvasSize) {
				throw new Error('Could not find canvas size');
			}

			const scale = calculateScale({
				canvasSize: canvasSize,
				compositionWidth: width,
				compositionHeight: height,
				previewSize: size.size,
			});

			const container = playerRef.current?.getContainerNode();
			if (!container) {
				throw new Error('Could not find container');
			}
			const containerLeft = container.getBoundingClientRect().left;
			const containerTop = container.getBoundingClientRect().top;

			const xOnCanvas = (event.clientX - containerLeft) / scale;
			const yOnCanvas = (event.clientY - containerTop) / scale;

			const id = generateRandomId('solid');

			const top = yOnCanvas;
			const left = xOnCanvas;

			let added = false;
			let wasModified = false;
			const addIfNotYetAdded = () => {
				if (added) {
					return;
				}

				setState((state) => {
					addItem({
						state,
						item: {
							type: 'solid',
							color: '#ffffff',
							durationInFrames: SHAPE_DURATION_IN_FRAMES,
							from: playerRef.current?.getCurrentFrame() ?? 0,
							top: Math.round(top),
							left: Math.round(left),
							width: 100,
							height: 100,
							isDraggingInTimeline: false,
							id,
							opacity: 1,
							borderRadius: 0,
							rotation: 0,
							keepAspectRatio: byDefaultKeepAspectRatioMap.solid,
							fadeInDurationInSeconds: 0,
							fadeOutDurationInSeconds: 0,
							transition: {
								toNext: undefined,
								toPrev: undefined,
							},
						},
						position: {type: 'front'},
					});
				});
				// Select outside setState
				useUIStore.getState().setSelectedItems([id]);

				added = true;
			};

			const onPointerMove = (evt: PointerEvent) => {
				addIfNotYetAdded();

				if (!wasModified) {
					// Pause undo tracking for continuous updates
					const temporalState = useEditorStore.temporal.getState();
					temporalState.pause();
					wasModified = true;
				}

				const containerNode = playerRef.current?.getContainerNode();
				if (!containerNode) {
					throw new Error('Could not find container');
				}
				const newContainerLeft = containerNode.getBoundingClientRect().left;
				const newContainerTop = containerNode.getBoundingClientRect().top;
				let newWidth = Math.round(
					(evt.clientX - newContainerLeft) / scale - xOnCanvas,
				);
				let newHeight = Math.round(
					(evt.clientY - newContainerTop) / scale - yOnCanvas,
				);

				updateItem(id, (item) => {
					let leftToApply = left;
					let topToApply = top;
					if (newWidth < 0) {
						leftToApply = left + newWidth;
					} else if (newWidth === 0) {
						newWidth = 1;
					}
					if (newHeight < 0) {
						topToApply = top + newHeight;
					} else if (newHeight === 0) {
						newHeight = 1;
					}

					return {
						...item,
						left: Math.round(leftToApply),
						top: Math.round(topToApply),
						width: Math.abs(newWidth),
						height: Math.abs(newHeight),
					};
				});
			};

			const onPointerUp = () => {
				addIfNotYetAdded();

				if (wasModified) {
					// Resume undo tracking and create single undo point
					const temporalState = useEditorStore.temporal.getState();
					temporalState.resume();
				}

				setEditMode('select');

				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
			};

			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);

			return () => {
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
			};
		},
		[
			canvasSize,
			height,
			playerRef,
			setEditMode,
			setState,
			size.size,
			width,
			updateItem,
		],
	);

	return <AbsoluteFill onPointerDown={onPointerDown}></AbsoluteFill>;
};
