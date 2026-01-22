import {useDurationInFrames} from '../../zustand/editor-store';
import {renderFrame} from '../utils/render-frame';

export const ProjectDurationDisplay: React.FC<{
	fps: number;
}> = ({fps}) => {
	const durationInFrames = useDurationInFrames();

	return (
		<div
			title="Project duration"
			className="text-xs tabular-nums opacity-80 select-none sm:text-sm"
		>
			{renderFrame(durationInFrames, fps)}
		</div>
	);
};
