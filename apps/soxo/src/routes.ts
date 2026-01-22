import {type RouteConfig, index, route} from '@react-router/dev/routes';

export default [
	index('routes/projects.tsx'),
	route('/editor/:projectId', 'routes/editor.tsx'),
] satisfies RouteConfig;
