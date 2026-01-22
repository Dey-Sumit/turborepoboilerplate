import {useCallback, useSyncExternalStore} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {RedoIcon} from '../icons/redo';
import {clsx} from '../utils/clsx';

/**
 * Subscribe to temporal state for canRedo status
 */
function useCanRedo() {
	const subscribe = useCallback((callback: () => void) => {
		return useEditorStore.temporal.subscribe(callback);
	}, []);

	const getSnapshot = useCallback(() => {
		return useEditorStore.temporal.getState().futureStates.length > 0;
	}, []);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const RedoButton = () => {
	const canRedo = useCanRedo();

	const handleRedo = useCallback(() => {
		const temporal = useEditorStore.temporal.getState();
		if (temporal.futureStates.length > 0) {
			temporal.redo();
		}
	}, []);

	return (
		<div className="bg-white/5">
			<button
				className={clsx(
					'editor-starter-focus-ring flex h-10 w-10 items-center justify-center rounded text-white transition-colors',
					!canRedo && 'opacity-50 cursor-not-allowed',
					canRedo && 'hover:bg-white/10',
				)}
				disabled={!canRedo}
				title="Redo (Ctrl+Y / Cmd+Shift+Z)"
				onClick={handleRedo}
				aria-label="Redo"
			>
				<RedoIcon />
			</button>
		</div>
	);
};
