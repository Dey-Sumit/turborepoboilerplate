import React from 'react';
import {GenerateCaptionSection} from '../captioning/caption-section';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_ANIMATION_CONTROL,
	FEATURE_AUDIO_FADE_CONTROL,
	FEATURE_BORDER_RADIUS_CONTROL,
	FEATURE_CROP_CONTROL,
	FEATURE_CROPPING,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_PLAYBACKRATE_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_SOURCE_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
	FEATURE_VOLUME_CONTROL,
} from '../flags';
import {useVideoInspectorData, useAssetById} from '../selectors/hooks';
import {InspectorLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {AudioFadeControls} from './controls/audio-fade-controls';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {CropControls} from './controls/crop-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PlaybackRateControls} from './controls/playback-rate-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {SourceControls} from './controls/source-info/source-info';
import {ThreePhaseAnimationControls} from './controls/three-phase-animation-controls';
import {TransitionControls} from './controls/transition-controls';
import {VolumeControls} from './controls/volume-controls';

const VideoInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const videoData = useVideoInspectorData(itemId);
	const asset = useAssetById(videoData.assetId);

	if (!asset || asset.type !== 'video') {
		return null;
	}

	return (
		<div>
			{FEATURE_SOURCE_CONTROL && <SourceControls itemId={itemId} />}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Layout</InspectorLabel>}
				id={`layout-${itemId}`}
				defaultOpen
			>
				{FEATURE_ALIGNMENT_CONTROL && <AlignmentControls itemId={itemId} />}
				{FEATURE_POSITION_CONTROL && <PositionControl itemId={itemId} />}
				{FEATURE_DIMENSIONS_CONTROL && <DimensionsControls itemId={itemId} />}
				{FEATURE_ROTATION_CONTROL && <RotationControl itemId={itemId} />}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Fill</InspectorLabel>}
				id={`fill-${itemId}`}
				defaultOpen
			>
				{FEATURE_OPACITY_CONTROL && <OpacityControls itemId={itemId} />}
				{FEATURE_BORDER_RADIUS_CONTROL && (
					<BorderRadiusControl borderRadiusType="fill" itemId={itemId} />
				)}
			</CollapsableInspectorSection>
			{FEATURE_CROPPING && FEATURE_CROP_CONTROL && (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Crop</InspectorLabel>}
						id={`crop-${itemId}`}
						defaultOpen={false}
					>
						<CropControls itemId={itemId} />
					</CollapsableInspectorSection>
				</>
			)}
			<InspectorDivider />
			<CollapsableInspectorSection
				summary={<InspectorLabel>Video</InspectorLabel>}
				id={`video-${itemId}`}
				defaultOpen={false}
			>
				{FEATURE_PLAYBACKRATE_CONTROL && (
					<PlaybackRateControls
						playbackRate={videoData.playbackRate}
						itemId={itemId}
						assetId={videoData.assetId}
					/>
				)}
				{FEATURE_VISUAL_FADE_CONTROL && <FadeControls itemId={itemId} />}
			</CollapsableInspectorSection>

			{asset.hasAudioTrack ? (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Audio</InspectorLabel>}
						id={`audio-${itemId}`}
						defaultOpen={false}
					>
						{FEATURE_VOLUME_CONTROL && (
							<VolumeControls
								decibelAdjustment={videoData.decibelAdjustment}
								itemId={itemId}
							/>
						)}
						{FEATURE_AUDIO_FADE_CONTROL && (
							<AudioFadeControls
								fadeInDuration={videoData.audioFadeInDurationInSeconds}
								fadeOutDuration={videoData.audioFadeOutDurationInSeconds}
								itemId={itemId}
								durationInFrames={videoData.durationInFrames}
							/>
						)}
					</CollapsableInspectorSection>
					<InspectorDivider />
					<GenerateCaptionSection itemId={itemId} />
				</>
			) : null}
			{FEATURE_ANIMATION_CONTROL && (
				<>
					<InspectorDivider />
					<CollapsableInspectorSection
						summary={<InspectorLabel>Animations</InspectorLabel>}
						id={`animations-${itemId}`}
						defaultOpen={false}
					>
						<ThreePhaseAnimationControls itemId={itemId} />
					</CollapsableInspectorSection>
				</>
			)}
			<TransitionControls itemId={itemId} />
		</div>
	);
};

export const VideoInspector = React.memo(VideoInspectorUnmemoized);
