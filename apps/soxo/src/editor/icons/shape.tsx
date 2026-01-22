import React from 'react';

/**
 * Shape Icon Component
 *
 * A simple icon representing shapes (circle, square, triangle combined)
 * Used in the toolbar for the shape creation tool.
 *
 * @param props - Standard SVG props (className, fill, stroke, etc.)
 */
export const ShapeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			{/* Circle */}
			<circle cx="6" cy="6" r="4" />
			{/* Triangle */}
			<path d="M18 4 L22 12 L14 12 Z" />
			{/* Square */}
			<rect x="3" y="14" width="8" height="8" />
		</svg>
	);
};
