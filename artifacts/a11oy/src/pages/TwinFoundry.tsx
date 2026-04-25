import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const API = '/api/a11oy';

interface BusinessTwin {
  id: string; name: string; type: string; tenant: string; domain: string;
  fidelity: number; driftScore: number; riskLevel: string; owner: string;
  lastSync: string; signals: number; activeWorkcells: number; proofCoverage: number;
  recommendedAction: string; state: Record<string, unknown>;
}

interface TwinsData {
  twins: BusinessTwin[];
  summary: { total: number; byRisk: Record<string, number>; byType: Record<string, number>; avgDriftScore: number; avgProofCoverage: number };
}

const RISK_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };

function DriftBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 rounded-full flex-1" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: score > 40 ? '#ef4444' : score > 20 ? '#f59e0b' : '#10b981' }} />
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{score}</span>
    </div>
  );
}

export function TwinFoundry() {
  const [data, setData] = useState<TwinsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BusinessTwin | null>(null);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetch(`${API}/twins/sovereign`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function simulate(twin: BusinessTwin) {
    setSimLoading(true);
    setSimResult(null);
    fetch(`${API}/twins/sovereign/${twin.id}/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'no_action_vs_approved_action' }) })
      .then(r => r.json())
      .then(d => { if (d.ok) setSimResult(d.data); })
      .catch(() => {})
      .finally(() => setSimLoading(false));
  }

  const twinTypes = data ? [...new Set(data.twins.map(t => t.type))] : [];
  const filtered = data?.twins.filter(t =>
    (filterRisk === 'all' || t.riskLevel === filterRisk) &&
    (filterType === 'all' || t.type === filterType)
  ) ?? [];

  return (
    <Layout>
      <PageHeader
        label="TWIN FOUNDRY"
        title="Business Twin Registry"
        subtitle="Every enterprise asset, deal, vessel, matter, and incident has a live digital twin — continuously synchronized, drift-scored, and simulation-ready."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading twin registry…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard label="BUSINESS TWINS" value={String(data.summary.total)} sub="All tenants" accent="#8b5cf6" />
            <KpiCard label="HIGH / CRITICAL" value={String((data.summary.byRisk.high ?? 0) + (data.summary.byRisk.critical ?? 0))} sub="Risk exposure" accent="#ef4444" />
            <KpiCard label="AVG DRIFT SCORE" value={String(data.summary.avgDriftScore)} sub="0=stable · 100=severe" accent="#f59e0b" />
            <KpiCard label="AVG PROOF COVERAGE" value={`${data.summary.avgProofCoverage}%`} sub="Across all twins" accent="#10b981" />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Risk:</span>
            {['all', 'critical', 'high', 'medium', 'low'].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterRisk === r ? 'rgba(59,130,246,0.2)' : 'var(--color-a11oy-muted)', color: filterRisk === r ? '#3b82f6' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterRisk === r ? 'rgba(59,130,246,0.4)' : 'var(--color-a11oy-border)'}` }}>
                {r}
              </button>
            ))}
            <span className="text-xs ml-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Type:</span>
            {['all', ...twinTypes.slice(0, 5)].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterType === t ? 'rgba(139,92,246,0.2)' : 'var(--color-a11oy-muted)', color: filterType === t ? '#8b5cf6' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterType === t ? 'rgba(139,92,246,0.4)' : 'var(--color-a11oy-border)'}` }}>
                {t === 'all' ? 'all' : t}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SectionTitle>Twins ({filtered.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
                {filtered.map(twin => (
                  <Card key={twin.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === twin.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => { setSelected(twin); setSimResult(null); }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{twin.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{twin.type} · {twin.domain} · {twin.tenant}</div>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ color: RISK_COLORS[twin.riskLevel], backgroundColor: `${RISK_COLORS[twin.riskLevel]}18` }}>
                        {twin.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>fidelity</div><div style={{ color: '#10b981' }}>{twin.fidelity}%</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>drift</div><DriftBar score={twin.driftScore} /></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>signals</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{twin.signals}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>proof</div><div style={{ color: twin.proofCoverage >= 80 ? '#10b981' : '#f59e0b' }}>{twin.proofCoverage}%</div></div>
                    </div>
                    {twin.activeWorkcells > 0 && (
                      <div className="text-xs" style={{ color: '#8b5cf6' }}>⬡ {twin.activeWorkcells} active workcell{twin.activeWorkcells > 1 ? 's' : ''}</div>
                    )}
                    <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>→ {twin.recommendedAction}</div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              {selected ? (
                <>
                  <SectionTitle>Twin Detail</SectionTitle>
                  <Card>
                    <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selected.name}</div>
                    <div className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.type} · {selected.owner}</div>

                    <div className="space-y-2 text-xs mb-4">
                      {Object.entries(selected.state).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-2">
                          <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-right" style={{ color: 'var(--color-a11oy-text-sub)' }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs p-2 rounded mb-4" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: '#f59e0b' }}>
                      → {selected.recommendedAction}
                    </div>

                    <button
                      onClick={() => simulate(selected)}
                      disabled={simLoading}
                      className="w-full text-xs py-2 rounded font-medium"
                      style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', opacity: simLoading ? 0.6 : 1 }}
                    >
                      {simLoading ? 'Simulating…' : 'Run No-Action vs. Approved-Action'}
                    </button>

                    {simResult && (
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <div className="font-medium mb-1" style={{ color: '#ef4444' }}>No Action</div>
                          <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{(simResult.noAction as Record<string, unknown>)?.projectedImpact as string}</div>
                        </div>
                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div className="font-medium mb-1" style={{ color: '#10b981' }}>Approved Action</div>
                          <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{(simResult.approvedAction as Record<string, unknown>)?.projectedImpact as string}</div>
                          <div className="mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Est. resolution: {(simResult.approvedAction as Record<string, unknown>)?.estimatedResolution as string}</div>
                        </div>
                      </div>
                    )}
                  </Card>

                  <div className="mt-3">
                    <SectionTitle>Twin Type Distribution</SectionTitle>
                    <div className="flex flex-col gap-1">
                      {Object.entries(data!.summary.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-xs">
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{type}</span>
                          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <SectionTitle>Risk Distribution</SectionTitle>
                  <Card>
                    {Object.entries(data.summary.byRisk).map(([risk, count]) => (
                      <div key={risk} className="flex items-center justify-between text-xs mb-2">
                        <span style={{ color: RISK_COLORS[risk] }}>{risk.toUpperCase()}</span>
                        <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{count} twins</span>
                      </div>
                    ))}
                    <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a twin to view detail and run simulation.</div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Twin registry unavailable.</div>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Demo mode — twins are seeded. Simulations are deterministic. No workcell created until human approved.
      </div>
    </Layout>
  );
}
