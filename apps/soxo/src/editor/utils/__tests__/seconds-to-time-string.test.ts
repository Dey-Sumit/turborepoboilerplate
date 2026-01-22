import {describe, it, expect} from 'vitest';
import {secondsToTimeString} from '../seconds-to-time-string';

describe('secondsToTimeString', () => {
	describe('without milliseconds', () => {
		it('should format seconds correctly', () => {
			expect(secondsToTimeString(0)).toBe('00:00');
			expect(secondsToTimeString(5)).toBe('00:05');
			expect(secondsToTimeString(30)).toBe('00:30');
			expect(secondsToTimeString(59)).toBe('00:59');
		});

		it('should format minutes correctly', () => {
			expect(secondsToTimeString(60)).toBe('01:00');
			expect(secondsToTimeString(90)).toBe('01:30');
			expect(secondsToTimeString(125)).toBe('02:05');
			expect(secondsToTimeString(3599)).toBe('59:59');
		});

		it('should format hours correctly', () => {
			expect(secondsToTimeString(3600)).toBe('01:00:00');
			expect(secondsToTimeString(3661)).toBe('01:01:01');
			expect(secondsToTimeString(7325)).toBe('02:02:05');
		});

		it('should truncate decimal seconds', () => {
			expect(secondsToTimeString(5.9)).toBe('00:05');
			expect(secondsToTimeString(30.7)).toBe('00:30');
		});
	});

	describe('with milliseconds', () => {
		it('should include milliseconds in format', () => {
			expect(secondsToTimeString(0, true)).toBe('00:00.000');
			expect(secondsToTimeString(5, true)).toBe('00:05.000');
			expect(secondsToTimeString(5.123, true)).toBe('00:05.123');
		});

		it('should format milliseconds with leading zeros', () => {
			expect(secondsToTimeString(5.001, true)).toBe('00:05.001');
			expect(secondsToTimeString(5.01, true)).toBe('00:05.010');
			expect(secondsToTimeString(5.1, true)).toBe('00:05.100');
		});

		it('should handle minutes with milliseconds', () => {
			expect(secondsToTimeString(65.456, true)).toBe('01:05.456');
			expect(secondsToTimeString(125.789, true)).toBe('02:05.789');
		});

		it('should handle hours with milliseconds', () => {
			expect(secondsToTimeString(3661.123, true)).toBe('01:01:01.123');
		});
	});
});

