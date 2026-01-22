import {PlayerRef} from '@remotion/player';
import React, {useCallback} from 'react';
import useEditorStore from '../../zustand/editor-store';
import useUIStore, {useEditMode, useSetEditMode} from '../../zustand/ui-store';
import {addAsset} from '../assets/add-asset';
import {addItem} from '../state/actions/add-item';
import {getCodeItemDefaults} from '../canvas-size-defaults';
import {
	FEATURE_CREATE_CODE_TOOL,
	FEATURE_CREATE_TEXT_TOOL,
	FEATURE_DRAW_SOLID_TOOL,
	FEATURE_IMPORT_ASSETS_TOOL,
} from '../flags';
import {AudioIcon} from '../icons/audio-icon';
import {CodeIcon} from '../icons/code';
import {EditModeIcon} from '../icons/edit-mode';
import {ImageIcon} from '../icons/image';
import {ShapeIcon} from '../icons/shape';
import {SolidIcon} from '../icons/solid';
import {TextIcon} from '../icons/text';
import {VideoIcon} from '../icons/video';
import {getCurrentTracks} from '../state/helpers/get-current-timeline';
import {makeCodeItemWithDimensions} from '../items/code/make-code-item';
import {makeShapeItem} from '../items/shape/make-shape-item';
import {generateRandomId} from '../utils/generate-random-id';
import {getNextCodeItemPosition} from '../utils/get-track-from-last-added-item';
import {AddFromUrlModal} from './add-from-url-modal';
import {TemplateDropdown} from './template-dropdown';

export const ToolSelection: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const setState = useEditorStore((state) => state.setState);
	const editMode = useEditMode();
	const setEditMode = useSetEditMode();

	const setSelectEditMode = useCallback(() => {
		setEditMode('select');
	}, [setEditMode]);

	const setSolidEditMode = useCallback(() => {
		setEditMode('draw-solid');
	}, [setEditMode]);

	const setCreateTextMode = useCallback(() => {
		setEditMode('create-text');
	}, [setEditMode]);

	const addCodeItem = useCallback(() => {
		const currentState = useEditorStore.getState();
		const uiState = useUIStore.getState();
		const compositionWidth = currentState.compositionState.compositionWidth;
		const compositionHeight = currentState.compositionState.compositionHeight;
		const lastAddedItem = uiState.lastAddedItem;

		// Get canvas-size-specific defaults
		const canvasDefaults = getCodeItemDefaults(compositionWidth, compositionHeight);

		// Use full width and height with some padding
		const layoutPadding = 0;
		const width = compositionWidth - layoutPadding * 2;
		const height = compositionHeight - layoutPadding * 2;

		// Get position from last added item
		const fromFrame = getNextCodeItemPosition(currentState, lastAddedItem);

		// Get properties from last added code item if available
		const lastCodeItem =
			lastAddedItem?.type === 'code' ? lastAddedItem : null;

		// Use the last code item's code content, or default example code
		const code =
			lastCodeItem?.code ??
			`\`\`\`ts !
import { Pre, RawCode, highlight } from "codehike/code"

async function Code({codeblock}: {codeblock: RawCode}) {
  const highlighted = await highlight(codeblock, "material-ocean")
  return <Pre code={highlighted} style={highlighted.style} />
}
\`\`\``;

		const codeItem = makeCodeItemWithDimensions({
			id: generateRandomId('code'),
			from: fromFrame,
			durationInFrames: lastCodeItem?.durationInFrames ?? canvasDefaults.durationInFrames,
			code,
			left: layoutPadding,
			top: layoutPadding,
			width,
			height,
			fontSize: lastCodeItem?.fontSize ?? canvasDefaults.fontSize,
			fontFamily: lastCodeItem?.fontFamily ?? 'Fira Code',
			theme: lastCodeItem?.theme ?? 'poimandres',
			lineHeight: lastCodeItem?.lineHeight ?? 1.7,
			backgroundColor: lastCodeItem?.backgroundColor ?? 'transparent',
			padding: lastCodeItem?.padding ?? canvasDefaults.padding,
			borderRadius: lastCodeItem?.borderRadius ?? 0,
		});

		currentState.setState((prevState) => {
			addItem({
				state: prevState,
				item: codeItem,
				position: {type: 'back'},
			});
		});

		// Track the entire item as the last added item
		// Note: trackId is set by addItem, so we need to get the updated item
		const updatedItem =
			useEditorStore.getState().compositionState.items[codeItem.id];
		uiState.setLastAddedItem(updatedItem ?? codeItem);

		uiState.setSelectedItems([codeItem.id]);
	}, []);

	/**
	 * Add a shape item to the composition
	 *
	 * Creates a circle shape at the center of the canvas.
	 * For POC, we're creating a circle by default - in future versions,
	 * this could open a shape selector dialog.
	 */
	const addShapeItem = useCallback(() => {
		const currentState = useEditorStore.getState();
		const uiState = useUIStore.getState();
		const compositionWidth = currentState.compositionState.compositionWidth;
		const compositionHeight = currentState.compositionState.compositionHeight;

		// Get current playhead position
		const fromFrame = playerRef.current?.getCurrentFrame() ?? 0;

		// Create a circle shape at center of canvas
		const shapeItem = makeShapeItem({
			variant: 'circle',
			from: fromFrame,
			left: Math.round(compositionWidth / 2 - 50), // Center horizontally
			top: Math.round(compositionHeight / 2 - 50), // Center vertically
			width: 100,
			height: 100,
			fill: 'rgba(59, 130, 246, 0.5)', // Blue with transparency
			stroke: '#3b82f6', // Blue stroke
			strokeWidth: 3,
		});

		// Add the shape to the composition
		currentState.setState((prevState) => {
			addItem({
				state: prevState,
				item: shapeItem,
				position: {type: 'front'}, // Add to front
			});
		});

		// Track as last added item
		const updatedItem =
			useEditorStore.getState().compositionState.items[shapeItem.id];
		uiState.setLastAddedItem(updatedItem ?? shapeItem);

		// Select the new shape
		uiState.setSelectedItems([shapeItem.id]);
	}, [playerRef]);

	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const addFile = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files) return;

			const currentState = useEditorStore.getState();
			// Get tracks from current timeline context (could be inside a composite)
			const tracks = getCurrentTracks(currentState);
			const uploadPromises = [];
			for (const file of files) {
				uploadPromises.push(
					addAsset({
						file,
						setState,
						playerRef,
						dropPosition: null,
						fps: currentState.compositionState.fps,
						compositionWidth: currentState.compositionState.compositionWidth,
						compositionHeight: currentState.compositionState.compositionHeight,
						tracks,
						filename: file.name,
					}),
				);
			}
			await Promise.all(uploadPromises);
			// Allow for more files to be added
			e.target.value = '';
		},
		[playerRef, setState],
	);
	return (
		<>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*,video/*,audio/*"
				onChange={handleFileChange}
				className="hidden"
				multiple
			/>
			<div className="flex overflow-hidden rounded bg-white/5">
				<button
					data-active={editMode === 'select'}
					className="editor-starter-focus-ring flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/10 data-[active=true]:bg-white/10"
					title="Select"
					onClick={setSelectEditMode}
					aria-label="Select"
				>
					<EditModeIcon
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						className="w-4"
					/>
				</button>

				{FEATURE_DRAW_SOLID_TOOL ? (
					<>
						<div className="bg-editor-starter-panel w-px"></div>
						<button
							onClick={setSolidEditMode}
							data-active={editMode === 'draw-solid'}
							className="editor-starter-focus-ring flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/10 data-[active=true]:bg-white/10"
							title="Add Solid"
							aria-label="Add Solid"
						>
							<SolidIcon className="w-4" />
						</button>
					</>
				) : null}
				{FEATURE_CREATE_TEXT_TOOL ? (
					<>
						<div className="bg-editor-starter-panel w-px"></div>
						<button
							onClick={setCreateTextMode}
							data-active={editMode === 'create-text'}
							className="editor-starter-focus-ring flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/10 data-[active=true]:bg-white/10"
							title="Add Text"
							aria-label="Add Text"
						>
							<TextIcon className="w-4" />
						</button>
					</>
				) : null}
				{FEATURE_CREATE_CODE_TOOL ? (
					<>
						<div className="bg-editor-starter-panel w-px"></div>
						<button
							onClick={addCodeItem}
							className="editor-starter-focus-ring flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/10"
							title="Add Code Block"
							aria-label="Add Code Block"
						>
							<CodeIcon className="w-4" />
						</button>
					</>
				) : null}
				{/* POC: Shape tool - creates a circle shape */}
				<>
					<div className="bg-editor-starter-panel w-px"></div>
					<button
						onClick={addShapeItem}
						className="editor-starter-focus-ring flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/10"
						title="Add Shape"
						aria-label="Add Shape"
					>
						<ShapeIcon className="w-4" />
					</button>
				</>
				{FEATURE_IMPORT_ASSETS_TOOL ? (
					<>
						<div className="bg-editor-starter-panel w-px"></div>
						<button
							onClick={addFile}
							className="editor-starter-focus-ring flex h-10 items-center justify-center gap-3 px-3 text-white transition-colors hover:bg-white/10"
							title="Add images, videos, and audio"
							aria-label="Add images, videos, and audio"
						>
							<ImageIcon />
							<VideoIcon />
							<AudioIcon />
						</button>
					</>
				) : null}
			</div>
			<TemplateDropdown playerRef={playerRef} />
			<AddFromUrlModal playerRef={playerRef} />
		</>
	);
};
