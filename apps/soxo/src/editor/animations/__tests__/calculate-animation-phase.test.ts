import {describe, it, expect} from 'vitest';
import {
	calculateAnimationPhase,
	isPhaseActive,
} from '../calculate-animation-phase';
import type {ThreePhaseAnimations} from '../../items/shared';

describe('calculateAnimationPhase', () => {
	describe('No animations configured', () => {
		it('should return "after" phase when no animations are provided', () => {
			const result = calculateAnimationPhase(50, 0, 90, undefined);
			expect(result.phase).toBe('after');
			expect(result.relativeFrame).toBe(0);
		});
	});

	describe('Before item starts', () => {
		it('should return "before" phase when current frame is before item start', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 10},
			};
			const result = calculateAnimationPhase(-5, 10, 90, animations);
			expect(result.phase).toBe('before');
			expect(result.relativeFrame).toBe(-15);
		});
	});

	describe('After item ends', () => {
		it('should return "after" phase when current frame is past item duration', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 10},
			};
			const result = calculateAnimationPhase(100, 0, 90, animations);
			expect(result.phase).toBe('after');
			expect(result.relativeFrame).toBe(10);
		});
	});

	describe('Enter phase', () => {
		it('should be in enter phase during enter animation', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 14, delay: 0},
			};
			// Item starts at frame 0, lasts 90 frames
			// At frame 5 (relative to item start)
			const result = calculateAnimationPhase(5, 0, 90, animations);
			expect(result.phase).toBe('enter');
			expect(result.relativeFrame).toBe(5);
		});

		it('should handle enter delay', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 10, delay: 5},
			};
			// At frame 7 (relative) = 2 frames into animation
			const result = calculateAnimationPhase(7, 0, 90, animations);
			expect(result.phase).toBe('enter');
			expect(result.relativeFrame).toBe(2);
		});

		it('should complete enter phase at last frame (N-1 fix verification)', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 2, delay: 0},
			};
			// 2-frame animation: frame 0 = start, frame 1 = end
			const result = calculateAnimationPhase(1, 0, 90, animations);
			expect(result.phase).toBe('enter');
			expect(result.relativeFrame).toBe(1);
		});
	});

	describe('Emphasis phase', () => {
		it('should be in emphasis phase between enter and exit', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 14, delay: 0},
				emphasis: {type: 'pulse', duration: 17, delay: 0},
				exit: {type: 'fade-out', duration: 2},
			};
			// Item: 90 frames total
			// Enter: frames 0-13
			// Emphasis: frames 14-87
			// Exit: frames 88-89
			const result = calculateAnimationPhase(20, 0, 90, animations);
			expect(result.phase).toBe('emphasis');
			expect(result.emphasisIteration).toBeDefined();
		});

		it('should calculate correct iteration and frame for looping emphasis', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 10},
				emphasis: {type: 'pulse', duration: 15, pauseBetween: 5},
			};
			// Emphasis starts at frame 10
			// Each cycle: 15 frames animation + 5 frames pause = 20 frames
			// Frame 50 (relative to emphasis start: frame 40)
			// 40 / 20 = 2 iterations, frame 0 of iteration 2
			const result = calculateAnimationPhase(50, 0, 90, animations);
			expect(result.phase).toBe('emphasis');
			expect(result.emphasisIteration).toBe(2);
			expect(result.emphasisIterationFrame).toBe(0);
		});

		it('should hold at end when max iterations reached', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 10},
				emphasis: {type: 'pulse', duration: 10, iterations: 2},
			};
			// Emphasis starts at frame 10, lasts until frame 90 (no exit)
			// Max 2 iterations = frames 10-29 (20 frames)
			// At frame 50, should hold at end of iteration 1
			const result = calculateAnimationPhase(50, 0, 90, animations);
			expect(result.phase).toBe('emphasis');
			expect(result.emphasisIteration).toBe(1);
			expect(result.relativeFrame).toBe(10); // End of animation
		});

		it('should handle pause between emphasis cycles', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 10},
				emphasis: {type: 'pulse', duration: 10, pauseBetween: 5},
			};
			// First cycle: frames 10-19 (animation)
			// Pause: frames 20-24
			// At frame 22 (in pause), should hold at end
			const result = calculateAnimationPhase(22, 0, 90, animations);
			expect(result.phase).toBe('emphasis');
			expect(result.relativeFrame).toBe(10); // Held at end
		});
	});

	describe('Exit phase', () => {
		it('should be in exit phase during exit animation', () => {
			const animations: ThreePhaseAnimations = {
				exit: {type: 'slide-out-left', duration: 2},
			};
			// 90-frame item, exit is last 2 frames
			// Exit starts at frame 88, ends at frame 89
			const result = calculateAnimationPhase(88, 0, 90, animations);
			expect(result.phase).toBe('exit');
			expect(result.relativeFrame).toBe(0);
		});

		it('should complete exit at last frame (N-1 fix verification)', () => {
			const animations: ThreePhaseAnimations = {
				exit: {type: 'slide-out-left', duration: 2},
			};
			// 2-frame exit: frame 88 = start, frame 89 = end (last frame of item)
			const result = calculateAnimationPhase(89, 0, 90, animations);
			expect(result.phase).toBe('exit');
			expect(result.relativeFrame).toBe(1); // Second frame of exit (completion)
		});
	});

	describe('Duration validation', () => {
		it('should auto-scale animations when they exceed item duration', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'fade-in', duration: 50},
				exit: {type: 'fade-out', duration: 50},
			};
			// Total required: 100 frames, but item is only 90 frames
			// Should auto-scale proportionally
			const result = calculateAnimationPhase(25, 0, 90, animations);
			// Animation should still work, just scaled down
			expect(result.phase).toMatch(/enter|after/);
		});
	});

	describe('Real-world scenario: User bug report', () => {
		it('should fully complete 2-frame exit animation (the reported bug)', () => {
			const animations: ThreePhaseAnimations = {
				enter: {type: 'pop-in', duration: 14, delay: 0},
				emphasis: {type: 'bounce', duration: 17, delay: 0},
				exit: {type: 'slide-out-left', duration: 2},
			};
			// 90-frame item
			// Enter: 0-13
			// Emphasis: 14-87
			// Exit: 88-89 (2 frames)

			// At frame 89 (last frame of item)
			const result = calculateAnimationPhase(89, 0, 90, animations);
			expect(result.phase).toBe('exit');
			expect(result.relativeFrame).toBe(1); // Should be at 100% (frame 1 of 2)
		});
	});
});

describe('isPhaseActive', () => {
	it('should correctly identify active phase', () => {
		const result = {
			phase: 'enter' as const,
			relativeFrame: 5,
		};
		expect(isPhaseActive('enter', result)).toBe(true);
		expect(isPhaseActive('emphasis', result)).toBe(false);
		expect(isPhaseActive('exit', result)).toBe(false);
	});
});
