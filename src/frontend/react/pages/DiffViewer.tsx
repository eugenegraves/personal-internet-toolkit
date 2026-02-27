import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';

// ─── Types ───

type DiffLine = {
    type: 'added' | 'removed' | 'unchanged';
    leftNum: number | null;
    rightNum: number | null;
    content: string;
};

type DiffViewerProps = {
    cssPath: string;
};

// ─── Diff Algorithm (simple LCS-based) ───

function computeDiff(left: string, right: string): DiffLine[] {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    const result: DiffLine[] = [];

    // Simple diff: use longest common subsequence approach
    const m = leftLines.length;
    const n = rightLines.length;

    // Build LCS table
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        new Array(n + 1).fill(0)
    );

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (leftLines[i - 1] === rightLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to build diff
    let i = m,
        j = n;
    const stack: DiffLine[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
            stack.push({
                type: 'unchanged',
                leftNum: i,
                rightNum: j,
                content: leftLines[i - 1],
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            stack.push({
                type: 'added',
                leftNum: null,
                rightNum: j,
                content: rightLines[j - 1],
            });
            j--;
        } else {
            stack.push({
                type: 'removed',
                leftNum: i,
                rightNum: null,
                content: leftLines[i - 1],
            });
            i--;
        }
    }

    stack.reverse();
    return stack;
}

// ─── Memoized Diff Row ───

const DiffRow = memo(function DiffRow({
    line,
    style,
}: {
    line: DiffLine;
    style: React.CSSProperties;
}) {
    const bgMap: Record<string, string> = {
        added: 'rgba(46, 160, 67, 0.12)',
        removed: 'rgba(248, 81, 73, 0.12)',
        unchanged: 'transparent',
    };
    const colorMap: Record<string, string> = {
        added: '#3fb950',
        removed: '#f85149',
        unchanged: 'inherit',
    };
    const prefixMap: Record<string, string> = {
        added: '+',
        removed: '-',
        unchanged: ' ',
    };

    return (
        <div
            style={{
                ...style,
                display: 'flex',
                background: bgMap[line.type],
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                lineHeight: '22px',
                borderBottom: '1px solid hsl(225, 10%, 14%)',
            }}
        >
            <span
                style={{
                    width: '50px',
                    textAlign: 'right',
                    padding: '0 8px',
                    color: 'hsl(220, 8%, 42%)',
                    userSelect: 'none',
                    flexShrink: 0,
                }}
            >
                {line.leftNum ?? ''}
            </span>
            <span
                style={{
                    width: '50px',
                    textAlign: 'right',
                    padding: '0 8px',
                    color: 'hsl(220, 8%, 42%)',
                    userSelect: 'none',
                    flexShrink: 0,
                    borderRight: '1px solid hsl(225, 10%, 16%)',
                }}
            >
                {line.rightNum ?? ''}
            </span>
            <span
                style={{
                    width: '20px',
                    textAlign: 'center',
                    color: colorMap[line.type],
                    fontWeight: 600,
                    userSelect: 'none',
                    flexShrink: 0,
                }}
            >
                {prefixMap[line.type]}
            </span>
            <span style={{ padding: '0 8px', flex: 1, whiteSpace: 'pre' }}>
                {line.content}
            </span>
        </div>
    );
});

// ─── Virtual List Hook ───

function useVirtualList(
    containerRef: React.RefObject<HTMLDivElement | null>,
    itemCount: number,
    itemHeight: number,
    overscan: number = 10
) {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleScroll = () => setScrollTop(el.scrollTop);
        const handleResize = () => setContainerHeight(el.clientHeight);

        el.addEventListener('scroll', handleScroll, { passive: true });
        const ro = new ResizeObserver(handleResize);
        ro.observe(el);
        handleResize();

        return () => {
            el.removeEventListener('scroll', handleScroll);
            ro.disconnect();
        };
    }, [containerRef]);

    const startIndex = Math.max(
        0,
        Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
        itemCount - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const totalHeight = itemCount * itemHeight;
    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
        visibleItems.push({
            index: i,
            style: {
                position: 'absolute' as const,
                top: i * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
            },
        });
    }

    return { visibleItems, totalHeight };
}

// ─── Sample Data ───

const SAMPLE_LEFT = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Calculate results
const fib10 = fibonacci(10);
const fact5 = factorial(5);
console.log("Fibonacci(10):", fib10);
console.log("Factorial(5):", fact5);`;

const SAMPLE_RIGHT = `function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Calculate results
const fib10 = fibonacci(10);
const fact5 = factorial(5);
console.log("Fibonacci(10):", fib10);
console.log("Factorial(5):", fact5);
console.log("Performance improved with memoization");`;

// ─── Main Component ───
import { PerfPanel } from '../components/PerfPanel';

export const DiffViewer = ({ cssPath }: DiffViewerProps) => {
    console.log('[DiffViewer] Render started');
    const [leftText, setLeftText] = useState(SAMPLE_LEFT);
    const [rightText, setRightText] = useState(SAMPLE_RIGHT);
    const containerRef = useRef<HTMLDivElement>(null);

    const diffLines = useMemo(() => {
        console.log('[DiffViewer] Computing diff...');
        const t0 = performance.now();
        const res = computeDiff(leftText, rightText);
        console.log(`[DiffViewer] Diff computed in ${performance.now() - t0}ms`);
        return res;
    }, [leftText, rightText]);

    const stats = useMemo(() => {
        let added = 0,
            removed = 0,
            unchanged = 0;
        for (const line of diffLines) {
            if (line.type === 'added') added++;
            else if (line.type === 'removed') removed++;
            else unchanged++;
        }
        return { added, removed, unchanged, total: diffLines.length };
    }, [diffLines]);

    console.log('[DiffViewer] Calling useVirtualList...');
    const { visibleItems, totalHeight } = useVirtualList(
        containerRef,
        diffLines.length,
        22
    );
    console.log('[DiffViewer] Render complete. Visible items:', visibleItems.length);

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta name="x-framework" content="React" />
                <title>Diff Viewer | Personal Internet Toolkit</title>
                <link rel="icon" href="/assets/ico/favicon.ico" />
                <link rel="stylesheet" href={cssPath} />
            </head>
            <body
                style={{
                    margin: 0,
                    fontFamily:
                        "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    background: 'hsl(225, 15%, 8%)',
                    color: 'hsl(220, 15%, 90%)',
                    minHeight: '100vh',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    {/* Nav */}
                    <nav
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: 'hsl(225, 14%, 11%)',
                            borderBottom: '1px solid hsl(225, 10%, 16%)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 100,
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: '17px',
                                marginRight: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            ⚡{' '}
                            <span
                                style={{
                                    background:
                                        'linear-gradient(135deg, hsl(200,80%,60%), hsl(260,70%,65%))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Personal Internet Toolkit
                            </span>
                        </div>
                        {[
                            { href: '/', label: 'Home' },
                            { href: '/markdown', label: 'Markdown' },
                            { href: '/json', label: 'JSON' },
                            { href: '/diff', label: 'Diff', active: true },
                            { href: '/regex', label: 'Regex' },
                            { href: '/convert', label: 'Convert' },
                            { href: '/compress', label: 'Compress' },
                        ].map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: link.active
                                        ? 'hsl(200,80%,60%)'
                                        : 'hsl(220,10%,60%)',
                                    background: link.active
                                        ? 'hsl(200,40%,20%)'
                                        : 'transparent',
                                    textDecoration: 'none',
                                }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Tool Header */}
                    <div
                        style={{
                            padding: '24px 24px 16px',
                            borderBottom: '1px solid hsl(225,10%,16%)',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                marginBottom: '4px',
                            }}
                        >
                            Diff Viewer
                        </h1>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: 'hsl(220,8%,42%)',
                                fontSize: '13px',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    padding: '4px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    background: 'hsla(193,95%,60%,0.15)',
                                    color: 'hsl(193,95%,60%)',
                                }}
                            >
                                React
                            </span>
                            <span>
                                Virtualized rendering • Memoized rows •
                                LCS-based diff
                            </span>
                        </div>
                    </div>

                    {/* Input Areas */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1px',
                            background: 'hsl(225,10%,16%)',
                        }}
                    >
                        <div style={{ background: 'hsl(225,15%,8%)', padding: '12px' }}>
                            <label
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'hsl(220,8%,42%)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginBottom: '8px',
                                    display: 'block',
                                }}
                            >
                                Original
                            </label>
                            <textarea
                                value={leftText}
                                onChange={(e) => setLeftText(e.target.value)}
                                spellCheck={false}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    resize: 'vertical',
                                    padding: '8px 12px',
                                    background: 'hsl(225,15%,8%)',
                                    border: '1px solid hsl(225,10%,22%)',
                                    borderRadius: '6px',
                                    color: 'hsl(220,15%,90%)',
                                    fontFamily:
                                        "'JetBrains Mono', monospace",
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ background: 'hsl(225,15%,8%)', padding: '12px' }}>
                            <label
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'hsl(220,8%,42%)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginBottom: '8px',
                                    display: 'block',
                                }}
                            >
                                Modified
                            </label>
                            <textarea
                                value={rightText}
                                onChange={(e) => setRightText(e.target.value)}
                                spellCheck={false}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    resize: 'vertical',
                                    padding: '8px 12px',
                                    background: 'hsl(225,15%,8%)',
                                    border: '1px solid hsl(225,10%,22%)',
                                    borderRadius: '6px',
                                    color: 'hsl(220,15%,90%)',
                                    fontFamily:
                                        "'JetBrains Mono', monospace",
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '8px 24px',
                            background: 'hsl(225,14%,11%)',
                            borderBottom: '1px solid hsl(225,10%,16%)',
                            fontSize: '13px',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        <span style={{ color: '#3fb950' }}>
                            +{stats.added} added
                        </span>
                        <span style={{ color: '#f85149' }}>
                            -{stats.removed} removed
                        </span>
                        <span style={{ color: 'hsl(220,8%,42%)' }}>
                            {stats.unchanged} unchanged
                        </span>
                        <span style={{ color: 'hsl(220,8%,42%)', marginLeft: 'auto' }}>
                            {stats.total} lines total
                        </span>
                    </div>

                    {/* Virtualized Diff Output */}
                    <div
                        ref={containerRef}
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            position: 'relative',
                            background: 'hsl(225,15%,8%)',
                        }}
                    >
                        <div
                            style={{
                                height: totalHeight,
                                position: 'relative',
                            }}
                        >
                            {visibleItems.map(({ index, style }) => (
                                <DiffRow
                                    key={index}
                                    line={diffLines[index]}
                                    style={style}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <PerfPanel />
            </body>
        </html>
    );
};
