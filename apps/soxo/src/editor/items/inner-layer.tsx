import React from 'react';
import {AudioLayer} from './audio/audio-layer';
import {CaptionsLayer} from './captions/captions-layer';
import {CodeLayer} from './code/code-layer';
import {CompositeLayer} from './composite/composite-layer';
import {GifLayer} from './gif/gif-layer';
import {ImageLayer} from './image/image-layer';
import {EditorStarterItem} from './item-type';
import {ShapeLayer} from './shape/shape-layer';
import {SolidLayer} from './solid/solid-layer';
import {TextLayer} from './text/text-layer';
import {VideoLayer} from './video/video-layer';

export const InnerLayer: React.FC<{
	item: EditorStarterItem;
	trackMuted: boolean;
	cropBackground: boolean;
	previousItemId?: string;
}> = ({item, trackMuted, cropBackground, previousItemId}) => {
	if (item.type === 'image') {
		return <ImageLayer item={item} cropBackground={cropBackground} />;
	}

	if (item.type === 'text') {
		return <TextLayer item={item} />;
	}

	if (item.type === 'video') {
		return (
			<VideoLayer
				item={item}
				trackMuted={trackMuted}
				cropBackground={cropBackground}
			/>
		);
	}

	if (item.type === 'solid') {
		return <SolidLayer item={item} />;
	}

	if (item.type === 'audio') {
		return <AudioLayer item={item} trackMuted={trackMuted} />;
	}

	if (item.type === 'captions') {
		return <CaptionsLayer item={item} />;
	}

	if (item.type === 'gif') {
		return <GifLayer item={item} cropBackground={cropBackground} />;
	}

	if (item.type === 'composite') {
		return <CompositeLayer item={item} cropBackground={cropBackground} />;
	}

	if (item.type === 'code') {
		return <CodeLayer item={item} previousItemId={previousItemId} />;
	}

	if (item.type === 'shape') {
		return <ShapeLayer item={item} />;
	}

	throw new Error(
		'Unimplemented item type: ' + JSON.stringify(item satisfies never),
	);
};
