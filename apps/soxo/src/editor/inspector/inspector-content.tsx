import useEditorStore from '../../zustand/editor-store';
import {getCurrentTimeline} from '../state/helpers/get-current-timeline';
import {AudioInspector} from './audio-inspector';
import {CaptionsInspector} from './captions-inspector';
import {CodeInspector} from './code-inspector';
import {CompositeInspector} from './composite-inspector';
import {GifInspector} from './gif-inspector';
import {ImgInspector} from './img-inspector';
import {ShapeInspector} from './shape-inspector';
import {SolidInspector} from './solid-inspector';
import {TextInspector} from './text-inspector';
import {VideoInspector} from './video-inspector';

export const InspectorContent: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	// Only subscribe to the item's type - not the full item
	// This prevents re-renders when other properties change
	const itemType = useEditorStore((state) => {
		const timeline = getCurrentTimeline(state.compositionState);
		return timeline.items[itemId]?.type;
	});

	if (!itemType) {
		return null;
	}

	if (itemType === 'image') {
		return <ImgInspector itemId={itemId} />;
	}

	if (itemType === 'captions') {
		return <CaptionsInspector itemId={itemId} />;
	}

	if (itemType === 'video') {
		return <VideoInspector itemId={itemId} />;
	}

	if (itemType === 'audio') {
		return <AudioInspector itemId={itemId} />;
	}

	if (itemType === 'text') {
		return <TextInspector itemId={itemId} />;
	}

	if (itemType === 'solid') {
		return <SolidInspector itemId={itemId} />;
	}

	if (itemType === 'gif') {
		return <GifInspector itemId={itemId} />;
	}

	if (itemType === 'composite') {
		return <CompositeInspector itemId={itemId} />;
	}

	if (itemType === 'code') {
		return <CodeInspector itemId={itemId} />;
	}

	if (itemType === 'shape') {
		return <ShapeInspector itemId={itemId} />;
	}

	throw new Error(`Unknown item type: ${itemType satisfies never}`);
};
