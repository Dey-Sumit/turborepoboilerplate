import React, {useCallback} from 'react';
import useUIStore from '../../zustand/ui-store';
import {LoopIcon} from '../icons/loop';
import {useLoop} from '../utils/use-context';

export const LoopButton: React.FC = () => {
	const loop = useLoop();
	const onClickLoop = useCallback(() => {
		useUIStore.getState().setLoop(!loop);
	}, [loop]);

	return (
		<button
			className="editor-starter-focus-ring p-2"
			type="button"
			onClick={onClickLoop}
			title="Loop"
			aria-label="Loop"
		>
			<LoopIcon
				className={loop ? 'fill-editor-starter-accent' : 'text-neutral-300'}
			/>
		</button>
	);
};
