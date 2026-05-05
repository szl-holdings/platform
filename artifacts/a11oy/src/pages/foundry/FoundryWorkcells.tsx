import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

interface Workcell {
  id: string;
  name: string;
  recipe: string;
  model: string;
  domain: string;
  tier: 'standard' | 'elevated' | 'sovereign';
  status: 'healthy' | 'degraded' | 'stopped';
  uptime: string;
  p50Latency: number;
  p99Latency: number;
  callsToday: number;
  tokenCost: number;
  covenantLift: number;
  correlationId: string;
  protocols: string[];
}

const WORKCELLS: Workcell[] = [
  { id: 'wc-1', name: 'Cascade-Prod-1', recipe: 'Cascade Navigator v4.2', model: 'GPT-5.1', domain: 'Maritime', tier: 'elevated', status: 'healthy', uptime: '99.97%', p50Latency: 840, p99Latency: 2100, callsToday: 3421, tokenCost: 128.40, covenantLift: 42000, correlationId: 'a11oy-wc-c1-prod', protocols: ['REST', 'A2A'] },
  { id: 'wc-2', name: 'Cascade-Prod-2', recipe: 'Cascade Navigator v4.2', model: 'GPT-5.1', domain: 'Maritime', tier: 'elevated', status: 'healthy', uptime: '99.94%', p50Latency: 860, p99Latency: 2200, callsToday: 2891, tokenCost: 108.20, covenantLift: 38000, correlationId: 'a11oy-wc-c2-prod', protocols: ['REST', 'A2A'] },
  { id: 'wc-3', name: 'Cascade-Staging', recipe: 'Cascade Navigator v4.2', model: 'GPT-5.1', domain: 'Maritime', tier: 'elevated', status: 'healthy', uptime: '99.80%', p50Latency: 920, p99Latency: 2500, callsToday: 421, tokenCost: 15.80, covenantLift: 8000, correlationId: 'a11oy-wc-c3-stg', protocols: ['REST'] },
  { id: 'wc-4', name: 'Counsel-Prod-1', recipe: 'Counsel Sentinel v2.1', model: 'Claude 4 Opus', domain: 'Legal', tier: 'sovereign', status: 'healthy', uptime: '100%', p50Latency: 2400, p99Latency: 5800, callsToday: 892, tokenCost: 89.20, covenantLift: 125000, correlationId: 'a11oy-wc-cs1-prod', protocols: ['REST'] },
  { id: 'wc-5', name: 'Counsel-Prod-2', recipe: 'Counsel Sentinel v2.1', model: 'Claude 4 Opus', domain: 'Legal', tier: 'sovereign', status: 'healthy', uptime: '100%', p50Latency: 2600, p99Latency: 6100, callsToday: 741, tokenCost: 74.10, covenantLift: 108000, correlationId: 'a11oy-wc-cs2-prod', protocols: ['REST'] },
  { id: 'wc-6', name: 'Guardian-NOC-1', recipe: 'Guardian v5.0', model: 'o4-mini', domain: 'Security', tier: 'elevated', status: 'healthy', uptime: '99.99%', p50Latency: 380, p99Latency: 940, callsToday: 18421, tokenCost: 92.10, covenantLift: 280000, correlationId: 'a11oy-wc-g1-prod', protocols: ['REST', 'A2A', 'ACP'] },
  { id: 'wc-7', name: 'Guardian-NOC-2', recipe: 'Guardian v5.0', model: 'o4-mini', domain: 'Security', tier: 'elevated', status: 'degraded', uptime: '98.20%', p50Latency: 420, p99Latency: 1800, callsToday: 14200, tokenCost: 71.00, covenantLift: 210000, correlationId: 'a11oy-wc-g2-prod', protocols: ['REST', 'A2A'] },
];

const TIER_COLORS = {
  standard: { bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a' },
  elevated: { bg: 'rgba(201,183,135,0.12)', color: GOLD },
  sovereign: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
};

const STATUS_COLORS = {
  healthy: '#22c55e',
  degraded: GOLD,
  stopped: '#f87171',
};

export function FoundryWorkcells() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const filtered = WORKCELLS.filter(w => filter === 'all' || w.status === filter || w.tier === filter || w.domain.toLowerCase() === filter.toLowerCase());

  const totalCalls = WORKCELLS.reduce((s, w) => s + w.callsToday, 0);
  const totalCost = WORKCELLS.reduce((s, w) => s + w.tokenCost, 0);
  const totalLift = WORKCELLS.reduce((s, w) => s + w.covenantLift, 0);
  const healthy = WORKCELLS.filter(w => w.status === 'healthy').length;

  const wc = selected ? WORKCELLS.find(w => w.id === selected) : null;

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / WORKCELLS"
        title="Live Workcell Instances"
        subtitle="Each Workcell is a live instance of an Agent Recipe. Monitor latency, token cost, and Covenant Lift $ — harm avoided in real dollars — across all running instances."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="WORKCELLS" value={String(WORKCELLS.length)} sub={`${healthy} healthy`} accent={GOLD} />
        <KpiCard label="CALLS TODAY" value={totalCalls.toLocaleString()} sub="across all cells" accent={GOLD} />
        <KpiCard label="TOKEN COST" value={`$${totalCost.toFixed(0)}`} sub="today" accent={GOLD} />
        <KpiCard label="COVENANT LIFT $" value={`$${(totalLift / 1000).toFixed(0)}k`} sub="harm avoided today" accent="#22c55e" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'healthy', 'degraded', 'elevated', 'sovereign', 'Maritime', 'Legal', 'Security'].map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
            style={{ background: filter === f ? 'rgba(201,183,135,0.12)' : 'transparent', color: filter === f ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filter === f ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(w => {
            const tier = TIER_COLORS[w.tier];
            const isSelected = selected === w.id;
            return (
              <div key={w.id} className="rounded-lg border p-4 cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: isSelected ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}
                onClick={() => setSelected(isSelected ? null : w.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--color-a11oy-text)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[w.status] }} />
                      {w.name}
                    </div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{w.recipe} · {w.model}</div>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: tier.bg, color: tier.color }}>{w.tier}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>p50</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{w.p50Latency}ms</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>p99</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{w.p99Latency}ms</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>calls</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{w.callsToday.toLocaleString()}</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>uptime</div><div style={{ color: w.uptime === '100%' ? '#22c55e' : GOLD }}>{w.uptime}</div></div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          {wc ? (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Workcell Detail</div>
              <div className="font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{wc.name}</div>
              <div className="text-xs font-mono mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wc.correlationId}</div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Recipe</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{wc.recipe}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Model</span>
                  <span style={{ color: GOLD }}>{wc.model}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Protocols</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{wc.protocols.join(', ')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Token Cost Today</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>${wc.tokenCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Covenant Lift $</span>
                  <span style={{ color: '#22c55e' }}>${wc.covenantLift.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Harm-Avoided ROI</span>
                  <span style={{ color: '#22c55e' }}>{Math.round(wc.covenantLift / wc.tokenCost)}x</span>
                </div>
              </div>
              <div className="mt-4 p-2 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
                Correlation ID: {wc.correlationId}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" className="flex-1 py-1.5 rounded text-xs font-mono"
                  style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer' }}>
                  Pause Workcell
                </button>
                <button type="button" className="flex-1 py-1.5 rounded text-xs font-mono"
                  style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
                  View Proof Chain
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <div className="text-2xl mb-2">⚙</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a Workcell to inspect its correlation ID, Covenant Lift $, and proof chain.</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
