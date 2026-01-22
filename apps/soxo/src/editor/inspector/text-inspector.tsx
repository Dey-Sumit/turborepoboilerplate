import React from 'react';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_ANIMATION_CONTROL,
	FEATURE_COLOR_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_FONT_FAMILY_CONTROL,
	FEATURE_FONT_STYLE_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_TEXT_ALIGNMENT_CONTROL,
	FEATURE_TEXT_BACKGROUND_CONTROL,
	FEATURE_TEXT_DIRECTION_CONTROL,
	FEATURE_TEXT_FONT_SIZE_CONTROL,
	FEATURE_TEXT_LETTER_SPACING_CONTROL,
	FEATURE_TEXT_LINE_HEIGHT_CONTROL,
	FEATURE_TEXT_STROKE_COLOR_CONTROL,
	FEATURE_TEXT_STROKE_WIDTH_CONTROL,
	FEATURE_TEXT_VALUE_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
} from '../flags';
import {useTextInspectorData} from '../selectors/hooks';
import {ColorInspector} from './color-inspector';
import {InspectorLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {CssControls} from './controls/css-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {FontFamilyControl} from './controls/font-family-controls/font-family-controls';
import {FontSizeControls} from './controls/font-size-controls';
import {FontStyleControls} from './controls/font-style-controls/font-style-controls';
import {LetterSpacingControls} from './controls/letter-spacing-controls';
import {LineHeightControls} from './controls/line-height-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {StrokeWidthControls} from './controls/stroke-width-controls';
import {TextAlignmentControls} from './controls/text-alignment-controls';
import {TextBackgroundControls} from './controls/text-background-controls/text-background-controls';
import {TextDirectionControls} from './controls/text-direction-controls';
import {TextValueControls} from './controls/text-value-controls/text-value-controls';
import {TransitionControls} from './controls/transition-controls';
import {ThreePhaseAnimationControls} from './controls/three-phase-animation-controls';

const TextInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const textData = useTextInspectorData(itemId);
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
				summary={<InspectorLabel>Typography</InspectorLabel>}
				id={`typography-${itemId}`}
				defaultOpen
			>
				{FEATURE_FONT_FAMILY_CONTROL && (
					<FontFamilyControl fontFamily={textData.fontFamily} itemId={itemId} />
				)}
				{FEATURE_FONT_STYLE_CONTROL && (
					<FontStyleControls
						fontFamily={textData.fontFamily}
						fontStyle={textData.fontStyle}
						itemId={itemId}
					/>
				)}
				{FEATURE_TEXT_FONT_SIZE_CONTROL && (
					<FontSizeControls
						fontSize={textData.fontSize}
						itemId={itemId}
						itemType="text"
					/>
				)}
				<div className="flex flex-row gap-2">
					{FEATURE_TEXT_LINE_HEIGHT_CONTROL && (
						<LineHeightControls
							lineHeight={textData.lineHeight}
							itemId={itemId}
						/>
					)}
					{FEATURE_TEXT_LETTER_SPACING_CONTROL && (
						<LetterSpacingControls
							letterSpacing={textData.letterSpacing}
							itemId={itemId}
						/>
					)}
				</div>
				{FEATURE_TEXT_VALUE_CONTROL && (
					<TextValueControls
						text={textData.text}
						itemId={itemId}
						direction={textData.direction}
						align={textData.align}
					/>
				)}
				<div className="flex flex-row gap-2">
					{FEATURE_TEXT_ALIGNMENT_CONTROL && (
						<TextAlignmentControls align={textData.align} itemId={itemId} />
					)}
					{FEATURE_TEXT_DIRECTION_CONTROL && (
						<TextDirectionControls
							direction={textData.direction}
							itemId={itemId}
						/>
					)}
				</div>
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
						color={textData.color}
						itemId={itemId}
						colorType="color"
						accessibilityLabel="Fill color"
					/>
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Stroke</InspectorLabel>}
				id={`stroke-${itemId}`}
				defaultOpen={false}
			>
				{FEATURE_TEXT_STROKE_WIDTH_CONTROL && (
					<StrokeWidthControls
						strokeWidth={textData.strokeWidth}
						itemId={itemId}
					/>
				)}
				{FEATURE_TEXT_STROKE_COLOR_CONTROL && (
					<ColorInspector
						color={textData.strokeColor}
						itemId={itemId}
						colorType="strokeColor"
						accessibilityLabel="Stroke color"
					/>
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<div className="px-4 py-3">
				<CssControls itemId={itemId} />
			</div>
			{FEATURE_TEXT_BACKGROUND_CONTROL ? (
				<>
					<InspectorDivider />
					<TextBackgroundControls itemId={itemId} />
				</>
			) : null}
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
						id={`fade-${itemId}`}
						defaultOpen={false}
						summary={<InspectorLabel>Fade</InspectorLabel>}
					>
						<FadeControls itemId={itemId} />
					</CollapsableInspectorSection>
				</>
			)}
			<TransitionControls itemId={itemId} />
		</div>
	);
};

export const TextInspector = React.memo(TextInspectorUnmemoized);
