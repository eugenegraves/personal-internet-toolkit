import { useState, useEffect, useRef } from 'react';

export const PerfPanel = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [domCount, setDomCount] = useState<string>('—');
    const [mutations, setMutations] = useState<number>(0);
    const [heap, setHeap] = useState<string>('—');
    const [frame, setFrame] = useState<string>('—');
    const [load, setLoad] = useState<string>('—');
    const frameSamplesRef = useRef<number[]>([]);

    useEffect(() => {

        // DOM Count
        const updateDom = () => {
            setDomCount(document.querySelectorAll('*').length.toLocaleString());
        };
        updateDom();
        const domInt = setInterval(updateDom, 2000);

        // Mutations
        let mutCount = 0;
        const observer = new MutationObserver((mutList) => {
            console.log('[PerfPanel] MutationObserver fired with', mutList.length, 'mutations');
            const external = mutList.filter(m => {
                const el = m.target.nodeType === 1 ? m.target as Element : m.target.parentElement;
                if (!el) {
                    console.log('[PerfPanel] Ignored detached node', m.target.nodeName);
                    return false;
                }
                const isPerf = el.closest?.('.perf-panel');
                if (!isPerf) {
                    console.log('[PerfPanel] EXTERNAL MUTATION DETECTED', m.type, 'Target:', m.target.nodeName, 'el:', el.nodeName, 'class:', el.className);
                    if (m.type === 'childList') {
                        console.log('Added:', Array.from(m.addedNodes).map(n => n.nodeName), 'Removed:', Array.from(m.removedNodes).map(n => n.nodeName));
                    }
                }
                return !isPerf;
            });
            console.log('[PerfPanel] External mutations count:', external.length);
            if (external.length > 0) {
                mutCount += external.length;
                console.log('[PerfPanel] Calling setMutations', mutCount);
                setMutations(mutCount);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

        // Heap
        const updateHeap = () => {
            const perf = performance as any;
            if (perf.memory) {
                setHeap((perf.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB');
            } else {
                setHeap('N/A');
            }
        };
        updateHeap();
        const heapInt = setInterval(updateHeap, 3000);

        // Frame — collect samples in a ref, only update state every 500ms
        let rafId: number;
        let lastFrame = performance.now();
        const samples = frameSamplesRef.current;
        samples.length = 0;
        const frameLoop = (now: number) => {
            const delta = now - lastFrame;
            lastFrame = now;
            samples.push(delta);
            if (samples.length > 30) samples.shift();
            rafId = requestAnimationFrame(frameLoop);
        };
        rafId = requestAnimationFrame(frameLoop);
        const frameInt = setInterval(() => {
            if (samples.length > 0) {
                const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
                setFrame(avg.toFixed(1) + ' ms');
            }
        }, 500);

        // Load
        const checkLoad = () => {
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (nav) {
                setLoad((nav.loadEventEnd - nav.startTime).toFixed(0) + ' ms');
            }
        };
        if (document.readyState === 'complete') {
            checkLoad();
        } else {
            window.addEventListener('load', checkLoad);
        }

        return () => {
            clearInterval(domInt);
            clearInterval(heapInt);
            clearInterval(frameInt);
            observer.disconnect();
            cancelAnimationFrame(rafId);
        };
    }, []);

    const fwColor = 'var(--react)';

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

    return (
            <div className={`perf-panel ${collapsed ? 'perf-panel--collapsed' : ''}`}>
                <style dangerouslySetInnerHTML={{ __html: PERF_CSS }} />
                <button className="perf-panel__toggle" title="Toggle Performance Panel" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? '📊' : '⚡'}
                </button>
                <div className="perf-panel__body">
                    <div className="perf-panel__title">Instrumentation</div>
                    <div className="perf-panel__row">
                        <span className="perf-panel__label">Framework</span>
                        <span className="perf-panel__value perf-panel__framework" style={{ color: fwColor }}>React</span>
                    </div>
                    <div className="perf-panel__row">
                        <span className="perf-panel__label">DOM Nodes</span>
                        <span className="perf-panel__value">{domCount}</span>
                    </div>
                    <div className="perf-panel__row">
                        <span className="perf-panel__label">Mutations</span>
                        <span className="perf-panel__value">{mutations.toLocaleString()}</span>
                    </div>
                    <div className="perf-panel__row">
                        <span className="perf-panel__label">JS Heap</span>
                        <span className="perf-panel__value">{heap}</span>
                    </div>
                    <div className="perf-panel__row">
                        <span className="perf-panel__label">Frame Δ</span>
                        <span className="perf-panel__value">{frame}</span>
                    </div>
                    <div className="perf-panel__row">
                        <span className="perf-panel__label">Load</span>
                        <span className="perf-panel__value">{load}</span>
                    </div>
                </div>
            </div>
    );
};
