/**
 * Performance Instrumentation Panel
 * Vanilla JS — injected into every page via a shared <script> tag.
 * Reads framework identity from <meta name="x-framework">.
 */

(function perfPanel() {
  // --------------- DOM Construction ---------------
  const panel = document.createElement('div');
  panel.className = 'perf-panel';
  panel.innerHTML = `
    <button class="perf-panel__toggle" title="Toggle Performance Panel">⚡</button>
    <div class="perf-panel__body">
      <div class="perf-panel__title">Instrumentation</div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Framework</span>
        <span class="perf-panel__value perf-panel__framework" id="perf-framework">—</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">DOM Nodes</span>
        <span class="perf-panel__value" id="perf-dom">—</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Mutations</span>
        <span class="perf-panel__value" id="perf-mutations">0</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">JS Heap</span>
        <span class="perf-panel__value" id="perf-heap">—</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Frame Δ</span>
        <span class="perf-panel__value" id="perf-frame">—</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Load</span>
        <span class="perf-panel__value" id="perf-load">—</span>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // --------------- References ---------------
  const elFramework = document.getElementById('perf-framework')!;
  const elDom       = document.getElementById('perf-dom')!;
  const elMutations = document.getElementById('perf-mutations')!;
  const elHeap      = document.getElementById('perf-heap')!;
  const elFrame     = document.getElementById('perf-frame')!;
  const elLoad      = document.getElementById('perf-load')!;
  const toggle      = panel.querySelector('.perf-panel__toggle') as HTMLButtonElement;

  // --------------- Toggle ---------------
  let collapsed = false;
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    panel.classList.toggle('perf-panel--collapsed', collapsed);
    toggle.textContent = collapsed ? '📊' : '⚡';
  });

  // --------------- Framework Detection ---------------
  const fwMeta = document.querySelector('meta[name="x-framework"]') as HTMLMetaElement | null;
  const framework = fwMeta?.content || 'Unknown';
  elFramework.textContent = framework;

  // Apply framework color
  const fwColors: Record<string, string> = {
    'Svelte':  'var(--svelte)',
    'React':   'var(--react)',
    'Vue':     'var(--vue)',
    'HTMX':    'var(--htmx)',
    'Vanilla': 'var(--vanilla)',
    'HTML':    'var(--vanilla)',
  };
  elFramework.style.color = fwColors[framework] || 'var(--text)';

  // --------------- DOM Node Count (polled) ---------------
  function updateDomCount() {
    elDom.textContent = document.querySelectorAll('*').length.toLocaleString();
  }
  updateDomCount();
  setInterval(updateDomCount, 2000);

  // --------------- Mutation Counter ---------------
  let mutationCount = 0;
  const observer = new MutationObserver((mutations) => {
    mutationCount += mutations.length;
    elMutations.textContent = mutationCount.toLocaleString();
  });
  const mainEl = document.querySelector('main') || document.body;
  observer.observe(mainEl, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  // --------------- JS Heap Memory ---------------
  function updateHeap() {
    const perf = (performance as any);
    if (perf.memory) {
      const mb = (perf.memory.usedJSHeapSize / 1048576).toFixed(1);
      elHeap.textContent = `${mb} MB`;
    } else {
      elHeap.textContent = 'N/A';
    }
  }
  updateHeap();
  setInterval(updateHeap, 3000);

  // --------------- Frame Cost ---------------
  let lastFrame = performance.now();
  let frameSamples: number[] = [];

  function frameLoop(now: number) {
    const delta = now - lastFrame;
    lastFrame = now;
    frameSamples.push(delta);
    if (frameSamples.length > 30) frameSamples.shift();

    const avg = frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length;
    elFrame.textContent = `${avg.toFixed(1)} ms`;
    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);

  // --------------- Page Load Time ---------------
  window.addEventListener('load', () => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (nav) {
      const loadTime = (nav.loadEventEnd - nav.startTime).toFixed(0);
      elLoad.textContent = `${loadTime} ms`;
    }
  });
})();
