import * as Dialog from '@radix-ui/react-dialog';
import Editor, {type Monaco} from '@monaco-editor/react';
import React, {useCallback, useState, useRef, useEffect} from 'react';
import type * as monacoEditor from 'monaco-editor';
import useEditorStore from '../../zustand/editor-store';
import {
	useCodeEditorOpenForItemId,
	useSetCodeEditorOpenForItemId,
} from '../../zustand/ui-store';

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

// Single consistent Monaco theme name
const MONACO_THEME_NAME = 'oxoven-dark';

// Define custom theme (Poimandres-inspired dark theme)
const defineCustomTheme = (monaco: Monaco) => {
	monaco.editor.defineTheme(MONACO_THEME_NAME, {
		base: 'vs-dark',
		inherit: true,
		rules: [
			{token: 'comment', foreground: '767c9d', fontStyle: 'italic'},
			{token: 'keyword', foreground: '5de4c7'},
			{token: 'keyword.control', foreground: '5de4c7'},
			{token: 'string', foreground: 'a6da95'},
			{token: 'number', foreground: 'd0679d'},
			{token: 'type', foreground: 'add7ff'},
			{token: 'type.identifier', foreground: 'add7ff'},
			{token: 'function', foreground: 'e4f0fb'},
			{token: 'variable', foreground: 'e4f0fb'},
			{token: 'variable.parameter', foreground: 'e4f0fb'},
			{token: 'constant', foreground: 'd0679d'},
			{token: 'operator', foreground: '91b4d5'},
			{token: 'delimiter', foreground: 'a6accd'},
			{token: 'delimiter.bracket', foreground: 'a6accd'},
			{token: 'tag', foreground: '5de4c7'},
			{token: 'attribute.name', foreground: 'add7ff'},
			{token: 'attribute.value', foreground: 'a6da95'},
		],
		colors: {
			'editor.background': '#1b1e28',
			'editor.foreground': '#e4f0fb',
			'editor.lineHighlightBackground': '#252836',
			'editor.selectionBackground': '#506477',
			'editorCursor.foreground': '#a6accd',
			'editorWhitespace.foreground': '#303340',
			'editorLineNumber.foreground': '#506477',
			'editorLineNumber.activeForeground': '#a6accd',
			'editor.inactiveSelectionBackground': '#303340',
		},
	});
};

// Supported languages for the dropdown
const SUPPORTED_LANGUAGES = [
	{value: 'typescript', label: 'TypeScript'},
	{value: 'javascript', label: 'JavaScript'},
	{value: 'tsx', label: 'TSX'},
	{value: 'jsx', label: 'JSX'},
	{value: 'python', label: 'Python'},
	{value: 'rust', label: 'Rust'},
	{value: 'go', label: 'Go'},
	{value: 'java', label: 'Java'},
	{value: 'c', label: 'C'},
	{value: 'cpp', label: 'C++'},
	{value: 'csharp', label: 'C#'},
	{value: 'html', label: 'HTML'},
	{value: 'css', label: 'CSS'},
	{value: 'json', label: 'JSON'},
	{value: 'markdown', label: 'Markdown'},
	{value: 'sql', label: 'SQL'},
	{value: 'shell', label: 'Shell'},
	{value: 'yaml', label: 'YAML'},
];

// Extract language from MDX code fence (```language)
const extractLanguageFromCode = (code: string): string => {
	const match = code.match(/^```(\w+)/);
	return match?.[1] ?? 'typescript';
};

// Extract actual code content from MDX code fence
const extractCodeContent = (code: string): string => {
	// Remove the opening fence with language and annotations
	const withoutOpeningFence = code.replace(/^```\w*[^\n]*\n/, '');
	// Remove the closing fence
	const withoutClosingFence = withoutOpeningFence.replace(/\n```\s*$/, '');
	return withoutClosingFence;
};

// Wrap code content back into MDX code fence format
const wrapCodeContent = (
	code: string,
	language: string,
	annotations: string,
): string => {
	const annotationPart = annotations ? ` ${annotations}` : '';
	return `\`\`\`${language}${annotationPart}\n${code}\n\`\`\``;
};

// Get comment syntax for different languages
const getCommentSyntax = (
	language: string,
): {line: string; blockStart?: string; blockEnd?: string} => {
	switch (language) {
		case 'python':
		case 'shell':
		case 'yaml':
			return {line: '#'};
		case 'html':
		case 'markdown':
			return {line: '//', blockStart: '<!--', blockEnd: '-->'};
		case 'css':
			return {line: '//', blockStart: '/*', blockEnd: '*/'};
		case 'sql':
			return {line: '--'};
		default:
			// JavaScript, TypeScript, Java, C, C++, Go, Rust, etc.
			return {line: '//'};
	}
};

export const CodeEditorDialog: React.FC<{
	code: string;
	theme?: string; // Kept for API compatibility but not used (single theme)
	onSave: (code: string) => void;
	trigger: React.ReactNode;
}> = ({code, onSave, trigger}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [editedCode, setEditedCode] = useState('');
	const [language, setLanguage] = useState('typescript');
	// Track editor mount key to force re-mount when language/dialog changes
	const [editorKey, setEditorKey] = useState(0);
	const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
		null,
	);

	// Initialize state when dialog opens
	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				// Extract language and content when opening
				const extractedLang = extractLanguageFromCode(code);
				setLanguage(extractedLang);
				setEditedCode(extractCodeContent(code));
				// Force editor re-mount with correct language
				setEditorKey((prev) => prev + 1);
			}
			setIsOpen(open);
		},
		[code],
	);

	const handleSave = useCallback(() => {
		// Wrap the edited code back into MDX format (no annotations in header)
		const wrappedCode = wrapCodeContent(editedCode, language, '');
		onSave(wrappedCode);
		setIsOpen(false);
	}, [editedCode, language, onSave]);

	const handleEditorChange = useCallback((value: string | undefined) => {
		setEditedCode(value ?? '');
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			// Cmd/Ctrl + S to save
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				handleSave();
			}
		},
		[handleSave],
	);

	// Configure Monaco before it mounts - define theme and language settings
	const handleBeforeMount = useCallback((monaco: Monaco) => {
		// Define custom theme
		defineCustomTheme(monaco);

		// Configure TypeScript/JavaScript language features
		try {
			const tsDefaults = monaco.languages.typescript.typescriptDefaults;
			const jsxDefaults = monaco.languages.typescript.javascriptDefaults;

			const compilerOptions = {
				target: 99 as number, // Latest
				allowNonTsExtensions: true,
				moduleResolution: 2 as number, // NodeJs
				module: 1 as number, // CommonJS
				noEmit: true,
				esModuleInterop: true,
				jsx: 2 as number, // React
				reactNamespace: 'React',
				allowJs: true,
			};

			if (tsDefaults && typeof tsDefaults.setCompilerOptions === 'function') {
				tsDefaults.setCompilerOptions(compilerOptions);
				tsDefaults.setDiagnosticsOptions({
					noSemanticValidation: false,
					noSyntaxValidation: false,
				});
			}

			if (jsxDefaults && typeof jsxDefaults.setCompilerOptions === 'function') {
				jsxDefaults.setCompilerOptions(compilerOptions);
			}
		} catch (error) {
			console.warn('Could not configure Monaco TypeScript settings:', error);
		}
	}, []);

	// Handle editor mount
	const handleEditorMount = useCallback(
		(editor: monacoEditor.editor.IStandaloneCodeEditor) => {
			editorRef.current = editor;
			// Focus the editor when it mounts
			editor.focus();
		},
		[],
	);

	// Handle language change - force editor re-mount
	const handleLanguageChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			setLanguage(e.target.value);
			setEditorKey((prev) => prev + 1);
		},
		[],
	);

	// Insert annotation comment at the current cursor position or selected lines
	const insertAnnotation = useCallback(
		(annotationType: 'highlight' | 'focus') => {
			const editor = editorRef.current;
			if (!editor) return;

			const selection = editor.getSelection();
			if (!selection) return;

			const model = editor.getModel();
			if (!model) return;

			const commentSyntax = getCommentSyntax(language);
			const startLine = selection.startLineNumber;
			const endLine = selection.endLineNumber;

			// Build the annotation comment
			let annotationComment: string;
			if (startLine === endLine) {
				// Single line - just add the annotation before the line
				annotationComment = `${commentSyntax.line}!${annotationType}\n`;
			} else {
				// Multi-line - use the range syntax
				const lineCount = endLine - startLine + 1;
				annotationComment = `${commentSyntax.line}!${annotationType}(1:${lineCount})\n`;
			}

			// Insert at the beginning of the first selected line
			const lineContent = model.getLineContent(startLine);
			const leadingWhitespace = lineContent.match(/^\s*/)?.[0] ?? '';

			editor.executeEdits('insert-annotation', [
				{
					range: {
						startLineNumber: startLine,
						startColumn: 1,
						endLineNumber: startLine,
						endColumn: 1,
					},
					text: leadingWhitespace + annotationComment,
				},
			]);

			// Focus back to editor
			editor.focus();
		},
		[language],
	);

	return (
		<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
			<Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/70" />
				<Dialog.Content
					className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 h-[80vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-2xl focus:outline-none"
					onKeyDown={handleKeyDown}
				>
					<div className="flex h-full flex-col">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
							<Dialog.Title className="text-base font-semibold text-white">
								Edit Code
							</Dialog.Title>
							<Dialog.Close asChild>
								<button
									type="button"
									className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
									aria-label="Close"
								>
									<CloseIcon className="h-4 w-4" />
								</button>
							</Dialog.Close>
						</div>

						{/* Language selector and annotation buttons */}
						<div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-2">
							<div className="flex items-center gap-2">
								<label
									htmlFor="language-select"
									className="text-xs text-white/70"
								>
									Language:
								</label>
								<select
									id="language-select"
									value={language}
									onChange={handleLanguageChange}
									className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
								>
									{SUPPORTED_LANGUAGES.map((lang) => (
										<option key={lang.value} value={lang.value}>
											{lang.label}
										</option>
									))}
								</select>
							</div>

							{/* Annotation buttons */}
							<div className="flex items-center gap-2">
								<span className="text-xs text-white/50">Annotations:</span>
								<button
									type="button"
									onClick={() => insertAnnotation('highlight')}
									className="rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400 transition-colors hover:bg-yellow-500/20"
									title="Add highlight annotation to selected lines"
								>
									Highlight
								</button>
								<button
									type="button"
									onClick={() => insertAnnotation('focus')}
									className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/20"
									title="Add focus annotation to selected lines"
								>
									Focus
								</button>
							</div>
						</div>

						{/* Description */}
						<Dialog.Description className="sr-only">
							Edit the code content. Use Cmd+S to save.
						</Dialog.Description>

						{/* Monaco Editor */}
						<div className="flex-1 overflow-hidden">
							<Editor
								key={editorKey}
								height="100%"
								language={language}
								value={editedCode}
								onChange={handleEditorChange}
								theme={MONACO_THEME_NAME}
								beforeMount={handleBeforeMount}
								onMount={handleEditorMount}
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
									formatOnPaste: true,
									formatOnType: true,
									suggest: {
										showKeywords: true,
										showSnippets: true,
									},
								}}
							/>
						</div>

						{/* Footer */}
						<div className="flex justify-between border-t border-white/10 px-4 py-3">
							<span className="text-xs text-white/40">
								Press Cmd+S (Ctrl+S) to save
							</span>
							<div className="flex gap-2">
								<Dialog.Close asChild>
									<button
										type="button"
										className="rounded bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
									>
										Cancel
									</button>
								</Dialog.Close>
								<button
									type="button"
									onClick={handleSave}
									className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
								>
									Save Code
								</button>
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

/**
 * Global code editor dialog that listens to UI store state
 * This enables opening the code editor from keyboard shortcuts (CMD+I)
 */
export const GlobalCodeEditorDialog: React.FC = () => {
	const codeEditorOpenForItemId = useCodeEditorOpenForItemId();
	const setCodeEditorOpenForItemId = useSetCodeEditorOpenForItemId();
	const updateItem = useEditorStore((state) => state.updateItem);

	// Get the code item from the store
	const codeItem = useEditorStore((state) => {
		if (!codeEditorOpenForItemId) return null;
		const item = state.compositionState.items[codeEditorOpenForItemId];
		if (item?.type === 'code') return item;
		return null;
	});

	const handleSave = useCallback(
		(newCode: string) => {
			if (!codeEditorOpenForItemId) return;
			updateItem(codeEditorOpenForItemId, (i) => {
				if (i.type !== 'code') return i;
				if (i.code === newCode) return i;
				return {
					...i,
					code: newCode,
					processedCode: null,
				};
			});
			setCodeEditorOpenForItemId(null);
		},
		[codeEditorOpenForItemId, updateItem, setCodeEditorOpenForItemId],
	);

	const handleClose = useCallback(() => {
		setCodeEditorOpenForItemId(null);
	}, [setCodeEditorOpenForItemId]);

	if (!codeItem) return null;

	return (
		<CodeEditorDialogControlled
			isOpen={true}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
			code={codeItem.code}
			theme={codeItem.theme}
			onSave={handleSave}
		/>
	);
};

/**
 * Controlled version of CodeEditorDialog for use with global state
 */
const CodeEditorDialogControlled: React.FC<{
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	code: string;
	theme?: string; // Kept for API compatibility but not used
	onSave: (code: string) => void;
}> = ({isOpen, onOpenChange, code, onSave}) => {
	const [editedCode, setEditedCode] = useState('');
	const [language, setLanguage] = useState('typescript');
	// Track editor key to force re-mount when dialog opens (fixes syntax highlighting)
	const [editorKey, setEditorKey] = useState(0);
	const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
		null,
	);

	// Initialize state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setLanguage(extractLanguageFromCode(code));
			setEditedCode(extractCodeContent(code));
			// Force editor re-mount with correct language
			setEditorKey((prev) => prev + 1);
		}
	}, [isOpen, code]);

	const handleSave = useCallback(() => {
		// Wrap the edited code back into MDX format (no annotations field)
		const wrappedCode = wrapCodeContent(editedCode, language, '');
		onSave(wrappedCode);
	}, [editedCode, language, onSave]);

	const handleEditorChange = useCallback((value: string | undefined) => {
		setEditedCode(value ?? '');
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				handleSave();
			}
		},
		[handleSave],
	);

	// Configure Monaco before it mounts - define theme and language settings
	const handleBeforeMount = useCallback((monaco: Monaco) => {
		// Define custom theme
		defineCustomTheme(monaco);

		// Configure TypeScript/JavaScript language features
		try {
			const tsDefaults = monaco.languages.typescript.typescriptDefaults;
			const jsxDefaults = monaco.languages.typescript.javascriptDefaults;

			const compilerOptions = {
				target: 99 as number,
				allowNonTsExtensions: true,
				moduleResolution: 2 as number,
				module: 1 as number,
				noEmit: true,
				esModuleInterop: true,
				jsx: 2 as number,
				reactNamespace: 'React',
				allowJs: true,
			};

			if (tsDefaults && typeof tsDefaults.setCompilerOptions === 'function') {
				tsDefaults.setCompilerOptions(compilerOptions);
				tsDefaults.setDiagnosticsOptions({
					noSemanticValidation: false,
					noSyntaxValidation: false,
				});
			}

			if (jsxDefaults && typeof jsxDefaults.setCompilerOptions === 'function') {
				jsxDefaults.setCompilerOptions(compilerOptions);
			}
		} catch (error) {
			console.warn('Could not configure Monaco TypeScript settings:', error);
		}
	}, []);

	const handleEditorMount = useCallback(
		(editor: monacoEditor.editor.IStandaloneCodeEditor) => {
			editorRef.current = editor;
			// Focus the editor when it mounts
			editor.focus();
		},
		[],
	);

	// Insert annotation comment at the current cursor position or selected lines
	const insertAnnotation = useCallback(
		(annotationType: 'highlight' | 'focus') => {
			const editor = editorRef.current;
			if (!editor) return;

			const selection = editor.getSelection();
			if (!selection) return;

			const model = editor.getModel();
			if (!model) return;

			const commentSyntax = getCommentSyntax(language);
			const startLine = selection.startLineNumber;
			const endLine = selection.endLineNumber;

			// Build the annotation comment
			let annotationComment: string;
			if (startLine === endLine) {
				annotationComment = `${commentSyntax.line}!${annotationType}\n`;
			} else {
				const lineCount = endLine - startLine + 1;
				annotationComment = `${commentSyntax.line}!${annotationType}(1:${lineCount})\n`;
			}

			const lineContent = model.getLineContent(startLine);
			const leadingWhitespace = lineContent.match(/^\s*/)?.[0] ?? '';

			editor.executeEdits('insert-annotation', [
				{
					range: {
						startLineNumber: startLine,
						startColumn: 1,
						endLineNumber: startLine,
						endColumn: 1,
					},
					text: leadingWhitespace + annotationComment,
				},
			]);

			editor.focus();
		},
		[language],
	);

	return (
		<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/70" />
				<Dialog.Content
					className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 h-[80vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-2xl focus:outline-none"
					onKeyDown={handleKeyDown}
				>
					<div className="flex h-full flex-col">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
							<Dialog.Title className="text-base font-semibold text-white">
								Edit Code
							</Dialog.Title>
							<Dialog.Close asChild>
								<button
									type="button"
									className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
									aria-label="Close"
								>
									<CloseIcon className="h-4 w-4" />
								</button>
							</Dialog.Close>
						</div>

						{/* Language selector and annotation buttons */}
						<div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-2">
							<div className="flex items-center gap-2">
								<label
									htmlFor="language-select-controlled"
									className="text-xs text-white/70"
								>
									Language:
								</label>
								<select
									id="language-select-controlled"
									value={language}
									onChange={(e) => setLanguage(e.target.value)}
									className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
								>
									{SUPPORTED_LANGUAGES.map((lang) => (
										<option key={lang.value} value={lang.value}>
											{lang.label}
										</option>
									))}
								</select>
							</div>

							{/* Annotation buttons */}
							<div className="flex items-center gap-2">
								<span className="text-xs text-white/50">Annotations:</span>
								<button
									type="button"
									onClick={() => insertAnnotation('highlight')}
									className="rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400 transition-colors hover:bg-yellow-500/20"
									title="Add highlight annotation to selected lines"
								>
									Highlight
								</button>
								<button
									type="button"
									onClick={() => insertAnnotation('focus')}
									className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/20"
									title="Add focus annotation to selected lines"
								>
									Focus
								</button>
							</div>
						</div>

						<Dialog.Description className="sr-only">
							Edit the code content. Use Cmd+S to save.
						</Dialog.Description>

						{/* Monaco Editor */}
						<div className="flex-1 overflow-hidden">
							<Editor
								key={editorKey}
								height="100%"
								language={language}
								value={editedCode}
								onChange={handleEditorChange}
								theme={MONACO_THEME_NAME}
								beforeMount={handleBeforeMount}
								onMount={handleEditorMount}
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
									formatOnPaste: true,
									formatOnType: true,
									suggest: {
										showKeywords: true,
										showSnippets: true,
									},
								}}
							/>
						</div>

						{/* Footer */}
						<div className="flex justify-between border-t border-white/10 px-4 py-3">
							<span className="text-xs text-white/40">
								Press Cmd+S (Ctrl+S) to save
							</span>
							<div className="flex gap-2">
								<Dialog.Close asChild>
									<button
										type="button"
										className="rounded bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
									>
										Cancel
									</button>
								</Dialog.Close>
								<button
									type="button"
									onClick={handleSave}
									className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
								>
									Save Code
								</button>
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
