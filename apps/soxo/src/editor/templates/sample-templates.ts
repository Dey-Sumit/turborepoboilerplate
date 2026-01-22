import {SolidItem} from '../items/solid/solid-item-type';
import {TextItem} from '../items/text/text-item-type';
import {TemplateDefinition} from './template-types';

/**
 * Sample templates - pure static data, no functions.
 * These can be stored in a database and fetched remotely.
 *
 * Note: Item IDs here are "template IDs" that get remapped to unique IDs
 * when the template is instantiated. Duration values are at 30fps and get
 * scaled to the target FPS on instantiation.
 */

// Base properties shared by all text items in templates
const baseTextItem: Omit<
	TextItem,
	| 'id'
	| 'type'
	| 'text'
	| 'left'
	| 'top'
	| 'width'
	| 'height'
	| 'fontSize'
	| 'color'
	| 'from'
	| 'durationInFrames'
	| 'align'
	| 'fontStyle'
> = {
	fontFamily: 'Inter',
	lineHeight: 1.2,
	letterSpacing: 0,
	resizeOnEdit: true,
	direction: 'ltr',
	strokeWidth: 0,
	strokeColor: '#000000',
	fadeInDurationInSeconds: 0,
	fadeOutDurationInSeconds: 0,
	background: null,
	opacity: 1,
	rotation: 0,
	isDraggingInTimeline: false,
	transition: {toNext: undefined, toPrev: undefined},
};

// Base properties shared by all solid items in templates
const baseSolidItem: Omit<
	SolidItem,
	| 'id'
	| 'type'
	| 'left'
	| 'top'
	| 'width'
	| 'height'
	| 'color'
	| 'from'
	| 'durationInFrames'
	| 'borderRadius'
> = {
	opacity: 1,
	rotation: 0,
	keepAspectRatio: false,
	fadeInDurationInSeconds: 0,
	fadeOutDurationInSeconds: 0,
	isDraggingInTimeline: false,
	transition: {toNext: undefined, toPrev: undefined},
};

/**
 * Lower Third - Modern Style
 * A sleek lower third with name and title
 */
const lowerThirdModern: TemplateDefinition = {
	id: 'lower-third-modern',
	name: 'Modern Lower Third',
	description: 'Clean lower third with name and title',
	category: 'lower-third',
	defaultDurationInFrames: 150, // 5 seconds at 30fps
	width: 500,
	height: 100,
	childTimeline: {
		items: {
			'bg-solid': {
				...baseSolidItem,
				id: 'bg-solid',
				type: 'solid',
				left: 0,
				top: 0,
				width: 500,
				height: 100,
				color: 'rgba(0, 0, 0, 0.75)',
				from: 0,
				durationInFrames: 150,
				borderRadius: 8,
			},
			'accent-bar': {
				...baseSolidItem,
				id: 'accent-bar',
				type: 'solid',
				left: 0,
				top: 0,
				width: 6,
				height: 100,
				color: '#3B82F6',
				from: 0,
				durationInFrames: 150,
				borderRadius: 4,
			},
			'name-text': {
				...baseTextItem,
				id: 'name-text',
				type: 'text',
				text: 'John Smith',
				left: 24,
				top: 20,
				width: 460,
				height: 36,
				fontSize: 28,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '700'},
			},
			'title-text': {
				...baseTextItem,
				id: 'title-text',
				type: 'text',
				text: 'Creative Director',
				left: 24,
				top: 58,
				width: 460,
				height: 28,
				fontSize: 18,
				color: '#94A3B8',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-1', items: ['bg-solid'], hidden: false, muted: false},
			{id: 'track-2', items: ['accent-bar'], hidden: false, muted: false},
			{id: 'track-3', items: ['name-text'], hidden: false, muted: false},
			{id: 'track-4', items: ['title-text'], hidden: false, muted: false},
		],
	},
};

/**
 * Lower Third - Minimal Style
 * A minimal text-only lower third
 */
const lowerThirdMinimal: TemplateDefinition = {
	id: 'lower-third-minimal',
	name: 'Minimal Lower Third',
	description: 'Simple text with underline accent',
	category: 'lower-third',
	defaultDurationInFrames: 150,
	width: 400,
	height: 80,
	childTimeline: {
		items: {
			'name-text': {
				...baseTextItem,
				id: 'name-text',
				type: 'text',
				text: 'Jane Doe',
				left: 0,
				top: 10,
				width: 400,
				height: 36,
				fontSize: 28,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '600'},
			},
			underline: {
				...baseSolidItem,
				id: 'underline',
				type: 'solid',
				left: 0,
				top: 52,
				width: 120,
				height: 3,
				color: '#10B981',
				from: 0,
				durationInFrames: 150,
				borderRadius: 2,
			},
			'subtitle-text': {
				...baseTextItem,
				id: 'subtitle-text',
				type: 'text',
				text: 'Product Manager',
				left: 0,
				top: 60,
				width: 400,
				height: 24,
				fontSize: 16,
				color: '#9CA3AF',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-1', items: ['name-text'], hidden: false, muted: false},
			{id: 'track-2', items: ['underline'], hidden: false, muted: false},
			{id: 'track-3', items: ['subtitle-text'], hidden: false, muted: false},
		],
	},
};
const imageCardWithBorder: TemplateDefinition = {
	id: 'imageCardWithBorder',
	name: 'imageCardWithBorder',
	description: '',
	category: 'overlay',
	defaultDurationInFrames: 90,
	width: 1080,
	height: 1920,
	childTimeline: {
		tracks: [
			{
				id: 'LgCs',
				items: ['U1hc'],
				hidden: false,
				muted: false,
			},
			{
				id: 'C250',
				items: ['VikT'],
				hidden: false,
				muted: false,
			},
			{
				id: 'CFXL',
				items: ['pkrV'],
				hidden: false,
				muted: false,
			},
		],
		items: {
			pkrV: {
				type: 'solid',
				color: '#bababa',
				durationInFrames: 90,
				from: 0,
				top: 0,
				left: 0,
				width: 1080,
				height: 1920,
				isDraggingInTimeline: false,
				id: 'pkrV',
				opacity: 1,
				borderRadius: 0,
				rotation: 0,
				keepAspectRatio: false,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				transition: {},
			},
			U1hc: {
				id: 'U1hc',
				durationInFrames: 60,
				top: 183,
				left: 104,
				width: 872,
				height: 1555,
				from: 0,
				type: 'image',
				opacity: 1,
				borderRadius: 50,
				rotation: 0,
				assetId: 'ACvU',
				isDraggingInTimeline: false,
				keepAspectRatio: true,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				cropLeft: 0,
				cropTop: 0,
				cropRight: 0,
				cropBottom: 0,
				transition: {},
			},
			VikT: {
				type: 'solid',
				color: '#ffffff',
				durationInFrames: 90,
				from: 0,
				top: 176,
				left: 97,
				width: 886,
				height: 1568,
				isDraggingInTimeline: false,
				id: 'VikT',
				opacity: 1,
				borderRadius: 52,
				rotation: 0,
				keepAspectRatio: false,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				transition: {},
			},
		},
	},
	assets: {
		ACvU: {
			id: 'ACvU',
			type: 'image',
			filename: 'Pop-Art-Smart-Contract-Icon-midjourney-prompt.webp',
			remoteUrl:
				'https://promptlibrary.org/wp-content/uploads/2025/05/Pop-Art-Smart-Contract-Icon-midjourney-prompt.webp',
			remoteFileKey: null,
			size: 0,
			mimeType: 'image/webp',
			width: null,
			height: null,
			isExternal: true,
			externalErrorCode: 'CORS',
		},
	},
};

const CenteredTitleCard: TemplateDefinition = {
	id: 'CenteredTitleCard',
	name: 'CenteredTitleCard',
	description: '',
	category: 'overlay',
	defaultDurationInFrames: 90,
	width: 1080,
	height: 1920,
	childTimeline: {
		tracks: [
			{
				id: '1lQ5',
				items: ['OiLt'],
				hidden: false,
				muted: false,
			},
			{
				id: 'CFXL',
				items: ['pkrV'],
				hidden: false,
				muted: false,
			},
		],
		items: {
			OiLt: {
				id: 'OiLt',
				durationInFrames: 90,
				from: 0,
				type: 'text',
				text: 'Sample Text',
				color: '#0d0d0d',
				top: 912,
				left: 215,
				width: 651,
				height: 132,
				align: 'center',
				opacity: 1,
				rotation: 0,
				fontFamily: 'Roboto Slab',
				fontSize: 110,
				lineHeight: 1.2,
				letterSpacing: 0,
				resizeOnEdit: true,
				direction: 'ltr',
				fontStyle: {
					variant: 'normal',
					weight: '500',
				},
				isDraggingInTimeline: false,
				strokeWidth: 0,
				strokeColor: '#000000',
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				background: null,
				transition: {},
			},
			pkrV: {
				type: 'solid',
				color: '#ffffff',
				durationInFrames: 90,
				from: 0,
				top: 0,
				left: 0,
				width: 1080,
				height: 1920,
				isDraggingInTimeline: false,
				id: 'pkrV',
				opacity: 1,
				borderRadius: 0,
				rotation: 0,
				keepAspectRatio: false,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				transition: {},
			},
		},
	},
};
/**
 * Title Card - Centered
 * A centered title card for intros
 */
const titleCardCentered: TemplateDefinition = {
	id: 'title-card-centered',
	name: 'Centered Title Card',
	description: 'Big centered title with subtitle',
	category: 'intro',
	defaultDurationInFrames: 90, // 3 seconds
	width: 800,
	height: 200,
	childTimeline: {
		items: {
			'main-title': {
				...baseTextItem,
				id: 'main-title',
				type: 'text',
				text: 'Welcome',
				left: 0,
				top: 30,
				width: 800,
				height: 80,
				fontSize: 64,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 90,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '700'},
			},
			subtitle: {
				...baseTextItem,
				id: 'subtitle',
				type: 'text',
				text: 'Your story begins here',
				left: 0,
				top: 120,
				width: 800,
				height: 40,
				fontSize: 24,
				color: '#A1A1AA',
				from: 0,
				durationInFrames: 90,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-1', items: ['main-title'], hidden: false, muted: false},
			{id: 'track-2', items: ['subtitle'], hidden: false, muted: false},
		],
	},
};

/**
 * Call to Action - Subscribe
 * A subscribe/CTA overlay
 */
const ctaSubscribe: TemplateDefinition = {
	id: 'cta-subscribe',
	name: 'Subscribe CTA',
	description: 'Call to action for subscriptions',
	category: 'overlay',
	defaultDurationInFrames: 120, // 4 seconds
	width: 350,
	height: 120,
	childTimeline: {
		items: {
			background: {
				...baseSolidItem,
				id: 'background',
				type: 'solid',
				left: 0,
				top: 0,
				width: 350,
				height: 120,
				color: '#EF4444',
				from: 0,
				durationInFrames: 120,
				borderRadius: 12,
			},
			'bell-icon': {
				...baseTextItem,
				id: 'bell-icon',
				type: 'text',
				text: '🔔',
				left: 20,
				top: 35,
				width: 50,
				height: 50,
				fontSize: 36,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 120,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '600'},
			},
			'main-text': {
				...baseTextItem,
				id: 'main-text',
				type: 'text',
				text: 'Subscribe Now!',
				left: 80,
				top: 30,
				width: 250,
				height: 35,
				fontSize: 26,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 120,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '700'},
			},
			'sub-text': {
				...baseTextItem,
				id: 'sub-text',
				type: 'text',
				text: 'Never miss an update',
				left: 80,
				top: 68,
				width: 250,
				height: 25,
				fontSize: 16,
				color: 'rgba(255,255,255,0.9)',
				from: 0,
				durationInFrames: 120,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-1', items: ['background'], hidden: false, muted: false},
			{id: 'track-2', items: ['bell-icon'], hidden: false, muted: false},
			{id: 'track-3', items: ['main-text'], hidden: false, muted: false},
			{id: 'track-4', items: ['sub-text'], hidden: false, muted: false},
		],
	},
};

/**
 * End Card - Thanks for Watching
 * An outro/end card
 */
const endCardThanks: TemplateDefinition = {
	id: 'end-card-thanks',
	name: 'Thanks End Card',
	description: 'Thank you outro card',
	category: 'outro',
	defaultDurationInFrames: 120, // 4 seconds
	width: 600,
	height: 300,
	childTimeline: {
		items: {
			background: {
				...baseSolidItem,
				id: 'background',
				type: 'solid',
				left: 0,
				top: 0,
				width: 600,
				height: 300,
				color: 'rgba(0, 0, 0, 0.85)',
				from: 0,
				durationInFrames: 120,
				borderRadius: 16,
			},
			'thanks-text': {
				...baseTextItem,
				id: 'thanks-text',
				type: 'text',
				text: 'Thanks for Watching!',
				left: 0,
				top: 80,
				width: 600,
				height: 60,
				fontSize: 42,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 120,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '700'},
			},
			divider: {
				...baseSolidItem,
				id: 'divider',
				type: 'solid',
				left: 200,
				top: 155,
				width: 200,
				height: 3,
				color: '#8B5CF6',
				from: 0,
				durationInFrames: 120,
				borderRadius: 2,
			},
			'follow-text': {
				...baseTextItem,
				id: 'follow-text',
				type: 'text',
				text: '@yourhandle',
				left: 0,
				top: 180,
				width: 600,
				height: 35,
				fontSize: 24,
				color: '#A78BFA',
				from: 0,
				durationInFrames: 120,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '500'},
			},
			'subscribe-text': {
				...baseTextItem,
				id: 'subscribe-text',
				type: 'text',
				text: 'Like & Subscribe for more content',
				left: 0,
				top: 225,
				width: 600,
				height: 30,
				fontSize: 18,
				color: '#9CA3AF',
				from: 0,
				durationInFrames: 120,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-1', items: ['background'], hidden: false, muted: false},
			{id: 'track-2', items: ['thanks-text'], hidden: false, muted: false},
			{id: 'track-3', items: ['divider'], hidden: false, muted: false},
			{id: 'track-4', items: ['follow-text'], hidden: false, muted: false},
			{id: 'track-5', items: ['subscribe-text'], hidden: false, muted: false},
		],
	},
};

/**
 * Quote Card
 * A stylish quote display
 */
const quoteCard: TemplateDefinition = {
	id: 'quote-card',
	name: 'Quote Card',
	description: 'Stylish quote display',
	category: 'overlay',
	defaultDurationInFrames: 150, // 5 seconds
	width: 700,
	height: 250,
	childTimeline: {
		items: {
			background: {
				...baseSolidItem,
				id: 'background',
				type: 'solid',
				left: 0,
				top: 0,
				width: 700,
				height: 250,
				color: 'rgba(30, 41, 59, 0.95)',
				from: 0,
				durationInFrames: 150,
				borderRadius: 12,
			},
			'quote-mark': {
				...baseTextItem,
				id: 'quote-mark',
				type: 'text',
				text: '"',
				left: 30,
				top: 20,
				width: 60,
				height: 80,
				fontSize: 72,
				color: '#3B82F6',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '700'},
			},
			'quote-text': {
				...baseTextItem,
				id: 'quote-text',
				type: 'text',
				text: 'The only way to do great work is to love what you do.',
				left: 50,
				top: 70,
				width: 600,
				height: 80,
				fontSize: 28,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 150,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '500'},
			},
			'author-text': {
				...baseTextItem,
				id: 'author-text',
				type: 'text',
				text: '— Steve Jobs',
				left: 50,
				top: 170,
				width: 600,
				height: 35,
				fontSize: 20,
				color: '#94A3B8',
				from: 0,
				durationInFrames: 150,
				align: 'center',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-1', items: ['background'], hidden: false, muted: false},
			{id: 'track-2', items: ['quote-mark'], hidden: false, muted: false},
			{id: 'track-3', items: ['quote-text'], hidden: false, muted: false},
			{id: 'track-4', items: ['author-text'], hidden: false, muted: false},
		],
	},
};

/**
 * Modern Lower Third (copy)
 * Lower third positioned for 1080x1920 canvas
 */
const modernLowerThird: TemplateDefinition = {
	id: 'modern-lower-third',
	name: 'Modern Lower Third v2',
	description: 'Lower third for portrait videos',
	category: 'lower-third',
	defaultDurationInFrames: 150,
	width: 500,
	height: 100,
	childTimeline: {
		items: {
			'bg-solid': {
				...baseSolidItem,
				id: 'bg-solid',
				type: 'solid',
				left: 0,
				top: 0,
				width: 500,
				height: 100,
				color: 'rgba(0, 0, 0, 0.75)',
				from: 0,
				durationInFrames: 150,
				borderRadius: 8,
			},
			'accent-bar': {
				...baseSolidItem,
				id: 'accent-bar',
				type: 'solid',
				left: 0,
				top: 0,
				width: 6,
				height: 100,
				color: '#3B82F6',
				from: 0,
				durationInFrames: 150,
				borderRadius: 4,
			},
			'name-text': {
				...baseTextItem,
				id: 'name-text',
				type: 'text',
				text: 'John Smith',
				left: 24,
				top: 20,
				width: 460,
				height: 36,
				fontSize: 28,
				color: '#FFFFFF',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '700'},
			},
			'title-text': {
				...baseTextItem,
				id: 'title-text',
				type: 'text',
				text: 'Creative Director',
				left: 24,
				top: 58,
				width: 460,
				height: 28,
				fontSize: 18,
				color: '#94A3B8',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '400'},
			},
		},
		tracks: [
			{id: 'track-4', items: ['title-text'], hidden: false, muted: false},
			{id: 'track-3', items: ['name-text'], hidden: false, muted: false},
			{id: 'track-2', items: ['accent-bar'], hidden: false, muted: false},
			{id: 'track-1', items: ['bg-solid'], hidden: false, muted: false},
		],
	},
};

/**
 * Image with Texts
 * A full-screen template with text overlays
 */
const imageWithTexts: TemplateDefinition = {
	id: 'composite-4-items',
	name: 'Full Screen Text Overlay',
	description: 'Full screen background with text',
	category: 'overlay',
	defaultDurationInFrames: 150,
	width: 1080,
	height: 1920,
	childTimeline: {
		items: {
			'text-1': {
				...baseTextItem,
				id: 'text-1',
				type: 'text',
				text: 'Organises your day so nothing slips\nthrough',
				left: 55,
				top: 1518,
				width: 690,
				height: 96,
				fontSize: 40,
				color: '#545454',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '400'},
			},
			'text-2': {
				...baseTextItem,
				id: 'text-2',
				type: 'text',
				text: 'Making everyday\nplanning feel easier.',
				left: 45,
				top: 1293,
				width: 818,
				height: 192,
				fontSize: 80,
				color: '#000000',
				from: 0,
				durationInFrames: 150,
				align: 'left',
				fontStyle: {variant: 'normal', weight: '400'},
			},
			'bg-solid': {
				...baseSolidItem,
				id: 'bg-solid',
				type: 'solid',
				left: 0,
				top: 0,
				width: 1080,
				height: 1920,
				color: '#f0f0f0',
				from: 0,
				durationInFrames: 150,
				borderRadius: 0,
			},
		},
		tracks: [
			{id: 'track-1', items: ['text-1'], hidden: false, muted: false},
			{id: 'track-2', items: ['text-2'], hidden: false, muted: false},
			{id: 'track-3', items: ['bg-solid'], hidden: false, muted: false},
		],
	},
};

const testTemplate: TemplateDefinition = {
	id: 'composite-2-items',
	name: 'Composite (2 items)',
	description: '',
	category: 'overlay',
	defaultDurationInFrames: 100,
	width: 659,
	height: 656,
	childTimeline: {
		tracks: [
			{
				id: '6JTJ',
				items: ['G4Ki'],
				hidden: false,
				muted: false,
			},
			{
				id: 'rbMm',
				items: ['8tCq'],
				hidden: false,
				muted: false,
			},
		],
		items: {
			G4Ki: {
				id: 'G4Ki',
				durationInFrames: 100,
				from: 0,
				type: 'text',
				text: 'Text',
				color: '#ffffff',
				top: 560,
				left: 108,
				width: 153,
				height: 96,
				align: 'center',
				opacity: 1,
				rotation: 0,
				fontFamily: 'Roboto',
				fontSize: 80,
				lineHeight: 1.2,
				letterSpacing: 0,
				resizeOnEdit: true,
				direction: 'ltr',
				fontStyle: {
					variant: 'normal',
					weight: '400',
				},
				isDraggingInTimeline: false,
				strokeWidth: 0,
				strokeColor: '#000000',
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				background: null,
				transition: {},
			},
			'8tCq': {
				type: 'solid',
				color: '#ffffff',
				durationInFrames: 90,
				from: 0,
				top: 0,
				left: 0,
				width: 659,
				height: 418,
				isDraggingInTimeline: false,
				id: '8tCq',
				opacity: 1,
				borderRadius: 0,
				rotation: 0,
				keepAspectRatio: false,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				transition: {},
			},
		},
	},
};

const _template_1: TemplateDefinition = {
	id: 'composite-4-items',
	name: 'Composite (4 items)',
	description: '',
	category: 'overlay',
	defaultDurationInFrames: 60,
	width: 1091,
	height: 2305,
	childTimeline: {
		tracks: [
			{
				id: '3u7g',
				items: ['PYbS'],
				hidden: false,
				muted: false,
			},
			{
				id: 'gjX0',
				items: ['o57h'],
				hidden: false,
				muted: false,
			},
			{
				id: 'xFyZ',
				items: ['doOP'],
				hidden: false,
				muted: false,
			},
			{
				id: '2Qsv',
				items: ['mcNU'],
				hidden: false,
				muted: false,
			},
		],
		items: {
			PYbS: {
				id: 'PYbS',
				durationInFrames: 60,
				from: 0,
				type: 'text',
				text: 'keep track of the tasks and reminders\nso you dont have to.',
				color: '#000000',
				top: 1943,
				left: 132,
				width: 838,
				height: 96,
				align: 'left',
				opacity: 1,
				rotation: 0,
				fontFamily: 'Cinzel',
				fontSize: 40,
				lineHeight: 1.2,
				letterSpacing: 0,
				resizeOnEdit: true,
				direction: 'ltr',
				fontStyle: {
					variant: 'normal',
					weight: '600',
				},
				isDraggingInTimeline: false,
				strokeWidth: 0,
				strokeColor: '#000000',
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				background: null,
				transition: {},
			},
			o57h: {
				id: 'o57h',
				durationInFrames: 60,
				from: 0,
				type: 'text',
				text: 'Taking care of the \nlittle things you forget',
				color: '#000000',
				top: 1706,
				left: 62,
				width: 917,
				height: 192,
				align: 'left',
				opacity: 1,
				rotation: 0,
				fontFamily: 'Yeseva One',
				fontSize: 80,
				lineHeight: 1.2,
				letterSpacing: 0,
				resizeOnEdit: true,
				direction: 'ltr',
				fontStyle: {
					variant: 'normal',
					weight: '400',
				},
				isDraggingInTimeline: false,
				strokeWidth: 0,
				strokeColor: '#000000',
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				background: null,
				transition: {},
			},
			doOP: {
				id: 'doOP',
				durationInFrames: 60,
				top: 0,
				left: 0,
				width: 1091,
				height: 1867.3720439189187,
				from: 0,
				type: 'image',
				opacity: 1,
				borderRadius: 0,
				rotation: 0,
				assetId: 'nKOL',
				isDraggingInTimeline: false,
				keepAspectRatio: true,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				cropLeft: 0.010223048327137546,
				cropTop: 0.20625879823309673,
				cropRight: 0,
				cropBottom: 0.11813875173250171,
				transition: {},
			},
			mcNU: {
				type: 'solid',
				color: '#ededed',
				durationInFrames: 60,
				from: 0,
				top: 385,
				left: 11,
				width: 1080,
				height: 1920,
				isDraggingInTimeline: false,
				id: 'mcNU',
				opacity: 1,
				borderRadius: 0,
				rotation: 0,
				keepAspectRatio: false,
				fadeInDurationInSeconds: 0,
				fadeOutDurationInSeconds: 0,
				transition: {},
			},
		},
	},
	assets: {
		nKOL: {
			id: 'nKOL',
			type: 'image',
			filename: 'image.png',
			remoteUrl:
				'https://editor-starter-v1.s3-accelerate.amazonaws.com/2c66d1c6-f8d2-425d-8a84-f61d79029dc7',
			remoteFileKey: '2c66d1c6-f8d2-425d-8a84-f61d79029dc7',
			size: 1982463,
			mimeType: 'image/png',
			width: 816,
			height: 1456,
		},
	},
};

/**
 * All available templates
 */
export const SAMPLE_TEMPLATES: TemplateDefinition[] = [
	lowerThirdModern,
	lowerThirdMinimal,
	titleCardCentered,
	ctaSubscribe,
	endCardThanks,
	quoteCard,
	modernLowerThird,
	imageWithTexts,
	testTemplate,
	_template_1,
	imageCardWithBorder,
	CenteredTitleCard,
];

/**
 * Get templates grouped by category
 */
export const getTemplatesByCategory = () => {
	const categories = new Map<string, TemplateDefinition[]>();

	for (const template of SAMPLE_TEMPLATES) {
		const existing = categories.get(template.category) || [];
		existing.push(template);
		categories.set(template.category, existing);
	}

	return categories;
};

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<string, string> = {
	'lower-third': 'Lower Thirds',
	intro: 'Intros',
	outro: 'Outros',
	overlay: 'Overlays',
	transition: 'Transitions',
};
