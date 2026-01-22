import {getCurrentTracks} from '../helpers/get-current-timeline';
import {EditorState} from '../types';

export const hideTrack = (state: EditorState, trackId: string) => {
	// Get tracks from current timeline context (could be inside a composite)
	const tracks = getCurrentTracks(state.compositionState);
	const track = tracks.find((t) => t.id === trackId);
	if (track && !track.hidden) {
		track.hidden = true;
	}
};

export const unhideTrack = (state: EditorState, trackId: string) => {
	// Get tracks from current timeline context (could be inside a composite)
	const tracks = getCurrentTracks(state.compositionState);
	const track = tracks.find((t) => t.id === trackId);
	if (track && track.hidden) {
		track.hidden = false;
	}
};
