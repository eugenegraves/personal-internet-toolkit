import { DiffViewer } from '../frontend/react/pages/DiffViewer';
import MarkdownEditor from '../frontend/svelte/pages/MarkdownEditor.svelte';
import { vueImports } from './utils/vueImporter';
import { convert, UNIT_OPTIONS } from './utils/converter';
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

// ─── Build Configuration ───

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

// ─── Server ───

const server = new Elysia()
	.use(staticPlugin({ assets: './build', prefix: '' }))

	// ──────────────── LANDING PAGE (HTML) ────────────────
	.get('/', () =>
		handleHTMLPageRequest('build/html/pages/Landing.html')
	)

	// ──────────────── MARKDOWN EDITOR (Svelte) ────────────────
	.get('/markdown', () =>
		handleSveltePageRequest(
			MarkdownEditor,
			asset(result, 'MarkdownEditor'),
			asset(result, 'MarkdownEditorIndex'),
			{ cssPath: asset(result, 'MarkdownEditorCSS') }
		)
	)

	// ──────────────── JSON VIEWER (Vanilla HTML) ────────────────
	.get('/json', () =>
		handleHTMLPageRequest('build/html/pages/JsonViewer.html')
	)

	// ──────────────── DIFF VIEWER (React) ────────────────
	.get('/diff', () =>
		handleReactPageRequest(
			DiffViewer,
			asset(result, 'DiffViewerIndex'),
			{ cssPath: asset(result, 'DiffViewerCSS') }
		)
	)

	// ──────────────── REGEX PLAYGROUND (Vue) ────────────────
	.get('/regex', () =>
		handleVuePageRequest(
			vueImports.RegexPlayground,
			asset(result, 'RegexPlayground'),
			asset(result, 'RegexPlaygroundIndex'),
			generateHeadElement({
				cssPath: '/css/regex-playground.css',
				title: 'Regex Playground | Personal Internet Toolkit',
				description: 'Live regex evaluation with match highlighting'
			}),
			{}
		)
	)

	// ──────────────── UNIT CONVERTER (HTMX) ────────────────
	.get('/convert', () =>
		handleHTMXPageRequest('build/htmx/pages/UnitConverter.html')
	)

	// HTMX API: Convert
	.post('/api/convert', ({ body }) => {
		const { value, fromUnit, toUnit, category } = body as {
			value: string;
			fromUnit: string;
			toUnit: string;
			category: string;
		};
		const numValue = parseFloat(value);
		const converted = convert(numValue, fromUnit, toUnit, category);
		return `<span class="converter__result-value">${converted}</span>`;
	})

	// HTMX API: Get units for a category
	.get('/api/units', ({ query }) => {
		const category = (query as { category?: string }).category || 'length';
		const units = UNIT_OPTIONS[category] ?? UNIT_OPTIONS['length'];
		return (units ?? [])
			.map((u) => `<option value="${u.value}">${u.label}</option>`)
			.join('');
	})

	// ──────────────── IMAGE COMPRESSOR (Vanilla HTML + Worker) ────────────────
	.get('/compress', () =>
		handleHTMLPageRequest('build/html/pages/ImageCompressor.html')
	)

	// ──────────────── Networking & Error Handling ────────────────
	.use(networking)
	.on('error', (err) => {
		const { request } = err;
		console.error(
			`Server error on ${request.method} ${request.url}: ${err.message}`
		);
	});

// ─── HMR Setup ───

if (
	typeof result.hmrState !== 'string' &&
	typeof result.manifest === 'object'
) {
	server.use(hmr(result.hmrState, result.manifest));
}
