import {describe, it, expect} from 'vitest';
import {clamp} from '../clamp';

describe('clamp', () => {
	it('should return value when within bounds', () => {
		expect(clamp({value: 5, min: 0, max: 10})).toBe(5);
		expect(clamp({value: 0, min: 0, max: 10})).toBe(0);
		expect(clamp({value: 10, min: 0, max: 10})).toBe(10);
	});

	it('should clamp to min when value is below minimum', () => {
		expect(clamp({value: -5, min: 0, max: 10})).toBe(0);
		expect(clamp({value: -100, min: 10, max: 20})).toBe(10);
	});

	it('should clamp to max when value is above maximum', () => {
		expect(clamp({value: 15, min: 0, max: 10})).toBe(10);
		expect(clamp({value: 100, min: 10, max: 20})).toBe(20);
	});

	it('should handle negative ranges', () => {
		expect(clamp({value: -5, min: -10, max: -1})).toBe(-5);
		expect(clamp({value: -15, min: -10, max: -1})).toBe(-10);
		expect(clamp({value: 0, min: -10, max: -1})).toBe(-1);
	});

	it('should handle decimal values', () => {
		expect(clamp({value: 5.5, min: 0, max: 10})).toBe(5.5);
		expect(clamp({value: -0.5, min: 0, max: 10})).toBe(0);
		expect(clamp({value: 10.5, min: 0, max: 10})).toBe(10);
	});
});

