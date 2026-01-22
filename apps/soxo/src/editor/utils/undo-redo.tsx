import {useCallback, useMemo, useRef, useSyncExternalStore} from 'react';
import useUIStore from '../../zustand/ui-store';
import {EditorState, compositionState} from '../state/types';
import {filterSelectedItemstoOnlyReturnExistingItems} from './filter-selected-items-for-only-existing-items';

const MAX_HISTORY_SIZE = 50;

interface HistoryState {
	entries: compositionState[];
	index: number;
}

const onServer = () => false;

export const useUndoRedo = (
	setState: React.Dispatch<React.SetStateAction<EditorState>>,
) => {
	const historyState = useRef<HistoryState>({
		entries: [],
		index: 0,
	});

	const listeners = useRef<(() => void)[]>([]);

	const isUndoRedoOperation = useRef(false);

	const pushHistory = useCallback(
		(stateSnapshot: compositionState) => {
			const prevState = historyState.current;
			const lastEntry =
				historyState.current.entries[historyState.current.entries.length - 1];
			if (lastEntry && lastEntry === stateSnapshot) {
				return;
			}

			const truncated = prevState.entries.slice(0, prevState.index + 1);
			let newEntries = [...truncated, stateSnapshot];

			if (newEntries.length > MAX_HISTORY_SIZE) {
				newEntries = newEntries.slice(newEntries.length - MAX_HISTORY_SIZE);
			}

			historyState.current = {
				entries: newEntries,
				index: newEntries.length - 1,
			};
		},
		[historyState],
	);

	const undo = useCallback(() => {
		const prevState = historyState.current;
		if (prevState.index === 0) {
			return;
		}

		const newIndex = prevState.index - 1;
		const stateToRestore = prevState.entries[newIndex];

		if (stateToRestore) {
			isUndoRedoOperation.current = true;

			// Update Zustand store - filter selected items to only existing ones
			const currentSelectedItems = useUIStore.getState().selectedItems;
			const filteredSelectedItems =
				filterSelectedItemstoOnlyReturnExistingItems({
					selectedItems: currentSelectedItems,
					items: stateToRestore.items,
				});
			useUIStore.getState().setSelectedItems(filteredSelectedItems);

			setState((prev) => {
				return {
					...prev,
					compositionState: stateToRestore,
				};
			});
		}

		historyState.current = {
			...prevState,
			index: newIndex,
		};
		listeners.current.forEach((cb) => cb());
	}, [setState]);

	const redo = useCallback(() => {
		const prevState = historyState.current;
		if (prevState.index >= prevState.entries.length - 1) {
			return;
		}

		const newIndex = prevState.index + 1;
		const stateToRestore = prevState.entries[newIndex];

		if (stateToRestore) {
			isUndoRedoOperation.current = true;

			// Update Zustand store - filter selected items to only existing ones
			const currentSelectedItems = useUIStore.getState().selectedItems;
			const filteredSelectedItems =
				filterSelectedItemstoOnlyReturnExistingItems({
					selectedItems: currentSelectedItems,
					items: stateToRestore.items,
				});
			useUIStore.getState().setSelectedItems(filteredSelectedItems);

			setState((prev) => ({
				...prev,
				compositionState: stateToRestore,
			}));
		}

		historyState.current = {
			...prevState,
			index: newIndex,
		};
		listeners.current.forEach((cb) => cb());
	}, [setState]);

	const canUndoImperative = useCallback(() => {
		const prevState = historyState.current;
		return prevState.index > 0;
	}, []);

	const canRedoImperative = useCallback(() => {
		const prevState = historyState.current;
		return prevState.index < prevState.entries.length - 1;
	}, []);

	const canRedo = useSyncExternalStore(
		(cb) => {
			listeners.current.push(cb);
			return () => {
				listeners.current = listeners.current.filter((l) => l !== cb);
			};
		},
		canRedoImperative,
		onServer,
	);

	const canUndo = useSyncExternalStore(
		(cb) => {
			listeners.current.push(cb);
			return () => {
				listeners.current = listeners.current.filter((l) => l !== cb);
			};
		},
		canUndoImperative,
		onServer,
	);

	return useMemo(
		() => ({undo, redo, pushHistory, canUndo, canRedo}),
		[undo, redo, pushHistory, canUndo, canRedo],
	);
};
