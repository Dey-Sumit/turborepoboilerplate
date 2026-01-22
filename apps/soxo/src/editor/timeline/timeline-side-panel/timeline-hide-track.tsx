import React, {useCallback} from 'react';
import useEditorStore from '../../../zustand/editor-store';
import {IconButton} from '../../icon-button';
import {EyeIcon, EyeOffIcon} from '../../icons/visibility';
import {hideTrack, unhideTrack} from '../../state/actions/hide-track';
import {TrackType} from '../../state/types';

export const TimelineHideTrack = ({track}: {track: TrackType}) => {
	const setState = useEditorStore((state) => state.setState);

	const toggle = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();

			// Hide/unhide should NOT be added to undo history
			const temporalState = useEditorStore.temporal.getState();
			temporalState.pause();

			if (track.hidden) {
				setState((state) => unhideTrack(state, track.id));
			} else {
				setState((state) => hideTrack(state, track.id));
			}

			temporalState.resume();
		},
		[track.hidden, setState, track.id],
	);

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		// Prevent items from being unselected
		e.stopPropagation();
	}, []);

	return (
		<IconButton
			onClick={toggle}
			onPointerDown={onPointerDown}
			aria-label={track.hidden ? 'Unhide Track' : 'Hide Track'}
		>
			{track.hidden ? (
				<EyeOffIcon className="text-editor-starter-accent size-4" />
			) : (
				<EyeIcon className="size-4 text-neutral-400 hover:text-white" />
			)}
		</IconButton>
	);
};
