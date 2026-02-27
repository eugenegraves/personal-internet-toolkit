/**
 * JSON Tree Explorer — Vanilla TypeScript
 * Recursive tree rendering with lazy child expansion.
 * No framework dependency.
 */

const input = document.getElementById('json-input') as HTMLTextAreaElement;
const treeEl = document.getElementById('json-tree') as HTMLDivElement;
const errorEl = document.getElementById('json-error') as HTMLDivElement;
const statsEl = document.getElementById('json-stats') as HTMLSpanElement;
const btnParse = document.getElementById('btn-parse') as HTMLButtonElement;
const btnSample = document.getElementById('btn-sample') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;

let totalNodes = 0;

// --------------- Rendering ---------------

function getType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

function getPreview(value: unknown, type: string): string {
    switch (type) {
        case 'string': return `"${(value as string).length > 80 ? (value as string).slice(0, 80) + '…' : value}"`;
        case 'number': return String(value);
        case 'boolean': return String(value);
        case 'null': return 'null';
        case 'array': return `Array(${(value as unknown[]).length})`;
        case 'object': return `{${Object.keys(value as object).length} keys}`;
        default: return String(value);
    }
}

function createLeafNode(key: string | number | null, value: unknown, type: string): HTMLDivElement {
    totalNodes++;
    const row = document.createElement('div');
    row.className = `json-node json-node--leaf json-node--${type}`;

    const keySpan = key !== null
        ? `<span class="json-key">${escapeHtml(String(key))}</span><span class="json-colon">: </span>`
        : '';
    const valSpan = `<span class="json-value json-value--${type}">${escapeHtml(getPreview(value, type))}</span>`;

    row.innerHTML = keySpan + valSpan;
    return row;
}

function createBranchNode(key: string | number | null, value: object | unknown[]): HTMLDetailsElement {
    totalNodes++;
    const isArray = Array.isArray(value);
    const entries = isArray ? value : Object.entries(value);
    const count = isArray ? value.length : Object.keys(value as object).length;
    const type = isArray ? 'array' : 'object';

    const details = document.createElement('details');
    details.className = `json-node json-node--branch json-node--${type}`;

    const summary = document.createElement('summary');
    summary.className = 'json-branch-summary';

    const keyPart = key !== null
        ? `<span class="json-key">${escapeHtml(String(key))}</span><span class="json-colon">: </span>`
        : '';
    const bracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';
    summary.innerHTML = `${keyPart}<span class="json-bracket">${bracket}</span> <span class="json-count">${count} items</span>`;

    details.appendChild(summary);

    // Lazy children: only build on first open
    let loaded = false;
    details.addEventListener('toggle', () => {
        if (details.open && !loaded) {
            loaded = true;
            const childContainer = document.createElement('div');
            childContainer.className = 'json-children';

            if (isArray) {
                (value as unknown[]).forEach((item, i) => {
                    childContainer.appendChild(createNode(i, item));
                });
            } else {
                for (const [k, v] of Object.entries(value as object)) {
                    childContainer.appendChild(createNode(k, v));
                }
            }

            // Closing bracket
            const closer = document.createElement('div');
            closer.className = 'json-bracket json-bracket--close';
            closer.textContent = closeBracket;
            childContainer.appendChild(closer);

            details.appendChild(childContainer);
            updateStats();
        }
    });

    return details;
}

function createNode(key: string | number | null, value: unknown): HTMLElement {
    const type = getType(value);
    if (type === 'object' || type === 'array') {
        return createBranchNode(key, value as object | unknown[]);
    }
    return createLeafNode(key, value, type);
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateStats() {
    statsEl.textContent = `${totalNodes.toLocaleString()} nodes rendered`;
}

// --------------- Parse & Render ---------------

function parseAndRender(jsonStr: string) {
    treeEl.innerHTML = '';
    errorEl.classList.add('hidden');
    totalNodes = 0;

    try {
        const data = JSON.parse(jsonStr);
        const root = createNode(null, data);
        treeEl.appendChild(root);
        updateStats();
    } catch (e) {
        errorEl.textContent = `Parse Error: ${(e as Error).message}`;
        errorEl.classList.remove('hidden');
        statsEl.textContent = '';
    }
}

// --------------- Sample Data Generator ---------------

function generateSample(depth: number = 3, breadth: number = 10): object {
    if (depth === 0) {
        const primitives = [42, 'hello world', true, null, 3.14, 'lorem ipsum dolor sit amet'];
        return primitives[Math.floor(Math.random() * primitives.length)] as any;
    }
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < breadth; i++) {
        const key = `key_${depth}_${i}`;
        if (Math.random() > 0.3) {
            obj[key] = generateSample(depth - 1, Math.max(2, breadth - 2));
        } else {
            obj[key] = generateSample(0, 0);
        }
    }
    return obj;
}

// --------------- Event Wiring ---------------

btnParse.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) parseAndRender(text);
});

btnSample.addEventListener('click', () => {
    const sample = generateSample(3, 10);
    const json = JSON.stringify(sample, null, 2);
    input.value = json;
    parseAndRender(json);
});

btnClear.addEventListener('click', () => {
    input.value = '';
    treeEl.innerHTML = '';
    errorEl.classList.add('hidden');
    statsEl.textContent = '';
    totalNodes = 0;
});

// Parse on Ctrl/Cmd+Enter
input.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        btnParse.click();
    }
});
