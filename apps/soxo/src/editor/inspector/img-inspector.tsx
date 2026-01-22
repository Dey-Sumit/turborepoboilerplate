import React from 'react';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_ANIMATION_CONTROL,
	FEATURE_BORDER_RADIUS_CONTROL,
	FEATURE_CROP_CONTROL,
	FEATURE_CROPPING,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_SOURCE_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
} from '../flags';
import {InspectorLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {ThreePhaseAnimationControls} from './controls/three-phase-animation-controls';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {CropControls} from './controls/crop-controls';
import {CssControls} from './controls/css-controls';
import {CssPresetButtons} from './controls/css-preset-buttons';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PositionControl} from './controls/position-control';
import {QuickTransformButtons} from './controls/quick-transform-buttons';
import {RotationControl} from './controls/rotation-controls';
import {SourceControls} from './controls/source-info/source-info';
import {TransitionControls} from './controls/transition-controls';

const ImgInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	return (
		<div>
			{FEATURE_SOURCE_CONTROL && <SourceControls itemId={itemId} />}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Layout</InspectorLabel>}
				id={`layout-${itemId}`}
				defaultOpen
			>
				{FEATURE_ALIGNMENT_CONTROL && <AlignmentControls itemId={itemId} />}
				{FEATURE_POSITION_CONTROL && <PositionControl itemId={itemId} />}
				{FEATURE_DIMENSIONS_CONTROL && <DimensionsControls itemId={itemId} />}
				{FEATURE_ROTATION_CONTROL && <RotationControl itemId={itemId} />}
				<InspectorDivider />
				<QuickTransformButtons itemId={itemId} />
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Fill</InspectorLabel>}
				id={`fill-${itemId}`}
				defaultOpen
			>
				{FEATURE_OPACITY_CONTROL && <OpacityControls itemId={itemId} />}
				{FEATURE_BORDER_RADIUS_CONTROL && (
					<BorderRadiusControl borderRadiusType="fill" itemId={itemId} />
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Style Presets</InspectorLabel>}
				id={`style-presets-${itemId}`}
				defaultOpen={false}
			>
				<CssPresetButtons itemId={itemId} />
			</CollapsableInspectorSection>
			<InspectorDivider />
			<div className="px-4 py-3">
				<CssControls itemId={itemId} />
			</div>
			{FEATURE_CROPPING && FEATURE_CROP_CONTROL && (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Crop</InspectorLabel>}
						id={`crop-${itemId}`}
						defaultOpen={false}
					>
						<CropControls itemId={itemId} />
					</CollapsableInspectorSection>
				</>
			)}
			{FEATURE_ANIMATION_CONTROL && (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Animations</InspectorLabel>}
						id={`animations-${itemId}`}
						defaultOpen={false}
					>
						{/* NEW: Three-phase animation system */}
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

export const ImgInspector = React.memo(ImgInspectorUnmemoized);
