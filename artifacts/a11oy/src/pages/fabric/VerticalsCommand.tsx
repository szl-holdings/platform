import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { GOVERNANCE_COLORS, SEVERITY_COLORS } from '../../data/fabric';
import type { VerticalId, MaturityStage } from '../../data/fabric';
import { useFabricData } from '../../hooks/useFabricData';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

export function VerticalsCommand() {
  const { data, loading, error } = useFabricData();
  const [maturityFilter, setMaturityFilter] = useState<MaturityStage | 'all'>('all');
  const [sortBy, setSortBy] = useState<'health' | 'name' | 'signals'>('health');
  const [drawerVertical, setDrawerVertical] = useState<VerticalId | null>(null);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <span className="text-sm font-mono" style={{ color: GHOST }}>Loading verticals…</span>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="flex items-center justify-center h-64 flex-col gap-2">
        <span className="text-sm font-mono" style={{ color: '#ef4444' }}>Failed to load verticals</span>
        <span className="text-xs font-mono" style={{ color: GHOST }}>{error}</span>
      </div>
    </Layout>
  );

  const { verticals, twins, signals, risks, evidence } = data;

  const filtered = verticals.filter(v => maturityFilter === 'all' || v.maturityStage === maturityFilter);
  const sorted = [...filtered].sort((a, b) => {
    const ta = twins.find(t => t.verticalId === a.id);
    const tb = twins.find(t => t.verticalId === b.id);
    if (sortBy === 'health') return (tb?.healthScore ?? 0) - (ta?.healthScore ?? 0);
    if (sortBy === 'signals') return (tb?.signalVolume ?? 0) - (ta?.signalVolume ?? 0);
    return a.name.localeCompare(b.name);
  });

  const drawerV = drawerVertical ? verticals.find(v => v.id === drawerVertical) : null;
  const drawerTwin = drawerVertical ? twins.find(t => t.verticalId === drawerVertical) : null;

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · VERTICALS"
        title="Verticals Command"
        subtitle="All vertical profiles as command domains. Each vertical keeps its domain identity — A11oy gives them shared intelligence."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="VERTICALS" value={verticals.length} sub="fully configured" accent={GOLD} />
        <KpiCard label="TOTAL SIGNALS" value={signals.length} sub="cross-vertical" accent={GOLD} />
        <KpiCard label="OPEN RISKS" value={risks.filter(r => r.status === 'open').length} sub="across verticals" accent="#f59e0b" />
        <KpiCard label="EVIDENCE" value={evidence.length} sub="records anchored" accent={GOLD} />
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>MATURITY</span>
          {(['all', 'seed', 'operational', 'scaling', 'enterprise'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMaturityFilter(m)}
              className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: maturityFilter === m ? `${GOLD}18` : 'transparent',
                color: maturityFilter === m ? GOLD : GHOST,
                border: `1px solid ${maturityFilter === m ? `${GOLD}40` : 'transparent'}`,
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>SORT</span>
          {(['health', 'signals', 'name'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: sortBy === s ? `${GOLD}18` : 'transparent',
                color: sortBy === s ? GOLD : GHOST,
                border: `1px solid ${sortBy === s ? `${GOLD}40` : 'transparent'}`,
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {sorted.map(v => {
          const twin = twins.find(t => t.verticalId === v.id);
          const sigCount = signals.filter(s => s.verticalId === v.id).length;
          const riskCount = risks.filter(r => r.verticalId === v.id && r.status === 'open').length;
          const evCount = evidence.filter(e => e.verticalId === v.id).length;
          return (
            <div
              key={v.id}
              className="rounded-lg border p-4 cursor-pointer transition-all hover:border-[#c9b787]"
              onClick={() => setDrawerVertical(drawerVertical === v.id ? null : v.id)}
              style={{ backgroundColor: SURFACE, borderColor: drawerVertical === v.id ? GOLD : BORDER, borderTop: `3px solid ${v.colorToken}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: v.colorToken, fontSize: '1.1rem' }}>{v.icon}</span>
                  <span className="font-semibold text-sm" style={{ color: TEXT }}>{v.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: SUB }}>
                  {v.maturityStage.toUpperCase()}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: GHOST }}>{v.tagline}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-3">
                <div><span style={{ color: GHOST }}>Health</span> <span style={{ color: TEXT }}>{twin?.healthScore ?? 0}%</span></div>
                <div><span style={{ color: GHOST }}>Signals</span> <span style={{ color: TEXT }}>{sigCount}</span></div>
                <div><span style={{ color: GHOST }}>Risks</span> <span style={{ color: riskCount > 8 ? '#f59e0b' : TEXT }}>{riskCount}</span></div>
                <div><span style={{ color: GHOST }}>Evidence</span> <span style={{ color: TEXT }}>{evCount}</span></div>
                <div><span style={{ color: GHOST }}>Velocity</span> <span style={{ color: TEXT }}>{twin?.outcomeVelocity ?? 0}</span></div>
                <div><span style={{ color: GHOST }}>Governance</span> <span style={{ color: GOVERNANCE_COLORS[twin?.sentraGovernanceState ?? 'green'] }}>{twin?.sentraGovernanceState?.toUpperCase()}</span></div>
              </div>
              <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                A11oy layers: {v.connectedA11oyLayers.slice(0, 3).join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      {drawerV && drawerTwin && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto" style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span style={{ color: drawerV.colorToken, fontSize: '1.3rem' }}>{drawerV.icon}</span>
                <span className="font-semibold text-lg" style={{ color: TEXT }}>{drawerV.name}</span>
              </div>
              <button onClick={() => setDrawerVertical(null)} className="text-sm font-mono px-3 py-1 rounded" style={{ color: GHOST, border: `1px solid ${BORDER}` }}>
                Close
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: SUB }}>{drawerV.tagline}</p>
            <p className="text-xs mb-4" style={{ color: GHOST }}>{drawerV.operatingModel}</p>

            <SectionTitle>Domain Command Twin — {drawerTwin.name}</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card><div className="text-[10px] font-mono" style={{ color: GHOST }}>Health</div><div className="text-lg font-bold" style={{ color: GOLD }}>{drawerTwin.healthScore}%</div></Card>
              <Card><div className="text-[10px] font-mono" style={{ color: GHOST }}>Signals</div><div className="text-lg font-bold" style={{ color: TEXT }}>{drawerTwin.signalVolume}</div></Card>
              <Card><div className="text-[10px] font-mono" style={{ color: GHOST }}>Active Risks</div><div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{drawerTwin.activeRisks}</div></Card>
              <Card><div className="text-[10px] font-mono" style={{ color: GHOST }}>Chainlight</div><div className="text-lg font-bold" style={{ color: GOLD }}>{drawerTwin.chainlightConfidence}</div></Card>
            </div>

            <SectionTitle>Innovation Seed</SectionTitle>
            <Card className="mb-4">
              <div className="text-sm font-medium mb-1" style={{ color: GOLD }}>{drawerV.innovationSeed.name}</div>
              <p className="text-xs mb-2" style={{ color: SUB }}>{drawerV.innovationSeed.description}</p>
              <p className="text-[10px]" style={{ color: GHOST }}>{drawerV.innovationSeed.researchBasis}</p>
              <div className="mt-2 text-[10px] font-mono" style={{ color: GOLD }}>Capability: {drawerV.innovationSeed.capability}</div>
            </Card>

            <SectionTitle>Top Signals</SectionTitle>
            <div className="flex flex-col gap-1 mb-4">
              {drawerTwin.topSignals.map((s, i) => (
                <div key={i} className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: SUB }}>{s}</div>
              ))}
            </div>

            <SectionTitle>Top Risks</SectionTitle>
            <div className="flex flex-col gap-1 mb-4">
              {drawerTwin.topRisks.map((r, i) => (
                <div key={i} className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: SUB }}>{r}</div>
              ))}
            </div>

            <SectionTitle>Next Best Actions</SectionTitle>
            <div className="flex flex-col gap-1 mb-4">
              {drawerTwin.nextBestActions.map((a, i) => (
                <div key={i} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: `${GOLD}08`, color: TEXT }}>
                  <span style={{ color: GOLD }}>→</span> {a}
                </div>
              ))}
            </div>

            <SectionTitle>Core Entities</SectionTitle>
            <div className="flex flex-wrap gap-1 mb-4">
              {drawerV.coreEntities.map(e => (
                <span key={e} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: SUB }}>{e}</span>
              ))}
            </div>

            <SectionTitle>Key Metrics</SectionTitle>
            <div className="flex flex-wrap gap-1 mb-4">
              {drawerV.keyMetrics.map(m => (
                <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${GOLD}10`, color: GOLD }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
