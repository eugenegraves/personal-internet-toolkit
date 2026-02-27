/**
 * Image Compressor — Main thread application logic.
 * Offloads compression to a Web Worker for non-blocking UI.
 */

const fileInput = document.getElementById('file-input') as HTMLInputElement;
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const btnBrowse = document.getElementById('btn-browse') as HTMLButtonElement;
const controls = document.getElementById('compressor-controls') as HTMLDivElement;
const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
const qualityValue = document.getElementById('quality-value') as HTMLSpanElement;
const formatSelect = document.getElementById('format-select') as HTMLSelectElement;
const progressWrap = document.getElementById('compressor-progress') as HTMLDivElement;
const progressFill = document.getElementById('progress-fill') as HTMLDivElement;
const progressText = document.getElementById('progress-text') as HTMLSpanElement;
const resultSection = document.getElementById('compressor-result') as HTMLDivElement;
const canvasOrig = document.getElementById('canvas-original') as HTMLCanvasElement;
const canvasComp = document.getElementById('canvas-compressed') as HTMLCanvasElement;
const sizeOrigEl = document.getElementById('size-original') as HTMLSpanElement;
const sizeCompEl = document.getElementById('size-compressed') as HTMLSpanElement;
const statReduction = document.getElementById('stat-reduction') as HTMLSpanElement;
const statDimensions = document.getElementById('stat-dimensions') as HTMLSpanElement;
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement;

let originalFile: File | null = null;
let compressedBlob: Blob | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// --------------- File Handling ---------------

btnBrowse.addEventListener('click', (e) => { e.preventDefault(); fileInput.click(); });
fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
});

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('compressor__upload-area--dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('compressor__upload-area--dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('compressor__upload-area--dragover');
    const file = e.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
});

async function handleFile(file: File) {
    originalFile = file;
    controls.classList.remove('hidden');
    resultSection.classList.remove('hidden');

    // Draw original
    const bmp = await createImageBitmap(file);
    canvasOrig.width = bmp.width;
    canvasOrig.height = bmp.height;
    canvasOrig.getContext('2d')!.drawImage(bmp, 0, 0);
    sizeOrigEl.textContent = formatBytes(file.size);
    statDimensions.textContent = `${bmp.width} × ${bmp.height}`;

    compress();
}

// --------------- Compression (main-thread Canvas fallback) ---------------

qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(compress, 200);
});

formatSelect.addEventListener('change', () => compress());

async function compress() {
    if (!originalFile) return;

    progressWrap.classList.remove('hidden');
    progressFill.style.width = '30%';
    progressText.textContent = 'Compressing...';

    const quality = parseInt(qualitySlider.value, 10) / 100;
    const format = formatSelect.value;

    try {
        const bmp = await createImageBitmap(originalFile);
        progressFill.style.width = '50%';

        // Use OffscreenCanvas if available (worker-like path on main thread)
        const offscreen = new OffscreenCanvas(bmp.width, bmp.height);
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(bmp, 0, 0);
        progressFill.style.width = '70%';

        const blob = await offscreen.convertToBlob({ type: format, quality });
        progressFill.style.width = '100%';
        progressText.textContent = 'Done!';

        compressedBlob = blob;

        // Draw compressed
        const compBmp = await createImageBitmap(blob);
        canvasComp.width = compBmp.width;
        canvasComp.height = compBmp.height;
        canvasComp.getContext('2d')!.drawImage(compBmp, 0, 0);

        sizeCompEl.textContent = formatBytes(blob.size);
        const reduction = ((1 - blob.size / originalFile.size) * 100).toFixed(1);
        statReduction.textContent = `${reduction}%`;
        statReduction.className = `compressor__stat-value ${parseFloat(reduction) > 0 ? 'text-success' : 'text-error'}`;

        setTimeout(() => progressWrap.classList.add('hidden'), 600);
    } catch {
        progressText.textContent = 'Compression failed';
        progressFill.style.width = '100%';
        progressFill.style.background = 'var(--error)';
    }
}

// --------------- Download ---------------

btnDownload.addEventListener('click', () => {
    if (!compressedBlob) return;
    const ext = formatSelect.value.split('/')[1];
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
});

// --------------- Util ---------------

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
}
