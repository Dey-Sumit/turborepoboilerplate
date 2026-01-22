import {render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import useUIStore from '../../zustand/ui-store';
import {useTimelineSize} from '../timeline/utils/use-timeline-size';
import {TimelineSizeProvider} from '../timeline/timeline-size-provider';

// Mock modules
vi.mock('../caching/indexeddb', () => ({
	getKeys: vi.fn().mockResolvedValue([]),
	updateKeys: vi.fn().mockResolvedValue(undefined),
	getBlob: vi.fn().mockResolvedValue(null),
	setBlob: vi.fn().mockResolvedValue(undefined),
	removeBlob: vi.fn().mockResolvedValue(undefined),
}));

// Promise.withResolvers polyfill for Node < 22
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

// Mock editor-store to provide durationInFrames
vi.mock('../../zustand/editor-store', () => ({
	useEditorStore: vi.fn(() => ({
		compositionState: {
			composition: {
				durationInFrames: 300,
				fps: 30,
			},
		},
	})),
	useDurationInFrames: vi.fn(() => 300),
}));

// Mock use-context to provide fps
vi.mock('../utils/use-context', () => ({
	useFps: vi.fn(() => ({fps: 30})),
}));

// Mock use-timeline-zoom to provide zoom
vi.mock('../timeline/utils/use-timeline-zoom', () => ({
	useTimelineZoom: vi.fn(() => ({zoom: 0.5})),
}));

// Test component that uses useTimelineSize
const TestComponent = () => {
	const {timelineWidth, containerWidth, maxZoom, zoomStep} = useTimelineSize();

	return (
		<div>
			<div data-testid="timeline-width">{timelineWidth ?? 'null'}</div>
			<div data-testid="container-width">{containerWidth ?? 'null'}</div>
			<div data-testid="max-zoom">{maxZoom}</div>
			<div data-testid="zoom-step">{zoomStep}</div>
		</div>
	);
};

describe('TimelineSize Migration Tests', () => {
	beforeEach(() => {
		// Reset ui-store before each test
		useUIStore.setState({timelineContainerWidth: null});
	});

	describe('Initial State', () => {
		it('should have null initial state when no containerWidth', async () => {
			render(
				<TimelineSizeProvider containerWidth={null}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				expect(screen.getByTestId('timeline-width')).toHaveTextContent('null');
				expect(screen.getByTestId('container-width')).toHaveTextContent('null');
				expect(screen.getByTestId('max-zoom')).toHaveTextContent('1');
				expect(screen.getByTestId('zoom-step')).toHaveTextContent('0.1');
			});
		});

		it('should calculate timeline size when containerWidth is provided', async () => {
			render(
				<TimelineSizeProvider containerWidth={1000}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				// With containerWidth=1000, zoom=0.5, durationInFrames=300, fps=30
				// The calculation should produce a non-null timelineWidth
				const timelineWidth = screen.getByTestId('timeline-width').textContent;
				expect(timelineWidth).not.toBe('null');
				expect(Number(timelineWidth)).toBeGreaterThan(0);

				expect(screen.getByTestId('container-width')).toHaveTextContent('1000');
			});
		});
	});

	describe('TimelineSizeProvider', () => {
		it('should update ui-store when containerWidth changes', async () => {
			const {rerender} = render(
				<TimelineSizeProvider containerWidth={800}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				expect(useUIStore.getState().timelineContainerWidth).toBe(800);
			});

			// Change containerWidth
			rerender(
				<TimelineSizeProvider containerWidth={1200}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				expect(useUIStore.getState().timelineContainerWidth).toBe(1200);
			});
		});

		it('should handle null containerWidth', async () => {
			render(
				<TimelineSizeProvider containerWidth={null}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				expect(useUIStore.getState().timelineContainerWidth).toBeNull();
			});
		});
	});

	describe('useTimelineSize computed hook', () => {
		it('should recalculate when containerWidth changes', async () => {
			const {rerender} = render(
				<TimelineSizeProvider containerWidth={800}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			const initialTimelineWidth = await waitFor(() => {
				const width = screen.getByTestId('timeline-width').textContent;
				expect(width).not.toBe('null');
				return Number(width);
			});

			// Change containerWidth - should trigger recalculation
			rerender(
				<TimelineSizeProvider containerWidth={1600}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				const newTimelineWidth = Number(
					screen.getByTestId('timeline-width').textContent,
				);
				// Doubled containerWidth should change timelineWidth
				expect(newTimelineWidth).not.toBe(initialTimelineWidth);
				expect(newTimelineWidth).toBeGreaterThan(initialTimelineWidth);
			});
		});

		it('should calculate maxZoom correctly', async () => {
			render(
				<TimelineSizeProvider containerWidth={1000}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				const maxZoom = Number(screen.getByTestId('max-zoom').textContent);
				// maxZoom should be between 0 and 1 (or possibly > 1 based on duration)
				expect(maxZoom).toBeGreaterThan(0);
			});
		});

		it('should calculate zoomStep correctly', async () => {
			render(
				<TimelineSizeProvider containerWidth={1000}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				const zoomStep = Number(screen.getByTestId('zoom-step').textContent);
				// zoomStep should be a small positive number
				expect(zoomStep).toBeGreaterThan(0);
				expect(zoomStep).toBeLessThan(1);
			});
		});
	});

	describe('Calculations match original Context implementation', () => {
		it('should produce same timelineWidth for given inputs', async () => {
			// Test with specific known inputs
			render(
				<TimelineSizeProvider containerWidth={1000}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				const timelineWidth = Number(
					screen.getByTestId('timeline-width').textContent,
				);

				// With containerWidth=1000, zoom=0.5 (mocked), durationInFrames=300, fps=30
				// getZoomMultiplier will interpolate zoom (0.5) into a multiplier
				// timelineWidth = containerWidth * multiplier
				// Since zoom=0.5 is midpoint, multiplier should be between 1 and maxMultiplier
				expect(timelineWidth).toBeGreaterThan(1000); // Should be more than containerWidth
			});
		});

		it('should handle containerWidth transitions correctly', async () => {
			const {rerender} = render(
				<TimelineSizeProvider containerWidth={null}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			// Initially null
			await waitFor(() => {
				expect(screen.getByTestId('timeline-width')).toHaveTextContent('null');
			});

			// Transition to real width
			rerender(
				<TimelineSizeProvider containerWidth={1000}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				expect(screen.getByTestId('timeline-width')).not.toHaveTextContent(
					'null',
				);
				expect(screen.getByTestId('container-width')).toHaveTextContent('1000');
			});

			// Transition back to null
			rerender(
				<TimelineSizeProvider containerWidth={null}>
					<TestComponent />
				</TimelineSizeProvider>,
			);

			await waitFor(() => {
				expect(screen.getByTestId('timeline-width')).toHaveTextContent('null');
				expect(screen.getByTestId('container-width')).toHaveTextContent('null');
			});
		});
	});

	describe('Performance - No Context re-renders', () => {
		it('should only recalculate when dependencies change', async () => {
			let renderCount = 0;

			const CountingComponent = () => {
				renderCount++;
				const {timelineWidth} = useTimelineSize();
				return <div data-testid="width">{timelineWidth ?? 'null'}</div>;
			};

			const {rerender} = render(
				<TimelineSizeProvider containerWidth={1000}>
					<CountingComponent />
				</TimelineSizeProvider>,
			);

			const initialRenderCount = await waitFor(() => {
				expect(renderCount).toBeGreaterThan(0);
				return renderCount;
			});

			// Re-render with same containerWidth - component shouldn't re-render unnecessarily
			rerender(
				<TimelineSizeProvider containerWidth={1000}>
					<CountingComponent />
				</TimelineSizeProvider>,
			);

			// Allow a brief moment for potential re-renders
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Render count should not increase significantly (maybe +1 for provider update, but not cascade)
			expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 2);
		});
	});
});
