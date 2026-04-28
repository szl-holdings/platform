/**
 * FlexCache Runtime — live visualisation of A11oy's tiered cache layer.
 *
 * Shows hot/warm/cold tier occupancy, hit rate, latency wins, top profiled
 * keys, and a streaming event log. A "synthetic workload" panel lets the
 * operator drive demo traffic so the strategy promotions are visible.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  FlexCacheProvider,
  useFlexCache,
  useFlexCacheEvents,
  useFlexCacheProfiles,
  useFlexCacheStats,
} from '@szl-holdings/flexcache/react';
import type { TierDecisionEvent } from '@szl-holdings/flexcache';
import { getFlexCache } from '../lib/flexcache-runtime';

const TOKENS = {
  bg: '#0a0a0a',
  surface: '#111111',
  border: '#1f1f1f',
  text: '#e5e5e5',
  textDim: '#909090',
  textMuted: '#666666',
  accent: '#c9b787',
  hot: '#ff7a59',
  warm: '#f0c674',
  cold: '#5fa8d3',
  promote: '#4ade80',
  demote: '#fb923c',
  evict: '#f87171',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

export function FlexCacheRuntime() {
  return (
    <FlexCacheProvider manager={getFlexCache()}>
      <FlexCachePage />
    </FlexCacheProvider>
  );
}

function FlexCachePage() {
  const stats = useFlexCacheStats(750);
  const events = useFlexCacheEvents(40);
  const profiles = useFlexCacheProfiles(12);

  return (
    <div
      style={{
        background: TOKENS.bg,
        color: TOKENS.text,
        minHeight: 'calc(100vh - 52px)',
        padding: '2rem 2.5rem',
      }}
    >
      <Header />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <KPICard label="Hit rate" value={`${((stats?.hitRate ?? 0) * 100).toFixed(1)}%`} hint={`${stats?.hits ?? 0} hits / ${stats?.misses ?? 0} misses`} accent={TOKENS.accent} />
        <KPICard label="Avg loader" value={`${(stats?.avgLoaderMs ?? 0).toFixed(1)}ms`} hint={`${stats?.coldLoads ?? 0} cold loads`} accent={TOKENS.cold} />
        <KPICard label="Hot tier" value={`${stats?.hotSize ?? 0}`} hint={`promotions ${stats?.promotions ?? 0}`} accent={TOKENS.hot} />
        <KPICard label="Warm tier" value={`${stats?.warmSize ?? 0}`} hint={`evictions ${stats?.evictions ?? 0}`} accent={TOKENS.warm} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <Panel title="Tier occupancy">
          <TierBar
            hot={stats?.hotSize ?? 0}
            warm={stats?.warmSize ?? 0}
            keysProfiled={stats?.totalKeysProfiled ?? 0}
          />
          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: TOKENS.textDim, lineHeight: 1.6 }}>
            Approx <code style={{ color: TOKENS.text }}>{formatBytes(stats?.approxBytes ?? 0)}</code>
            {' '}across both tiers.{' '}
            <code style={{ color: TOKENS.text }}>{stats?.totalKeysProfiled ?? 0}</code>
            {' '}distinct keys profiled.
          </p>
        </Panel>

        <Panel title="Synthetic workload">
          <SyntheticWorkload />
        </Panel>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
        <Panel title="Top profiled keys (by tier-promotion score)">
          <ProfileTable rows={profiles} />
        </Panel>
        <Panel title="Live decision stream">
          <EventStream events={events} />
        </Panel>
      </section>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header style={{ marginBottom: '2rem' }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: '0.625rem', color: TOKENS.textMuted, letterSpacing: '0.16em', marginBottom: '0.5rem' }}>
        A11OY · RUNTIME · FLEXCACHE
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.015em', margin: 0, marginBottom: '0.5rem' }}>
        FlexCache Runtime
      </h1>
      <p style={{ color: TOKENS.textDim, fontSize: '0.875rem', margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
        Tiered, self-profiling cache that sits in front of every heavy data path in A11oy — graph snapshots,
        agent dossiers, ontology slices, evidence ledger queries. Inspired by NVIDIA's FlexTensor playbook
        (Apache-2.0): observe access patterns first, then promote the keys that are both frequently used and
        expensive to recompute into the hot tier. Demote and evict the rest.
      </p>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${TOKENS.border}`, color: TOKENS.textMuted, fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
      <span><code style={{ color: TOKENS.textDim }}>@szl-holdings/flexcache</code> · adaptive strategy · Apache-2.0</span>
      <span>Adapted from <code style={{ color: TOKENS.textDim }}>ai-dynamo/flextensor</code></span>
    </footer>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 8, padding: '1.25rem' }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: '0.625rem', letterSpacing: '0.14em', color: TOKENS.textMuted, marginBottom: '0.85rem', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function KPICard({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: string }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 8, padding: '1rem 1.15rem' }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: '0.6rem', letterSpacing: '0.14em', color: TOKENS.textMuted, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 500, marginTop: '0.4rem', color: accent }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: TOKENS.textDim, marginTop: '0.25rem' }}>{hint}</div>
    </div>
  );
}

function TierBar({ hot, warm, keysProfiled }: { hot: number; warm: number; keysProfiled: number }) {
  const cold = Math.max(0, keysProfiled - hot - warm);
  const total = Math.max(1, hot + warm + cold);
  const segs = [
    { label: 'Hot', count: hot, color: TOKENS.hot },
    { label: 'Warm', count: warm, color: TOKENS.warm },
    { label: 'Cold', count: cold, color: TOKENS.cold },
  ];
  return (
    <div>
      <div style={{ display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden', background: '#1a1a1a' }}>
        {segs.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.count} keys`}
            style={{ width: `${(s.count / total) * 100}%`, background: s.color, transition: 'width 0.4s ease' }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.75rem', color: TOKENS.textDim }}>
        {segs.map((s) => (
          <span key={s.label}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: s.color, borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }} />
            {s.label} <strong style={{ color: TOKENS.text, fontWeight: 500 }}>{s.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileTable({ rows }: { rows: ReturnType<typeof useFlexCacheProfiles> }) {
  if (rows.length === 0) {
    return <Empty hint="No keys profiled yet. Drive some traffic with the synthetic workload panel above." />;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
      <thead>
        <tr style={{ color: TOKENS.textMuted, textAlign: 'left', fontFamily: TOKENS.mono, fontSize: '0.65rem', letterSpacing: '0.12em' }}>
          <th style={{ padding: '0.4rem 0.6rem 0.4rem 0', fontWeight: 500 }}>KEY</th>
          <th style={{ padding: '0.4rem 0.6rem', fontWeight: 500, textAlign: 'right' }}>CALLS</th>
          <th style={{ padding: '0.4rem 0.6rem', fontWeight: 500, textAlign: 'right' }}>AVG LOAD</th>
          <th style={{ padding: '0.4rem 0.6rem', fontWeight: 500, textAlign: 'right' }}>BYTES</th>
          <th style={{ padding: '0.4rem 0', fontWeight: 500, textAlign: 'right' }}>TIER · SCORE</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const avg = r.loaderInvocations > 0 ? (r.loaderLatencyMs / r.loaderInvocations).toFixed(1) : '–';
          return (
            <tr key={r.key} style={{ borderTop: `1px solid ${TOKENS.border}` }}>
              <td style={{ padding: '0.5rem 0.6rem 0.5rem 0', color: TOKENS.text, fontFamily: TOKENS.mono, fontSize: '0.75rem' }}>{r.key}</td>
              <td style={{ padding: '0.5rem 0.6rem', color: TOKENS.textDim, textAlign: 'right' }}>{r.calls}</td>
              <td style={{ padding: '0.5rem 0.6rem', color: TOKENS.textDim, textAlign: 'right' }}>{avg}{avg !== '–' ? 'ms' : ''}</td>
              <td style={{ padding: '0.5rem 0.6rem', color: TOKENS.textDim, textAlign: 'right' }}>{formatBytes(r.lastBytes)}</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                <TierPill tier={r.lastServedTier} />
                <span style={{ marginLeft: 8, color: TOKENS.textDim, fontFamily: TOKENS.mono, fontSize: '0.7rem' }}>
                  {r.score.toFixed(2)}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TierPill({ tier }: { tier: 'hot' | 'warm' | 'cold' }) {
  const color = tier === 'hot' ? TOKENS.hot : tier === 'warm' ? TOKENS.warm : TOKENS.cold;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '0.65rem', fontFamily: TOKENS.mono, color, border: `1px solid ${color}55`, borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {tier}
    </span>
  );
}

function EventStream({ events }: { events: TierDecisionEvent[] }) {
  if (events.length === 0) {
    return <Empty hint="No tier decisions yet." />;
  }
  return (
    <div style={{ maxHeight: 320, overflowY: 'auto', fontFamily: TOKENS.mono, fontSize: '0.75rem' }}>
      {events.map((e, i) => {
        const color =
          e.reason === 'promote' ? TOKENS.promote :
          e.reason === 'demote'  ? TOKENS.demote  :
          e.reason === 'evict'   ? TOKENS.evict   :
                                   TOKENS.accent;
        const ts = new Date(e.at).toLocaleTimeString('en-US', { hour12: false });
        return (
          <div key={`${e.at}-${i}`} style={{ padding: '0.4rem 0.2rem', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', gap: '0.6rem', alignItems: 'baseline' }}>
            <span style={{ color: TOKENS.textMuted, minWidth: 70 }}>{ts}</span>
            <span style={{ color, minWidth: 70, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.08em' }}>{e.reason}</span>
            <span style={{ color: TOKENS.textDim }}>{e.from} → {e.to}</span>
            <span style={{ color: TOKENS.text, fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.key}</span>
          </div>
        );
      })}
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: TOKENS.textMuted, fontSize: '0.8rem' }}>
      {hint}
    </div>
  );
}

/**
 * Synthetic workload — drives demo traffic into the cache so operators can
 * watch the tier-promotion logic make decisions in real time. Loaders are
 * artificially slow (50–250ms) to mimic the kind of network/DB call this
 * cache is normally protecting.
 */
function SyntheticWorkload() {
  const cache = getFlexCache();
  const [running, setRunning] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const keys = useMemo(
    () => [
      'graph:capability-trajectory',
      'graph:agent-viz',
      'graph:ontology',
      'graph:control-tower',
      'agent:roster',
      'agent:behaviour-trace',
      'demo:investor-deck',
      'evidence:proof-chain',
      'fabric:risk-matrix',
      'fabric:signal-mesh',
    ],
    [],
  );

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const tick = async () => {
      while (!cancelled) {
        // Bias: skew toward the first 3 keys (zipfian-ish) so the strategy has
        // signal to learn from. Real apps look like this — a small handful of
        // hot keys carry most traffic.
        const idx = Math.floor(Math.pow(Math.random(), 2.4) * keys.length);
        const key = keys[idx];
        const result = await cache.get(key, async () => {
          await sleep(50 + Math.random() * 200);
          return mockPayload(key);
        });
        if (cancelled) return;
        if (result.cold) setMisses((n) => n + 1);
        else setHits((n) => n + 1);
        await sleep(120);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [running, cache, keys]);

  return (
    <div style={{ fontSize: '0.8125rem', color: TOKENS.textDim, lineHeight: 1.6 }}>
      <p style={{ margin: 0, marginBottom: '0.85rem' }}>
        Drives a zipfian-skewed workload of 10 representative A11oy keys.
        Loader latency is randomised 50–250ms to mimic real network paths.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '0.5rem 1rem',
            background: running ? TOKENS.evict : TOKENS.text,
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          {running ? 'Stop workload' : 'Start workload'}
        </button>
        <button
          type="button"
          onClick={async () => {
            await cache.clear();
            setHits(0);
            setMisses(0);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: TOKENS.text,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Reset cache
        </button>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem' }}>
        <span><span style={{ color: TOKENS.promote, fontWeight: 500 }}>{hits}</span> hits</span>
        <span><span style={{ color: TOKENS.cold, fontWeight: 500 }}>{misses}</span> cold loads</span>
      </div>
    </div>
  );
}

/** Demo loader for the new page — also shows the React hook in action elsewhere. */
export function useDemoGraph(key: string) {
  return useFlexCache(`graph:${key}`, async () => {
    await sleep(120 + Math.random() * 180);
    return mockPayload(key);
  });
}

function mockPayload(key: string) {
  const size = 200 + Math.floor(Math.random() * 800);
  return {
    key,
    nodes: Array.from({ length: size }, (_, i) => ({ id: `n${i}`, label: `node ${i}` })),
    generatedAt: Date.now(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
