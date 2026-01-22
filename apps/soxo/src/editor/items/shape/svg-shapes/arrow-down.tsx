import React from 'react';
import {FillPattern} from '../shape-item-type';

/**
 * Arrow Down SVG Component
 *
 * Renders a simple arrow pointing downward.
 * The arrow consists of a vertical line with a triangular arrowhead.
 * Supports border styles (dashed/dotted) and fill patterns.
 *
 * @param fill - Fill color for the arrow (applied to arrowhead)
 * @param stroke - Stroke color for the arrow line
 * @param strokeWidth - Thickness of the arrow line in pixels
 * @param width - Width of the SVG viewBox
 * @param height - Height of the SVG viewBox
 * @param strokeDasharray - Stroke dash pattern for border style
 * @param fillValue - Fill value (solid color or pattern reference)
 * @param patternId - Pattern ID for fill patterns
 * @param fillPattern - Fill pattern type
 * @param renderPatternDefs - Function to render pattern definitions
 */
export const ArrowDown: React.FC<{
	fill: string;
	stroke: string;
	strokeWidth: number;
	width: number;
	height: number;
	strokeDasharray: string;
	fillValue: string;
	patternId: string;
	fillPattern?: FillPattern;
	renderPatternDefs: () => React.ReactNode;
}> = ({
	stroke,
	strokeWidth,
	width,
	height,
	strokeDasharray,
	fillValue,
	renderPatternDefs,
}) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 100 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			{renderPatternDefs()}
			{/* Arrow line */}
			<line
				x1="50"
				y1="10"
				x2="50"
				y2="75"
				stroke={stroke}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeDasharray={strokeDasharray}
			/>
			{/* Arrowhead */}
			<path
				d="M50 75 L40 60 L60 60 Z"
				fill={fillValue}
				stroke={stroke}
				strokeWidth={strokeWidth / 2}
				strokeLinejoin="round"
				strokeDasharray={strokeDasharray}
			/>
		</svg>
	);
};
