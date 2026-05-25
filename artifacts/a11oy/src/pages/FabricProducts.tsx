/**
 * A11oy Unified Fabric — Products tile.
 *
 * Tells the orchestration story end-to-end: six product tiles backed by the
 * live registry, recent proof events from the unified ledger, deep links
 * back into each child product, and a one-click "demo chain" that fires the
 * canonical Sentra → Counsel → Amaru handoff.
 */

import { Fragment, useEffect, useState } from 'react';
import {
  listFabricProducts,
  runDemoCrossProductChain,
  type ProductRegistryResponse,
  type RegisteredProduct,
  type ProofLedgerEntry,
  type ProofLambdaAxes,
} from '@workspace/a11oy-orchestration/client';

const palette = {
  bg: '#0a0a0a',
  panel: '#111114',
  border: 'rgba(255,255,255,0.08)',
  text: '#e7e5e4',
  muted: '#a1a1aa',
  accent: '#c9b787',
};

const styles = {
  page: {
    minHeight: '100vh',
    background: palette.bg,
    color: palette.text,
    padding: '48px 32px 96px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as const,
  header: { maxWidth: 1200, margin: '0 auto 24px' } as const,
  h1: { fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 } as const,
  sub: { color: palette.muted, marginTop: 8, maxWidth: 720 } as const,
  grid: {
    maxWidth: 1200,
    margin: '24px auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  } as const,
  tile: {
    background: palette.panel,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as const,
  pill: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
  } as const,
  recent: {
    maxWidth: 1200,
    margin: '32px auto 0',
    background: palette.panel,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    padding: 20,
  } as const,
  row: {
    display: 'grid',
    gridTemplateColumns: '120px 120px 1fr 260px 100px',
    gap: 12,
    padding: '8px 0',
    borderTop: `1px solid ${palette.border}`,
    fontSize: 13,
    alignItems: 'center',
  } as const,
  hashCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    color: palette.muted,
    position: 'relative' as const,
  } as const,
  hashLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as const,
  hashLabel: {
    color: palette.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    fontSize: 9,
    width: 44,
    flexShrink: 0,
  } as const,
  hashValue: {
    color: palette.text,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    minWidth: 0,
    flex: 1,
  } as const,
  copyBtn: {
    background: 'transparent',
    border: `1px solid ${palette.border}`,
    color: palette.muted,
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 9,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  } as const,
  verifyPanel: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: 6,
    background: palette.bg,
    border: `1px solid ${palette.accent}55`,
    borderRadius: 8,
    padding: 12,
    minWidth: 240,
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    zIndex: 20,
  } as const,
  btn: {
    background: palette.accent,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontWeight: 600,
    cursor: 'pointer',
  } as const,
};

function healthDot(h: RegisteredProduct['health']) {
  switch (h) {
    case 'healthy': return '#22c55e';
    case 'degraded': return '#f59e0b';
    case 'offline': return '#ef4444';
    default: return '#6b7280';
  }
}

function ProductTile({ product }: { product: RegisteredProduct }) {
  return (
    <a
      href={product.basePath}
      style={{ ...styles.tile, textDecoration: 'none', color: palette.text, borderTopColor: product.accentColor, borderTopWidth: 3 }}
      data-testid={`fabric-product-${product.product}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{product.displayName}</div>
        <div style={styles.pill}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: healthDot(product.health) }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.health}</span>
        </div>
      </div>
      <div style={{ color: palette.muted, fontSize: 13 }}>
        {product.capabilities.length} capabilit{product.capabilities.length === 1 ? 'y' : 'ies'} · {product.recentProofCount} proofs · models: {product.modelsUsed.length || 'none'}
      </div>
      {product.lastAction ? (
        <div style={{ fontSize: 12, color: palette.muted, marginTop: 8 }}>
          Last: {product.lastAction}
        </div>
      ) : null}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {product.capabilities.map((c) => (
          <span key={c.id} style={{ ...styles.pill, fontSize: 10 }}>{c.label}</span>
        ))}
      </div>
    </a>
  );
}

const LAMBDA_AXIS_LABELS: Record<keyof ProofLambdaAxes, string> = {
  cleanliness: 'Cleanliness',
  horizon: 'Horizon',
  resonance: 'Resonance',
  frustum: 'Frustum',
  gaussClosure: 'Gauss Closure',
  invariance: 'Invariance',
  moralGrounding: 'Moral Grounding',
  ontologicalGrounding: 'Ontological Grounding',
  measurabilityHonesty: 'Measurability Honesty',
};

function shortHash(h: string): string {
  if (h.length <= 18) return h;
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

async function copyToClipboard(value: string, key: string, setCopied: (k: string | null) => void): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1200);
  } catch {
    /* clipboard unavailable — silently ignore */
  }
}

function VerifyPanel({ axes, traceId, receiptHash }: { axes: ProofLambdaAxes; traceId?: string; receiptHash?: string }) {
  const entries = (Object.entries(axes) as [keyof ProofLambdaAxes, number | undefined][])
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v));
  return (
    <div style={styles.verifyPanel} data-testid="verify-panel">
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.accent, marginBottom: 8 }}>
        Λ-axis attestation
      </div>
      {entries.length === 0 ? (
        <div style={{ color: palette.muted, fontSize: 12 }}>No Λ-axis scores stamped on this span.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', fontSize: 12 }}>
          {entries.map(([k, v]) => (
            <Fragment key={k}>
              <span style={{ color: palette.muted }}>{LAMBDA_AXIS_LABELS[k]}</span>
              <span style={{ color: palette.text, fontFamily: 'ui-monospace, monospace' }}>{(v as number).toFixed(2)}</span>
            </Fragment>
          ))}
        </div>
      )}
      {(traceId || receiptHash) && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${palette.border}`, fontSize: 10, color: palette.muted, lineHeight: 1.5, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
          {traceId ? <div><span style={{ color: palette.accent }}>trace</span> {traceId}</div> : null}
          {receiptHash ? <div><span style={{ color: palette.accent }}>hash</span> {receiptHash}</div> : null}
        </div>
      )}
    </div>
  );
}

function ProofRow({ p }: { p: ProofLedgerEntry }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const hash = p.receiptHash;
  const traceId = p.traceId;
  const hasAxes = !!p.lambdaAxes && Object.keys(p.lambdaAxes).length > 0;

  return (
    <div style={styles.row} data-testid={`proof-row-${p.id}`}>
      <span style={{ color: palette.muted, fontSize: 11 }}>{new Date(p.ts).toLocaleTimeString()}</span>
      <span style={{ ...styles.pill, justifySelf: 'start' }}>{p.product}</span>
      <span>
        <span style={{ color: palette.accent }}>{p.kind}</span> · {p.summary}
        {p.relatedProduct ? <span style={{ color: palette.muted }}> → {p.relatedProduct}</span> : null}
      </span>
      <div
        style={styles.hashCell}
        onMouseEnter={() => hasAxes && setShowVerify(true)}
        onMouseLeave={() => setShowVerify(false)}
        data-testid={`proof-trace-${p.id}`}
      >
        {hash ? (
          <div style={styles.hashLine} title={hash}>
            <span style={styles.hashLabel}>hash</span>
            <span style={styles.hashValue} data-testid={`proof-hash-${p.id}`}>{shortHash(hash)}</span>
            <button
              type="button"
              style={styles.copyBtn}
              onClick={(e) => { e.stopPropagation(); void copyToClipboard(hash, `${p.id}-hash`, setCopied); }}
              data-testid={`copy-hash-${p.id}`}
              aria-label="Copy receipt hash"
            >
              {copied === `${p.id}-hash` ? '✓' : 'copy'}
            </button>
          </div>
        ) : null}
        {traceId ? (
          <div style={styles.hashLine} title={traceId}>
            <span style={styles.hashLabel}>trace</span>
            <span style={styles.hashValue} data-testid={`proof-traceid-${p.id}`}>{shortHash(traceId)}</span>
            <button
              type="button"
              style={styles.copyBtn}
              onClick={(e) => { e.stopPropagation(); void copyToClipboard(traceId, `${p.id}-trace`, setCopied); }}
              data-testid={`copy-trace-${p.id}`}
              aria-label="Copy traceId"
            >
              {copied === `${p.id}-trace` ? '✓' : 'copy'}
            </button>
            {hasAxes ? (
              <span
                style={{ ...styles.copyBtn, color: palette.accent, borderColor: `${palette.accent}55` }}
                data-testid={`verify-toggle-${p.id}`}
              >
                Λ
              </span>
            ) : null}
          </div>
        ) : null}
        {!hash && !traceId ? (
          <span style={{ color: palette.muted, fontStyle: 'italic' }}>no receipt</span>
        ) : null}
        {showVerify && hasAxes && p.lambdaAxes ? (
          <VerifyPanel axes={p.lambdaAxes} traceId={traceId} receiptHash={hash} />
        ) : null}
      </div>
      {p.deepLink ? (
        <a href={p.deepLink} style={{ color: palette.accent, fontSize: 12 }}>open ↗</a>
      ) : <span />}
    </div>
  );
}

export function FabricProducts() {
  const [data, setData] = useState<ProductRegistryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function refresh() {
    try {
      const next = await listFabricProducts();
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => { void refresh(); }, 5_000);
    return () => window.clearInterval(id);
  }, []);

  async function fireDemo() {
    setRunning(true);
    try {
      await runDemoCrossProductChain();
      await refresh();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={styles.page} data-testid="fabric-products-page">
      <div style={styles.header}>
        <h1 style={styles.h1}>Fabric · Products</h1>
        <div style={styles.sub}>
          A11oy is the conductor. Six products register on boot, route every model
          call through the governed router, and emit material actions to the unified
          proof ledger. Drill from any event into the originating product.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" style={styles.btn} onClick={fireDemo} disabled={running} data-testid="run-demo-chain">
            {running ? 'Running…' : 'Run Sentra → Counsel → Amaru demo'}
          </button>
          <span style={{ color: palette.muted, fontSize: 12 }}>
            {data ? `${data.products.length} products · ${data.totalProofs} proofs in ledger` : '…'}
          </span>
        </div>
      </div>

      {error ? <div style={{ color: '#ef4444', maxWidth: 1200, margin: '0 auto' }}>Error: {error}</div> : null}

      {data && data.products.length === 0 ? (
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: 24,
            border: `1px dashed ${palette.border}`,
            borderRadius: 14,
            color: palette.muted,
            fontSize: 13,
          }}
          data-testid="empty-registry"
        >
          No products have registered yet. Each child product calls
          <code style={{ margin: '0 6px', color: palette.accent }}>registerWithA11oy</code>
          on boot — open one of the artifacts (Sentra, Counsel, Conduit, Terra, Vessels, Carlota Jo)
          and it will appear here within a few seconds.
        </div>
      ) : null}

      <div style={styles.grid}>
        {data?.products.map((p) => <ProductTile key={p.product} product={p} />)}
      </div>

      <div style={styles.recent} data-testid="recent-proofs">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Recent proofs</div>
        {data?.recentProofs.length === 0 ? (
          <div style={{ color: palette.muted, fontSize: 13 }}>
            No proofs yet — fire the demo chain to seed the ledger.
          </div>
        ) : null}
        {data?.recentProofs.map((p) => <ProofRow key={p.id} p={p} />)}
      </div>
    </div>
  );
}

export default FabricProducts;
