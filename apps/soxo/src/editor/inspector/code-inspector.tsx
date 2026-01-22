import React, {memo, useCallback, useMemo} from 'react';
import {createContinuousUpdateTracker} from '../../zustand/temporal-helpers';
import {CodeItem} from '../items/code/code-item-type';
import useEditorStore from '../../zustand/editor-store';
import {InspectorLabel, InspectorSubLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {
	NumberControl,
	NumberControlUpdateHandler,
} from './controls/number-controls';
import {CodeEditorDialog} from './code-editor-dialog';
import {FontSizeIcon} from '../icons/font-size';
import {LineHeightIcon} from '../icons/line-height';
import {AlignmentControls} from './controls/alignment-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {FadeControls} from './controls/fade-controls';
import {TransitionControls} from './controls/transition-controls';
import {ThreePhaseAnimationControls} from './controls/three-phase-animation-controls';
import {ColorInspector} from './color-inspector';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
	FEATURE_ANIMATION_CONTROL,
} from '../flags';
import {useItem} from '../utils/use-context';

// Code font families (monospace fonts)
const CODE_FONT_FAMILIES = [
	{value: 'Fira Code', label: 'Fira Code'},
	{value: 'JetBrains Mono', label: 'JetBrains Mono'},
	{value: 'Source Code Pro', label: 'Source Code Pro'},
	{value: 'IBM Plex Mono', label: 'IBM Plex Mono'},
	{value: 'Cascadia Code', label: 'Cascadia Code'},
	{value: 'Roboto Mono', label: 'Roboto Mono'},
	{value: 'Ubuntu Mono', label: 'Ubuntu Mono'},
	{value: 'Inconsolata', label: 'Inconsolata'},
];

// CodeHike themes
const CODE_THEMES = [
	{value: 'poimandres', label: 'Poimandres'},
	{value: 'slack-ochin', label: 'Slack Ochin'},
	{value: 'material-darker', label: 'Material Darker'},
];

const CodeInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const item = useItem(itemId) as CodeItem;
	const updateItem = useEditorStore((state) => state.updateItem);

	// Undo tracker for continuous updates (sliders)
	const fontSizeUndoTracker = useMemo(
		() => createContinuousUpdateTracker(),
		[],
	);
	const lineHeightUndoTracker = useMemo(
		() => createContinuousUpdateTracker(),
		[],
	);
	const paddingUndoTracker = useMemo(() => createContinuousUpdateTracker(), []);
	const tokenTransitionUndoTracker = useMemo(
		() => createContinuousUpdateTracker(),
		[],
	);

	// Code update handler
	const handleCodeChange = useCallback(
		(newCode: string) => {
			updateItem(itemId, (i) => {
				if (i.type !== 'code') return i;
				if (i.code === newCode) return i;
				return {
					...i,
					code: newCode,
					// Reset processed code so it will be reprocessed
					processedCode: null,
				};
			});
		},
		[updateItem, itemId],
	);

	// Font family change handler
	const handleFontFamilyChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const newFontFamily = e.target.value;
			updateItem(itemId, (i) => {
				if (i.type !== 'code') return i;
				if (i.fontFamily === newFontFamily) return i;
				return {...i, fontFamily: newFontFamily};
			});
		},
		[updateItem, itemId],
	);

	// Theme change handler
	const handleThemeChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const newTheme = e.target.value;
			updateItem(itemId, (i) => {
				if (i.type !== 'code') return i;
				if (i.theme === newTheme) return i;
				return {...i, theme: newTheme};
			});
		},
		[updateItem, itemId],
	);

	// Font size change handler
	const handleFontSizeChange: NumberControlUpdateHandler = useCallback(
		({num, commitToUndoStack}) => {
			const validFontSize = Math.max(8, Math.min(72, isNaN(num) ? 16 : num));

			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'code') return i;
					if (i.fontSize === validFontSize) return i;
					return {...i, fontSize: validFontSize};
				});
			};

			if (commitToUndoStack) {
				fontSizeUndoTracker.endTracking(performUpdate);
			} else {
				if (!fontSizeUndoTracker.isTracking()) {
					fontSizeUndoTracker.startTracking(performUpdate);
				} else {
					fontSizeUndoTracker.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, fontSizeUndoTracker],
	);

	// Line height change handler
	const handleLineHeightChange: NumberControlUpdateHandler = useCallback(
		({num, commitToUndoStack}) => {
			const validLineHeight = Math.max(1, Math.min(3, num));

			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'code') return i;
					if (i.lineHeight === validLineHeight) return i;
					return {...i, lineHeight: validLineHeight};
				});
			};

			if (commitToUndoStack) {
				lineHeightUndoTracker.endTracking(performUpdate);
			} else {
				if (!lineHeightUndoTracker.isTracking()) {
					lineHeightUndoTracker.startTracking(performUpdate);
				} else {
					lineHeightUndoTracker.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, lineHeightUndoTracker],
	);

	// Padding change handler
	const handlePaddingChange: NumberControlUpdateHandler = useCallback(
		({num, commitToUndoStack}) => {
			const validPadding = Math.max(0, Math.min(64, isNaN(num) ? 16 : num));

			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'code') return i;
					if (i.padding === validPadding) return i;
					return {...i, padding: validPadding};
				});
			};

			if (commitToUndoStack) {
				paddingUndoTracker.endTracking(performUpdate);
			} else {
				if (!paddingUndoTracker.isTracking()) {
					paddingUndoTracker.startTracking(performUpdate);
				} else {
					paddingUndoTracker.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, paddingUndoTracker],
	);

	// Token transition duration change handler
	const handleTokenTransitionChange: NumberControlUpdateHandler = useCallback(
		({num, commitToUndoStack}) => {
			const validDuration = Math.max(0, Math.min(2, num));

			const performUpdate = () => {
				updateItem(itemId, (i) => {
					if (i.type !== 'code') return i;
					if (i.tokenTransitionDuration === validDuration) return i;
					return {...i, tokenTransitionDuration: validDuration};
				});
			};

			if (commitToUndoStack) {
				tokenTransitionUndoTracker.endTracking(performUpdate);
			} else {
				if (!tokenTransitionUndoTracker.isTracking()) {
					tokenTransitionUndoTracker.startTracking(performUpdate);
				} else {
					tokenTransitionUndoTracker.update(performUpdate);
				}
			}
		},
		[updateItem, itemId, tokenTransitionUndoTracker],
	);

	// Disable token transitions toggle
	const handleDisableTransitionsChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const disabled = e.target.checked;
			updateItem(itemId, (i) => {
				if (i.type !== 'code') return i;
				if (i.disableTokenTransitions === disabled) return i;
				return {...i, disableTokenTransitions: disabled};
			});
		},
		[updateItem, itemId],
	);

	return (
		<div>
			{/* Code Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Code</InspectorLabel>}
				id={`code-${itemId}`}
				defaultOpen
			>
				<div className="mb-2">
					<CodeEditorDialog
						code={item.code}
						theme={item.theme}
						onSave={handleCodeChange}
						trigger={
							<button
								type="button"
								className="editor-starter-field w-full px-3 py-2 text-left text-xs text-neutral-300 transition-colors hover:bg-white/10"
							>
								Edit Code...
							</button>
						}
					/>
				</div>
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* Styling Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Styling</InspectorLabel>}
				id={`styling-${itemId}`}
				defaultOpen
			>
				{/* Font Family */}
				<div className="mb-2">
					<InspectorSubLabel>Font Family</InspectorSubLabel>
					<select
						value={item.fontFamily}
						onChange={handleFontFamilyChange}
						className="editor-starter-field w-full px-2 py-2 text-xs text-neutral-300"
						aria-label="Font Family"
					>
						{CODE_FONT_FAMILIES.map((font) => (
							<option key={font.value} value={font.value}>
								{font.label}
							</option>
						))}
					</select>
				</div>

				{/* Font Size */}
				<div className="mb-2">
					<InspectorSubLabel>Font Size</InspectorSubLabel>
					<NumberControl
						label={<FontSizeIcon className="size-3" />}
						setValue={handleFontSizeChange}
						value={item.fontSize}
						min={8}
						max={72}
						step={1}
						accessibilityLabel="Font size"
					/>
				</div>

				{/* Line Height */}
				<div className="mb-2">
					<InspectorSubLabel>Line Height</InspectorSubLabel>
					<NumberControl
						label={<LineHeightIcon className="size-3" />}
						setValue={handleLineHeightChange}
						value={item.lineHeight}
						min={1}
						max={3}
						step={0.1}
						accessibilityLabel="Line height"
					/>
				</div>

				{/* Theme */}
				<div>
					<InspectorSubLabel>Theme</InspectorSubLabel>
					<select
						value={item.theme}
						onChange={handleThemeChange}
						className="editor-starter-field w-full px-2 py-2 text-xs text-neutral-300"
						aria-label="Code Theme"
					>
						{CODE_THEMES.map((theme) => (
							<option key={theme.value} value={theme.value}>
								{theme.label}
							</option>
						))}
					</select>
				</div>
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* Animation Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Animation</InspectorLabel>}
				id={`animation-${itemId}`}
				defaultOpen={false}
			>
				{/* Token Transition Duration */}
				<div className="mb-2">
					<InspectorSubLabel>Token Transition (sec)</InspectorSubLabel>
					<NumberControl
						label="T"
						setValue={handleTokenTransitionChange}
						value={item.tokenTransitionDuration}
						min={0}
						max={2}
						step={0.1}
						accessibilityLabel="Token transition duration in seconds"
					/>
				</div>

				{/* Disable Token Transitions */}
				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id={`disable-transitions-${itemId}`}
						checked={item.disableTokenTransitions}
						onChange={handleDisableTransitionsChange}
						className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
					/>
					<label
						htmlFor={`disable-transitions-${itemId}`}
						className="text-xs text-neutral-400"
					>
						Disable token transitions
					</label>
				</div>
			</CollapsableInspectorSection>

			<InspectorDivider />

			{/* Appearance Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Appearance</InspectorLabel>}
				id={`appearance-${itemId}`}
				defaultOpen={false}
			>
				{/* Background Color */}
				<ColorInspector
					color={item.backgroundColor}
					itemId={itemId}
					colorType="backgroundColor"
					accessibilityLabel="Background color"
				/>

				{/* Padding */}
				<div className="mt-2">
					<InspectorSubLabel>Padding</InspectorSubLabel>
					<NumberControl
						label="P"
						setValue={handlePaddingChange}
						value={item.padding}
						min={0}
						max={64}
						step={1}
						accessibilityLabel="Padding"
					/>
				</div>

				{/* Border Radius */}
				<div className="mt-2">
					<BorderRadiusControl borderRadiusType="fill" itemId={itemId} />
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

			{/* Fill Section */}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Fill</InspectorLabel>}
				id={`fill-${itemId}`}
				defaultOpen={false}
			>
				{FEATURE_OPACITY_CONTROL && <OpacityControls itemId={itemId} />}
			</CollapsableInspectorSection>

			{/* Fade Section */}

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

			{/* Transitions */}
			<TransitionControls itemId={itemId} />
		</div>
	);
};

export const CodeInspector = memo(CodeInspectorUnmemoized);
