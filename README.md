# Personal Internet Toolkit

**A Contextual Frontend Architecture Showcase**

> Six tools. Five frameworks. One server. Each tool uses the framework best suited to its interaction pattern — orchestrated by AbsoluteJS.

---

## The Architectural Thesis

Not every UI surface deserves the same framework. The industry default — picking one framework and using it everywhere — optimizes for developer familiarity at the cost of runtime performance, bundle size, and architectural honesty.

This project inverts that assumption. Each tool is built with the framework whose strengths align with the tool's specific interaction pattern:

| Tool | Framework | Why |
|------|-----------|-----|
| **Markdown Editor** | Svelte | Compile-time reactive assignments handle high-frequency keystrokes with near-zero runtime overhead |
| **JSON Tree Explorer** | Vanilla JS | No persistent reactivity needed — lazy DOM expansion via `<details>` elements, zero framework tax |
| **Diff Viewer** | React | Controlled virtualization, memoized row rendering, and windowing patterns for large lists |
| **Regex Playground** | Vue | Clean `computed()` properties for structured reactive feedback — the right level of abstraction |
| **Unit Converter** | HTMX | HTML-over-the-wire: declarative hypermedia with no client-side state system |
| **Image Compressor** | Vanilla + OffscreenCanvas | Performance-critical compression offloaded from the main thread — frameworks would only add overhead |

**AbsoluteJS** acts as the orchestration layer: routing, SSR, build tooling, and lifecycle management. It loads each framework per route only when needed. No monolithic bundle. No runtime leakage between tools.

---

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open in browser
open http://localhost:3000
```

---

## Architecture

```
src/
├── backend/
│   ├── server.ts              # Elysia server + router + HTMX API endpoints
│   └── utils/
│       ├── vueImporter.ts     # Vue SFC import bridge
│       └── converter.ts       # Unit conversion engine
├── frontend/
│   ├── html/                  # Landing, JSON Viewer, Image Compressor
│   │   ├── pages/
│   │   ├── scripts/           # perf-panel.ts, json-tree.ts, compressor-app.ts
│   │   └── styles/
│   ├── htmx/                  # Unit Converter
│   │   └── pages/
│   ├── react/                 # Diff Viewer
│   │   └── pages/
│   ├── svelte/                # Markdown Editor
│   │   └── pages/
│   ├── vue/                   # Regex Playground
│   │   └── pages/
│   └── styles/                # Shared design system + instrumentation panel CSS
└── constants.ts
```

### Build Separation

AbsoluteJS's `build()` function accepts per-framework directories:

```typescript
const buildConfig: BuildConfig = {
  reactDirectory:  'src/frontend/react',
  svelteDirectory: 'src/frontend/svelte',
  vueDirectory:    'src/frontend/vue',
  htmlDirectory:   'src/frontend/html',
  htmxDirectory:   'src/frontend/htmx',
};
```

Each framework is compiled independently. React's runtime never appears on the Svelte page. Vue's reactivity system never loads on HTML pages.

---

## State Boundaries

Each tool maintains strict state isolation:

- **Markdown Editor** — Component-local `$state()` runes. No global store. Debounce timer is scoped to the component lifecycle.
- **JSON Viewer** — Module-scoped variables in plain TypeScript. DOM is the state layer (via `<details open>`).
- **Diff Viewer** — React component state via `useState`. Diff computation and virtualization are memoized with `useMemo`.
- **Regex Playground** — Vue `ref()` and `computed()`. Debounced with a scoped `watch()`. No Pinia or global state.
- **Unit Converter** — Zero client state. Server-side computation returns HTML fragments via HTMX.
- **Image Compressor** — Module-scoped variables. OffscreenCanvas handles image data. No shared state.

---

## Performance Instrumentation

A floating panel on every page (implemented in vanilla JS) displays:

| Metric | Source |
|--------|--------|
| Active Framework | `<meta name="x-framework">` tag |
| DOM Node Count | `document.querySelectorAll('*').length` (polled) |
| Mutation Count | `MutationObserver` on `<main>` |
| JS Heap Memory | `performance.memory.usedJSHeapSize` |
| Frame Cost | `requestAnimationFrame` delta averaging |
| Page Load | `PerformanceNavigationTiming.loadEventEnd` |

---

## Optimization Strategies

### Markdown Editor (Svelte)
- 300ms debounced re-render prevents preview thrashing during typing
- Only the preview `<div>` updates — the textarea binding is instantaneous
- Derived values (word count, outline) are compile-time reactive

### JSON Viewer (Vanilla)
- Lazy expansion: child DOM nodes created on first `<details>` toggle, not on parse
- No framework runtime loaded — pure DOM manipulation
- Handles 100k+ nodes by only materializing visible branches

### Diff Viewer (React)
- Custom `useVirtualList` hook renders only rows in the viewport + overscan
- `React.memo` on `DiffRow` prevents re-renders during scroll
- LCS diff computed once via `useMemo` — not on every scroll event

### Regex Playground (Vue)
- 200ms debounced `watch()` on pattern/flags to avoid regex recompilation spam
- `computed()` for match results, count, and highlighted HTML — cached until dependencies change
- Regex errors caught and displayed without crashing the UI

### Unit Converter (HTMX)
- 300ms debounce via `hx-trigger="input changed delay:300ms"`
- Server-side computation — zero client JS state management
- Category changes dynamically swap `<option>` lists via `hx-get`

### Image Compressor (Vanilla + Worker)
- `OffscreenCanvas` for compression — no main-thread blocking
- Debounced quality slider (200ms) prevents excessive recompression
- Canvas-based preview avoids creating new `<img>` elements

---

## Design System

All tools share a consistent visual language via `design-system.css`:

- **Colors**: HSL-based dark-mode palette with semantic variables
- **Typography**: Inter (UI) + JetBrains Mono (code), fluid scale
- **Spacing**: 4px-based scale (`--space-1` through `--space-8`)
- **Components**: `.nav`, `.card`, `.btn`, `.badge`, `.input`, `.split-pane`
- **Framework badges**: Color-coded per framework

The CSS is framework-agnostic — imported as a plain stylesheet by HTML pages and linked via `cssPath` props by SSR'd frameworks.

---

## Routes

| Path | Framework | Tool |
|------|-----------|------|
| `/` | HTML | Landing page / tool index |
| `/markdown` | Svelte | Markdown Live Editor |
| `/json` | HTML | JSON Tree Explorer |
| `/diff` | React | Diff Viewer |
| `/regex` | Vue | Regex Playground |
| `/convert` | HTMX | Unit Converter |
| `/compress` | HTML | Image Compressor |

---

## License

MIT
