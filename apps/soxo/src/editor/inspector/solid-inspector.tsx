import React from 'react';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_ANIMATION_CONTROL,
	FEATURE_BORDER_RADIUS_CONTROL,
	FEATURE_COLOR_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
} from '../flags';
import {useSolidInspectorData} from '../selectors/hooks';
import {ColorInspector} from './color-inspector';
import {InspectorLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {CssControls} from './controls/css-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {ThreePhaseAnimationControls} from './controls/three-phase-animation-controls';
import {TransitionControls} from './controls/transition-controls';

const SolidInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const solidData = useSolidInspectorData(itemId);

	return (
		<div>
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
			<CollapsableInspectorSection
				summary={<InspectorLabel>Fill</InspectorLabel>}
				id={`fill-${itemId}`}
				defaultOpen
			>
				{FEATURE_OPACITY_CONTROL && <OpacityControls itemId={itemId} />}
				{FEATURE_COLOR_CONTROL && (
					<ColorInspector
						color={solidData.color}
						itemId={itemId}
						colorType="color"
						accessibilityLabel="Fill color"
					/>
				)}
				{FEATURE_BORDER_RADIUS_CONTROL && (
					<BorderRadiusControl borderRadiusType="fill" itemId={itemId} />
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<div className="px-4 py-3">
				<CssControls itemId={itemId} />
			</div>
			{FEATURE_ANIMATION_CONTROL && (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Animations</InspectorLabel>}
						id={`animations-${itemId}`}
						defaultOpen={false}
					>
						<ThreePhaseAnimationControls itemId={itemId} />
					</CollapsableInspectorSection>
				</>
			)}
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
			<TransitionControls itemId={itemId} />
		</div>
	);
};

export const SolidInspector = React.memo(SolidInspectorUnmemoized);
