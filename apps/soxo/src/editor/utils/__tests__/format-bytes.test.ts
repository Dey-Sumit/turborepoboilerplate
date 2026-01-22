import {describe, it, expect} from 'vitest';
import {formatBytes} from '../format-bytes';

describe('formatBytes', () => {
	it('should format bytes correctly', () => {
		expect(formatBytes(0, {locale: 'en-US', signed: false})).toBe('0 B');
		expect(formatBytes(500, {locale: 'en-US', signed: false})).toBe('500 B');
		// formatBytes formats 1024 as 1.024 kB (with locale formatting)
		expect(formatBytes(1024, {locale: 'en-US', signed: false})).toBe(
			'1.024 kB',
		);
		expect(formatBytes(1048576, {locale: 'en-US', signed: false})).toBe(
			'1.049 MB',
		);
	});

	it('should handle decimal values', () => {
		const result = formatBytes(1500, {locale: 'en-US', signed: false});
		expect(result).toContain('kB');
		expect(parseFloat(result)).toBeCloseTo(1.5, 1);
	});

	it('should throw error for non-finite numbers', () => {
		expect(() =>
			formatBytes(Infinity, {locale: 'en-US', signed: false}),
		).toThrow();
		expect(() => formatBytes(NaN, {locale: 'en-US', signed: false})).toThrow();
	});

	it('should handle binary format', () => {
		const result = formatBytes(1024, {
			locale: 'en-US',
			signed: false,
			binary: true,
		});
		expect(result).toBe('1 kiB');
	});

	it('should handle signed format', () => {
		expect(formatBytes(100, {locale: 'en-US', signed: true})).toBe('+100 B');
		expect(formatBytes(-100, {locale: 'en-US', signed: true})).toBe('-100 B');
		expect(formatBytes(0, {locale: 'en-US', signed: true})).toBe('0 B');
	});
});
