import React, {useCallback, useState} from 'react';
import {Button} from '../../components/ui/button';
import {Input} from '../../components/ui/input';
import useEditorStore from '../../zustand/editor-store';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_BORDER_RADIUS_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
} from '../flags';
import {CompositeItem} from '../items/composite/composite-item-type';
import {enterCompositeEditMode} from '../state/actions/composite-navigation';
import {getCurrentItems} from '../state/helpers/get-current-timeline';
import {CreateTemplateDialog} from '../templates/create-template-dialog';
import {useAssets, useItem} from '../utils/use-context';
import {InspectorLabel, InspectorSubLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {TransitionControls} from './controls/transition-controls';

const EditIcon: React.FC<{className?: string}> = ({className}) => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
		<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
	</svg>
);

const TemplateIcon: React.FC<{className?: string}> = ({className}) => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
		<line x1="3" y1="9" x2="21" y2="9" />
		<line x1="9" y1="21" x2="9" y2="9" />
	</svg>
);

const CompositeInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const item = useItem(itemId) as CompositeItem;
	const setState = useEditorStore((state) => state.setState);
	const {assets} = useAssets();
	const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] =
		useState(false);

	// Count child items
	const childItemCount = Object.keys(item.childTimeline.items).length;
	const childTrackCount = item.childTimeline.tracks.length;

	// Handle name change
	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newName = e.target.value;
			setState((state) => {
				const items = getCurrentItems(state);
				const currentItem = items[itemId] as CompositeItem | undefined;
				if (!currentItem) return;
				items[itemId] = {
					...currentItem,
					name: newName,
				};
			});
		},
		[setState, itemId],
	);

	// Handle edit composite
	const handleEditComposite = useCallback(() => {
		setState((state) => {
			enterCompositeEditMode(state, itemId);
		});
	}, [setState, itemId]);

	// Handle create template
	const handleCreateTemplate = useCallback(() => {
		setIsCreateTemplateDialogOpen(true);
	}, []);

	return (
		<div>
			{/* Create Template Dialog */}
			{isCreateTemplateDialogOpen && (
				<CreateTemplateDialog
					isOpen={isCreateTemplateDialogOpen}
					onClose={() => setIsCreateTemplateDialogOpen(false)}
					item={item}
					assets={assets}
				/>
			)}

			{/* Composite Info Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Composite</InspectorLabel>}
				id={`composite-info-${itemId}`}
				defaultOpen
			>
				{/* Name Input */}
				<div className="mb-3">
					<InspectorSubLabel>Name</InspectorSubLabel>
					<Input
						type="text"
						value={item.name}
						onChange={handleNameChange}
						placeholder="Composite name"
					/>
				</div>

				{/* Stats */}
				<div className="mb-3 flex gap-4">
					<div className="flex-1">
						<InspectorSubLabel>Items</InspectorSubLabel>
						<div className="text-sm text-white/70">{childItemCount}</div>
					</div>
					<div className="flex-1">
						<InspectorSubLabel>Tracks</InspectorSubLabel>
						<div className="text-sm text-white/70">{childTrackCount}</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col gap-2">
					<Button onClick={handleEditComposite}>
						<EditIcon />
						<span>Edit Composite</span>
					</Button>

					<Button onClick={handleCreateTemplate} variant="secondary">
						<TemplateIcon />
						<span>Create Template</span>
					</Button>
				</div>
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* Layout Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Layout</InspectorLabel>}
				id={`layout-${itemId}`}
				defaultOpen
			>
				{FEATURE_ALIGNMENT_CONTROL && <AlignmentControls itemId={itemId} />}
				{FEATURE_POSITION_CONTROL && <PositionControl itemId={itemId} />}
				{FEATURE_DIMENSIONS_CONTROL && <DimensionsControls itemId={itemId} />}
				{FEATURE_ROTATION_CONTROL && <RotationControl itemId={itemId} />}
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* Appearance Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Appearance</InspectorLabel>}
				id={`appearance-${itemId}`}
				defaultOpen
			>
				{FEATURE_OPACITY_CONTROL && <OpacityControls itemId={itemId} />}
				{FEATURE_BORDER_RADIUS_CONTROL && (
					<BorderRadiusControl borderRadiusType="fill" itemId={itemId} />
				)}
			</CollapsableInspectorSection>

			{FEATURE_VISUAL_FADE_CONTROL && (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Fade</InspectorLabel>}
						id={`fade-${itemId}`}
						defaultOpen={false}
					>
						<FadeControls itemId={itemId} />
					</CollapsableInspectorSection>
				</>
			)}

			{/* Transitions */}
			<TransitionControls itemId={itemId} />
		</div>
	);
};

export const CompositeInspector = React.memo(CompositeInspectorUnmemoized);
