<script lang="ts">
	type MarkdownEditorProps = {
		cssPath: string;
	};

	let { cssPath }: MarkdownEditorProps = $props();

	let markdown = $state(`# Welcome to the Markdown Editor

This editor uses **Svelte** for its compile-time reactivity — every keystroke is handled with minimal runtime overhead.

## Features

- **Live preview** with debounced rendering
- **Word count** and **reading time**
- **Heading outline** generator
- Syntax highlighting in preview

## Try it out

Start typing in the left panel. The preview on the right updates after a short debounce (300ms) to avoid unnecessary re-renders.

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### A List

1. First item
2. Second item
3. Third item

> Blockquotes are supported too.

---

*Built with Svelte inside AbsoluteJS.*
`);

	let renderedHtml = $state('');
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Debounced markdown rendering
	function scheduleRender() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			renderedHtml = parseMarkdown(markdown);
		}, 300);
	}

	// Trigger render on markdown change
	$effect(() => {
		markdown; // track
		scheduleRender();
	});

	// Initial render
	$effect(() => {
		renderedHtml = parseMarkdown(markdown);
	});

	// --- Stats (computed) ---
	let wordCount = $derived(
		markdown
			.trim()
			.split(/\s+/)
			.filter((w: string) => w.length > 0).length
	);

	let charCount = $derived(markdown.length);

	let readingTime = $derived(Math.max(1, Math.ceil(wordCount / 200)));

	// --- Outline (computed from headings) ---
	let outline = $derived.by(() => {
		const lines = markdown.split('\n');
		const headings: { level: number; text: string }[] = [];
		for (const line of lines) {
			const match = line.match(/^(#{1,6})\s+(.+)/);
			if (match) {
				headings.push({ level: match[1].length, text: match[2] });
			}
		}
		return headings;
	});

	// --- Simple Markdown Parser ---
	function parseMarkdown(md: string): string {
		let html = escapeHtml(md);

		// Code blocks
		html = html.replace(
			/```(\w*)\n([\s\S]*?)```/g,
			(_m: string, lang: string, code: string) =>
				`<pre class="md-code-block"><code class="lang-${lang}">${code.trim()}</code></pre>`
		);

		// Headings
		html = html.replace(
			/^######\s+(.+)$/gm,
			'<h6 class="md-h6">$1</h6>'
		);
		html = html.replace(
			/^#####\s+(.+)$/gm,
			'<h5 class="md-h5">$1</h5>'
		);
		html = html.replace(
			/^####\s+(.+)$/gm,
			'<h4 class="md-h4">$1</h4>'
		);
		html = html.replace(
			/^###\s+(.+)$/gm,
			'<h3 class="md-h3">$1</h3>'
		);
		html = html.replace(
			/^##\s+(.+)$/gm,
			'<h2 class="md-h2">$1</h2>'
		);
		html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>');

		// Blockquotes
		html = html.replace(
			/^&gt;\s+(.+)$/gm,
			'<blockquote class="md-blockquote">$1</blockquote>'
		);

		// Bold & italic
		html = html.replace(
			/\*\*\*(.+?)\*\*\*/g,
			'<strong><em>$1</em></strong>'
		);
		html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

		// Inline code
		html = html.replace(
			/`([^`]+)`/g,
			'<code class="md-inline-code">$1</code>'
		);

		// Horizontal rule
		html = html.replace(/^---$/gm, '<hr class="md-hr" />');

		// Ordered lists
		html = html.replace(
			/^\d+\.\s+(.+)$/gm,
			'<li class="md-li">$1</li>'
		);

		// Unordered lists
		html = html.replace(/^-\s+(.+)$/gm, '<li class="md-li-ul">$1</li>');

		// Paragraphs (lines that aren't already tags)
		html = html
			.split('\n')
			.map((line: string) => {
				const trimmed = line.trim();
				if (
					trimmed === '' ||
					trimmed.startsWith('<')
				)
					return line;
				return `<p>${trimmed}</p>`;
			})
			.join('\n');

		return html;
	}

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="x-framework" content="Svelte" />
	<title>Markdown Editor | Personal Internet Toolkit</title>
	<link rel="icon" href="/assets/ico/favicon.ico" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
	/>
	<link rel="stylesheet" href={cssPath} type="text/css" />
</svelte:head>

<div class="page-shell">
	<nav class="nav">
		<div class="nav__brand">⚡ <span>Personal Internet Toolkit</span></div>
		<ul class="nav__links">
			<li><a class="nav__link" href="/">Home</a></li>
			<li><a class="nav__link nav__link--active" href="/markdown"
				>Markdown</a
			></li>
			<li><a class="nav__link" href="/json">JSON</a></li>
			<li><a class="nav__link" href="/diff">Diff</a></li>
			<li><a class="nav__link" href="/regex">Regex</a></li>
			<li><a class="nav__link" href="/convert">Convert</a></li>
			<li><a class="nav__link" href="/compress">Compress</a></li>
		</ul>
	</nav>

	<div class="tool-header">
		<h1 class="tool-header__title">Markdown Editor</h1>
		<div class="tool-header__meta">
			<span class="badge badge--svelte">Svelte</span>
			<span>{wordCount} words • {charCount} chars • {readingTime} min read</span>
		</div>
	</div>

	<div class="editor-layout">
		<!-- Sidebar: Outline -->
		<aside class="editor-outline">
			<h3 class="editor-outline__title">Outline</h3>
			{#if outline.length === 0}
				<p class="editor-outline__empty">No headings yet</p>
			{:else}
				<ul class="editor-outline__list">
					{#each outline as heading}
						<li
							class="editor-outline__item"
							style="padding-left: {(heading.level - 1) * 12}px"
						>
							{heading.text}
						</li>
					{/each}
				</ul>
			{/if}
		</aside>

		<!-- Main: Split Pane -->
		<div class="split-pane">
			<div class="split-pane__panel editor-input-panel">
				<textarea
					class="editor-textarea"
					bind:value={markdown}
					spellcheck="false"
					placeholder="Write your markdown here..."
				></textarea>
			</div>
			<div class="split-pane__panel editor-preview-panel">
				<div class="editor-preview">
					{@html renderedHtml}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Scoped component styles — extend design system */

	.editor-layout {
		display: grid;
		grid-template-columns: 220px 1fr;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.editor-outline {
		padding: var(--space-4);
		border-right: 1px solid var(--border-subtle);
		overflow-y: auto;
		background: var(--bg-elevated);
	}

	.editor-outline__title {
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: var(--space-3);
	}

	.editor-outline__empty {
		font-size: var(--fs-xs);
		color: var(--text-muted);
		font-style: italic;
	}

	.editor-outline__list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.editor-outline__item {
		font-size: var(--fs-xs);
		color: var(--text-secondary);
		padding: var(--space-1) 0;
		cursor: default;
		border-left: 2px solid transparent;
		transition: all 120ms ease;
	}
	.editor-outline__item:hover {
		color: var(--accent);
		border-left-color: var(--accent);
		padding-left: 8px;
	}

	.editor-input-panel,
	.editor-preview-panel {
		display: flex;
		flex-direction: column;
	}

	.editor-textarea {
		width: 100%;
		height: 100%;
		min-height: calc(100vh - 140px);
		resize: none;
		border: none;
		outline: none;
		padding: var(--space-4);
		background: var(--bg);
		color: var(--text);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.7;
		tab-size: 2;
	}

	.editor-preview {
		padding: var(--space-4) var(--space-5);
		color: var(--text);
		line-height: 1.7;
		overflow-y: auto;
		min-height: calc(100vh - 140px);
	}

	/* Markdown rendered content styles */
	.editor-preview :global(.md-h1) {
		font-size: var(--fs-2xl);
		font-weight: var(--fw-bold);
		margin: var(--space-5) 0 var(--space-3);
		color: var(--text);
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: var(--space-2);
	}
	.editor-preview :global(.md-h2) {
		font-size: var(--fs-xl);
		font-weight: var(--fw-bold);
		margin: var(--space-4) 0 var(--space-2);
		color: var(--text);
	}
	.editor-preview :global(.md-h3) {
		font-size: var(--fs-lg);
		font-weight: var(--fw-semibold);
		margin: var(--space-4) 0 var(--space-2);
		color: var(--text);
	}
	.editor-preview :global(strong) {
		font-weight: var(--fw-bold);
		color: var(--text);
	}
	.editor-preview :global(em) {
		font-style: italic;
		color: var(--text-secondary);
	}
	.editor-preview :global(.md-inline-code) {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: var(--surface);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--accent);
	}
	.editor-preview :global(.md-code-block) {
		background: var(--surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		padding: var(--space-3) var(--space-4);
		margin: var(--space-3) 0;
		overflow-x: auto;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.5;
	}
	.editor-preview :global(.md-blockquote) {
		border-left: 3px solid var(--accent);
		padding-left: var(--space-4);
		color: var(--text-secondary);
		font-style: italic;
		margin: var(--space-3) 0;
	}
	.editor-preview :global(.md-hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: var(--space-5) 0;
	}
	.editor-preview :global(.md-li),
	.editor-preview :global(.md-li-ul) {
		margin-left: var(--space-5);
		padding: var(--space-1) 0;
		color: var(--text-secondary);
	}
	.editor-preview :global(p) {
		margin: var(--space-2) 0;
		color: var(--text-secondary);
	}
</style>
