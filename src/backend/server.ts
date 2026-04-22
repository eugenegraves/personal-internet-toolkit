import { DiffViewer } from '../frontend/react/pages/DiffViewer';
import MarkdownEditor from '../frontend/svelte/pages/MarkdownEditor.svelte';
import { vueImports } from './utils/vueImporter';
import { convert, UNIT_OPTIONS } from './utils/converter';
import {
	asset,
	generateHeadElement,
	handleHTMLPageRequest,
	handleHTMXPageRequest,
	handleReactPageRequest,
	networking,
	prepare
} from '@absolutejs/absolute';
import { handleSveltePageRequest } from '@absolutejs/absolute/svelte';
import { handleVuePageRequest } from '@absolutejs/absolute/vue';
import { Elysia } from 'elysia';

const { absolutejs, manifest } = await prepare();

const server = new Elysia()
	.use(absolutejs)

	// ──────────────── LANDING PAGE (HTML) ────────────────
	.get('/', () =>
		handleHTMLPageRequest('build/html/pages/Landing.html')
	)

	// ──────────────── MARKDOWN EDITOR (Svelte) ────────────────
	.get('/markdown', () =>
		handleSveltePageRequest({
			pagePath: asset(manifest, 'MarkdownEditor'),
			indexPath: asset(manifest, 'MarkdownEditorIndex'),
			props: { cssPath: asset(manifest, 'MarkdownEditorCSS') }
		})
	)

	// ──────────────── JSON VIEWER (Vanilla HTML) ────────────────
	.get('/json', () =>
		handleHTMLPageRequest('build/html/pages/JsonViewer.html')
	)

	// ──────────────── DIFF VIEWER (React) ────────────────
	.get('/diff', () =>
		handleReactPageRequest({
			Page: DiffViewer,
			index: asset(manifest, 'DiffViewerIndex'),
			props: { cssPath: asset(manifest, 'DiffViewerCSS') }
		})
	)

	// ──────────────── REGEX PLAYGROUND (Vue) ────────────────
	.get('/regex', () =>
		handleVuePageRequest({
			pagePath: asset(manifest, 'RegexPlayground'),
			indexPath: asset(manifest, 'RegexPlaygroundIndex'),
			headTag: generateHeadElement({
				cssPath: '/css/regex-playground.css',
				title: 'Regex Playground | Personal Internet Toolkit',
				description: 'Live regex evaluation with match highlighting'
			}),
			props: {}
		})
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

