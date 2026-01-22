import React, {ComponentProps} from 'react';

export const TimelineItemExtendHandle: React.FC<ComponentProps<'div'>> = ({
	className,
	...restProps
}) => {
	return (
		<div
			className={`group absolute top-0 bottom-0 flex items-center justify-center ${className ?? ''}`}
			{...restProps}
		>
			{/* Minimal resize indicator - two thin vertical bars */}
			<div className="flex gap-[2px] px-1">
				<div className="h-5 w-[2px] bg-gray-200 opacity-40 transition-colors group-hover:bg-blue-500 group-hover:opacity-100" />
				<div className="h-5 w-[2px] bg-gray-200 opacity-40 transition-colors group-hover:bg-blue-500 group-hover:opacity-100" />
			</div>
		</div>
	);
};
