import React from 'react';
import {GenerateCaptionSection} from '../captioning/caption-section';
import {
	FEATURE_AUDIO_FADE_CONTROL,
	FEATURE_PLAYBACKRATE_CONTROL,
	FEATURE_SOURCE_CONTROL,
	FEATURE_VOLUME_CONTROL,
} from '../flags';
import {useAudioInspectorData} from '../selectors/hooks';
import {InspectorLabel} from './components/inspector-label';
import {
	CollapsableInspectorSection,
	InspectorDivider,
} from './components/inspector-section';
import {AudioFadeControls} from './controls/audio-fade-controls';
import {PlaybackRateControls} from './controls/playback-rate-controls';
import {SourceControls} from './controls/source-info/source-info';
import {TransitionControls} from './controls/transition-controls';
import {VolumeControls} from './controls/volume-controls';

const AudioInspectorUnmemoized: React.FC<{
	itemId: string;
}> = ({itemId}) => {
	const audioData = useAudioInspectorData(itemId);

	return (
		<div>
			{FEATURE_SOURCE_CONTROL && <SourceControls itemId={itemId} />}
			<CollapsableInspectorSection
				summary={<InspectorLabel>Audio</InspectorLabel>}
				id={`audio-${itemId}`}
				defaultOpen={false}
			>
				{FEATURE_VOLUME_CONTROL && (
					<VolumeControls
						decibelAdjustment={audioData.decibelAdjustment}
						itemId={itemId}
					/>
				)}
				{FEATURE_AUDIO_FADE_CONTROL && (
					<AudioFadeControls
						fadeInDuration={audioData.audioFadeInDurationInSeconds}
						fadeOutDuration={audioData.audioFadeOutDurationInSeconds}
						itemId={itemId}
						durationInFrames={audioData.durationInFrames}
					/>
				)}
				{FEATURE_PLAYBACKRATE_CONTROL && (
					<PlaybackRateControls
						playbackRate={audioData.playbackRate}
						itemId={itemId}
						assetId={audioData.assetId}
					/>
				)}
			</CollapsableInspectorSection>
			<InspectorDivider />
			<GenerateCaptionSection itemId={itemId} />
			<TransitionControls itemId={itemId} />
		</div>
	);
};

export const AudioInspector = React.memo(AudioInspectorUnmemoized);
