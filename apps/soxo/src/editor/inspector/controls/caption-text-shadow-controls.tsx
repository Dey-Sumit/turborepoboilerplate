import React, {memo, useCallback} from 'react';
import {Slider} from '../../../components/ui/slider';
import useEditorStore from '../../../zustand/editor-store';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import {ColorInspector} from '../color-inspector';
import {InspectorSubLabel} from '../components/inspector-label';

const undoTrackerOffsetX = createContinuousUpdateTracker();
const undoTrackerOffsetY = createContinuousUpdateTracker();
const undoTrackerBlur = createContinuousUpdateTracker();

const CaptionTextShadowControlsUnmemoized: React.FC<{
	itemId: string;
	textShadowEnabled: boolean;
	textShadowColor: string;
	textShadowOffsetX: number;
	textShadowOffsetY: number;
	textShadowBlur: number;
}> = ({
	itemId,
	textShadowEnabled,
	textShadowColor,
	textShadowOffsetX,
	textShadowOffsetY,
	textShadowBlur,
}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const toggleTextShadow = useCallback(() => {
		updateItem(itemId, (i) => {
			if (i.type !== 'captions') return i;
			return {
				...i,
				textShadowEnabled: !textShadowEnabled,
			};
		});
	}, [updateItem, itemId, textShadowEnabled]);

	const handleOffsetXChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'captions') return i;
					return {
						...i,
						textShadowOffsetX: value,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerOffsetX.endTracking(performUpdate);
			} else {
				if (!undoTrackerOffsetX.isTracking()) {
					undoTrackerOffsetX.startTracking(performUpdate);
				} else {
					undoTrackerOffsetX.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handleOffsetYChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'captions') return i;
					return {
						...i,
						textShadowOffsetY: value,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerOffsetY.endTracking(performUpdate);
			} else {
				if (!undoTrackerOffsetY.isTracking()) {
					undoTrackerOffsetY.startTracking(performUpdate);
				} else {
					undoTrackerOffsetY.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handleBlurChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'captions') return i;
					return {
						...i,
						textShadowBlur: value,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerBlur.endTracking(performUpdate);
			} else {
				if (!undoTrackerBlur.isTracking()) {
					undoTrackerBlur.startTracking(performUpdate);
				} else {
					undoTrackerBlur.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	return (
		<div className="flex flex-col gap-3">
			{/* Toggle Text Shadow */}
			<div className="flex items-center justify-between">
				<InspectorSubLabel>Text Shadow</InspectorSubLabel>
				<button
					onClick={toggleTextShadow}
					className={`h-6 w-11 rounded-full transition-colors ${
						textShadowEnabled ? 'bg-blue-600' : 'bg-neutral-700'
					}`}
				>
					<div
						className={`h-5 w-5 rounded-full bg-white transition-transform ${
							textShadowEnabled ? 'translate-x-6' : 'translate-x-0.5'
						}`}
					/>
				</button>
			</div>

			{textShadowEnabled && (
				<>
					{/* Shadow Color */}
					<ColorInspector
						color={textShadowColor}
						itemId={itemId}
						colorType="textShadowColor"
						accessibilityLabel="Shadow color"
					/>

					{/* Offset X */}
					<div>
						<InspectorSubLabel>Horizontal Offset</InspectorSubLabel>
						<div className="flex w-full items-center gap-3">
							<Slider
								value={textShadowOffsetX}
								//@ts-expect-error : type mismatch
								onValueChange={handleOffsetXChange}
								min={-20}
								max={20}
								step={1}
								className="flex-1"
								title={`Offset X: ${textShadowOffsetX}px`}
							/>
							<div className="min-w-[32px] text-right text-xs text-white/75">
								{textShadowOffsetX}px
							</div>
						</div>
					</div>

					{/* Offset Y */}
					<div>
						<InspectorSubLabel>Vertical Offset</InspectorSubLabel>
						<div className="flex w-full items-center gap-3">
							<Slider
								value={textShadowOffsetY}
								//@ts-expect-error : type mismatch
								onValueChange={handleOffsetYChange}
								min={-20}
								max={20}
								step={1}
								className="flex-1"
								title={`Offset Y: ${textShadowOffsetY}px`}
							/>
							<div className="min-w-[32px] text-right text-xs text-white/75">
								{textShadowOffsetY}px
							</div>
						</div>
					</div>

					{/* Blur */}
					<div>
						<InspectorSubLabel>Blur</InspectorSubLabel>
						<div className="flex w-full items-center gap-3">
							<Slider
								value={textShadowBlur}
								//@ts-expect-error : type mismatch
								onValueChange={handleBlurChange}
								min={0}
								max={20}
								step={1}
								className="flex-1"
								title={`Blur: ${textShadowBlur}px`}
							/>
							<div className="min-w-[32px] text-right text-xs text-white/75">
								{textShadowBlur}px
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export const CaptionTextShadowControls = memo(
	CaptionTextShadowControlsUnmemoized,
);
