import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), reactRouter()],
	optimizeDeps: {
		holdUntilCrawlEnd: true,
		exclude: [
			// The dynamic import for loading the worker cannot be optimized.
			'@remotion/media-parser/worker',

			// These libraries do export an ESM version and therefore
			// do not need to be optimized.
			'remotion',
			'@remotion/player',
			'@remotion/media-parser',
			'@remotion/gif',
			'@remotion/media-parser/web',
			'@remotion/google-fonts/from-info',
			'@remotion/layout-utils',
			'@remotion/shapes',
		],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
