import {PlayerRef} from '@remotion/player';
import React from 'react';
import {AbsoluteFill, getRemotionEnvironment} from 'remotion';
import useEditorStore from '../../zustand/editor-store';
import {useEditMode} from '../../zustand/ui-store';
import {SortedOutlines} from '../selection-border/sorted-outlines';
import {isTimelineEmpty} from '../utils/is-timeline-empty';
import {useActiveCanvasSnapPoints, useTracks} from '../utils/use-context';
import {EmptyCanvasPlaceholder} from './empty-canvas-placeholder';
import {Layers} from './layers';
import {CanvasSnapIndicators} from './snap/canvas-snap-indicators';
import {SolidDrawingTool} from './solid-drawing-tool';
import {TextInsertionTool} from './text-insertion-tool';

export type MainCompositionProps = {
	playerRef: React.RefObject<PlayerRef | null> | null;
};

export const MainComposition: React.FC<MainCompositionProps> = ({
	playerRef,
}) => {
	const editMode = useEditMode();
	const {tracks} = useTracks();
	const compositionRootStyles = useEditorStore(
		(state) => state.compositionState.compositionRootStyles,
	);

	const {activeCanvasSnapPoints} = useActiveCanvasSnapPoints();

	return (
		<AbsoluteFill
			style={{
				...compositionRootStyles,
				//	background: 'white',
				// background:
				// 	'radial-gradient(125% 125% at 50% 10%, #072607 10%, #000000 100%)',
			}}
		>
			<Layers tracks={tracks} />
			{getRemotionEnvironment().isPlayer ? <SortedOutlines /> : null}
			{getRemotionEnvironment().isPlayer ? (
				<CanvasSnapIndicators activeSnapPoints={activeCanvasSnapPoints} />
			) : null}
			{getRemotionEnvironment().isPlayer && isTimelineEmpty(tracks) ? (
				<EmptyCanvasPlaceholder />
			) : null}
			{editMode === 'draw-solid' && playerRef ? (
				<SolidDrawingTool playerRef={playerRef} />
			) : null}
			{editMode === 'create-text' && playerRef ? (
				<TextInsertionTool playerRef={playerRef} />
			) : null}
		</AbsoluteFill>
	);
};
