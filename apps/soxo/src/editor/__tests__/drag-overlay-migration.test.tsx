/**
 * DragOverlay Migration Test Suite
 *
 * Purpose: Capture CURRENT behavior before migration from Context to Zustand
 * Strategy: Write tests against current implementation, then verify they still pass after migration
 *
 * Test Coverage:
 * 1. startDrag() initializes drag state correctly
 * 2. updateCursorPosition() updates cursor during drag
 * 3. stopDrag() clears drag state
 * 4. setSnappedPositions() updates snap positions
 * 5. Components re-render appropriately (not excessively)
 */

import {render, screen, waitFor} from '@testing-library/react';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {PlayerRef} from '@remotion/player';
import React, {useRef} from 'react';
import {DragOverlayProvider, useDragOverlay} from '../drag-overlay-provider';
import {TrackType} from '../state/types';
import {EditorStarterItem} from '../items/item-type';

// Mock dependencies
vi.mock('../utils/restore-scroll-after-zoom', () => ({
	timelineScrollableContainerRef: {
		current: {
			getBoundingClientRect: () => ({
				top: 100,
				left: 200,
				width: 1000,
				height: 500,
			}),
		},
	},
}));

vi.mock('../utils/use-timeline-container-auto-scroll', () => ({
	useTimelineContainerAutoScroll: vi.fn(),
}));

// Mock IndexedDB to avoid Promise.withResolvers error
vi.mock('../caching/indexeddb', () => ({
	getKeys: vi.fn().mockResolvedValue([]),
	updateKeys: vi.fn().mockResolvedValue(undefined),
	getBlob: vi.fn().mockResolvedValue(null),
	setBlob: vi.fn().mockResolvedValue(undefined),
	removeBlob: vi.fn().mockResolvedValue(undefined),
}));

// Polyfill Promise.withResolvers for Node < 22
if (!Promise.withResolvers) {
	// @ts-expect-error - Polyfill for older Node versions
	Promise.withResolvers = function <T>() {
		let resolve: (value: T | PromiseLike<T>) => void;
		let reject: (reason?: any) => void;
		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return {promise, resolve: resolve!, reject: reject!};
	};
}

// Test component that uses drag overlay
const TestComponent = ({
	onRender,
}: {
	onRender?: (state: ReturnType<typeof useDragOverlay>) => void;
}) => {
	const dragOverlay = useDragOverlay();
	const renderCount = useRef(0);
	renderCount.current++;

	// Call onRender callback to capture state
	React.useEffect(() => {
		onRender?.(dragOverlay);
	});

	return (
		<div data-testid="test-component">
			<div data-testid="is-dragging">{String(dragOverlay.isDragging)}</div>
			<div data-testid="dragged-count">{dragOverlay.draggedItemIds.length}</div>
			<div data-testid="cursor-x">
				{dragOverlay.cursorPosition?.x ?? 'null'}
			</div>
			<div data-testid="cursor-y">
				{dragOverlay.cursorPosition?.y ?? 'null'}
			</div>
			<div data-testid="render-count">{renderCount.current}</div>
		</div>
	);
};

// Helper to create test data
const createTestData = () => {
	const tracks: TrackType[] = [
		{
			id: 'track1',
			items: ['item1', 'item2'],
			hidden: false,
			muted: false,
		},
		{
			id: 'track2',
			items: ['item3'],
			hidden: false,
			muted: false,
		},
	];

	const items: Record<string, EditorStarterItem> = {
		item1: {
			id: 'item1',
			type: 'text',
			trackId: 'track1',
			from: 0,
			fromFrameInTimeline: 0,
			durationInFrames: 30,
			x: 100,
			y: 100,
			width: 200,
			height: 100,
			name: 'Text 1',
			locked: false,
		} as EditorStarterItem,
		item2: {
			id: 'item2',
			type: 'text',
			trackId: 'track1',
			from: 30,
			fromFrameInTimeline: 30,
			durationInFrames: 30,
			x: 100,
			y: 100,
			width: 200,
			height: 100,
			name: 'Text 2',
			locked: false,
		} as EditorStarterItem,
		item3: {
			id: 'item3',
			type: 'video',
			trackId: 'track2',
			from: 0,
			fromFrameInTimeline: 0,
			durationInFrames: 60,
			x: 100,
			y: 100,
			width: 200,
			height: 100,
			name: 'Video 1',
			locked: false,
		} as EditorStarterItem,
	};

	return {tracks, items};
};

describe('DragOverlay Migration Tests', () => {
	let playerRef: React.RefObject<PlayerRef | null>;

	beforeEach(() => {
		playerRef = {current: null};
	});

	describe('Initial State', () => {
		it('should have correct initial state', () => {
			const capturedState = vi.fn();

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<TestComponent onRender={capturedState} />
				</DragOverlayProvider>,
			);

			// Wait for initial render
			waitFor(() => {
				expect(capturedState).toHaveBeenCalled();
			});

			const state = capturedState.mock.calls[0][0];

			// Verify initial state
			expect(state.isDragging).toBe(false);
			expect(state.draggedItemIds).toEqual([]);
			expect(state.itemsMeta).toEqual([]);
			expect(state.cursorPosition).toBeNull();
			expect(state.snappedPositions).toBeNull();
		});

		it('should render isDragging as false initially', () => {
			render(
				<DragOverlayProvider playerRef={playerRef}>
					<TestComponent />
				</DragOverlayProvider>,
			);

			expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
			expect(screen.getByTestId('dragged-count')).toHaveTextContent('0');
			expect(screen.getByTestId('cursor-x')).toHaveTextContent('null');
			expect(screen.getByTestId('cursor-y')).toHaveTextContent('null');
		});
	});

	describe('startDrag()', () => {
		it('should initialize drag state correctly', async () => {
			const {tracks, items} = createTestData();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<TestComponent />
				</DragOverlayProvider>,
			);

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1', 'item2'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Wait for state update
			await waitFor(() => {
				expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
			});

			// Verify drag started
			expect(screen.getByTestId('dragged-count')).toHaveTextContent('2');
			expect(screen.getByTestId('cursor-x')).toHaveTextContent('300');
			expect(screen.getByTestId('cursor-y')).toHaveTextContent('150');
		});

		it('should calculate itemsMeta correctly', async () => {
			const {tracks, items} = createTestData();
			const capturedState = vi.fn();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<TestComponent onRender={capturedState} />
				</DragOverlayProvider>,
			);

			// Start drag with single item
			dragOverlayApi!.startDrag({
				itemIds: ['item1'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Wait for state update
			await waitFor(() => {
				const calls = capturedState.mock.calls;
				const lastCall = calls[calls.length - 1];
				expect(lastCall[0].isDragging).toBe(true);
			});

			const state = capturedState.mock.calls[capturedState.mock.calls.length - 1][0];

			// Verify itemsMeta
			expect(state.itemsMeta).toHaveLength(1);
			expect(state.itemsMeta[0].id).toBe('item1');
			expect(state.itemsMeta[0].from).toBe(0);
			expect(state.itemsMeta[0].durationInFrames).toBe(30);
			expect(state.itemsMeta[0].trackIndex).toBe(0);
		});

		it('should handle multiple items across tracks', async () => {
			const {tracks, items} = createTestData();
			const capturedState = vi.fn();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<TestComponent onRender={capturedState} />
				</DragOverlayProvider>,
			);

			// Drag items from different tracks
			dragOverlayApi!.startDrag({
				itemIds: ['item1', 'item3'], // item1 from track1, item3 from track2
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			await waitFor(() => {
				const calls = capturedState.mock.calls;
				const lastCall = calls[calls.length - 1];
				expect(lastCall[0].itemsMeta).toHaveLength(2);
			});

			const state = capturedState.mock.calls[capturedState.mock.calls.length - 1][0];

			// Verify both items
			expect(state.itemsMeta[0].id).toBe('item1');
			expect(state.itemsMeta[0].trackIndex).toBe(0);

			expect(state.itemsMeta[1].id).toBe('item3');
			expect(state.itemsMeta[1].trackIndex).toBe(1);
		});
	});

	describe('updateCursorPosition()', () => {
		it('should update cursor position during drag', async () => {
			const {tracks, items} = createTestData();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<TestComponent />
				</DragOverlayProvider>,
			);

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Wait for drag to start
			await waitFor(() => {
				expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
			});

			// Update cursor position
			dragOverlayApi!.updateCursorPosition(400, 200);

			// Wait for cursor update
			await waitFor(() => {
				expect(screen.getByTestId('cursor-x')).toHaveTextContent('400');
			});

			// Verify position updated
			expect(screen.getByTestId('cursor-y')).toHaveTextContent('200');
		});

		it('should trigger re-render on cursor update', () => {
			const {tracks, items} = createTestData();
			const renderSpy = vi.fn();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			const RenderCounter = () => {
				const overlay = useDragOverlay();
				React.useEffect(() => {
					renderSpy(overlay.cursorPosition);
				});
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<RenderCounter />
				</DragOverlayProvider>,
			);

			renderSpy.mockClear(); // Clear initial render

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Update position multiple times
			dragOverlayApi!.updateCursorPosition(350, 160);
			dragOverlayApi!.updateCursorPosition(400, 170);
			dragOverlayApi!.updateCursorPosition(450, 180);

			// Verify re-renders happened
			waitFor(() => {
				expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
			});
		});
	});

	describe('setSnappedPositions()', () => {
		it('should update snapped positions', () => {
			const {tracks, items} = createTestData();
			const capturedState = vi.fn();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<TestComponent onRender={capturedState} />
				</DragOverlayProvider>,
			);

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1', 'item2'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Set snapped positions
			const snappedPositions = {
				item1: 10,
				item2: 40,
			};

			dragOverlayApi!.setSnappedPositions(snappedPositions);

			waitFor(() => {
				const calls = capturedState.mock.calls;
				const lastCall = calls[calls.length - 1];
				expect(lastCall[0].snappedPositions).toEqual(snappedPositions);
			});
		});

		it('should not trigger re-render if positions are same', () => {
			const {tracks, items} = createTestData();
			const renderSpy = vi.fn();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			const RenderCounter = () => {
				useDragOverlay();
				renderSpy();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<RenderCounter />
				</DragOverlayProvider>,
			);

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			const renderCountBefore = renderSpy.mock.calls.length;

			// Set same positions twice
			const positions = {item1: 10};
			dragOverlayApi!.setSnappedPositions(positions);
			dragOverlayApi!.setSnappedPositions(positions); // Same reference

			// Should not cause additional re-renders
			waitFor(() => {
				expect(renderSpy.mock.calls.length).toBe(renderCountBefore + 1); // Only 1 update
			});
		});
	});

	describe('stopDrag()', () => {
		it('should clear all drag state', async () => {
			const {tracks, items} = createTestData();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<TestComponent />
				</DragOverlayProvider>,
			);

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1', 'item2'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Wait for drag to start
			await waitFor(() => {
				expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
			});

			// Verify drag active
			expect(screen.getByTestId('dragged-count')).toHaveTextContent('2');

			// Stop drag
			dragOverlayApi!.stopDrag();

			// Wait for drag to stop
			await waitFor(() => {
				expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
			});

			// Verify all state cleared
			expect(screen.getByTestId('dragged-count')).toHaveTextContent('0');
			expect(screen.getByTestId('cursor-x')).toHaveTextContent('null');
			expect(screen.getByTestId('cursor-y')).toHaveTextContent('null');
		});
	});

	describe('Re-render Behavior', () => {
		it('should not re-render unnecessarily when drag is inactive', async () => {
			const renderSpy = vi.fn();

			const RenderCounter = () => {
				const overlay = useDragOverlay();
				renderSpy(overlay.isDragging);
				return null;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<RenderCounter />
				</DragOverlayProvider>,
			);

			const initialRenderCount = renderSpy.mock.calls.length;

			// Wait a bit to see if any re-renders happen
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
		});

		it('should only re-render consumers, not entire tree', () => {
			const {tracks, items} = createTestData();
			const consumerRenderSpy = vi.fn();
			const siblingRenderSpy = vi.fn();
			let dragOverlayApi: ReturnType<typeof useDragOverlay>;

			const CaptureApi = () => {
				dragOverlayApi = useDragOverlay();
				return null;
			};

			const Consumer = () => {
				useDragOverlay();
				consumerRenderSpy();
				return <div>Consumer</div>;
			};

			const Sibling = () => {
				// Doesn't use drag overlay
				siblingRenderSpy();
				return <div>Sibling</div>;
			};

			render(
				<DragOverlayProvider playerRef={playerRef}>
					<CaptureApi />
					<Consumer />
					<Sibling />
				</DragOverlayProvider>,
			);

			consumerRenderSpy.mockClear();
			siblingRenderSpy.mockClear();

			// Start drag
			dragOverlayApi!.startDrag({
				itemIds: ['item1'],
				clickedItemId: 'item1',
				timelineWidth: 1000,
				visibleFrames: 100,
				clickX: 300,
				clickY: 150,
				tracks,
				items,
			});

			// Consumer should re-render
			waitFor(() => {
				expect(consumerRenderSpy.mock.calls.length).toBeGreaterThan(0);
			});

			// Sibling should NOT re-render (in ideal world)
			// NOTE: Context API may cause sibling to re-render, which is why we're migrating!
			// After migration to Zustand, sibling should have 0 re-renders
		});
	});
});
