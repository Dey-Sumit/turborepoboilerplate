import {useCallback, useSyncExternalStore} from 'react';
import useEditorStore from '../../zustand/editor-store';
import {UndoIcon} from '../icons/undo';
import {clsx} from '../utils/clsx';

/**
 * Subscribe to temporal state for canUndo status
 */
function useCanUndo() {
	const subscribe = useCallback((callback: () => void) => {
		return useEditorStore.temporal.subscribe(callback);
	}, []);

	const getSnapshot = useCallback(() => {
		return useEditorStore.temporal.getState().pastStates.length > 0;
	}, []);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const UndoButton = () => {
	const canUndo = useCanUndo();

	const handleUndo = useCallback(() => {
		const temporal = useEditorStore.temporal.getState();
		if (temporal.pastStates.length > 0) {
			temporal.undo();
		}
	}, []);

	return (
		<div className="bg-white/5">
			<button
				className={clsx(
					'editor-starter-focus-ring flex h-10 w-10 items-center justify-center rounded text-white transition-colors',
					!canUndo && 'opacity-50 cursor-not-allowed',
					canUndo && 'hover:bg-white/10',
				)}
				title="Undo (Ctrl+Z / Cmd+Z)"
				onClick={handleUndo}
				disabled={!canUndo}
				aria-label="Undo (Ctrl+Z / Cmd+Z)"
			>
				<UndoIcon />
			</button>
		</div>
	);
};
