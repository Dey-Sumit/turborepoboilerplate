import {useCallback, useMemo, useState, useSyncExternalStore} from 'react';
import useEditorStore from '../../zustand/editor-store';

type TemporalState = {
	compositionState?: {
		tracks?: unknown[];
		items?: Record<string, unknown>;
		assets?: Record<string, unknown>;
		[key: string]: unknown;
	};
};

/**
 * Hook to subscribe to temporal state changes without causing re-renders
 * that trigger state saves. Uses useSyncExternalStore for proper subscription.
 */
function useTemporalState() {
	const temporal = useEditorStore.temporal;

	const subscribe = useCallback(
		(callback: () => void) => {
			// Subscribe to the temporal store
			return temporal.subscribe(callback);
		},
		[temporal],
	);

	const getSnapshot = useCallback(() => {
		return temporal.getState();
	}, [temporal]);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const StateCard: React.FC<{
	title: string;
	state: TemporalState | null;
	index?: number;
	isActive?: boolean;
}> = ({title, state, index, isActive}) => {
	const [expanded, setExpanded] = useState(false);

	if (!state) {
		return (
			<div className="rounded border border-zinc-700 bg-zinc-800/50 p-2">
				<div className="text-xs text-zinc-500">{title}: null</div>
			</div>
		);
	}

	const compositionState = state.compositionState;
	const itemCount = compositionState?.items
		? Object.keys(compositionState.items).length
		: 0;
	const trackCount = compositionState?.tracks?.length ?? 0;
	const assetCount = compositionState?.assets
		? Object.keys(compositionState.assets).length
		: 0;

	return (
		<div
			className={`rounded border p-2 ${
				isActive
					? 'border-blue-500 bg-blue-500/10'
					: 'border-zinc-700 bg-zinc-800/50'
			}`}
		>
			<div
				className="flex cursor-pointer items-center justify-between"
				onClick={() => setExpanded(!expanded)}
			>
				<div className="text-xs font-medium text-zinc-300">
					{index !== undefined ? `${index}. ` : ''}
					{title}
				</div>
				<div className="text-xs text-zinc-500">{expanded ? '▼' : '▶'}</div>
			</div>

			<div className="mt-1 flex gap-2 text-xs text-zinc-400">
				<span>Items: {itemCount}</span>
				<span>Tracks: {trackCount}</span>
				<span>Assets: {assetCount}</span>
			</div>

			{expanded && (
				<div className="mt-2 max-h-40 overflow-auto rounded bg-zinc-900 p-2">
					<pre className="text-xs text-zinc-400">
						{JSON.stringify(compositionState, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
};

export const TemporalDebugPanel: React.FC = () => {
	const [isOpen, setIsOpen] = useState(true);
	const [activeTab, setActiveTab] = useState<'past' | 'present' | 'future'>(
		'present',
	);

	// Use proper subscription to temporal state
	const temporalState = useTemporalState();

	const pastStates = temporalState.pastStates as TemporalState[];
	const futureStates = temporalState.futureStates as TemporalState[];
	const isTracking = temporalState.isTracking;

	// Get current compositionState directly from the store snapshot
	// This avoids creating a subscription that could trigger re-renders
	const currentCompositionState = useMemo(() => {
		return useEditorStore.getState().compositionState;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [temporalState]); // Re-compute when temporal state changes (after undo/redo)

	const handleUndo = useCallback(() => {
		if (pastStates.length > 0) {
			useEditorStore.temporal.getState().undo();
		}
	}, [pastStates.length]);

	const handleRedo = useCallback(() => {
		if (futureStates.length > 0) {
			useEditorStore.temporal.getState().redo();
		}
	}, [futureStates.length]);

	const handleClear = useCallback(() => {
		useEditorStore.temporal.getState().clear();
	}, []);

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-4 right-4 z-50 rounded bg-zinc-800 px-3 py-1 text-xs text-zinc-300 shadow-lg hover:bg-zinc-700"
			>
				Debug Panel
			</button>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 flex max-h-[80vh] w-96 flex-col rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-zinc-700 p-3">
				<h3 className="text-sm font-semibold text-zinc-200">
					Temporal Debug Panel
				</h3>
				<button
					onClick={() => setIsOpen(false)}
					className="text-zinc-400 hover:text-zinc-200"
				>
					✕
				</button>
			</div>

			{/* Stats */}
			<div className="flex gap-4 border-b border-zinc-700 px-3 py-2 text-xs">
				<span className="text-zinc-400">
					Past: <span className="text-orange-400">{pastStates.length}</span>
				</span>
				<span className="text-zinc-400">
					Future: <span className="text-green-400">{futureStates.length}</span>
				</span>
				<span className="text-zinc-400">
					Can Undo:{' '}
					<span
						className={
							pastStates.length > 0 ? 'text-green-400' : 'text-red-400'
						}
					>
						{pastStates.length > 0 ? 'Yes' : 'No'}
					</span>
				</span>
				<span className="text-zinc-400">
					Can Redo:{' '}
					<span
						className={
							futureStates.length > 0 ? 'text-green-400' : 'text-red-400'
						}
					>
						{futureStates.length > 0 ? 'Yes' : 'No'}
					</span>
				</span>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-zinc-700">
				<button
					onClick={() => setActiveTab('past')}
					className={`flex-1 px-3 py-2 text-xs ${
						activeTab === 'past'
							? 'bg-orange-500/20 text-orange-400'
							: 'text-zinc-400 hover:bg-zinc-800'
					}`}
				>
					Past ({pastStates.length})
				</button>
				<button
					onClick={() => setActiveTab('present')}
					className={`flex-1 px-3 py-2 text-xs ${
						activeTab === 'present'
							? 'bg-blue-500/20 text-blue-400'
							: 'text-zinc-400 hover:bg-zinc-800'
					}`}
				>
					Present
				</button>
				<button
					onClick={() => setActiveTab('future')}
					className={`flex-1 px-3 py-2 text-xs ${
						activeTab === 'future'
							? 'bg-green-500/20 text-green-400'
							: 'text-zinc-400 hover:bg-zinc-800'
					}`}
				>
					Future ({futureStates.length})
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 space-y-2 overflow-auto p-3">
				{activeTab === 'past' && (
					<>
						{pastStates.length === 0 ? (
							<div className="py-4 text-center text-xs text-zinc-500">
								No past states (nothing to undo)
							</div>
						) : (
							[...pastStates].reverse().map((state, idx) => (
								<StateCard
									key={pastStates.length - 1 - idx}
									title={`Past State`}
									state={state}
									index={pastStates.length - idx}
								/>
							))
						)}
					</>
				)}

				{activeTab === 'present' && (
					<StateCard
						title="Current State"
						state={{compositionState: currentCompositionState}}
						isActive
					/>
				)}

				{activeTab === 'future' && (
					<>
						{futureStates.length === 0 ? (
							<div className="py-4 text-center text-xs text-zinc-500">
								No future states (nothing to redo)
							</div>
						) : (
							futureStates.map((state, idx) => (
								<StateCard
									key={idx}
									title={`Future State`}
									state={state}
									index={idx + 1}
								/>
							))
						)}
					</>
				)}
			</div>

			{/* Actions */}
			<div className="flex gap-2 border-t border-zinc-700 p-3">
				<button
					onClick={handleUndo}
					disabled={pastStates.length === 0}
					className="flex-1 rounded bg-orange-600 px-3 py-1.5 text-xs text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Undo
				</button>
				<button
					onClick={handleRedo}
					disabled={futureStates.length === 0}
					className="flex-1 rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Redo
				</button>
				<button
					onClick={handleClear}
					className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500"
				>
					Clear History
				</button>
			</div>

			{/* Pause Status */}
			<div className="border-t border-zinc-700 px-3 py-2 text-xs text-zinc-500">
				Temporal Status:{' '}
				<span className={isTracking ? 'text-green-400' : 'text-yellow-400'}>
					{isTracking ? 'Tracking' : 'Paused'}
				</span>
			</div>
		</div>
	);
};
