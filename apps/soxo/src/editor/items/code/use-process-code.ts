import {highlight, type HighlightedCode, type RawCode} from 'codehike/code';
import type {Theme} from '@code-hike/lighter';
import {useCallback, useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

interface UseProcessCodeResult {
	processedCode: HighlightedCode | null;
	isProcessing: boolean;
	error: string | null;
}

/**
 * Parse MDX code fence format to extract language, annotations, and code content
 * Format: ```language annotations\ncode\n```
 */
const parseMdxCode = (
	rawCode: string,
): {lang: string; meta: string; value: string} => {
	// Match the opening fence: ```language optional-annotations
	const openingMatch = rawCode.match(/^```(\w+)(?:\s+([^\n]*))?\n/);
	if (!openingMatch) {
		return {lang: 'typescript', meta: '', value: rawCode};
	}

	const lang = openingMatch[1] ?? 'typescript';
	const meta = openingMatch[2]?.trim() ?? '';

	// Remove opening fence and closing fence to get code content
	const withoutOpeningFence = rawCode.replace(/^```\w*[^\n]*\n/, '');
	const value = withoutOpeningFence.replace(/\n```\s*$/, '');

	return {lang, meta, value};
};

/**
 * Hook to process raw MDX code into CodeHike's HighlightedCode format
 * Uses delayRender/continueRender to block Remotion rendering until code is processed
 *
 * @param rawCode - MDX-formatted code string (```language !\n...code...\n```)
 * @param theme - CodeHike theme name (e.g., 'poimandres', 'slack-ochin', 'min-dark')
 * @returns Object with processedCode, isProcessing state, and any error
 */
export const useProcessCode = (
	rawCode: string,
	theme: string,
): UseProcessCodeResult => {
	const [processedCode, setProcessedCode] = useState<HighlightedCode | null>(
		null,
	);
	const [isProcessing, setIsProcessing] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const compileCode = useCallback(
		async (code: string, themeName: string): Promise<HighlightedCode> => {
			try {
				// Parse the MDX code fence format
				const {lang, meta, value} = parseMdxCode(code);

				// Create RawCode object for CodeHike
				const rawCodeBlock: RawCode = {
					lang,
					meta,
					value,
				};

				// Use CodeHike's highlight function with dynamic theme
				const highlighted = await highlight(rawCodeBlock, themeName as Theme);

				return highlighted;
			} catch (e) {
				console.error('Code compilation error:', e);
				throw e;
			}
		},
		[],
	);

	useEffect(() => {
		if (!rawCode) {
			setProcessedCode(null);
			setIsProcessing(false);
			return;
		}

		const handle = delayRender('Processing code with CodeHike...');
		let cancelled = false;

		const process = async () => {
			try {
				setIsProcessing(true);
				setError(null);

				const result = await compileCode(rawCode, theme);

				if (!cancelled) {
					setProcessedCode(result);
					setIsProcessing(false);
					continueRender(handle);
				}
			} catch (e) {
				if (!cancelled) {
					setError((e as Error).message);
					setIsProcessing(false);
					continueRender(handle);
				}
			}
		};

		process();

		return () => {
			cancelled = true;
		};
	}, [rawCode, theme, compileCode]);

	return {processedCode, isProcessing, error};
};
