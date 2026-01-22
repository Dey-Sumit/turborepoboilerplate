import {useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';
import {
	CaptionPreset,
	deletePreset as dbDeletePreset,
	getAllPresets,
	getPresetsCache,
	onPresetsChanged,
	savePreset as dbSavePreset,
} from './caption-presets-db';

interface UseCaptionPresetsResult {
	presets: CaptionPreset[];
	loading: boolean;
	error: Error | null;
}

/**
 * React hook that provides reactive access to caption presets
 * Automatically updates when presets are modified
 */
export const useCaptionPresets = (): UseCaptionPresetsResult => {
	const [presets, setPresets] = useState<CaptionPreset[]>(() => {
		// Initialize from cache if available
		return getPresetsCache() ?? [];
	});
	const [loading, setLoading] = useState<boolean>(() => {
		// If cache is null, we're loading
		return getPresetsCache() === null;
	});
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isMounted = true;

		// Load initial presets
		const loadPresets = async () => {
			try {
				const allPresets = await getAllPresets();
				if (isMounted) {
					setPresets(allPresets);
					setLoading(false);
				}
			} catch (err) {
				if (isMounted) {
					setError(err instanceof Error ? err : new Error('Failed to load presets'));
					setLoading(false);
				}
			}
		};

		// Only load if cache is empty
		if (getPresetsCache() === null) {
			loadPresets();
		}

		// Subscribe to preset changes
		const unsubscribe = onPresetsChanged(() => {
			const cache = getPresetsCache();
			if (cache && isMounted) {
				setPresets(cache);
			}
		});

		return () => {
			isMounted = false;
			unsubscribe();
		};
	}, []);

	return {presets, loading, error};
};

interface UsePresetActionsResult {
	savePreset: (preset: CaptionPreset) => Promise<void>;
	deletePreset: (id: string) => Promise<void>;
}

/**
 * React hook that provides actions for managing presets
 */
export const usePresetActions = (): UsePresetActionsResult => {
	const savePreset = useCallback(async (preset: CaptionPreset) => {
		try {
			await dbSavePreset(preset);
			toast.success('Preset saved successfully', {
				description: `"${preset.name}" is now available in your presets.`,
			});
		} catch (err) {
			console.error('Failed to save preset:', err);
			toast.error('Failed to save preset', {
				description: err instanceof Error ? err.message : 'An unknown error occurred',
			});
			throw err;
		}
	}, []);

	const deletePreset = useCallback(async (id: string) => {
		try {
			await dbDeletePreset(id);
			toast.success('Preset deleted');
		} catch (err) {
			console.error('Failed to delete preset:', err);
			toast.error('Failed to delete preset', {
				description: err instanceof Error ? err.message : 'An unknown error occurred',
			});
			throw err;
		}
	}, []);

	return {savePreset, deletePreset};
};
