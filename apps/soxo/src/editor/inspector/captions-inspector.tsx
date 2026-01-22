import {BookmarkPlusIcon} from 'lucide-react';
import React, {useState} from 'react';
import {Button} from '../../components/ui/button';
import {CaptionsItem} from '../items/captions/captions-item-type';
import useEditorStore from '../../zustand/editor-store';
import {
	FEATURE_CAPTIONS_PAGE_DURATION_CONTROL,
	FEATURE_COLOR_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_FONT_FAMILY_CONTROL,
	FEATURE_FONT_STYLE_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_TEXT_ALIGNMENT_CONTROL,
	FEATURE_TEXT_DIRECTION_CONTROL,
	FEATURE_TEXT_FONT_SIZE_CONTROL,
	FEATURE_TEXT_LETTER_SPACING_CONTROL,
	FEATURE_TEXT_LINE_HEIGHT_CONTROL,
	FEATURE_TEXT_MAX_LINES_CONTROL,
	FEATURE_TEXT_STROKE_COLOR_CONTROL,
	FEATURE_TEXT_STROKE_WIDTH_CONTROL,
	FEATURE_TOKENS_CONTROL,
	FEATURE_ANIMATION_CONTROL,
} from '../flags';
import {CaptionPresetSelector} from '../presets/caption-preset-selector';
import {applyCaptionPreset} from '../presets/caption-preset-utils';
import {SaveCaptionPresetDialog} from '../presets/save-caption-preset-dialog';
import {useItem} from '../utils/use-context';
import {ColorInspector} from './color-inspector';
import {InspectorLabel} from './components/inspector-label';
import {HighlightStyleControls} from './controls/highlight-style-controls';
import {CaptionBackgroundControls} from './controls/caption-background-controls';
import {CaptionTextShadowControls} from './controls/caption-text-shadow-controls';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {PageDurationControls} from './controls/caption-controls/page-duration-controls';
import {TokensControls} from './controls/caption-controls/tokens-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FontFamilyControl} from './controls/font-family-controls/font-family-controls';
import {FontSizeControls} from './controls/font-size-controls';
import {FontStyleControls} from './controls/font-style-controls/font-style-controls';
import {LetterSpacingControls} from './controls/letter-spacing-controls';
import {LineHeightControls} from './controls/line-height-controls';
import {MaxLinesControls} from './controls/max-lines-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {StrokeWidthControls} from './controls/stroke-width-controls';
import {TextAlignmentControls} from './controls/text-alignment-controls';
import {TextDirectionControls} from './controls/text-direction-controls';
import {ThreePhaseAnimationControls} from './controls/three-phase-animation-controls';
import {TransitionControls} from './controls/transition-controls';

const CaptionsInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const item = useItem(itemId) as CaptionsItem;
	const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
	const updateItem = useEditorStore((state) => state.updateItem);

	return (
		<div>
			<CollapsableInspectorSection
				summary={<InspectorLabel>Layout</InspectorLabel>}
				id={`layout-${itemId}`}
				defaultOpen
			>
				<AlignmentControls itemId={itemId} />
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
					<FontFamilyControl fontFamily={item.fontFamily} itemId={itemId} />
				)}
				{FEATURE_FONT_STYLE_CONTROL && (
					<FontStyleControls
						fontFamily={item.fontFamily}
						fontStyle={item.fontStyle}
						itemId={itemId}
					/>
				)}
				{FEATURE_TEXT_FONT_SIZE_CONTROL && (
					<FontSizeControls
						fontSize={item.fontSize}
						itemId={itemId}
						itemType="captions"
					/>
				)}

				<div className="flex flex-row gap-2">
					{FEATURE_TEXT_LINE_HEIGHT_CONTROL && (
						<LineHeightControls lineHeight={item.lineHeight} itemId={itemId} />
					)}
					{FEATURE_TEXT_LETTER_SPACING_CONTROL && (
						<LetterSpacingControls
							letterSpacing={item.letterSpacing}
							itemId={itemId}
						/>
					)}
				</div>
				<div className="flex flex-row gap-2">
					{FEATURE_TEXT_ALIGNMENT_CONTROL && (
						<TextAlignmentControls align={item.align} itemId={itemId} />
					)}
					{FEATURE_TEXT_DIRECTION_CONTROL && (
						<TextDirectionControls direction={item.direction} itemId={itemId} />
					)}
				</div>
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Caption Presets</InspectorLabel>}
				id={`presets-${itemId}`}
				defaultOpen={false}
			>
				<CaptionPresetSelector
					currentItem={item}
					onPresetApply={(preset) => {
						updateItem(
							itemId,
							(i) => {
								if (i.type !== 'captions') return i;
								return {...i, ...applyCaptionPreset(i, preset)};
							},
							'applyCaptionPreset',
						);
					}}
				/>

				<Button
					variant="outline"
					size="sm"
					onClick={() => setSavePresetDialogOpen(true)}
					className="mt-2 w-full"
				>
					<BookmarkPlusIcon className="mr-2 h-4 w-4" />
					Save Current Style as Preset
				</Button>
			</CollapsableInspectorSection>
			<InspectorDivider />
			{FEATURE_OPACITY_CONTROL && (
				<CollapsableInspectorSection
					summary={<InspectorLabel>Fill</InspectorLabel>}
					id={`fill-${itemId}`}
					defaultOpen
				>
					{FEATURE_OPACITY_CONTROL && <OpacityControls itemId={itemId} />}
					<div className="flex flex-row gap-2">
						{FEATURE_COLOR_CONTROL && (
							<ColorInspector
								color={item.color}
								itemId={itemId}
								colorType="color"
								accessibilityLabel="Fill color"
							/>
						)}
						{FEATURE_COLOR_CONTROL && (
							<ColorInspector
								color={item.highlightColor}
								itemId={itemId}
								colorType="highlightColor"
								accessibilityLabel="Highlight color"
							/>
						)}
					</div>
				</CollapsableInspectorSection>
			)}
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Stroke</InspectorLabel>}
				id={`stroke-${itemId}`}
				defaultOpen={false}
			>
				{FEATURE_TEXT_STROKE_WIDTH_CONTROL && (
					<StrokeWidthControls strokeWidth={item.strokeWidth} itemId={itemId} />
				)}
				{FEATURE_TEXT_STROKE_COLOR_CONTROL && (
					<ColorInspector
						color={item.strokeColor}
						itemId={itemId}
						colorType="strokeColor"
						accessibilityLabel="Stroke color"
					/>
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Highlight Style</InspectorLabel>}
				id={`highlight-${itemId}`}
				defaultOpen={false}
			>
				<HighlightStyleControls
					highlightStyle={item.highlightStyle}
					itemId={itemId}
				/>
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Background</InspectorLabel>}
				id={`background-${itemId}`}
				defaultOpen={false}
			>
				<CaptionBackgroundControls
					itemId={itemId}
					backgroundEnabled={item.backgroundEnabled}
					backgroundColor={item.backgroundColor}
					backgroundOpacity={item.backgroundOpacity}
					backgroundPadding={item.backgroundPadding}
					backgroundBorderRadius={item.backgroundBorderRadius}
				/>
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Text Shadow</InspectorLabel>}
				id={`text-shadow-${itemId}`}
				defaultOpen={false}
			>
				<CaptionTextShadowControls
					itemId={itemId}
					textShadowEnabled={item.textShadowEnabled}
					textShadowColor={item.textShadowColor}
					textShadowOffsetX={item.textShadowOffsetX}
					textShadowOffsetY={item.textShadowOffsetY}
					textShadowBlur={item.textShadowBlur}
				/>
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Captions</InspectorLabel>}
				id={`captions-${itemId}`}
				defaultOpen={false}
			>
				{FEATURE_CAPTIONS_PAGE_DURATION_CONTROL && (
					<PageDurationControls
						pageDurationInMilliseconds={item.pageDurationInMilliseconds}
						itemId={itemId}
					/>
				)}
				{FEATURE_TEXT_MAX_LINES_CONTROL && (
					<MaxLinesControls maxLines={item.maxLines} itemId={itemId} />
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />

			{/* Animations Section */}
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
			{FEATURE_TOKENS_CONTROL && <TokensControls item={item} />}
			<TransitionControls itemId={itemId} />

			<SaveCaptionPresetDialog
				isOpen={savePresetDialogOpen}
				onClose={() => setSavePresetDialogOpen(false)}
				captionItem={item}
			/>
		</div>
	);
};

export const CaptionsInspector = React.memo(CaptionsInspectorUnmemoized);
