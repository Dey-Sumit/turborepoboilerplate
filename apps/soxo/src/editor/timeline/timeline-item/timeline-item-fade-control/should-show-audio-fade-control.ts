import {
	FEATURE_AUDIO_FADE_CONTROL,
	FEATURE_AUDIO_WAVEFORM_FOR_VIDEO_ITEM,
} from '../../../flags';
import {EditorStarterItem} from '../../../items/item-type';

export const shouldShowAudioFadeControl = (itemType: EditorStarterItem['type']) => {
	if (!FEATURE_AUDIO_FADE_CONTROL) {
		return false;
	}

	if (itemType === 'audio') {
		return true;
	}

	if (itemType === 'video') {
		return FEATURE_AUDIO_WAVEFORM_FOR_VIDEO_ITEM;
	}

	if (
		itemType === 'captions' ||
		itemType === 'gif' ||
		itemType === 'text' ||
		itemType === 'solid' ||
		itemType === 'image' ||
		itemType === 'composite' ||
		itemType === 'code' ||
		itemType === 'shape'
	) {
		return false;
	}

	throw new Error('Invalid item type: ' + (itemType as never));
};
