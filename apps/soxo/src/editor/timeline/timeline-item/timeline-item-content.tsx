import {memo} from 'react';
import {EditorStarterAsset} from '../../assets/assets';
import {RequireCachedAsset} from '../../caching/require-cached-asset';
import {
	FEATURE_AUDIO_WAVEFORM_FOR_VIDEO_ITEM,
	FEATURE_FILMSTRIP,
	FEATURE_TIMELINE_VOLUME_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
	FEATURE_WAVEFORM,
} from '../../flags';
import {AudioItem} from '../../items/audio/audio-item-type';
import {EditorStarterItem} from '../../items/item-type';
import {VideoItem} from '../../items/video/video-item-type';
import {TRACK_PADDING} from '../../state/items';
import {getCanFadeVisual} from '../../utils/fade';
import {shouldShowItemHeader} from '../../utils/position-utils';
import {useFps} from '../../utils/use-context';
import {useTimelineSize} from '../utils/use-timeline-size';
import {FadeCurve} from './timeline-item-fade-control/fade-curve';
import {
	FILMSTRIP_HEIGHT_IF_THERE_IS_AUDIO,
	TimelineItemFilmStrip,
} from './timeline-item-film-strip';
import {TimelineItemHeader} from './timeline-item-header';
import {TIMELINE_ITEM_BORDER_WIDTH} from './timeline-item-layout';
import {TimelineItemPreview} from './timeline-item-preview';
import {TimelineItemVolumeControl} from './timeline-item-volume-control/timeline-item-volume-control';
import {TimelineItemWaveform} from './timeline-item-waveform';
import { TimelineItemData, useFullItem } from '../../selectors';
import useEditorStore from '../../../zustand/editor-store';

const shouldShowAudioWaveform = ({
	item,
	asset,
}: {
	item: EditorStarterItem;
	asset: EditorStarterAsset | null;
}) => {
	if (!FEATURE_WAVEFORM) {
		return false;
	}

	if (item.type === 'audio') {
		return true;
	}

	if (item.type === 'video') {
		if (!asset || asset.type !== 'video') {
			throw new Error('Expected video asset in shouldShowAudioWaveform');
		}

		return FEATURE_AUDIO_WAVEFORM_FOR_VIDEO_ITEM && asset.hasAudioTrack;
	}

	// Add all item types that don't have audio waveform here
	if (
		item.type === 'captions' ||
		item.type === 'gif' ||
		item.type === 'text' ||
		item.type === 'solid' ||
		item.type === 'image' ||
		item.type === 'composite' ||
		item.type === 'code'
	) {
		return false;
	}

	throw new Error('Invalid item type: ' + (item ));
};

export const TimelineItemContent = memo(
	({
		item,
		height,
		width,
		roundedDifference,
		trackMuted,
	}: {
		item: TimelineItemData;
		height: number;
		width: number;
		roundedDifference: number;
		trackMuted: boolean;
	}) => {
		const {fps} = useFps();
		const {timelineWidth} = useTimelineSize();

		// Get full item data ONLY when we need it for features
		// This prevents re-renders when video trim/playback changes for items without filmstrip/waveform
		const fullItem = useFullItem(item.id);

		// Get asset from full item (TimelineItemData doesn't have assetId)
		const asset =
			fullItem && 'assetId' in fullItem && fullItem.assetId
				? (() => {
						const assetId = fullItem.assetId;
						return (
							useEditorStore.getState().compositionState.assets[assetId] ?? null
						);
					})()
				: null;

		if (timelineWidth === null) {
			throw new Error('Timeline width is null');
		}

		const filmstripHeight =
			asset?.type === 'video' && !asset.hasAudioTrack
				? height
				: FILMSTRIP_HEIGHT_IF_THERE_IS_AUDIO;

		return (
			<>
				<div className="absolute h-full w-full">
					<TimelineItemPreview item={item} />

					{/* Filmstrip uses fullItem for video-specific props */}
					{item.type === 'video' &&
						FEATURE_FILMSTRIP &&
						asset &&
						fullItem &&
						fullItem.type === 'video' && (
							<RequireCachedAsset asset={asset}>
								<TimelineItemFilmStrip
									item={fullItem}
									startFrom={fullItem.videoStartFromInSeconds * fps}
									durationInFrames={fullItem.durationInFrames}
									fps={fps}
									roundedDifference={roundedDifference}
									height={filmstripHeight}
									playbackRate={fullItem.playbackRate}
								/>
							</RequireCachedAsset>
						)}

					{/* Fade controls use fullItem for fade durations */}
					{getCanFadeVisual(item) && FEATURE_VISUAL_FADE_CONTROL && fullItem && (
						<FadeCurve
							item={fullItem}
							height={
								item.type === 'video'
									? filmstripHeight
									: height - TRACK_PADDING - TIMELINE_ITEM_BORDER_WIDTH * 2
							}
							width={width}
							fadeType="visual"
						/>
					)}

					{/* Waveform uses fullItem for audio-specific props */}
					{asset && fullItem && shouldShowAudioWaveform({item: fullItem, asset}) ? (
						<RequireCachedAsset asset={asset}>
							<TimelineItemWaveform
								trackHeight={height}
								item={fullItem as AudioItem | VideoItem}
								timelineWidth={timelineWidth}
								roundedDifference={roundedDifference}
								trackMuted={trackMuted}
							>
								{FEATURE_TIMELINE_VOLUME_CONTROL ? (
									<TimelineItemVolumeControl
										item={fullItem as AudioItem | VideoItem}
									/>
								) : null}
							</TimelineItemWaveform>
						</RequireCachedAsset>
					) : null}
					{shouldShowItemHeader(item) && asset && asset.filename ? (
						<TimelineItemHeader filename={asset.filename} />
					) : null}
				</div>
			</>
		);
	},
);

TimelineItemContent.displayName = 'TimelineItemContent';
