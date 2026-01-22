'use client';

import type {PlayerRef} from '@remotion/player';
import {useRef} from 'react';
import {Toaster} from 'sonner';
import {ActionRow} from './action-row/action-row';
import {DownloadRemoteAssets} from './caching/download-remote-assets';
import {UseLocalCachedAssets} from './caching/use-local-cached-assets';
import {EditorWrapper} from './context-provider';

// import {TemporalDebugPanel} from './debug/temporal-debug-panel';
import {FEATURE_RESIZE_TIMELINE_PANEL} from './flags';
import {ForceSpecificCursor} from './force-specific-cursor';
import {PlaybackControls} from './playback-controls';
import {PreviewSizeProvider} from './preview-size-provider';
import {TimelineResizer} from './timeline-resizer';
import {CompositeBreadcrumb} from './timeline/composite-breadcrumb';
import {Timeline} from './timeline/timeline';
import {TimelineContainer} from './timeline/timeline-container';
import {TopPanel} from './top-panel';
import {WaitForInitialized} from './wait-for-initialized';
import {GlobalCodeEditorDialog} from './inspector/code-editor-dialog';

export const Editor: React.FC = () => {
	const playerRef = useRef<PlayerRef | null>(null);

	return (
		<div className="flex h-screen w-screen">
			<EditorWrapper>
				<WaitForInitialized>
					{/* <div className="h-full w-[700px] border">
						<ChatBot />
					</div> */}

					<div className="flex h-screen w-full flex-col items-center justify-between">
						<PreviewSizeProvider>
							<ActionRow playerRef={playerRef} />
							<TopPanel playerRef={playerRef} />
						</PreviewSizeProvider>

						<PlaybackControls playerRef={playerRef} />
						<CompositeBreadcrumb />
						{FEATURE_RESIZE_TIMELINE_PANEL && <TimelineResizer />}
						<TimelineContainer playerRef={playerRef}>
							<Timeline playerRef={playerRef} />
						</TimelineContainer>
					</div>
				</WaitForInitialized>
				<ForceSpecificCursor />
				<DownloadRemoteAssets />
				<UseLocalCachedAssets />
				<GlobalCodeEditorDialog />
				<Toaster theme="dark" />
				{/* <TemporalDebugPanel /> */}
			</EditorWrapper>
		</div>
	);
};
