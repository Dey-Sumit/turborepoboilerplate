/**
 * Checks if an element rectangle is entirely outside the player/viewport bounds.
 * 
 * An element is considered entirely outside if:
 * - It's completely to the left of the viewport (right edge < 0)
 * - It's completely to the right of the viewport (left edge > compositionWidth)
 * - It's completely above the viewport (bottom edge < 0)
 * - It's completely below the viewport (top edge > compositionHeight)
 * 
 * @param rect - The element rectangle with left, top, width, height
 * @param compositionWidth - The width of the composition/viewport (e.g., 1920)
 * @param compositionHeight - The height of the composition/viewport (e.g., 1080)
 * @returns true if the element is entirely outside the bounds, false otherwise
 */
export const isElementEntirelyOutsideBounds = (
	rect: {left: number; top: number; width: number; height: number},
	compositionWidth: number,
	compositionHeight: number,
): boolean => {
	const right = rect.left + rect.width;
	const bottom = rect.top + rect.height;

	// Check if entirely to the left
	if (right < 0) {
		return true;
	}

	// Check if entirely to the right
	if (rect.left > compositionWidth) {
		return true;
	}

	// Check if entirely above
	if (bottom < 0) {
		return true;
	}

	// Check if entirely below
	if (rect.top > compositionHeight) {
		return true;
	}

	return false;
};

