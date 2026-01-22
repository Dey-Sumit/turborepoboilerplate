import useEditorStore from './editor-store';

/**
 * Wraps continuous state updates (like dragging, resizing) to create a single undo point
 *
 * Usage:
 * ```ts
 * const tracker = createContinuousUpdateTracker();
 *
 * // On first update:
 * tracker.startTracking(() => {
 *   // Your state updates here
 * });
 *
 * // On subsequent updates:
 * tracker.update(() => {
 *   // Your state updates here
 * });
 *
 * // On final update (e.g., pointerup):
 * tracker.endTracking(() => {
 *   // Your final state updates here
 * });
 * ```
 */
export function createContinuousUpdateTracker() {
	let isTracking = false;

	return {
		/**
		 * Start tracking continuous updates. Call this on the FIRST update.
		 * This will:
		 * 1. Execute your state updates
		 * 2. Pause undo tracking for subsequent updates
		 */
		startTracking(updateFn: () => void) {
			if (isTracking) {
				throw new Error('Already tracking - call endTracking first');
			}

			// Execute the first update (this creates the initial undo point)
			updateFn();

			// Pause undo tracking for subsequent updates
			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();
			isTracking = true;
		},

		/**
		 * Update during continuous tracking. Call this on SUBSEQUENT updates.
		 * State changes will not create new undo points.
		 */
		update(updateFn: () => void) {
			if (!isTracking) {
				throw new Error(
					'Not tracking - call startTracking first or use startTracking for the first update',
				);
			}

			// Execute updates while paused (no new undo points)
			updateFn();
		},

		/**
		 * End tracking and resume undo. Call this on the FINAL update.
		 * This will:
		 * 1. Execute your final state updates
		 * 2. Resume undo tracking
		 */
		endTracking(updateFn?: () => void) {
			if (!isTracking) {
				// If not tracking, just execute the update normally
				updateFn?.();
				return;
			}

			// Execute final updates while still paused
			updateFn?.();

			// Resume undo tracking
			const temporalState = useEditorStore.temporal.getState();
			temporalState.resume();
			isTracking = false;
		},

		/**
		 * Check if currently tracking
		 */
		isTracking() {
			return isTracking;
		},
	};
}
