import {getCurrentTracks} from '../helpers/get-current-timeline';
import {EditorState} from '../types';

// Immer versions - mutate state directly
export const muteTrack = (editorState: EditorState, trackId: string): void => {
	// Get tracks from current timeline context (could be inside a composite)
	const tracks = getCurrentTracks(editorState.compositionState);
	tracks.forEach((track) => {
		if (track.id === trackId && !track.muted) {
			track.muted = true;
		}
	});
};

export const unmuteTrack = (
	editorState: EditorState,
	trackId: string,
): void => {
	// Get tracks from current timeline context (could be inside a composite)
	const tracks = getCurrentTracks(editorState.compositionState);
	tracks.forEach((track) => {
		if (track.id === trackId && track.muted) {
			track.muted = false;
		}
	});
};
