import {PlayerRef} from '@remotion/player';
import {useCallback} from 'react';
import {useDurationInFrames} from '../../zustand/editor-store';
import {GoToEndIcon} from '../icons/go-to-end';
import {GoToStartIcon} from '../icons/go-to-start';
import {timelineScrollContainerRef} from '../utils/restore-scroll-after-zoom';

const seekingIconStyle: React.CSSProperties = {
	width: 13,
};

export const GoToStartButton: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const onClick = useCallback(() => {
		playerRef.current?.seekTo(0);
		timelineScrollContainerRef.current?.scrollTo({
			left: 0,
			behavior: 'instant',
		});
	}, [playerRef]);

	return (
		<button
			className="editor-starter-focus-ring p-2"
			onClick={onClick}
			type="button"
			aria-label="Go to Start"
		>
			<GoToStartIcon className="text-neutral-300" style={seekingIconStyle} />
		</button>
	);
};

export const GoToEndButton: React.FC<{
	playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
	const durationInFrames = useDurationInFrames();

	const onClick = useCallback(() => {
		playerRef.current?.seekTo(durationInFrames);
		timelineScrollContainerRef.current?.scrollTo({
			left: durationInFrames,
			behavior: 'instant',
		});
	}, [durationInFrames, playerRef]);

	return (
		<button
			className="editor-starter-focus-ring p-2"
			onClick={onClick}
			type="button"
			aria-label="Go to End"
		>
			<GoToEndIcon style={seekingIconStyle} />
		</button>
	);
};
