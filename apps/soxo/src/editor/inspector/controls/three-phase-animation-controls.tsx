import React, {memo, useCallback, useMemo} from 'react';
import {Slider} from '../../../components/ui/slider';
import useEditorStore from '../../../zustand/editor-store';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import {
	AnimatableItemType,
	ENTER_ANIMATION_REGISTRY,
	EMPHASIS_ANIMATION_REGISTRY,
	EXIT_ANIMATION_REGISTRY,
	getEnterAnimationsForItemType,
	getEmphasisAnimationsForItemType,
	getExitAnimationsForItemType,
} from '../../animations/animation-map';
import {
	EnterAnimationType,
	EmphasisAnimationType,
	ExitAnimationType,
	EnterAnimationConfig,
	EmphasisAnimationConfig,
	ExitAnimationConfig,
	ThreePhaseAnimations,
} from '../../items/shared';
import {EditorStarterItem} from '../../items/item-type';
import {InspectorSubLabel} from '../components/inspector-label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from '../components/inspector-section';
import {useItemAnimations} from '../../selectors/hooks';

const undoTrackerEnterDuration = createContinuousUpdateTracker();
const undoTrackerEnterDelay = createContinuousUpdateTracker();
const undoTrackerEmphasisDuration = createContinuousUpdateTracker();
const undoTrackerEmphasisDelay = createContinuousUpdateTracker();
const undoTrackerEmphasisPause = createContinuousUpdateTracker();
const undoTrackerExitDuration = createContinuousUpdateTracker();

interface ThreePhaseAnimationControlsProps {
	itemId: string;
}

const ThreePhaseAnimationControlsUnmemoized: React.FC<
	ThreePhaseAnimationControlsProps
> = ({itemId}) => {
	const {animations, durationInFrames, itemType: rawItemType} = useItemAnimations(itemId);
	const itemType = rawItemType as AnimatableItemType;
	const updateItem = useEditorStore((state) => state.updateItem);

	// Get available animations for this item type
	const availableEnter = useMemo(
		() => getEnterAnimationsForItemType(itemType),
		[itemType],
	);
	const availableEmphasis = useMemo(
		() => getEmphasisAnimationsForItemType(itemType),
		[itemType],
	);
	const availableExit = useMemo(
		() => getExitAnimationsForItemType(itemType),
		[itemType],
	);

	// Update entire animations object
	const updateAnimations = useCallback(
		(newAnimations: ThreePhaseAnimations | undefined) => {
			updateItem(itemId, (i) => {
				const prev = i as EditorStarterItem;
				return {
					...prev,
					animations: newAnimations,
				};
			});
		},
		[updateItem, itemId],
	);

	// ============================================
	// ENTER ANIMATION HANDLERS
	// ============================================

	const handleEnterTypeChange = useCallback(
		(type: EnterAnimationType | 'none') => {
			if (type === 'none') {
				updateAnimations({
					...(animations || {}),
					enter: undefined,
				});
			} else {
				const newEnter: EnterAnimationConfig = {
					type,
					duration: animations?.enter?.duration ?? 20,
					delay: animations?.enter?.delay ?? 0,
				};
				updateAnimations({
					...(animations || {}),
					enter: newEnter,
				});
			}
		},
		[animations, updateAnimations],
	);

	const handleEnterDurationChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as EditorStarterItem;
					if (!prev.animations?.enter) return prev;
					return {
						...prev,
						animations: {
							...prev.animations,
							enter: {
								...prev.animations.enter,
								duration: value,
							},
						},
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerEnterDuration.endTracking(performUpdate);
			} else {
				if (!undoTrackerEnterDuration.isTracking()) {
					undoTrackerEnterDuration.startTracking(performUpdate);
				} else {
					undoTrackerEnterDuration.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handleEnterDelayChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as EditorStarterItem;
					if (!prev.animations?.enter) return prev;
					return {
						...prev,
						animations: {
							...prev.animations,
							enter: {
								...prev.animations.enter,
								delay: value,
							},
						},
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerEnterDelay.endTracking(performUpdate);
			} else {
				if (!undoTrackerEnterDelay.isTracking()) {
					undoTrackerEnterDelay.startTracking(performUpdate);
				} else {
					undoTrackerEnterDelay.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	// ============================================
	// EMPHASIS ANIMATION HANDLERS
	// ============================================

	const handleEmphasisTypeChange = useCallback(
		(type: EmphasisAnimationType | 'none') => {
			if (type === 'none') {
				updateAnimations({
					...(animations || {}),
					emphasis: undefined,
				});
			} else {
				const newEmphasis: EmphasisAnimationConfig = {
					type,
					duration: animations?.emphasis?.duration ?? 30,
					delay: animations?.emphasis?.delay ?? 0,
					iterations: animations?.emphasis?.iterations ?? 'infinite',
					pauseBetween: animations?.emphasis?.pauseBetween ?? 0,
				};
				updateAnimations({
					...(animations || {}),
					emphasis: newEmphasis,
				});
			}
		},
		[animations, updateAnimations],
	);

	const handleEmphasisDurationChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as EditorStarterItem;
					if (!prev.animations?.emphasis) return prev;
					return {
						...prev,
						animations: {
							...prev.animations,
							emphasis: {
								...prev.animations.emphasis,
								duration: value,
							},
						},
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerEmphasisDuration.endTracking(performUpdate);
			} else {
				if (!undoTrackerEmphasisDuration.isTracking()) {
					undoTrackerEmphasisDuration.startTracking(performUpdate);
				} else {
					undoTrackerEmphasisDuration.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handleEmphasisDelayChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as EditorStarterItem;
					if (!prev.animations?.emphasis) return prev;
					return {
						...prev,
						animations: {
							...prev.animations,
							emphasis: {
								...prev.animations.emphasis,
								delay: value,
							},
						},
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerEmphasisDelay.endTracking(performUpdate);
			} else {
				if (!undoTrackerEmphasisDelay.isTracking()) {
					undoTrackerEmphasisDelay.startTracking(performUpdate);
				} else {
					undoTrackerEmphasisDelay.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	const handleEmphasisIterationsChange = useCallback(
		(value: string | null) => {
			if (!value) return;
			const iterations = value === 'infinite' ? 'infinite' : parseInt(value, 10);
			updateItem(itemId, (i) => {
				const prev = i as EditorStarterItem;
				if (!prev.animations?.emphasis) return prev;
				return {
					...prev,
					animations: {
						...prev.animations,
						emphasis: {
							...prev.animations.emphasis,
							iterations,
						},
					},
				};
			});
		},
		[updateItem, itemId],
	);

	const handleEmphasisPauseChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as EditorStarterItem;
					if (!prev.animations?.emphasis) return prev;
					return {
						...prev,
						animations: {
							...prev.animations,
							emphasis: {
								...prev.animations.emphasis,
								pauseBetween: value,
							},
						},
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerEmphasisPause.endTracking(performUpdate);
			} else {
				if (!undoTrackerEmphasisPause.isTracking()) {
					undoTrackerEmphasisPause.startTracking(performUpdate);
				} else {
					undoTrackerEmphasisPause.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	// ============================================
	// EXIT ANIMATION HANDLERS
	// ============================================

	const handleExitTypeChange = useCallback(
		(type: ExitAnimationType | 'none') => {
			if (type === 'none') {
				updateAnimations({
					...(animations || {}),
					exit: undefined,
				});
			} else {
				const newExit: ExitAnimationConfig = {
					type,
					duration: animations?.exit?.duration ?? 20,
				};
				updateAnimations({
					...(animations || {}),
					exit: newExit,
				});
			}
		},
		[animations, updateAnimations],
	);

	const handleExitDurationChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const performUpdate = () => {
				updateItem(itemId, (i) => {
					const prev = i as EditorStarterItem;
					if (!prev.animations?.exit) return prev;
					return {
						...prev,
						animations: {
							...prev.animations,
							exit: {
								...prev.animations.exit,
								duration: value,
							},
						},
					};
				});
			};

			if (commitToUndoStack) {
				undoTrackerExitDuration.endTracking(performUpdate);
			} else {
				if (!undoTrackerExitDuration.isTracking()) {
					undoTrackerExitDuration.startTracking(performUpdate);
				} else {
					undoTrackerExitDuration.update(performUpdate);
				}
			}
		},
		[updateItem, itemId],
	);

	return (
		<div className="flex flex-col gap-2">
			{/* ENTER ANIMATION SECTION */}
			<CollapsableInspectorSection
				summary={<InspectorSubLabel>Enter Animation</InspectorSubLabel>}
				id={`enter-animation-${itemId}`}
				defaultOpen={!!animations?.enter}
			>
				<div className="flex flex-col gap-3">
					{/* Enter Type Dropdown */}
					<div>
						<InspectorSubLabel>Type</InspectorSubLabel>
						<Select
							value={animations?.enter?.type ?? 'none'}
							onValueChange={(value) =>
								handleEnterTypeChange(value as EnterAnimationType | 'none')
							}
						>
							<SelectTrigger className="editor-starter-field w-full">
								<SelectValue>
									{animations?.enter
										? ENTER_ANIMATION_REGISTRY[animations.enter.type].label
										: 'None'}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-editor-starter-panel">
								<SelectItem value="none">None</SelectItem>
								{availableEnter.map((type) => (
									<SelectItem key={type} value={type}>
										{ENTER_ANIMATION_REGISTRY[type].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Enter Settings (only if enter animation is selected) */}
					{animations?.enter && (
						<>
							{/* Duration */}
							<div>
								<InspectorSubLabel>Duration (frames)</InspectorSubLabel>
								<div className="flex w-full items-center gap-3">
									<Slider
										value={animations.enter.duration}
										//@ts-expect-error: type mismatch
										onValueChange={handleEnterDurationChange}
										min={1}
										max={Math.min(durationInFrames, 180)}
										step={1}
										className="flex-1"
										title={`Duration: ${animations.enter.duration} frames`}
									/>
									<div className="min-w-[32px] text-right text-xs text-white/75">
										{animations.enter.duration}
									</div>
								</div>
							</div>

							{/* Delay */}
							<div>
								<InspectorSubLabel>Delay (frames)</InspectorSubLabel>
								<div className="flex w-full items-center gap-3">
									<Slider
										value={animations.enter.delay ?? 0}
										//@ts-expect-error: type mismatch
										onValueChange={handleEnterDelayChange}
										min={0}
										max={Math.min(durationInFrames - animations.enter.duration, 120)}
										step={1}
										className="flex-1"
										title={`Delay: ${animations.enter.delay ?? 0} frames`}
									/>
									<div className="min-w-[32px] text-right text-xs text-white/75">
										{animations.enter.delay ?? 0}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* EMPHASIS ANIMATION SECTION */}
			<CollapsableInspectorSection
				summary={<InspectorSubLabel>Emphasis Animation</InspectorSubLabel>}
				id={`emphasis-animation-${itemId}`}
				defaultOpen={!!animations?.emphasis}
			>
				<div className="flex flex-col gap-3">
					{/* Emphasis Type Dropdown */}
					<div>
						<InspectorSubLabel>Type</InspectorSubLabel>
						<Select
							value={animations?.emphasis?.type ?? 'none'}
							onValueChange={(value) =>
								handleEmphasisTypeChange(value as EmphasisAnimationType | 'none')
							}
						>
							<SelectTrigger className="editor-starter-field w-full">
								<SelectValue>
									{animations?.emphasis
										? EMPHASIS_ANIMATION_REGISTRY[animations.emphasis.type].label
										: 'None'}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-editor-starter-panel">
								<SelectItem value="none">None</SelectItem>
								{availableEmphasis.map((type) => (
									<SelectItem key={type} value={type}>
										{EMPHASIS_ANIMATION_REGISTRY[type].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Emphasis Settings (only if emphasis animation is selected) */}
					{animations?.emphasis && (
						<>
							{/* Duration */}
							<div>
								<InspectorSubLabel>Duration (frames)</InspectorSubLabel>
								<div className="flex w-full items-center gap-3">
									<Slider
										value={animations.emphasis.duration}
										//@ts-expect-error: type mismatch
										onValueChange={handleEmphasisDurationChange}
										min={1}
										max={180}
										step={1}
										className="flex-1"
										title={`Duration: ${animations.emphasis.duration} frames`}
									/>
									<div className="min-w-[32px] text-right text-xs text-white/75">
										{animations.emphasis.duration}
									</div>
								</div>
							</div>

							{/* Delay */}
							<div>
								<InspectorSubLabel>Delay (frames)</InspectorSubLabel>
								<div className="flex w-full items-center gap-3">
									<Slider
										value={animations.emphasis.delay ?? 0}
										//@ts-expect-error: type mismatch
										onValueChange={handleEmphasisDelayChange}
										min={0}
										max={60}
										step={1}
										className="flex-1"
										title={`Delay: ${animations.emphasis.delay ?? 0} frames`}
									/>
									<div className="min-w-[32px] text-right text-xs text-white/75">
										{animations.emphasis.delay ?? 0}
									</div>
								</div>
							</div>

							{/* Iterations */}
							<div>
								<InspectorSubLabel>Iterations</InspectorSubLabel>
								<Select
									value={
										animations.emphasis.iterations === 'infinite'
											? 'infinite'
											: String(animations.emphasis.iterations ?? 'infinite')
									}
									onValueChange={handleEmphasisIterationsChange}
								>
									<SelectTrigger className="editor-starter-field w-full">
										<SelectValue>
											{animations.emphasis.iterations === 'infinite'
												? 'Infinite'
												: `${animations.emphasis.iterations ?? 'Infinite'} times`}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="bg-editor-starter-panel">
										<SelectItem value="infinite">Infinite</SelectItem>
										<SelectItem value="1">1 time</SelectItem>
										<SelectItem value="2">2 times</SelectItem>
										<SelectItem value="3">3 times</SelectItem>
										<SelectItem value="5">5 times</SelectItem>
										<SelectItem value="10">10 times</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Pause Between Cycles */}
							<div>
								<InspectorSubLabel>Pause Between (frames)</InspectorSubLabel>
								<div className="flex w-full items-center gap-3">
									<Slider
										value={animations.emphasis.pauseBetween ?? 0}
										//@ts-expect-error: type mismatch
										onValueChange={handleEmphasisPauseChange}
										min={0}
										max={60}
										step={1}
										className="flex-1"
										title={`Pause: ${animations.emphasis.pauseBetween ?? 0} frames`}
									/>
									<div className="min-w-[32px] text-right text-xs text-white/75">
										{animations.emphasis.pauseBetween ?? 0}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* EXIT ANIMATION SECTION */}
			<CollapsableInspectorSection
				summary={<InspectorSubLabel>Exit Animation</InspectorSubLabel>}
				id={`exit-animation-${itemId}`}
				defaultOpen={!!animations?.exit}
			>
				<div className="flex flex-col gap-3">
					{/* Exit Type Dropdown */}
					<div>
						<InspectorSubLabel>Type</InspectorSubLabel>
						<Select
							value={animations?.exit?.type ?? 'none'}
							onValueChange={(value) =>
								handleExitTypeChange(value as ExitAnimationType | 'none')
							}
						>
							<SelectTrigger className="editor-starter-field w-full">
								<SelectValue>
									{animations?.exit
										? EXIT_ANIMATION_REGISTRY[animations.exit.type].label
										: 'None'}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="bg-editor-starter-panel">
								<SelectItem value="none">None</SelectItem>
								{availableExit.map((type) => (
									<SelectItem key={type} value={type}>
										{EXIT_ANIMATION_REGISTRY[type].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Exit Settings (only if exit animation is selected) */}
					{animations?.exit && (
						<>
							{/* Duration */}
							<div>
								<InspectorSubLabel>Duration (frames)</InspectorSubLabel>
								<div className="flex w-full items-center gap-3">
									<Slider
										value={animations.exit.duration}
										//@ts-expect-error: type mismatch
										onValueChange={handleExitDurationChange}
										min={1}
										max={Math.min(durationInFrames, 180)}
										step={1}
										className="flex-1"
										title={`Duration: ${animations.exit.duration} frames`}
									/>
									<div className="min-w-[32px] text-right text-xs text-white/75">
										{animations.exit.duration}
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</CollapsableInspectorSection>
		</div>
	);
};

export const ThreePhaseAnimationControls = memo(
	ThreePhaseAnimationControlsUnmemoized,
);
