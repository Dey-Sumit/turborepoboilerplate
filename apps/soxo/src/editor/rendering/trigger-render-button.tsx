import React from 'react';
import {Button} from '../../components/ui/button';
import {isTimelineEmpty} from '../utils/is-timeline-empty';
import {useTracks} from '../utils/use-context';

export const TriggerRenderButton: React.FC<{
	onTrigger: () => void;
}> = ({onTrigger}) => {
	const {tracks} = useTracks();

	const disabled = isTimelineEmpty(tracks);

	return (
		<Button className="w-full" onClick={onTrigger} disabled={disabled}>
			Render video
		</Button>
	);
};
