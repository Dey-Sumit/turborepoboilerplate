import {AudioItem} from './audio/audio-item-type';
import {CaptionsItem} from './captions/captions-item-type';
import {CodeItem} from './code/code-item-type';
import {CompositeItem} from './composite/composite-item-type';
import {GifItem} from './gif/gif-item-type';
import {ImageItem} from './image/image-item-type';
import {ShapeItem} from './shape/shape-item-type';
import {SolidItem} from './solid/solid-item-type';
import {TextItem} from './text/text-item-type';
import {VideoItem} from './video/video-item-type';

export type EditorStarterItem =
	| ImageItem
	| TextItem
	| VideoItem
	| SolidItem
	| CaptionsItem
	| AudioItem
	| GifItem
	| CompositeItem
	| CodeItem
	| ShapeItem;
