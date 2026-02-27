// src/frontend/shared/perf-panel.ts
var PANEL_CSS = `
.perf-panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  min-width: 260px;
}
.perf-panel__toggle {
  position: absolute;
  top: -32px;
  right: 0;
  width: 28px;
  height: 28px;
  border: 1px solid hsl(225, 10%, 22%);
  border-radius: 6px;
  background: hsl(225, 12%, 14%);
  color: hsl(220, 8%, 42%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 120ms ease;
  line-height: 1;
}
.perf-panel__toggle:hover {
  background: hsl(225, 12%, 18%);
  color: hsl(220, 15%, 90%);
}
.perf-panel__body {
  background: hsl(225, 14%, 11%);
  border: 1px solid hsl(225, 10%, 22%);
  border-radius: 10px;
  padding: 12px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.perf-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: hsl(220, 8%, 42%);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.perf-panel__title::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: hsl(160, 70%, 45%);
  animation: perf-pulse 2s ease-in-out infinite;
}
@keyframes perf-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.perf-panel__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid hsl(225, 10%, 16%);
}
.perf-panel__row:last-child {
  border-bottom: none;
}
.perf-panel__label {
  color: hsl(220, 8%, 42%);
}
.perf-panel__value {
  color: hsl(220, 15%, 90%);
  font-weight: 500;
}
.perf-panel__framework {
  font-weight: 700;
}
.perf-panel--collapsed .perf-panel__body {
  display: none;
}
`;
var FW_COLORS = {
  Svelte: "hsl(15, 100%, 55%)",
  React: "hsl(193, 95%, 60%)",
  Vue: "hsl(153, 55%, 52%)",
  HTMX: "hsl(245, 60%, 60%)",
  Vanilla: "hsl(40, 90%, 55%)",
  HTML: "hsl(40, 90%, 55%)"
};
function initPerfPanel() {
  if (typeof document === "undefined")
    return;
  if (document.querySelector(".perf-panel"))
    return;
  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
  const panel = document.createElement("div");
  panel.className = "perf-panel";
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
  const elFramework = document.getElementById("perf-framework");
  const elDom = document.getElementById("perf-dom");
  const elMutations = document.getElementById("perf-mutations");
  const elHeap = document.getElementById("perf-heap");
  const elFrame = document.getElementById("perf-frame");
  const elLoad = document.getElementById("perf-load");
  const toggle = panel.querySelector(".perf-panel__toggle");
  let collapsed = false;
  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    panel.classList.toggle("perf-panel--collapsed", collapsed);
    toggle.textContent = collapsed ? "\uD83D\uDCCA" : "⚡";
  });
  const fwMeta = document.querySelector('meta[name="x-framework"]');
  const framework = fwMeta?.content || "Unknown";
  elFramework.textContent = framework;
  elFramework.style.color = FW_COLORS[framework] || "hsl(220, 15%, 90%)";
  function updateDomCount() {
    elDom.textContent = document.querySelectorAll("*").length.toLocaleString();
  }
  updateDomCount();
  const domInterval = setInterval(updateDomCount, 2000);
  let mutationCount = 0;
  const observer = new MutationObserver((mutations) => {
    let panelMutations = 0;
    for (const m of mutations) {
      if (panel.contains(m.target)) {
        panelMutations++;
      }
    }
    const realMutations = mutations.length - panelMutations;
    if (realMutations > 0) {
      mutationCount += realMutations;
      elMutations.textContent = mutationCount.toLocaleString();
    }
  });
  const mainEl = document.querySelector("main") || document.body;
  observer.observe(mainEl, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  function updateHeap() {
    const perf = performance;
    if (perf.memory) {
      const mb = (perf.memory.usedJSHeapSize / 1048576).toFixed(1);
      elHeap.textContent = `${mb} MB`;
    } else {
      elHeap.textContent = "N/A";
    }
  }
  updateHeap();
  const heapInterval = setInterval(updateHeap, 3000);
  let lastFrame = performance.now();
  let frameSamples = [];
  let rafId;
  function frameLoop(now) {
    const delta = now - lastFrame;
    lastFrame = now;
    frameSamples.push(delta);
    if (frameSamples.length > 30)
      frameSamples.shift();
    const avg = frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length;
    elFrame.textContent = `${avg.toFixed(1)} ms`;
    rafId = requestAnimationFrame(frameLoop);
  }
  rafId = requestAnimationFrame(frameLoop);
  function updateLoad() {
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav && nav.loadEventEnd > 0) {
      const loadTime = (nav.loadEventEnd - nav.startTime).toFixed(0);
      elLoad.textContent = `${loadTime} ms`;
    }
  }
  updateLoad();
  window.addEventListener("load", updateLoad);
  return () => {
    clearInterval(domInterval);
    clearInterval(heapInterval);
    cancelAnimationFrame(rafId);
    observer.disconnect();
    window.removeEventListener("load", updateLoad);
    style.remove();
    panel.remove();
  };
}
if (typeof globalThis.__PERF_PANEL_NO_AUTO__ === "undefined") {
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initPerfPanel());
    } else {
      initPerfPanel();
    }
  }
}
