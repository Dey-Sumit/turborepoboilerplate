import React, {useCallback, useMemo} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {EditorStarterItem} from '../../items/item-type';
import {
	addTransition,
	removeTransition,
	updateTransition,
} from '../../state/actions/transition';
import {CollapsableInspectorSection} from '../components/inspector-section';
import {InspectorSubLabel, InspectorLabel} from '../components/inspector-label';
import {Transition} from '../../state/types';
import {DEFAULT_TRANSITION_DURATION_IN_FRAMES} from '../../constants';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../components/ui/select';
import {Slider} from '../../../components/ui/slider';
import {createContinuousUpdateTracker} from '../../../zustand/temporal-helpers';
import {useItemForTransition} from '../../selectors/hooks';

interface TransitionControlsProps {
	itemId: string;
}

// Undo trackers for continuous slider updates
const undoTrackerToNextDuration = createContinuousUpdateTracker();
const undoTrackerToPrevDuration = createContinuousUpdateTracker();

// Transition type options
const TRANSITION_TYPES = [
	{value: 'fade', label: 'Fade'},
	{value: 'slide', label: 'Slide'},
	{value: 'wipe', label: 'Wipe'},
	{value: 'flip', label: 'Flip'},
	{value: 'clockwipe', label: 'Clock Wipe'},
	{value: 'iris', label: 'Iris'},
] as const;

// Direction options
const SLIDE_FLIP_DIRECTIONS = [
	{value: 'from-left', label: 'From Left'},
	{value: 'from-right', label: 'From Right'},
	{value: 'from-top', label: 'From Top'},
	{value: 'from-bottom', label: 'From Bottom'},
] as const;

const WIPE_DIRECTIONS = [
	{value: 'from-left', label: 'From Left'},
	{value: 'from-right', label: 'From Right'},
	{value: 'from-top', label: 'From Top'},
	{value: 'from-bottom', label: 'From Bottom'},
	{value: 'from-top-left', label: 'From Top Left'},
	{value: 'from-top-right', label: 'From Top Right'},
	{value: 'from-bottom-left', label: 'From Bottom Left'},
	{value: 'from-bottom-right', label: 'From Bottom Right'},
] as const;

export const TransitionControls: React.FC<TransitionControlsProps> = ({
	itemId,
}) => {
	const item = useItemForTransition(itemId) as EditorStarterItem;
	const setState = useEditorStore((state) => state.setState);
	const tracks = useEditorStore((state) => state.compositionState.tracks);
	const compositionWidth = useEditorStore(
		(state) => state.compositionState.compositionWidth,
	);
	const compositionHeight = useEditorStore(
		(state) => state.compositionState.compositionHeight,
	);

	// Find if this item can have transitions to next/prev
	const {canAddToNext, canAddToPrev} = useMemo(() => {
		if (!item) return {canAddToNext: false, canAddToPrev: false};
		const track = tracks.find((t) => t.items.includes(itemId));
		if (!track) return {canAddToNext: false, canAddToPrev: false};

		const itemIndex = track.items.indexOf(itemId);
		return {
			canAddToNext: itemIndex < track.items.length - 1,
			canAddToPrev: itemIndex > 0,
		};
	}, [tracks, itemId, item]);

	const handleAddTransition = useCallback(
		(direction: 'toNext' | 'toPrev') => {
			const defaultTransition: Transition = {
				type: 'fade',
				durationInFrames: DEFAULT_TRANSITION_DURATION_IN_FRAMES,
			};

			setState((state) => {
				addTransition({
					state,
					itemId: itemId,
					transition: defaultTransition,
					direction,
				});
				return state;
			});
		},
		[itemId, setState],
	);

	const handleRemoveTransition = useCallback(
		(direction: 'toNext' | 'toPrev') => {
			setState((state) => {
				removeTransition({
					state,
					itemId: itemId,
					direction,
				});
				return state;
			});
		},
		[itemId, setState],
	);

	const handleUpdateTransition = useCallback(
		(direction: 'toNext' | 'toPrev', updates: Partial<Transition>) => {
			setState((state) => {
				updateTransition({
					state,
					itemId: itemId,
					direction,
					updates,
				});
				return state;
			});
		},
		[itemId, setState],
	);

	const hasTransitionToNext = item?.transition?.toNext !== undefined;
	const hasTransitionToPrev = item?.transition?.toPrev !== undefined;

	const showSection =
		hasTransitionToNext || hasTransitionToPrev || canAddToNext || canAddToPrev;

	if (!showSection || !item) {
		return null;
	}

	return (
		<CollapsableInspectorSection
			summary={<InspectorLabel>Transitions</InspectorLabel>}
			id={`transitions-${itemId}`}
			defaultOpen={false}
		>
			<div className="flex flex-col gap-4">
				{/* Transition to Next */}
				{canAddToNext && (
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<InspectorSubLabel>To Next Item</InspectorSubLabel>
							{hasTransitionToNext && (
								<button
									onClick={() => handleRemoveTransition('toNext')}
									className="text-xs text-red-400 hover:text-red-300"
									title="Remove transition"
								>
									Remove
								</button>
							)}
						</div>

						{!hasTransitionToNext ? (
							<button
								onClick={() => handleAddTransition('toNext')}
								className="w-full rounded bg-white/5 px-3 py-2 text-xs text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
							>
								+ Add Transition
							</button>
						) : (
							<TransitionEditorFields
								transition={item.transition.toNext!}
								direction="toNext"
								onUpdate={handleUpdateTransition}
								compositionWidth={compositionWidth}
								compositionHeight={compositionHeight}
							/>
						)}
					</div>
				)}

				{/* Transition from Previous */}
				{canAddToPrev && (
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<InspectorSubLabel>From Previous Item</InspectorSubLabel>
							{hasTransitionToPrev && (
								<button
									onClick={() => handleRemoveTransition('toPrev')}
									className="text-xs text-red-400 hover:text-red-300"
									title="Remove transition"
								>
									Remove
								</button>
							)}
						</div>

						{!hasTransitionToPrev ? (
							<button
								onClick={() => handleAddTransition('toPrev')}
								className="w-full rounded bg-white/5 px-3 py-2 text-xs text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
							>
								+ Add Transition
							</button>
						) : (
							<TransitionEditorFields
								transition={item.transition.toPrev!}
								direction="toPrev"
								onUpdate={handleUpdateTransition}
								compositionWidth={compositionWidth}
								compositionHeight={compositionHeight}
							/>
						)}
					</div>
				)}
			</div>
		</CollapsableInspectorSection>
	);
};

// Component for editing a single transition
const TransitionEditorFields: React.FC<{
	transition: Transition;
	direction: 'toNext' | 'toPrev';
	onUpdate: (
		direction: 'toNext' | 'toPrev',
		updates: Partial<Transition>,
	) => void;
	compositionWidth: number;
	compositionHeight: number;
}> = ({
	transition,
	direction,
	onUpdate,
	compositionWidth,
	compositionHeight,
}) => {
	// Determine available directions based on type
	const availableDirections = useMemo(() => {
		if (transition.type === 'wipe') return WIPE_DIRECTIONS;
		if (transition.type === 'slide' || transition.type === 'flip')
			return SLIDE_FLIP_DIRECTIONS;
		return [];
	}, [transition.type]);

	const needsDirection =
		transition.type === 'slide' ||
		transition.type === 'wipe' ||
		transition.type === 'flip';
	const needsDimensions =
		transition.type === 'clockwipe' || transition.type === 'iris';

	const currentDirection =
		'direction' in transition ? transition.direction : 'from-left';

	const handleDurationChange = useCallback(
		(value: number, commitToUndoStack: boolean) => {
			const tracker =
				direction === 'toNext'
					? undoTrackerToNextDuration
					: undoTrackerToPrevDuration;

			const performUpdate = () => {
				onUpdate(direction, {durationInFrames: Math.round(value)});
			};

			if (commitToUndoStack) {
				tracker.endTracking(performUpdate);
			} else {
				if (!tracker.isTracking()) {
					tracker.startTracking(performUpdate);
				} else {
					tracker.update(performUpdate);
				}
			}
		},
		[direction, onUpdate],
	);

	const currentTypeMeta = TRANSITION_TYPES.find(
		(t) => t.value === transition.type,
	);

	return (
		<div className="flex flex-col gap-3">
			{/* Type Selector */}
			<div>
				<InspectorSubLabel>Type</InspectorSubLabel>
				<Select
					value={transition.type}
					onValueChange={(value) =>
						value && onUpdate(direction, {type: value as Transition['type']})
					}
				>
					<SelectTrigger className="editor-starter-field w-full">
						<SelectValue>
							{currentTypeMeta?.label ?? transition.type}
						</SelectValue>
					</SelectTrigger>
					<SelectContent className="bg-editor-starter-panel">
						{TRANSITION_TYPES.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Duration Slider */}
			<div>
				<InspectorSubLabel>Duration (frames)</InspectorSubLabel>
				<div className="flex w-full items-center gap-3">
					<Slider
						value={
							transition.durationInFrames ??
							DEFAULT_TRANSITION_DURATION_IN_FRAMES
						}
						//@ts-expect-error : type mismatch
						onValueChange={handleDurationChange}
						min={1}
						max={180}
						step={1}
						className="flex-1"
						title={`Duration: ${transition.durationInFrames ?? DEFAULT_TRANSITION_DURATION_IN_FRAMES} frames`}
					/>
					<div className="min-w-[32px] text-right text-xs text-white/75">
						{transition.durationInFrames ??
							DEFAULT_TRANSITION_DURATION_IN_FRAMES}
					</div>
				</div>
			</div>

			{/* Direction Selector (for slide, wipe, flip) */}
			{needsDirection && (
				<div>
					<InspectorSubLabel>Direction</InspectorSubLabel>
					<Select
						value={currentDirection}
						onValueChange={(value) =>
							value && onUpdate(direction, {direction: value })
						}
					>
						<SelectTrigger className="editor-starter-field w-full">
							<SelectValue>
								{availableDirections.find((d) => d.value === currentDirection)
									?.label ?? currentDirection}
							</SelectValue>
						</SelectTrigger>
						<SelectContent className="bg-editor-starter-panel">
							{availableDirections.map((dir) => (
								<SelectItem key={dir.value} value={dir.value}>
									{dir.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Dimensions info (for clockwipe, iris) */}
			{needsDimensions && (
				<div className="rounded bg-white/5 px-3 py-2">
					<span className="text-xs text-neutral-400">
						Size: {compositionWidth} × {compositionHeight}
					</span>
				</div>
			)}
		</div>
	);
};
