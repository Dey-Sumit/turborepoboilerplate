import React, {useCallback} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {exitCompositeEditMode} from '../state/actions/composite-navigation';
import {
	findCompositeInHierarchy,
	isAtRootLevel,
} from '../state/helpers/get-current-timeline';

export const CompositeBreadcrumb: React.FC = () => {
	const setState = useEditorStore((state) => state.setState);

	const isInsideComposite = useEditorStore(
		(state) => !isAtRootLevel(state.compositionState),
	);

	const currentComposite = useEditorStore((state) => {
		if (isAtRootLevel(state.compositionState)) return null;
		const stack = state.compositionState.timelineViewStack;
		const currentEntry = stack[stack.length - 1];
		if (currentEntry.type !== 'COMPOSITE') return null;
		return findCompositeInHierarchy(state, currentEntry.compositeId);
	});

	const handleGoBack = useCallback(() => {
		setState((state) => {
			exitCompositeEditMode(state);
		});
	}, [setState]);

	if (!isInsideComposite) {
		return null;
	}

	return (
		<div className="bg-editor-starter-panel border-editor-starter-border flex h-7 w-full items-center justify-between border-b px-3">
			<div className="flex items-center gap-3">
				<button
					onClick={handleGoBack}
					className="text-editor-starter-muted-foreground hover:text-editor-starter-foreground flex items-center gap-1.5 text-xs text-white transition-colors"
				>
					<svg
						width="10"
						height="10"
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M7.5 9L4.5 6L7.5 3" />
					</svg>
					<span>Back</span>
				</button>

				{currentComposite && (
					<>
						<div className="h-3 w-px bg-white/20" />
						<span className="text-xs text-white/50">
							Editing: {currentComposite.name}
						</span>
					</>
				)}
			</div>
		</div>
	);
};
