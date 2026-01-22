import React from 'react';

export const TimelineItemTransitionIndicator = () => {
	// Props are accepted for potential future use but currently not needed
	// since we're using relative positioning

	const hoverStyle: React.CSSProperties = {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	};

	return (
		<div
			className="absolute top-1/2 -right-2.5 z-50 flex h-6 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
			onClick={(e) => {
				e.stopPropagation();
			}}
			onMouseEnter={(e) => {
				Object.assign(e.currentTarget.style, hoverStyle);
			}}
			onMouseLeave={(_e) => {
				_e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
			}}
			title="Transition between items"
		>
			<svg
				viewBox="0 0 1792 1792"
				xmlns="http://www.w3.org/2000/svg"
				className="h-3 w-3 text-white/80"
				fill="#f1f1f190"
			>
				<path d="M1632 1600q14 0 23 9t9 23v128q0 14-9 23t-23 9H160q-14 0-23-9t-9-23v-128q0-14 9-23t23-9h1472zm-1374-64q3-55 16-107t30-95 46-87 53.5-76 64.5-69.5 66-60 70.5-55T671 939t65-43q-43-28-65-43t-66.5-47.5-70.5-55-66-60-64.5-69.5-53.5-76-46-87-30-95-16-107h1276q-3 55-16 107t-30 95-46 87-53.5 76-64.5 69.5-66 60-70.5 55T1121 853t-65 43q43 28 65 43t66.5 47.5 70.5 55 66 60 64.5 69.5 53.5 76 46 87 30 95 16 107H258zM1632 0q14 0 23 9t9 23v128q0 14-9 23t-23 9H160q-14 0-23-9t-9-23V32q0-14 9-23t23-9h1472z" />
			</svg>
		</div>
	);
};
