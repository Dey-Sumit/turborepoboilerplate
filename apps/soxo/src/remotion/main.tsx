import {FontInfo} from '@remotion/google-fonts';
import React, {useEffect} from 'react';
import {EditorStarterAsset} from '../editor/assets/assets';
import {MainComposition} from '../editor/canvas/composition';
import {DEFAULT_FPS} from '../editor/constants';
import {EditorStarterItem} from '../editor/items/item-type';
import {TrackType} from '../editor/state/types';
import {FontInfoContext} from '../editor/utils/text/font-info';
import useEditorStore from '../zustand/editor-store';

export type CompositionWithContextsProps = {
	tracks: TrackType[];
	items: Record<string, EditorStarterItem>;
	assets: Record<string, EditorStarterAsset>;
	compositionWidth: number;
	compositionHeight: number;
	fontInfos: Record<string, FontInfo>;
};

export const CompositionWithContexts: React.FC<
	CompositionWithContextsProps
> = ({
	tracks,
	assets,
	items,
	fontInfos,
	compositionWidth,
	compositionHeight,
}) => {
	const setState = useEditorStore((state) => state.setState);

	// Initialize Zustand store with props data for Remotion rendering
	useEffect(() => {
		setState((draft) => {
			draft.compositionState = {
				tracks,
				items,
				assets,
				fps: DEFAULT_FPS,
				compositionWidth,
				compositionHeight,
				deletedAssets: [],
				timelineViewStack: [{type: 'ROOT'}],
			};
		});
	}, [tracks, items, assets, compositionWidth, compositionHeight, setState]);

	return (
		<FontInfoContext.Provider value={fontInfos}>
			<MainComposition playerRef={null} />
		</FontInfoContext.Provider>
	);
};
