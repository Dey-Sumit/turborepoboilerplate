import React, {useCallback, useRef} from 'react';
import useEditorStore, {useDurationInFrames} from '../../zustand/editor-store';
import {
	FEATURE_RENDERING,
	FEATURE_SWAP_COMPOSITION_DIMENSIONS_BUTTON,
} from '../flags';
import {RotateRight} from '../icons/rotate-right';
import {RenderControls} from '../rendering/render-controls';
import {renderFrame} from '../utils/render-frame';
import {useDimensions, useFps} from '../utils/use-context';
import {InspectorIconButton} from './components/inspector-icon-button';
import {InspectorLabel, InspectorSubLabel} from './components/inspector-label';
import {
	InspectorDivider,
	InspectorSection,
} from './components/inspector-section';
import {BackgroundStylePresets} from './controls/background-style-presets';
import {
	NumberControl,
	NumberControlUpdateHandler,
} from './controls/number-controls';

export const CompositionInspector: React.FC = () => {
	const durationInFrames = useDurationInFrames();
	const {fps} = useFps();
	const {compositionWidth, compositionHeight} = useDimensions();
	const setState = useEditorStore((state) => state.setState);
	const compositionRootStyles = useEditorStore(
		(state) => state.compositionState.compositionRootStyles,
	);
	const commitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pendingCommitRef = useRef<(() => void) | null>(null);

	const swapDimensions = React.useCallback(() => {
		setState((state) => {
			if (
				state.compositionState.compositionWidth ===
				state.compositionState.compositionHeight
			) {
				return;
			}

			const temp = state.compositionState.compositionWidth;
			state.compositionState.compositionWidth =
				state.compositionState.compositionHeight;
			state.compositionState.compositionHeight = temp;
		});
	}, [setState]);

	const setCompositionHeight: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			if (!commitToUndoStack) {
				const temporalState = useEditorStore.temporal.getState();
				temporalState.pause();
			}

			setState((state) => {
				if (num === state.compositionState.compositionHeight) {
					return;
				}

				state.compositionState.compositionHeight = num;
			});

			if (!commitToUndoStack) {
				const temporalState = useEditorStore.temporal.getState();
				temporalState.resume();
			}
		},
		[setState],
	);

	const setCompositionWidth: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			if (!commitToUndoStack) {
				const temporalState = useEditorStore.temporal.getState();
				temporalState.pause();
			}

			setState((state) => {
				if (num === state.compositionState.compositionWidth) {
					return;
				}

				state.compositionState.compositionWidth = num;
			});

			if (!commitToUndoStack) {
				const temporalState = useEditorStore.temporal.getState();
				temporalState.resume();
			}
		},
		[setState],
	);

	const handleBackgroundColorChange = useCallback(
		(evt: React.ChangeEvent<HTMLInputElement>) => {
			const newColor = evt.target.value;

			// Pause undo tracking for intermediate updates
			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();

			setState((state) => {
				if (!state.compositionState.compositionRootStyles) {
					state.compositionState.compositionRootStyles = {};
				}
				state.compositionState.compositionRootStyles = {
					...state.compositionState.compositionRootStyles,
					backgroundColor: newColor,
				};
			});

			if (commitTimeoutRef.current) {
				clearTimeout(commitTimeoutRef.current);
			}

			const commit = () => {
				temporalState.resume();
				pendingCommitRef.current = null;
			};

			pendingCommitRef.current = commit;

			commitTimeoutRef.current = setTimeout(() => {
				commit();
				commitTimeoutRef.current = null;
			}, 200);
		},
		[setState],
	);

	React.useEffect(() => {
		return () => {
			if (commitTimeoutRef.current) {
				clearTimeout(commitTimeoutRef.current);
				if (pendingCommitRef.current) {
					pendingCommitRef.current();
				}
			}
		};
	}, []);

	const backgroundColor = compositionRootStyles?.backgroundColor ?? '#000000';

	return (
		<div>
			<InspectorSection>
				<InspectorLabel>Canvas</InspectorLabel>
				<div className="h-2"></div>
				<div className="flex flex-row gap-2">
					<div className="flex flex-1">
						<NumberControl
							label="W"
							setValue={setCompositionWidth}
							value={compositionWidth}
							min={2}
							max={null}
							step={2}
							accessibilityLabel="Width"
						/>
					</div>
					<div className="flex flex-1">
						<NumberControl
							label="H"
							setValue={setCompositionHeight}
							value={compositionHeight}
							min={2}
							max={null}
							step={2}
							accessibilityLabel="Height"
						/>
					</div>
					{FEATURE_SWAP_COMPOSITION_DIMENSIONS_BUTTON && (
						<div className="editor-starter-field hover:border-transparent">
							<InspectorIconButton
								className="flex h-full w-8 flex-1 items-center justify-center"
								onClick={swapDimensions}
								aria-label="Swap Dimensions"
							>
								<RotateRight height={12} width={12}></RotateRight>
							</InspectorIconButton>
						</div>
					)}
				</div>
			</InspectorSection>
			<InspectorDivider />
			<InspectorSection>
				<InspectorLabel>Duration</InspectorLabel>
				<div className="h-2"></div>
				<div className="text-xs text-neutral-300">
					{renderFrame(durationInFrames, fps)}
				</div>
			</InspectorSection>
			<InspectorDivider />
			<InspectorSection>
				<InspectorLabel>Background</InspectorLabel>
				<div className="h-2"></div>
				<BackgroundStylePresets />
				<div className="h-3"></div>
				<div className="w-full">
					<InspectorSubLabel>Custom Color</InspectorSubLabel>
					<input
						type="color"
						value={backgroundColor}
						onChange={handleBackgroundColorChange}
						className="editor-starter-focus-ring w-full"
						aria-label="Background color"
					/>
				</div>
			</InspectorSection>
			<InspectorDivider />
			{FEATURE_RENDERING ? <RenderControls /> : null}
		</div>
	);
};
