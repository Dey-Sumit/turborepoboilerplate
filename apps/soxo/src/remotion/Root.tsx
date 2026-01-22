import React from 'react';
import {Composition} from 'remotion';
import {
	CODE_CONFIG_FOR_REMOTION_STUDIO,
} from '../config.example';
import {DEFAULT_FPS} from '../editor/constants';
import {getCompositionDuration} from '../editor/utils/get-composition-duration';
import {collectFontInfoFromItems} from '../editor/utils/text/collect-font-info-from-items';
import {COMP_NAME} from './constants';
import {CompositionWithContexts} from './main';

export const Root: React.FC = () => {
	return (
		<Composition
			id={COMP_NAME}
			component={CompositionWithContexts}
			calculateMetadata={({props}) => {
				const framesShown = Math.max(
					1,
					getCompositionDuration(props.items, props.tracks),
				);

				return {
					width: props.compositionWidth,
					height: props.compositionHeight,
					durationInFrames: framesShown,
					fps: DEFAULT_FPS,
					props: {
						...props,
						fontInfos: collectFontInfoFromItems(Object.values(props.items)),
					},
				};
			}}
			/* defaultProps={{
				tracks: [],
				assets: {},
				items: {},
				compositionWidth: DEFAULT_COMPOSITION_WIDTH,
				compositionHeight: DEFAULT_COMPOSITION_HEIGHT,
				fontInfos: {},
			}} */
			defaultProps={CODE_CONFIG_FOR_REMOTION_STUDIO}
		/>
	);
};
