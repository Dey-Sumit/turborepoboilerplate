import React, {memo, useCallback} from 'react';
import {Slider} from '../../../components/ui/slider';
import useEditorStore from '../../../zustand/editor-store';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import {ColorInspector} from '../color-inspector';
import {InspectorSubLabel} from '../components/inspector-label';

const undoTrackerOpacity = createContinuousUpdateTracker();
const undoTrackerPadding = createContinuousUpdateTracker();
const undoTrackerRadius = createContinuousUpdateTracker();

const CaptionBackgroundControlsUnmemoized: React.FC<{
	itemId: string;
	backgroundEnabled: boolean;
	backgroundColor: string;
	backgroundOpacity: number;
	backgroundPadding: number;
	backgroundBorderRadius: number;
}> = ({
	itemId,
	backgroundEnabled,
	backgroundColor,
	backgroundOpacity,
	backgroundPadding,
	backgroundBorderRadius,
}) => {
	const updateItem = useEditorStore((state) => state.updateItem);

	const toggleBackground = useCallback(() => {
		updateItem(itemId, (i) => {
			if (i.type !== 'captions') return i;
			return {
				...i,
				backgroundEnabled: !backgroundEnabled,
			};
		});
	}, [updateItem, itemId, backgroundEnabled]);

	const handleOpacityChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'captions') return i;
					return {
						...i,
						backgroundOpacity: value,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerOpacity.endTracking(performUpdate);
			} else {
				if (!undoTrackerOpacity.isTracking()) {
					undoTrackerOpacity.startTracking(performUpdate);
				} else {
					undoTrackerOpacity.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handlePaddingChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'captions') return i;
					return {
						...i,
						backgroundPadding: value,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerPadding.endTracking(performUpdate);
			} else {
				if (!undoTrackerPadding.isTracking()) {
					undoTrackerPadding.startTracking(performUpdate);
				} else {
					undoTrackerPadding.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handleRadiusChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'captions') return i;
					return {
						...i,
						backgroundBorderRadius: value,
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerRadius.endTracking(performUpdate);
			} else {
				if (!undoTrackerRadius.isTracking()) {
					undoTrackerRadius.startTracking(performUpdate);
				} else {
					undoTrackerRadius.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	return (
		<div className="flex flex-col gap-3">
			{/* Toggle Background */}
			<div className="flex items-center justify-between">
				<InspectorSubLabel>Background Box</InspectorSubLabel>
				<button
					onClick={toggleBackground}
					className={`h-6 w-11 rounded-full transition-colors ${
						backgroundEnabled
							? 'bg-blue-600'
							: 'bg-neutral-700'
					}`}
				>
					<div
						className={`h-5 w-5 rounded-full bg-white transition-transform ${
							backgroundEnabled ? 'translate-x-6' : 'translate-x-0.5'
						}`}
					/>
				</button>
			</div>

			{backgroundEnabled && (
				<>
					{/* Background Color */}
					<ColorInspector
						color={backgroundColor}
						itemId={itemId}
						colorType="backgroundColor"
						accessibilityLabel="Background color"
					/>

					{/* Background Opacity */}
					<div>
						<InspectorSubLabel>Opacity</InspectorSubLabel>
						<div className="flex w-full items-center gap-3">
							<Slider
								value={backgroundOpacity}
								//@ts-expect-error : type mismatch
								onValueChange={handleOpacityChange}
								min={0}
								max={1}
								step={0.01}
								className="flex-1"
								title={`Opacity: ${Math.round(backgroundOpacity * 100)}%`}
							/>
							<div className="min-w-[32px] text-right text-xs text-white/75">
								{Math.round(backgroundOpacity * 100)}%
							</div>
						</div>
					</div>

					{/* Background Padding */}
					<div>
						<InspectorSubLabel>Padding</InspectorSubLabel>
						<div className="flex w-full items-center gap-3">
							<Slider
								value={backgroundPadding}
								//@ts-expect-error : type mismatch
								onValueChange={handlePaddingChange}
								min={0}
								max={32}
								step={1}
								className="flex-1"
								title={`Padding: ${backgroundPadding}px`}
							/>
							<div className="min-w-[32px] text-right text-xs text-white/75">
								{backgroundPadding}px
							</div>
						</div>
					</div>

					{/* Border Radius */}
					<div>
						<InspectorSubLabel>Border Radius</InspectorSubLabel>
						<div className="flex w-full items-center gap-3">
							<Slider
								value={backgroundBorderRadius}
								//@ts-expect-error : type mismatch
								onValueChange={handleRadiusChange}
								min={0}
								max={24}
								step={1}
								className="flex-1"
								title={`Radius: ${backgroundBorderRadius}px`}
							/>
							<div className="min-w-[32px] text-right text-xs text-white/75">
								{backgroundBorderRadius}px
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export const CaptionBackgroundControls = memo(
	CaptionBackgroundControlsUnmemoized,
);
