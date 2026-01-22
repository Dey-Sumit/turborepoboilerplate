import React from 'react';

export const Compact: React.FC<{
	width: number;
	height: number;
}> = ({width, height}) => {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			width={width}
			height={height}
		>
			{/* Top-left corner arrow pointing inward */}
			<polyline points="9,4 4,4 4,9" />
			<line x1="4" y1="4" x2="10" y2="10" />

			{/* Top-right corner arrow pointing inward */}
			<polyline points="15,4 20,4 20,9" />
			<line x1="20" y1="4" x2="14" y2="10" />

			{/* Bottom-left corner arrow pointing inward */}
			<polyline points="9,20 4,20 4,15" />
			<line x1="4" y1="20" x2="10" y2="14" />

			{/* Bottom-right corner arrow pointing inward */}
			<polyline points="15,20 20,20 20,15" />
			<line x1="20" y1="20" x2="14" y2="14" />
		</svg>
	);
};
