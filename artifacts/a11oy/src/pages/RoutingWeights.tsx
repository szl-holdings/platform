import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

function csrfToken(): string | null {
  const m = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) : null;
  return m ? decodeURIComponent(m[1]) : null;
}
function csrfHeaders(): Record<string, string> {
  const t = csrfToken();
  return t ? { 'x-csrf-token': t } : {};
}

interface RoutingWeight {
  dimension: string;
  category: string;
  label: string;
  weight: number;
  seed: number;
  updatedBy: string;
  updatedAt: string;
}

interface RoutingWeightsResponse {
  weights: RoutingWeight[];
  total: number;
  normalizedTotal: number;
  count: number;
}

export default function RoutingWeights() {
  const [serverWeights, setServerWeights] = useState<RoutingWeight[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/a11oy/routing-weights', { credentials: 'include' });
      const j = await r.json() as { ok: boolean; data?: RoutingWeightsResponse; error?: { message: string } };
      if (!j.ok || !j.data) throw new Error(j.error?.message ?? 'Failed to load routing weights');
      setServerWeights(j.data.weights);
      setDrafts(Object.fromEntries(j.data.weights.map(w => [w.dimension, w.weight])));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => {
    if (!serverWeights) return [] as Array<{ category: string; items: RoutingWeight[] }>;
    const map = new Map<string, RoutingWeight[]>();
    for (const w of serverWeights) {
      const arr = map.get(w.category) ?? [];
      arr.push(w);
      map.set(w.category, arr);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  }, [serverWeights]);

  const draftValues = Object.values(drafts);
  const draftTotal = draftValues.reduce((a, b) => a + b, 0);
  const draftNormalized = draftValues.length ? draftTotal / draftValues.length : 0;
  const dirty = serverWeights ? serverWeights.some(w => Math.abs((drafts[w.dimension] ?? w.weight) - w.weight) > 1e-9) : false;

  function setDraft(dimension: string, value: number) {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    setDrafts(prev => ({ ...prev, [dimension]: clamped }));
  }

  async function save() {
    if (!serverWeights || saving) return;
    setSaving(true);
    setError(null);
    try {
      const dirtyOnes = serverWeights.filter(w => Math.abs((drafts[w.dimension] ?? w.weight) - w.weight) > 1e-9);
      for (const w of dirtyOnes) {
        const next = drafts[w.dimension];
        const r = await fetch(`/api/a11oy/routing-weights/${encodeURIComponent(w.dimension)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'content-type': 'application/json', ...csrfHeaders() },
          body: JSON.stringify({ weight: next, updatedBy: 'operator' }),
        });
        const j = await r.json() as { ok: boolean; error?: { message: string } };
        if (!j.ok) throw new Error(j.error?.message ?? `Failed to save ${w.dimension}`);
      }
      setSavedAt(new Date().toLocaleTimeString());
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function resetSeed() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/a11oy/routing-weights/reset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ updatedBy: 'operator' }),
      });
      const j = await r.json() as { ok: boolean; error?: { message: string } };
      if (!j.ok) throw new Error(j.error?.message ?? 'Failed to reset weights');
      setSavedAt(new Date().toLocaleTimeString());
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        label="ROUTING WEIGHTS"
        title="Operator-Tunable Routing Surface"
        subtitle="Inspect and adjust the weights that drive how A11oy routes decisions across model tiers, agent classes, tool families, and verticals. Edits persist to the in-memory store on the API server for the lifetime of the process."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="DIMENSIONS" value={serverWeights?.length ?? 0} sub="seeded" accent={GOLD} />
        <KpiCard label="DRAFT TOTAL" value={draftTotal.toFixed(2)} sub="sum of weights" accent={GOLD} />
        <KpiCard label="NORMALIZED" value={draftNormalized.toFixed(3)} sub="mean weight" accent={GOLD} />
        <KpiCard label="DIRTY" value={dirty ? 'YES' : 'NO'} sub="unsaved edits" accent={dirty ? '#f59e0b' : '#22c55e'} />
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest"
          style={{
            background: dirty ? GOLD : 'rgba(201,183,135,0.15)',
            color: dirty ? '#0a0a0a' : 'var(--color-a11oy-text-ghost)',
            cursor: dirty && !saving ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Edits'}
        </button>
        <button
          type="button"
          onClick={() => void resetSeed()}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest"
          style={{
            background: 'transparent',
            color: 'var(--color-a11oy-text-sub)',
            border: '1px solid var(--color-a11oy-border)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          Reset to Seed
        </button>
        <button
          type="button"
          onClick={() => serverWeights && setDrafts(Object.fromEntries(serverWeights.map(w => [w.dimension, w.weight])))}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest"
          style={{
            background: 'transparent',
            color: 'var(--color-a11oy-text-ghost)',
            border: '1px solid var(--color-a11oy-border)',
            cursor: dirty && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          Discard Edits
        </button>
        {savedAt && <div className="text-xs font-mono" style={{ color: '#22c55e' }}>Saved at {savedAt}</div>}
        {error && <div className="text-xs font-mono" style={{ color: '#ef4444' }}>{error}</div>}
      </div>

      {loading && (
        <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: GOLD }}>Loading routing weights…</div>
      )}

      {!loading && grouped.map(group => (
        <Card key={group.category} className="mb-4">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>{group.category}</div>
          <div className="flex flex-col gap-2">
            {group.items.map(w => {
              const draft = drafts[w.dimension] ?? w.weight;
              const isDirty = Math.abs(draft - w.weight) > 1e-9;
              return (
                <div
                  key={w.dimension}
                  className="grid grid-cols-12 items-center gap-3 px-3 py-2 rounded"
                  style={{
                    background: isDirty ? 'rgba(245,158,11,0.05)' : 'transparent',
                    border: `1px solid ${isDirty ? 'rgba(245,158,11,0.25)' : 'var(--color-a11oy-border)'}`,
                  }}
                >
                  <div className="col-span-5">
                    <div className="text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{w.label}</div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{w.dimension}</div>
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={draft}
                      onChange={e => setDraft(w.dimension, parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="col-span-1 text-xs font-mono text-right" style={{ color: isDirty ? '#f59e0b' : GOLD }}>
                    {draft.toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={draft}
                      onChange={e => setDraft(w.dimension, parseFloat(e.target.value))}
                      className="w-full text-xs font-mono px-2 py-1 rounded"
                      style={{
                        background: 'var(--color-a11oy-deep)',
                        border: '1px solid var(--color-a11oy-border)',
                        color: 'var(--color-a11oy-text)',
                      }}
                    />
                  </div>
                  <div className="col-span-1 text-[10px] font-mono text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    seed {w.seed.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </Layout>
  );
}
