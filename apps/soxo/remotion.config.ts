import {
	Config,
	WebpackConfiguration,
	WebpackOverrideFn,
} from '@remotion/cli/config';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
Config.setEntryPoint('./src/remotion/index.ts');

const chConfig = {
	syntaxHighlighting: {
		theme: 'github-dark',
	},
};

// In this context, 'currentConfiguration' should be of type 'import("webpack").Configuration' from the 'webpack' package.
const enableMdx = async (currentConfiguration: WebpackConfiguration) => {
	const {remarkCodeHike, recmaCodeHike} = await import('codehike/mdx');
	return {
		...currentConfiguration,
		module: {
			...currentConfiguration.module,
			rules: [
				...(currentConfiguration.module?.rules
					? currentConfiguration.module.rules
					: []),
				{
					test: /\.mdx?$/,
					use: [
						{
							loader: '@mdx-js/loader',
							options: {
								remarkPlugins: [[remarkCodeHike, chConfig]],
								recmaPlugins: [[recmaCodeHike, chConfig]],
							},
						},
					],
				},
			],
		},
	};
};

export const webpackOverride: WebpackOverrideFn = async (config) => {
	const configWithMdxEnabled = await enableMdx(config);
	return {
		...configWithMdxEnabled,

		resolve: {
			...configWithMdxEnabled.resolve,
			plugins: [
				...(configWithMdxEnabled.resolve?.plugins ?? []),
				new TsconfigPathsPlugin({
					configFile: './tsconfig.json',
				}),
			],
		},
	};
};

Config.overrideWebpackConfig(webpackOverride);
