/**
 * A11oy Unified Fabric — Products tile.
 *
 * Tells the orchestration story end-to-end: six product tiles backed by the
 * live registry, recent proof events from the unified ledger, deep links
 * back into each child product, and a one-click "demo chain" that fires the
 * canonical Sentra → Counsel → Amaru handoff.
 */

import { useEffect, useState } from 'react';
import {
  listFabricProducts,
  runDemoCrossProductChain,
  type ProductRegistryResponse,
  type RegisteredProduct,
  type ProofLedgerEntry,
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
    gridTemplateColumns: '120px 120px 1fr 100px',
    gap: 12,
    padding: '8px 0',
    borderTop: `1px solid ${palette.border}`,
    fontSize: 13,
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

function ProofRow({ p }: { p: ProofLedgerEntry }) {
  return (
    <div style={styles.row} data-testid={`proof-row-${p.id}`}>
      <span style={{ color: palette.muted, fontSize: 11 }}>{new Date(p.ts).toLocaleTimeString()}</span>
      <span style={{ ...styles.pill, justifySelf: 'start' }}>{p.product}</span>
      <span>
        <span style={{ color: palette.accent }}>{p.kind}</span> · {p.summary}
        {p.relatedProduct ? <span style={{ color: palette.muted }}> → {p.relatedProduct}</span> : null}
      </span>
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
