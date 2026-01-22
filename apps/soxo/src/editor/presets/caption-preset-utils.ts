import {CaptionsItem} from '../items/captions/captions-item-type';
import {CaptionPreset} from './caption-presets-db';

/**
 * Extract stylable properties from a caption item to create a preset
 */
export const extractCaptionStyle = (item: CaptionsItem): Omit<CaptionPreset, 'id' | 'name' | 'createdAt' | 'updatedAt'> => {
	return {
		// Typography
		fontFamily: item.fontFamily,
		fontStyle: item.fontStyle,
		fontSize: item.fontSize,
		lineHeight: item.lineHeight,
		letterSpacing: item.letterSpacing,

		// Layout
		align: item.align,
		direction: item.direction,

		// Colors
		color: item.color,
		highlightColor: item.highlightColor,

		// Stroke
		strokeWidth: item.strokeWidth,
		strokeColor: item.strokeColor,

		// Caption-specific
		maxLines: item.maxLines,
		pageDurationInMilliseconds: item.pageDurationInMilliseconds,
		fadeInDurationInSeconds: item.fadeInDurationInSeconds,
		fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,

		// Highlight style
		highlightStyle: item.highlightStyle,

		// Background box
		backgroundEnabled: item.backgroundEnabled,
		backgroundColor: item.backgroundColor,
		backgroundOpacity: item.backgroundOpacity,
		backgroundPadding: item.backgroundPadding,
		backgroundBorderRadius: item.backgroundBorderRadius,

		// Text shadow
		textShadowEnabled: item.textShadowEnabled,
		textShadowColor: item.textShadowColor,
		textShadowOffsetX: item.textShadowOffsetX,
		textShadowOffsetY: item.textShadowOffsetY,
		textShadowBlur: item.textShadowBlur,
	};
};

/**
 * Apply a preset to a caption item (returns updated item properties)
 */
export const applyCaptionPreset = (
	item: CaptionsItem,
	preset: CaptionPreset,
): Partial<CaptionsItem> => {
	return {
		// Typography
		fontFamily: preset.fontFamily,
		fontStyle: preset.fontStyle,
		fontSize: preset.fontSize,
		lineHeight: preset.lineHeight,
		letterSpacing: preset.letterSpacing,

		// Layout
		align: preset.align,
		direction: preset.direction,

		// Colors
		color: preset.color,
		highlightColor: preset.highlightColor,

		// Stroke
		strokeWidth: preset.strokeWidth,
		strokeColor: preset.strokeColor,

		// Caption-specific
		maxLines: preset.maxLines,
		pageDurationInMilliseconds: preset.pageDurationInMilliseconds,
		fadeInDurationInSeconds: preset.fadeInDurationInSeconds,
		fadeOutDurationInSeconds: preset.fadeOutDurationInSeconds,

		// Highlight style
		highlightStyle: preset.highlightStyle,

		// Background box
		backgroundEnabled: preset.backgroundEnabled,
		backgroundColor: preset.backgroundColor,
		backgroundOpacity: preset.backgroundOpacity,
		backgroundPadding: preset.backgroundPadding,
		backgroundBorderRadius: preset.backgroundBorderRadius,

		// Text shadow
		textShadowEnabled: preset.textShadowEnabled,
		textShadowColor: preset.textShadowColor,
		textShadowOffsetX: preset.textShadowOffsetX,
		textShadowOffsetY: preset.textShadowOffsetY,
		textShadowBlur: preset.textShadowBlur,
	};
};

/**
 * Check if a caption item's current style matches a preset
 */
export const doesItemMatchPreset = (
	item: CaptionsItem,
	preset: CaptionPreset,
): boolean => {
	return (
		item.fontFamily === preset.fontFamily &&
		item.fontStyle === preset.fontStyle &&
		item.fontSize === preset.fontSize &&
		item.lineHeight === preset.lineHeight &&
		item.letterSpacing === preset.letterSpacing &&
		item.align === preset.align &&
		item.direction === preset.direction &&
		item.color === preset.color &&
		item.highlightColor === preset.highlightColor &&
		item.strokeWidth === preset.strokeWidth &&
		item.strokeColor === preset.strokeColor &&
		item.maxLines === preset.maxLines &&
		item.pageDurationInMilliseconds === preset.pageDurationInMilliseconds &&
		item.fadeInDurationInSeconds === preset.fadeInDurationInSeconds &&
		item.fadeOutDurationInSeconds === preset.fadeOutDurationInSeconds &&
		item.highlightStyle === preset.highlightStyle &&
		item.backgroundEnabled === preset.backgroundEnabled &&
		item.backgroundColor === preset.backgroundColor &&
		item.backgroundOpacity === preset.backgroundOpacity &&
		item.backgroundPadding === preset.backgroundPadding &&
		item.backgroundBorderRadius === preset.backgroundBorderRadius &&
		item.textShadowEnabled === preset.textShadowEnabled &&
		item.textShadowColor === preset.textShadowColor &&
		item.textShadowOffsetX === preset.textShadowOffsetX &&
		item.textShadowOffsetY === preset.textShadowOffsetY &&
		item.textShadowBlur === preset.textShadowBlur
	);
};

/**
 * Generate a unique preset ID
 */
export const generatePresetId = (): string => {
	return `preset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
