<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const collapsed = ref(false);
const domCount = ref('—');
const mutations = ref(0);
const heap = ref('—');
const frame = ref('—');
const load = ref('—');
const fwColor = 'var(--vue)';

let domInt: ReturnType<typeof setInterval>;
let heapInt: ReturnType<typeof setInterval>;
let rafId: number;
let observer: MutationObserver;
let mutCount = 0;

const PERF_CSS = `
.perf-panel { position: fixed; bottom: var(--space-4, 16px); right: var(--space-4, 16px); z-index: 9999; font-family: var(--font-mono, monospace); font-size: var(--fs-xs, 12px); min-width: 260px; }
.perf-panel__toggle { position: absolute; top: -32px; right: 0; width: 28px; height: 28px; border: 1px solid var(--border, #333); border-radius: var(--radius-sm, 4px); background: var(--surface, #222); color: var(--text-muted, #aaa); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all var(--transition-fast, 0.2s); line-height: 1; }
.perf-panel__toggle:hover { background: var(--surface-hover, #333); color: var(--text, #fff); }
.perf-panel__body { background: var(--bg-elevated, rgba(20,20,20,0.9)); border: 1px solid var(--border, #333); border-radius: var(--radius-md, 8px); padding: var(--space-3, 12px); backdrop-filter: blur(16px); box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.5)); }
.perf-panel__title { font-size: var(--fs-xs, 12px); font-weight: var(--fw-semibold, 600); color: var(--text-muted, #aaa); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: var(--space-2, 8px); display: flex; align-items: center; gap: var(--space-2, 8px); }
.perf-panel__title::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--success, #10b981); animation: pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.perf-panel__row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-1, 4px) 0; border-bottom: 1px solid var(--border-subtle, #222); }
.perf-panel__row:last-child { border-bottom: none; }
.perf-panel__label { color: var(--text-muted, #aaa); }
.perf-panel__value { color: var(--text, #fff); font-weight: var(--fw-medium, 500); }
.perf-panel__framework { font-weight: var(--fw-bold, 700); }
.perf-panel--collapsed .perf-panel__body { display: none; }
`;

onMounted(() => {
    if (!document.getElementById('perf-panel-styles')) {
        const style = document.createElement('style');
        style.id = 'perf-panel-styles';
        style.textContent = PERF_CSS;
        document.head.appendChild(style);
    }

    const updateDom = () => {
        domCount.value = document.querySelectorAll('*').length.toLocaleString();
    };
    updateDom();
    domInt = setInterval(updateDom, 2000);

    observer = new MutationObserver((mutList) => {
        const external = mutList.filter(m => {
            const el = m.target.nodeType === 1 ? m.target as Element : m.target.parentElement;
            if (!el) return false; // Ignore detached text nodes
            return !el.closest?.('.perf-panel');
        });
        if(external.length > 0) {
            mutCount += external.length;
            mutations.value = mutCount;
        }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

    const updateHeap = () => {
        const perf = performance as any;
        if (perf.memory) {
            heap.value = (perf.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB';
        } else {
            heap.value = 'N/A';
        }
    };
    updateHeap();
    heapInt = setInterval(updateHeap, 3000);

    let lastFrame = performance.now();
    const frameSamples: number[] = [];
    const frameLoop = (now: number) => {
        const delta = now - lastFrame;
        lastFrame = now;
        frameSamples.push(delta);
        if (frameSamples.length > 30) frameSamples.shift();
        const avg = frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length;
        frame.value = avg.toFixed(1) + ' ms';
        rafId = requestAnimationFrame(frameLoop);
    };
    rafId = requestAnimationFrame(frameLoop);

    const checkLoad = () => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (nav) {
            load.value = (nav.loadEventEnd - nav.startTime).toFixed(0) + ' ms';
        }
    };
    if (document.readyState === 'complete') {
        checkLoad();
    } else {
        window.addEventListener('load', checkLoad);
    }
});

onUnmounted(() => {
    clearInterval(domInt);
    clearInterval(heapInt);
    if (observer) observer.disconnect();
    cancelAnimationFrame(rafId);
});
</script>

<template>
  <div class="perf-panel" :class="{ 'perf-panel--collapsed': collapsed }">
    <button class="perf-panel__toggle" title="Toggle Performance Panel" @click="collapsed = !collapsed">
      {{ collapsed ? '📊' : '⚡' }}
    </button>
    <div class="perf-panel__body">
      <div class="perf-panel__title">Instrumentation</div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Framework</span>
        <span class="perf-panel__value perf-panel__framework" :style="{ color: fwColor }">Vue</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">DOM Nodes</span>
        <span class="perf-panel__value">{{ domCount }}</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Mutations</span>
        <span class="perf-panel__value">{{ mutations.toLocaleString() }}</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">JS Heap</span>
        <span class="perf-panel__value">{{ heap }}</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Frame Δ</span>
        <span class="perf-panel__value">{{ frame }}</span>
      </div>
      <div class="perf-panel__row">
        <span class="perf-panel__label">Load</span>
        <span class="perf-panel__value">{{ load }}</span>
      </div>
    </div>
  </div>
</template>
