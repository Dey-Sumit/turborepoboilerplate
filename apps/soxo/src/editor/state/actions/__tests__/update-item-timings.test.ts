import {describe, it, expect} from 'vitest';
import {updateItemTimings} from '../update-item-timings';
import {
	createMockSolidItem,
	createMockTextItem,
} from '../../../../test/test-helpers';

describe('updateItemTimings', () => {
	describe('Basic timing updates', () => {
		it('should update durationInFrames', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 120,
				newFrom: 0,
			});

			expect(updated.durationInFrames).toBe(120);
			expect(updated.from).toBe(0);
		});

		it('should update from position', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 30,
			});

			expect(updated.from).toBe(30);
			expect(updated.durationInFrames).toBe(90);
		});

		it('should update both durationInFrames and from', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 150,
				newFrom: 45,
			});

			expect(updated.durationInFrames).toBe(150);
			expect(updated.from).toBe(45);
		});
	});

	describe('Immutability', () => {
		it('should return a new item object when values change', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 120,
				newFrom: 0,
			});

			expect(updated).not.toBe(item);
			expect(updated.id).toBe(item.id);
		});

		it('should return the same item reference when no values change', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 30,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 30,
			});

			// Should return same reference for performance optimization
			expect(updated).toBe(item);
		});

		it('should not mutate the original item', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const originalDuration = item.durationInFrames;
			const originalFrom = item.from;

			updateItemTimings({
				item,
				newDurationInFrames: 150,
				newFrom: 60,
			});

			// Original item should remain unchanged
			expect(item.durationInFrames).toBe(originalDuration);
			expect(item.from).toBe(originalFrom);
		});
	});

	describe('Preserving other properties', () => {
		it('should preserve all other item properties', () => {
			const item = createMockTextItem({
				id: 'text-item',
				durationInFrames: 90,
				from: 0,
				text: 'Hello World',
				fontSize: 48,
				color: '#ff0000',
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 120,
				newFrom: 30,
			});

			expect(updated.text).toBe('Hello World');
			expect(updated.fontSize).toBe(48);
			expect(updated.color).toBe('#ff0000');
			expect(updated.type).toBe('text');
			expect(updated.id).toBe('text-item');
		});

		it('should preserve nested properties like transition', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
				transition: {
					toNext: {type: 'fade', durationInFrames: 10},
				},
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 100,
				newFrom: 0,
			});

			expect(updated.transition).toEqual({
				toNext: {type: 'fade', durationInFrames: 10},
			});
		});

		it('should preserve all BaseItem properties', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
				top: 100,
				left: 200,
				width: 500,
				height: 300,
				opacity: 0.8,
				isDraggingInTimeline: false,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 120,
				newFrom: 15,
			});

			expect(updated.top).toBe(100);
			expect(updated.left).toBe(200);
			expect(updated.width).toBe(500);
			expect(updated.height).toBe(300);
			expect(updated.opacity).toBe(0.8);
			expect(updated.isDraggingInTimeline).toBe(false);
		});
	});

	describe('Edge cases', () => {
		it('should handle zero duration', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 0,
				newFrom: 0,
			});

			expect(updated.durationInFrames).toBe(0);
		});

		it('should handle zero from position', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 30,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 0,
			});

			expect(updated.from).toBe(0);
		});

		it('should handle large frame numbers', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 100000,
				newFrom: 50000,
			});

			expect(updated.durationInFrames).toBe(100000);
			expect(updated.from).toBe(50000);
		});

		it('should handle fractional frame numbers', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 0,
			});

			// TypeScript allows numbers, so fractional frames should work
			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90.5,
				newFrom: 15.25,
			});

			expect(updated.durationInFrames).toBe(90.5);
			expect(updated.from).toBe(15.25);
		});
	});

	describe('Different item types', () => {
		it('should work with TextItem', () => {
			const item = createMockTextItem({
				id: 'text-1',
				durationInFrames: 60,
				from: 10,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 80,
				newFrom: 20,
			});

			expect(updated.type).toBe('text');
			expect(updated.durationInFrames).toBe(80);
			expect(updated.from).toBe(20);
		});

		it('should work with SolidItem', () => {
			const item = createMockSolidItem({
				id: 'solid-1',
				durationInFrames: 120,
				from: 0,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 30,
			});

			expect(updated.type).toBe('solid');
			expect(updated.durationInFrames).toBe(90);
			expect(updated.from).toBe(30);
		});
	});

	describe('Performance optimization', () => {
		it('should return same reference when only duration changes but is same value', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 30,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 30,
			});

			expect(updated).toBe(item);
		});

		it('should return same reference when only from changes but is same value', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 30,
			});

			const updated = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 30,
			});

			expect(updated).toBe(item);
		});

		it('should create new reference when either value changes', () => {
			const item = createMockSolidItem({
				id: 'item-1',
				durationInFrames: 90,
				from: 30,
			});

			// Change only duration
			const updated1 = updateItemTimings({
				item,
				newDurationInFrames: 100,
				newFrom: 30,
			});
			expect(updated1).not.toBe(item);

			// Change only from
			const updated2 = updateItemTimings({
				item,
				newDurationInFrames: 90,
				newFrom: 40,
			});
			expect(updated2).not.toBe(item);
		});
	});
});
