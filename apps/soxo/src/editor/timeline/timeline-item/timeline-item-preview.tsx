import React, {ComponentProps, PropsWithChildren} from 'react';
import {ITEM_COLORS} from '../../constants';
import { TimelineItemData } from '../../selectors';

const SimplePreview = ({children, style}: ComponentProps<'div'>) => {
	return (
		<div
			className="flex h-full w-full flex-nowrap gap-1 px-5 py-3 text-xs text-white"
			style={{background: '#FF9843', ...style}}
		>
			{children}
		</div>
	);
};

const Text = ({children}: PropsWithChildren) => {
	return <span className="truncate">{children}</span>;
};

SimplePreview.Text = Text;

const CaptionsPreview: React.FC = () => {
	return (
		<SimplePreview style={{background: '#FF7F50'}}>
			<SimplePreview.Text>Captions</SimplePreview.Text>
		</SimplePreview>
	);
};

const TextItemPreview: React.FC<{
	text: string;
}> = ({text}) => {
	return (
		<SimplePreview style={{background: ITEM_COLORS.text}}>
			<SimplePreview.Text>{text}</SimplePreview.Text>
		</SimplePreview>
	);
};

const ImageItemPreview: React.FC = () => {
	return (
		<SimplePreview style={{background: ITEM_COLORS.image}}></SimplePreview>
	);
};

const GifItemPreview: React.FC = () => {
	return <SimplePreview style={{background: ITEM_COLORS.gif}}></SimplePreview>;
};

const VideoItemPreview: React.FC = () => {
	return (
		<SimplePreview
			style={{background:  ITEM_COLORS.video}}
		></SimplePreview>
	);
};

const AudioItemPreview: React.FC = () => {
	return (
		<SimplePreview style={{background: ITEM_COLORS.audio}}></SimplePreview>
	);
};

const SolidItemPreview: React.FC<{
	item: Extract<TimelineItemData, { type: 'solid' }>;
}> = ({item}) => {
	return (
		<SimplePreview style={{background: ITEM_COLORS.solid}}>
			<div
				className={'mt-px h-3 w-3 shrink-0 rounded-full'}
				style={{
					backgroundColor: item.color,
				}}
			></div>
			<SimplePreview.Text>Solid</SimplePreview.Text>
		</SimplePreview>
	);
};

export const TimelineItemPreview: React.FC<{
	item: TimelineItemData;
}> = ({item}) => {
	if (item.type === 'text') {
		return <TextItemPreview text={item.text} />;
	}

	if (item.type === 'image') {
		return <ImageItemPreview />;
	}

	if (item.type === 'video') {
		return <VideoItemPreview />;
	}

	if (item.type === 'solid') {
		return <SolidItemPreview item={item} />;
	}

	if (item.type === 'captions') {
		return <CaptionsPreview />;
	}

	if (item.type === 'audio') {
		return <AudioItemPreview />;
	}

	if (item.type === 'gif') {
		return <GifItemPreview />;
	}

	if (item.type === 'composite') {
		return (
			<SimplePreview style={{background: ITEM_COLORS.composite}}>
				<SimplePreview.Text>{item.name || 'Composite'}</SimplePreview.Text>
			</SimplePreview>
		);
	}

	if (item.type === 'code') {
		return (
			<SimplePreview style={{background: ITEM_COLORS.code}}>
				<SimplePreview.Text>Code</SimplePreview.Text>
			</SimplePreview>
		);
	}

	if (item.type === 'shape') {
		return (
			<SimplePreview style={{background: ITEM_COLORS.shape}}>
				<SimplePreview.Text>{item.variant}</SimplePreview.Text>
			</SimplePreview>
		);
	}

	throw new Error(`Unknown item type: ${JSON.stringify(item satisfies never)}`);
};
