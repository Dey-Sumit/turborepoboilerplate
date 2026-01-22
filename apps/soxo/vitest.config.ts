import {defineConfig} from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss()],
	test: {
		// Test environment
		environment: 'jsdom',
		
		// Setup files
		setupFiles: ['./src/test/setup.ts'],
		
		// Glob patterns for test files
		include: ['**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'build', 'out', '.next'],
		
		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/test/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/mockData/**',
			],
		},
		
		// Global test timeout
		testTimeout: 10000,
		
		// Match options
		globals: true,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});

