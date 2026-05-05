import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const API = '/api/a11oy';
const GOLD = '#c9b787';

interface RoutingWeight {
  id: string;
  mode: string;
  category: string;
  model: string;
  provider: string;
  weight: number;
  tier: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

const TIER_STYLES: Record<string, { bg: string; color: string }> = {
  standard:  { bg: 'rgba(94,94,94,0.15)',   color: '#8a8a8a' },
  elevated:  { bg: 'rgba(201,183,135,0.15)', color: '#c9b787' },
  sovereign: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function WeightInput({ weight, onSave }: { weight: RoutingWeight; onSave: (id: string, val: number) => Promise<void> }) {
  const [value, setValue] = useState(String(weight.weight));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(String(weight.weight));
  }, [weight.weight]);

  function handleChange(raw: string) {
    setValue(raw);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const num = parseFloat(raw);
    if (isNaN(num) || num < 0 || num > 1) {
      setError('Must be 0.00 – 1.00');
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSaving(true);
      void onSave(weight.id, num).finally(() => setSaving(false));
    }, 600);
  }

  const num = parseFloat(value);
  const isValid = !isNaN(num) && num >= 0 && num <= 1;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((parseFloat(value) || 0) * 100)}%`, backgroundColor: isValid ? GOLD : '#ef4444' }} />
        </div>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={e => handleChange(e.target.value)}
          className="w-16 text-right text-xs font-mono px-2 py-1 rounded outline-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : isValid ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-border)'}`,
            color: error ? '#ef4444' : GOLD,
          }}
        />
      </div>
      {saving && <span className="text-[9px] font-mono" style={{ color: '#8a8a8a' }}>saving…</span>}
      {error && <span className="text-[9px] font-mono" style={{ color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

export function RoutingWeights() {
  const [weights, setWeights] = useState<RoutingWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [optimisticWeights, setOptimisticWeights] = useState<Record<string, number>>({});

  function loadWeights() {
    return fetch(`${API}/routing-weights`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: { ok: boolean; data: { weights: RoutingWeight[] } }) => {
        if (d.ok) {
          setWeights(d.data.weights);
          setOptimisticWeights({});
        } else {
          throw new Error('API error');
        }
      })
      .catch((e: Error) => setFetchError(e.message));
  }

  useEffect(() => {
    setLoading(true);
    void loadWeights().finally(() => setLoading(false));
  }, []);

  async function handleSave(id: string, newWeight: number) {
    setOptimisticWeights(prev => ({ ...prev, [id]: newWeight }));
    try {
      const r = await fetch(`${API}/routing-weights/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: newWeight, updatedBy: 'operator' }),
      });
      const d = await r.json() as { ok: boolean; data: RoutingWeight };
      if (d.ok) {
        setWeights(prev => prev.map(w => w.id === id ? d.data : w));
        setOptimisticWeights(prev => { const n = { ...prev }; delete n[id]; return n; });
      } else {
        setOptimisticWeights(prev => { const n = { ...prev }; delete n[id]; return n; });
        throw new Error('Save failed');
      }
    } catch {
      setOptimisticWeights(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const r = await fetch(`${API}/routing-weights/reset`, { method: 'POST' });
      const d = await r.json() as { ok: boolean; data: { weights: RoutingWeight[] } };
      if (d.ok) {
        setWeights(d.data.weights);
        setOptimisticWeights({});
      }
    } finally {
      setResetting(false);
    }
  }

  const displayWeights = weights.map(w => ({
    ...w,
    weight: optimisticWeights[w.id] !== undefined ? optimisticWeights[w.id] : w.weight,
  }));

  const avgWeight = displayWeights.length ? displayWeights.reduce((s, w) => s + w.weight, 0) / displayWeights.length : 0;
  const editedCount = weights.filter(w => w.updatedAt).length;

  return (
    <Layout>
      <PageHeader
        label="MODEL ROUTER"
        title="Routing Weights"
        subtitle="Operator-editable per-route weights that govern model selection for each inference category. Edits persist for the API process lifetime. Reset restores all defaults."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ROUTES" value={weights.length} sub="configured" accent={GOLD} />
        <KpiCard label="AVG WEIGHT" value={avgWeight.toFixed(2)} sub="across routes" accent={GOLD} />
        <KpiCard label="EDITED" value={editedCount} sub="from defaults" accent={editedCount > 0 ? GOLD : '#22c55e'} />
        <KpiCard label="WEIGHT RANGE" value="0 – 1" sub="inclusive" accent={GOLD} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Route Weights</SectionTitle>
        <button
          onClick={() => void handleReset()}
          disabled={resetting}
          className="text-xs font-mono px-4 py-1.5 rounded-lg transition-all"
          style={{
            backgroundColor: resetting ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.08)',
            color: resetting ? '#8a8a8a' : '#f87171',
            border: '1px solid rgba(239,68,68,0.2)',
            cursor: resetting ? 'not-allowed' : 'pointer',
          }}
        >
          {resetting ? 'Resetting…' : 'Reset to Defaults'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8" style={{ color: GOLD }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(201,183,135,0.2)', borderTopColor: GOLD }} />
          <span className="text-xs font-mono">Loading routing weights…</span>
        </div>
      ) : fetchError ? (
        <div className="p-4 rounded-lg text-xs font-mono" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {fetchError}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-a11oy-border)' }}>
                  <th className="text-left py-2 pr-4 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Mode / Category</th>
                  <th className="text-left py-2 pr-4 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Model</th>
                  <th className="text-left py-2 pr-4 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Provider</th>
                  <th className="text-left py-2 pr-4 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Tier</th>
                  <th className="text-right py-2 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Weight</th>
                </tr>
              </thead>
              <tbody>
                {displayWeights.map((w, i) => {
                  const tierStyle = TIER_STYLES[w.tier] ?? TIER_STYLES.standard;
                  const isEdited = !!weights.find(orig => orig.id === w.id)?.updatedAt;
                  return (
                    <tr
                      key={w.id}
                      style={{ borderBottom: i < displayWeights.length - 1 ? '1px solid var(--color-a11oy-border-subtle)' : 'none' }}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{w.mode}</div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{w.category}</div>
                        {isEdited && weights.find(orig => orig.id === w.id)?.updatedBy && (
                          <div className="text-[8px] font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            edited by {weights.find(orig => orig.id === w.id)?.updatedBy}
                            {weights.find(orig => orig.id === w.id)?.updatedAt &&
                              ` · ${fmt(weights.find(orig => orig.id === w.id)!.updatedAt!)}`
                            }
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono" style={{ color: GOLD }}>{w.model}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{w.provider}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tierStyle.bg, color: tierStyle.color }}>
                          {w.tier}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <WeightInput
                          weight={w}
                          onSave={handleSave}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-6 p-4 rounded-lg text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
        <div className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: GOLD }}>Operator Notes</div>
        <ul className="space-y-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          <li>· Weights range from 0.00 (disabled) to 1.00 (full priority). Values outside this range are rejected.</li>
          <li>· Changes are persisted for the lifetime of the API server process. A server restart restores defaults.</li>
          <li>· "Reset to Defaults" immediately restores all weights to their factory values and clears provenance records.</li>
          <li>· This panel is a static operator surface only — no automated RL tuning or telemetry feedback loop.</li>
        </ul>
      </div>
    </Layout>
  );
}
