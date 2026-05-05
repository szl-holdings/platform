import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

const METRICS_30D = [
  { day: 'Apr 6', calls: 42100, tokenCost: 168, lift: 48000, p50: 820 },
  { day: 'Apr 13', calls: 48200, tokenCost: 192, lift: 55000, p50: 840 },
  { day: 'Apr 20', calls: 51800, tokenCost: 207, lift: 61000, p50: 810 },
  { day: 'Apr 27', calls: 56400, tokenCost: 225, lift: 68000, p50: 800 },
  { day: 'May 5', calls: 62100, tokenCost: 248, lift: 74000, p50: 795 },
];

const CORRELATION_EVENTS = [
  { id: 'ce-1', ts: '2026-05-05T09:01:42Z', correlationId: 'a11oy-wc-c1-prod:4421', protocol: 'A2A', model: 'GPT-5.1', domain: 'Maritime', latency: 842, tokenCost: 0.042, covenantLift: 42000, result: 'approved' },
  { id: 'ce-2', ts: '2026-05-05T08:58:12Z', correlationId: 'a11oy-wc-cs1-prod:7821', protocol: 'REST', model: 'Claude 4 Opus', domain: 'Legal', latency: 2410, tokenCost: 0.124, covenantLift: 125000, result: 'approved' },
  { id: 'ce-3', ts: '2026-05-05T08:55:01Z', correlationId: 'a11oy-wc-g1-prod:9023', protocol: 'ACP', model: 'o4-mini', domain: 'Security', latency: 381, tokenCost: 0.005, covenantLift: 280000, result: 'auto-executed' },
  { id: 'ce-4', ts: '2026-05-05T08:52:44Z', correlationId: 'a11oy-wc-c2-prod:4289', protocol: 'A2A', model: 'GPT-5.1', domain: 'Maritime', latency: 901, tokenCost: 0.038, covenantLift: 38000, result: 'approved' },
  { id: 'ce-5', ts: '2026-05-05T08:48:33Z', correlationId: 'sv-1:0048', protocol: 'local', model: 'Llama 4 Maverick', domain: 'Defense', latency: 1240, tokenCost: 0.000, covenantLift: 190000, result: 'auto-executed' },
];

const PROTOCOL_BREAKDOWN = [
  { protocol: 'REST', calls: 24800, share: 40 },
  { protocol: 'A2A', calls: 18600, share: 30 },
  { protocol: 'ACP', calls: 12400, share: 20 },
  { protocol: 'MCP', calls: 4960, share: 8 },
  { protocol: 'ANP', calls: 1240, share: 2 },
];

const RESULT_COLORS: Record<string, string> = {
  approved: '#22c55e',
  'auto-executed': GOLD,
  blocked: '#f87171',
  pending: '#8a8a8a',
};

export function FoundryMonitoring() {
  const [activeTab, setActiveTab] = useState<'overview' | 'correlation' | 'protocols'>('overview');
  const [searchCorr, setSearchCorr] = useState('');

  const filteredEvents = CORRELATION_EVENTS.filter(e =>
    searchCorr === '' || [e.correlationId, e.domain, e.model, e.protocol].join(' ').toLowerCase().includes(searchCorr.toLowerCase())
  );

  const totalCalls = METRICS_30D[METRICS_30D.length - 1].calls;
  const totalLift = METRICS_30D.reduce((s, m) => s + m.lift, 0);
  const totalCost = METRICS_30D.reduce((s, m) => s + m.tokenCost, 0);
  const avgLatency = Math.round(METRICS_30D.reduce((s, m) => s + m.p50, 0) / METRICS_30D.length);

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / MONITORING"
        title="Foundry Monitoring"
        subtitle="Latency, cost in tokens AND Covenant Lift $, cross-protocol correlation IDs, provider health, and fallback events — all in one view."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="CALLS (TODAY)" value={totalCalls.toLocaleString()} sub="all workcells" accent={GOLD} />
        <KpiCard label="AVG P50 LATENCY" value={`${avgLatency}ms`} sub="30-day average" accent={GOLD} />
        <KpiCard label="TOKEN COST (30D)" value={`$${totalCost}`} sub="all providers" accent={GOLD} />
        <KpiCard label="COVENANT LIFT $ (30D)" value={`$${(totalLift / 1000).toFixed(0)}k`} sub="harm-avoided dollars" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['overview', 'correlation', 'protocols'] as const).map(t => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-colors"
            style={{ background: activeTab === t ? 'rgba(201,183,135,0.12)' : 'transparent', color: activeTab === t ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${activeTab === t ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
            {t === 'overview' ? 'Overview' : t === 'correlation' ? 'Correlation IDs' : 'Protocol Breakdown'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>30-Day Call Volume & Covenant Lift $</div>
            <div className="space-y-3">
              {METRICS_30D.map(m => {
                const maxLift = Math.max(...METRICS_30D.map(x => x.lift));
                return (
                  <div key={m.day} className="flex items-center gap-3 text-xs">
                    <div className="w-16 shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{m.day}</div>
                    <div className="flex-1">
                      <div className="h-5 rounded flex items-center overflow-hidden" style={{ backgroundColor: 'rgba(201,183,135,0.06)' }}>
                        <div className="h-full rounded" style={{ width: `${(m.lift / maxLift) * 100}%`, backgroundColor: 'rgba(34,197,94,0.4)' }} />
                      </div>
                    </div>
                    <div className="w-20 text-right" style={{ color: '#22c55e' }}>${(m.lift / 1000).toFixed(0)}k lift</div>
                    <div className="w-16 text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>${m.tokenCost} cost</div>
                    <div className="w-12 text-right" style={{ color: GOLD }}>{m.p50}ms</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Covenant Lift $ Explained</div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              Covenant Lift $ measures the difference between what a governed agent achieves vs. a Helpful-Only Shadow Twin running without governance. Each dollar represents estimated harm avoided — cost savings from prevented policy violations, regulatory fines, or operational errors.
            </p>
            <div className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}>
              <div className="font-mono" style={{ color: '#22c55e' }}>ROI: ${(totalLift / totalCost).toFixed(0)} Covenant Lift $ per $1 token spend (30d)</div>
              <div className="mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Microsoft Foundry bills in tokens only. A11oy Foundry also bills in harm-avoided dollars, giving you a true ROI view on governed AI spend.</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'correlation' && (
        <div className="space-y-4">
          <input
            type="text"
            value={searchCorr}
            onChange={e => setSearchCorr(e.target.value)}
            placeholder="Search by correlation ID, domain, model, or protocol…"
            className="w-full px-3 py-2 rounded-lg text-xs border bg-transparent outline-none"
            style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
          />
          <div className="space-y-2">
            {filteredEvents.map(e => (
              <div key={e.id} className="rounded-lg border p-3"
                style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-mono text-xs" style={{ color: GOLD }}>{e.correlationId}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {new Date(e.ts).toLocaleTimeString()} · {e.model} · {e.domain}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>{e.protocol}</span>
                    <span className="text-xs font-mono" style={{ color: RESULT_COLORS[e.result] ?? GOLD }}>{e.result}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Latency: </span><span style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.latency}ms</span></div>
                  <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Token cost: </span><span style={{ color: 'var(--color-a11oy-text-sub)' }}>${e.tokenCost.toFixed(3)}</span></div>
                  <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Covenant Lift: </span><span style={{ color: '#22c55e' }}>${e.covenantLift.toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'protocols' && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Cross-Protocol Breakdown (today)</div>
          <div className="space-y-3">
            {PROTOCOL_BREAKDOWN.map(p => (
              <div key={p.protocol} className="flex items-center gap-3 text-xs">
                <div className="w-12 font-mono" style={{ color: '#22c55e' }}>{p.protocol}</div>
                <div className="flex-1">
                  <div className="h-5 rounded overflow-hidden" style={{ backgroundColor: 'rgba(201,183,135,0.06)' }}>
                    <div className="h-full rounded transition-all" style={{ width: `${p.share}%`, backgroundColor: 'rgba(201,183,135,0.3)' }} />
                  </div>
                </div>
                <div className="w-20 text-right" style={{ color: GOLD }}>{p.calls.toLocaleString()}</div>
                <div className="w-12 text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.share}%</div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
            <div className="font-mono mb-1" style={{ color: GOLD }}>Cross-Protocol Correlation IDs</div>
            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              Every agent call — regardless of protocol (REST / A2A / ACP / MCP / ANP) — is assigned a correlation ID with the format <span style={{ color: GOLD }}>a11oy-wc-{'<'}cell{'>'}:{'<'}seq{'>'}</span>. This allows end-to-end tracing across protocol boundaries, unlike Microsoft Foundry which only tracks calls within a single protocol.
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
}
