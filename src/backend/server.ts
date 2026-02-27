import { ReactExample } from '../frontend/react/pages/ReactExample';
import SvelteExample from '../frontend/svelte/pages/SvelteExample.svelte';
import { vueImports } from './utils/vueImporter';
import {
	BuildConfig,
	asset,
	build,
	devBuild,
	generateHeadElement,
	handleHTMLPageRequest,
	handleHTMXPageRequest,
	handleReactPageRequest,
	hmr,
	networking
} from '@absolutejs/absolute';
import { handleSveltePageRequest } from '@absolutejs/absolute/svelte';
import { handleVuePageRequest } from '@absolutejs/absolute/vue';
import { staticPlugin } from '@elysiajs/static';
import { env } from 'bun';
import { Elysia } from 'elysia';
import { scopedState } from 'elysia-scoped-state';

const buildConfig: BuildConfig = {
	assetsDirectory: 'src/backend/assets',
	buildDirectory: 'build',
	reactDirectory: 'src/frontend/react',
	htmlDirectory: 'src/frontend/html',
	htmxDirectory: 'src/frontend/htmx',
	svelteDirectory: 'src/frontend/svelte',
	vueDirectory: 'src/frontend/vue',
	publicDirectory: 'public'
};

const isDev = env.NODE_ENV === 'development';
const result = isDev ? await devBuild(buildConfig) : await build(buildConfig);

const server = new Elysia()
	.use(staticPlugin({ assets: './build', prefix: '' }))
	.use(scopedState({ count: { value: 0 } }))
	.get('/', () =>
		handleReactPageRequest(
			ReactExample,
			asset(result, 'ReactExampleIndex'),
			{ initialCount: 0, cssPath: asset(result, 'ReactExampleCSS') }
		)
	)
	.get('/react', () =>
		handleReactPageRequest(
			ReactExample,
			asset(result, 'ReactExampleIndex'),
			{ initialCount: 0, cssPath: asset(result, 'ReactExampleCSS') }
		)
	)
	.get('/html', () =>
		handleHTMLPageRequest(`build/html/pages/HTMLExample.html`)
	)
	.get('/htmx', () =>
		handleHTMXPageRequest(`build/htmx/pages/HTMXExample.html`)
	)
	.post('/htmx/reset', ({ resetScopedStore }) => resetScopedStore())
	.get('/htmx/count', ({ scopedStore }) => scopedStore.count)
	.post('/htmx/increment', ({ scopedStore }) => ++scopedStore.count)
	.get('/svelte', () =>
		handleSveltePageRequest(
			SvelteExample,
			asset(result, 'SvelteExample'),
			asset(result, 'SvelteExampleIndex'),
			{ initialCount: 0, cssPath: asset(result, 'SvelteExampleCSS') }
		)
	)
	.get('/vue', () =>
		handleVuePageRequest(
			vueImports.VueExample,
			asset(result, 'VueExample'),
			asset(result, 'VueExampleIndex'),
			generateHeadElement({
				cssPath: asset(result, 'VueExampleCSS'),
				title: 'AbsoluteJS + Vue',
				description: 'A Vue.js example with AbsoluteJS'
			}),
			{ initialCount: 0 }
		)
	)
	.use(networking)
	.on('error', (err) => {
		const { request } = err;
		console.error(
			`Server error on ${request.method} ${request.url}: ${err.message}`
		);
	});

if (
	typeof result.hmrState !== 'string' &&
	typeof result.manifest === 'object'
) {
	server.use(hmr(result.hmrState, result.manifest));
}
