import {type RouteConfig, index, prefix, route} from '@react-router/dev/routes';

export default [
	index('routes/projects.tsx'),
	route('/editor/:projectId', 'routes/editor.tsx'),
	...prefix('api', [
		route('/upload', 'routes/api/upload.ts'),
		route('/progress', 'routes/api/progress.ts'),
		route('/render', 'routes/api/render.ts'),
		route('/captions', 'routes/api/captions.ts'),
		route('/chat', 'routes/api/chat.ts'),
		route('/chat-update-component', 'routes/api/chat-update-component.ts'),
		route('/fonts/:name', 'routes/api/font.ts'),
		route('/generate-caption-scenes', 'routes/api/generate-caption-scenes.ts'),
		route('/list-assets', 'routes/api/list-assets.ts'),
	]),
	...prefix('poc', [
		route('/external-asset', 'routes/poc/external-asset.tsx'),
		route('/ui-example', '../src/App.tsx'),
		route('/chat', 'routes/poc/chat.tsx'),
		route('/caption-scenes', 'routes/poc/caption-scenes.tsx'),
		route('/silence-remove', 'routes/poc/silence-remove.tsx'),
		route('/landing', 'routes/poc/landing.tsx'),
	]),
] satisfies RouteConfig;
