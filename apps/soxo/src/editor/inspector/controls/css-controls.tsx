import {Button} from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import {IconX} from '@tabler/icons-react';
import React, {memo, useCallback, useState} from 'react';
import {Rnd} from 'react-rnd';
import useEditorStore from '../../../zustand/editor-store';
import {EditorStarterItem} from '../../items/item-type';
import {useItemCss} from '../../selectors/hooks';

const CssControlsUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const css = useItemCss(itemId);
	const updateItem = useEditorStore((state) => state.updateItem);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [windowSize, setWindowSize] = useState({width: 600, height: 500});
	const [windowPosition, setWindowPosition] = useState(() => {
		// Position in bottom-right corner with some padding
		return {
			x: typeof window !== 'undefined' ? window.innerWidth - 640 : 100,
			y: typeof window !== 'undefined' ? window.innerHeight - 540 : 100,
		};
	});

	const onCssChange = useCallback(
		(newCss: string) => {
			// Parse and save CSS immediately when it changes
			let cssToSave = newCss;

			// Extract CSS properties from inside braces if using rule format
			const ruleMatch = cssToSave.match(/\{([^}]*)\}/);
			if (ruleMatch) {
				// Extract content inside braces and clean it up
				cssToSave = ruleMatch[1]
					.split('\n')
					.map((line) => line.trim())
					.filter(
						(line) =>
							line &&
							!line.startsWith('/*') &&
							!line.startsWith('*') &&
							!line.endsWith('*/'),
					)
					.join('\n')
					.trim();
			}

			// If still empty or only comments, save empty string
			if (
				!cssToSave ||
				cssToSave.trim() === '' ||
				/^\/\*[\s\S]*?\*\/$/.test(cssToSave.trim())
			) {
				cssToSave = '';
			}

			updateItem(itemId, (item: EditorStarterItem) => ({
				...item,
				css: cssToSave,
			}));
		},
		[updateItem, itemId],
	);

	const handleEditorChange = useCallback(
		(value: string | undefined) => {
			// Debounce the CSS change to avoid too many updates while typing
			const newCss = value ?? '';
			onCssChange(newCss);
		},
		[onCssChange],
	);

	const handleOpenDialog = useCallback(() => {
		setIsDialogOpen(true);
	}, []);

	const hasCss = css.trim().length > 0;

	// Format CSS for display in editor (with .element wrapper)
	const editorValue = hasCss
		? `.element {\n\t${css.split('\n').join('\n\t')}\n}`
		: `.element {
\t/* Write your CSS properties here */
\t/* Examples: */
\t/* border: 2px solid #ff6b6b; */
\t/* border-radius: 10px; */
\t/* box-shadow: 0 4px 20px rgba(0,0,0,0.2); */
\t/* filter: blur(1px); */
\t/* transform: scale(1.05); */

}`;

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleOpenDialog}
				className="w-full"
			>
				{hasCss ? 'Edit Styles' : 'Add Styles'}
			</Button>

			{/* CSS Editor - Draggable & Resizable Window */}
			{isDialogOpen && (
				<div className="pointer-events-none fixed inset-0 z-99">
					{/* Backdrop - no click to close, only visual */}
					{/* <div className="pointer-events-none absolute inset-0 bg-black/20" /> */}
					{/* Draggable Resizable Window */}
					<Rnd
						size={windowSize}
						position={windowPosition}
						onDragStop={(e, d) => {
							setWindowPosition({x: d.x, y: d.y});
						}}
						onResizeStop={(e, direction, ref, delta, position) => {
							setWindowSize({
								width: ref.offsetWidth,
								height: ref.offsetHeight,
							});
							setWindowPosition(position);
						}}
						minWidth={400}
						minHeight={300}
						maxWidth={window.innerWidth - 40}
						maxHeight={window.innerHeight - 40}
						bounds="window"
						style={{
							zIndex: 10001,
							pointerEvents: 'auto',
						}}
						dragHandleClassName="css-editor-drag-handle"
						enableResizing={{
							top: true,
							right: true,
							bottom: true,
							left: true,
							topRight: true,
							bottomRight: true,
							bottomLeft: true,
							topLeft: true,
						}}
						cancel=".monaco-editor, .monaco-editor *, .monaco-suggest-widget, .monaco-suggest-widget *"
					>
						<div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/20 bg-[#1a1a1a] shadow-2xl">
							{/* Header - Draggable */}
							<div className="css-editor-drag-handle flex items-center justify-between border-b border-white/10 bg-[#252525] px-4 py-3">
								<h3 className="text-sm font-medium text-white">
									CSS Styles Editor
								</h3>
								<button
									type="button"
									onClick={() => setIsDialogOpen(false)}
									className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
									aria-label="Close"
								>
									<IconX className="h-4 w-4" />
								</button>
							</div>

							{/* Content */}
							<div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
								<div className="text-xs text-white/70">
									Write CSS inside the{' '}
									<code className="rounded bg-white/10 px-1">.element</code>{' '}
									braces. Styles are applied automatically.
								</div>
								<div className="flex-1 overflow-hidden rounded border border-white/10">
									<Editor
										height="100%"
										language="css"
										value={editorValue}
										onChange={handleEditorChange}
										theme="vs-dark"
										options={{
											minimap: {enabled: false},
											fontSize: 14,
											fontFamily: 'Fira Code, monospace',
											fontLigatures: true,
											lineNumbers: 'on',
											scrollBeyondLastLine: false,
											automaticLayout: true,
											tabSize: 2,
											wordWrap: 'on',
											padding: {top: 16, bottom: 16},
											scrollbar: {
												vertical: 'visible',
												horizontal: 'visible',
												useShadows: false,
											},
											suggestOnTriggerCharacters: true,
											acceptSuggestionOnEnter: 'on',
											quickSuggestions: {
												other: true,
												comments: false,
												strings: true,
											},
											parameterHints: {
												enabled: true,
											},
											folding: true,
											renderLineHighlight: 'all',
											
											selectionHighlight: false,
											// Fix suggestion positioning
											suggest: {
												showKeywords: true,
												showSnippets: true,
												showProperties: true,
												showFunctions: true,
												showValues: true,
											},
											// Ensure proper editor behavior
											readOnly: false,
											domReadOnly: false,
											contextmenu: true,
										}}
										beforeMount={(monaco) => {
											monaco.languages.css.cssDefaults.setOptions({
												validate: true,
												lint: {
													compatibleVendorPrefixes: 'warning',
													vendorPrefix: 'warning',
													duplicateProperties: 'warning',
													emptyRules: 'ignore',
													importStatement: 'ignore',
													boxModel: 'ignore',
													universalSelector: 'ignore',
													zeroUnits: 'ignore',
													fontFaceProperties: 'ignore',
													hexColorLength: 'warning',
													argumentsInColorFunction: 'warning',
													unknownProperties: 'warning',
													ieHack: 'ignore',
													unknownVendorSpecificProperties: 'warning',
													propertyIgnoredDueToDisplay: 'warning',
													important: 'ignore',
													float: 'ignore',
													idSelector: 'ignore',
												},
											});
										}}
									/>
								</div>
							</div>
						</div>
					</Rnd>
				</div>
			)}
		</>
	);
};

export const CssControls = memo(CssControlsUnmemoized);
