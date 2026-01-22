import {useRef} from 'react';
import useEditorStore from './editor-store';

/**
 * Hook for continuous update operations (drag, slider, resize)
 * Batches all intermediate updates into a single undo point.
 *
 * Usage:
 * ```tsx
 * const tracker = useContinuousUpdate('opacity-slider');
 *
 * const handleChange = (value: number, commitToUndoStack: boolean) => {
 *   const performUpdate = () => updateItem(id, (i) => ({...i, opacity: value}));
 *
 *   if (commitToUndoStack) {
 *     tracker.end(performUpdate);
 *   } else if (!tracker.isActive) {
 *     tracker.start(performUpdate);
 *   } else {
 *     tracker.update(performUpdate);
 *   }
 * };
 * ```
 *
 * @param _key Unique identifier for debugging (not used functionally yet)
 */
export function useContinuousUpdate(_key: string) {
	const isActiveRef = useRef(false);

	return {
		/**
		 * Start a continuous update operation.
		 * - Executes the first update (creates undo point)
		 * - Pauses temporal for subsequent updates
		 */
		start(updateFn: () => void) {
			if (isActiveRef.current) {
				// Already tracking, just update
				updateFn();
				return;
			}

			// Execute first update (this creates the undo point)
			updateFn();

			// Pause temporal for subsequent updates
			useEditorStore.temporal.getState().pause();
			isActiveRef.current = true;
		},

		/**
		 * Continue a continuous update operation.
		 * Updates are applied but don't create new undo points (temporal paused).
		 */
		update(updateFn: () => void) {
			if (!isActiveRef.current) {
				// Not tracking yet, start tracking
				this.start(updateFn);
				return;
			}

			// Execute update (no undo point - temporal paused)
			updateFn();
		},

		/**
		 * End a continuous update operation.
		 * - Optionally applies final update
		 * - Resumes temporal tracking
		 */
		end(updateFn?: () => void) {
			if (!isActiveRef.current) {
				// Not tracking, just execute the update normally
				updateFn?.();
				return;
			}

			// Execute final update if provided
			updateFn?.();

			// Resume temporal tracking
			useEditorStore.temporal.getState().resume();
			isActiveRef.current = false;
		},

		/**
		 * Check if currently tracking a continuous operation
		 */
		get isActive() {
			return isActiveRef.current;
		},
	};
}
