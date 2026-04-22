import { defineConfig } from '@absolutejs/absolute';

export default defineConfig({
	assetsDirectory: 'src/backend/assets',
	buildDirectory: 'build',
	reactDirectory: 'src/frontend/react',
	htmlDirectory: 'src/frontend/html',
	htmxDirectory: 'src/frontend/htmx',
	stylesConfig: 'src/styles-indexes',
	svelteDirectory: 'src/frontend/svelte',
	vueDirectory: 'src/frontend/vue',
	publicDirectory: 'public'
});
