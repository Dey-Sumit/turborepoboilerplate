import type {HighlightedCode} from 'codehike/code';
import {BaseItem, CanHaveRotation} from '../shared';

export type CodeItem = BaseItem &
	CanHaveRotation & {
		type: 'code';

		// Raw MDX code content (what user writes)
		// Format: ```language !\n...code...\n```
		code: string;

		// Processed code (parsed by CodeHike) - cached after compilation
		processedCode: HighlightedCode | null;

		// Styling options
		fontSize: number;
		fontFamily: string; // e.g., 'Fira Code'
		theme: string; // e.g., 'github-dark', 'dracula'
		lineHeight: number;

		// Animation options
		tokenTransitionDuration: number; // in seconds
		disableTokenTransitions: boolean;

		// Visual options
		backgroundColor: string;
		padding: number;
		borderRadius: number;

		// Fade support (like TextItem)
		fadeInDurationInSeconds: number;
		fadeOutDurationInSeconds: number;
	};
