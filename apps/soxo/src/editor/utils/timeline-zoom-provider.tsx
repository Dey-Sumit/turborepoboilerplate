// MIGRATED TO ZUSTAND UI STORE
// This provider has been fully migrated to ui-store.ts
//
// The timeline zoom state is now managed in Zustand:
// - zoom state: useZoom() from ui-store
// - setZoom action: useSetZoom() from ui-store
//
// The setZoom action preserves the original scroll restoration logic
// using restoreScrollAfterZoom() and flushSync()
//
// For backwards compatibility, use:
// import { useTimelineZoom } from '../timeline/utils/use-timeline-zoom';
//
// This file can be safely deleted once all references are confirmed removed.
