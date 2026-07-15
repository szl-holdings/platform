import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import {
  VERTICALS,
  DOMAIN_TWINS,
  GOVERNANCE_COLORS,
  type VerticalId,
  type DomainTwin,
} from '../../data/fabric';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

export function DomainTwins() {
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'health' | 'signals' | 'risks'>('health');
  const [drawerTwin, setDrawerTwin] = useState<DomainTwin | null>(null);

  const filtered =
    verticalFilter === 'all'
      ? [...DOMAIN_TWINS]
      : DOMAIN_TWINS.filter((t) => t.verticalId === verticalFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'health') return b.healthScore - a.healthScore;
    if (sortBy === 'signals') return b.signalVolume - a.signalVolume;
    return b.activeRisks - a.activeRisks;
  });

  const avgHealth = Math.round(
    DOMAIN_TWINS.reduce((s, t) => s + t.healthScore, 0) / DOMAIN_TWINS.length,
  );

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · DOMAIN TWINS"
        title="Domain Command Twins"
        subtitle="A Domain Command Twin is a structured operational model of a vertical: entities, signals, workflows, risks, decisions, approvals, outcomes, evidence, and policies."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TWINS" value={DOMAIN_TWINS.length} sub="operational" accent={GOLD} />
        <KpiCard label="AVG HEALTH" value={`${avgHealth}%`} sub="across twins" accent={GOLD} />
        <KpiCard
          label="TOTAL SIGNALS"
          value={DOMAIN_TWINS.reduce((s, t) => s + t.signalVolume, 0)}
          sub="ingested"
          accent={GOLD}
        />
        <KpiCard
          label="OPEN APPROVALS"
          value={DOMAIN_TWINS.reduce((s, t) => s + t.openApprovals, 0)}
          sub="pending review"
          accent="#f59e0b"
        />
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>
            VERTICAL
          </span>
          <button
            onClick={() => setVerticalFilter('all')}
            className="text-[10px] font-mono px-2 py-1 rounded"
            style={{
              backgroundColor: verticalFilter === 'all' ? `${GOLD}18` : 'transparent',
              color: verticalFilter === 'all' ? GOLD : GHOST,
              border: `1px solid ${verticalFilter === 'all' ? `${GOLD}40` : 'transparent'}`,
            }}
          >
            ALL
          </button>
          {VERTICALS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVerticalFilter(v.id)}
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{
                backgroundColor: verticalFilter === v.id ? `${GOLD}18` : 'transparent',
                color: verticalFilter === v.id ? GOLD : GHOST,
                border: `1px solid ${verticalFilter === v.id ? `${GOLD}40` : 'transparent'}`,
              }}
            >
              {v.icon} {v.name.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>
            SORT
          </span>
          {(['health', 'signals', 'risks'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="text-[10px] font-mono px-2 py-1 rounded"
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

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {sorted.map((twin) => {
          const v = VERTICALS.find((vt) => vt.id === twin.verticalId);
          return (
            <div
              key={twin.id}
              className="rounded-lg border p-5 cursor-pointer transition-all hover:border-[#c9b787]"
              onClick={() => setDrawerTwin(drawerTwin?.id === twin.id ? null : twin)}
              style={{
                backgroundColor: SURFACE,
                borderColor: drawerTwin?.id === twin.id ? GOLD : BORDER,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ color: v?.colorToken ?? GOLD, fontSize: '1.1rem' }}>
                    {v?.icon}
                  </span>
                  <span className="font-semibold" style={{ color: TEXT }}>
                    {twin.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${GOVERNANCE_COLORS[twin.sentraGovernanceState]}18`,
                    color: GOVERNANCE_COLORS[twin.sentraGovernanceState],
                  }}
                >
                  {twin.sentraGovernanceState.toUpperCase()}
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: SUB }}>
                {twin.description}
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: GOLD }}>
                    {twin.healthScore}%
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                    Health
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: TEXT }}>
                    {twin.signalVolume}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                    Signals
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{ color: twin.activeRisks > 15 ? '#f59e0b' : TEXT }}
                  >
                    {twin.activeRisks}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                    Risks
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <span style={{ color: GHOST }}>Decisions</span>{' '}
                  <span style={{ color: TEXT }}>{twin.pendingDecisions}</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Approvals</span>{' '}
                  <span style={{ color: twin.openApprovals > 4 ? '#f59e0b' : TEXT }}>
                    {twin.openApprovals}
                  </span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Evidence</span>{' '}
                  <span style={{ color: TEXT }}>{twin.evidenceCompleteness}%</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Proof Chain</span>{' '}
                  <span style={{ color: TEXT }}>{twin.proofChainCoverage}%</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Chainlight</span>{' '}
                  <span style={{ color: GOLD }}>{twin.chainlightConfidence}</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Velocity</span>{' '}
                  <span style={{ color: TEXT }}>{twin.outcomeVelocity}</span>
                </div>
              </div>
              <div className="mt-3 text-[10px] font-mono" style={{ color: GHOST }}>
                Argo: {twin.argoLearningStatus}
              </div>
            </div>
          );
        })}
      </div>

      {drawerTwin && (
        <div
          className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto"
          style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-lg" style={{ color: TEXT }}>
                {drawerTwin.name}
              </span>
              <button
                onClick={() => setDrawerTwin(null)}
                className="text-sm font-mono px-3 py-1 rounded"
                style={{ color: GHOST, border: `1px solid ${BORDER}` }}
              >
                Close
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: SUB }}>
              {drawerTwin.description}
            </p>

            <SectionTitle>Top Signals</SectionTitle>
            <div className="flex flex-col gap-1 mb-4">
              {drawerTwin.topSignals.map((s, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: SUB }}
                >
                  {s}
                </div>
              ))}
            </div>

            <SectionTitle>Top Risks</SectionTitle>
            <div className="flex flex-col gap-1 mb-4">
              {drawerTwin.topRisks.map((r, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: SUB }}
                >
                  {r}
                </div>
              ))}
            </div>

            <SectionTitle>Next Best Actions</SectionTitle>
            <div className="flex flex-col gap-1 mb-4">
              {drawerTwin.nextBestActions.map((a, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded flex items-center gap-2"
                  style={{ backgroundColor: `${GOLD}08`, color: TEXT }}
                >
                  <span style={{ color: GOLD }}>→</span> {a}
                </div>
              ))}
            </div>

            <SectionTitle>Governance States</SectionTitle>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Card>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  TENAX
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: GOVERNANCE_COLORS[drawerTwin.sentraGovernanceState] }}
                >
                  {drawerTwin.sentraGovernanceState.toUpperCase()}
                </div>
              </Card>
              <Card>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  PSYCHE
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: GOVERNANCE_COLORS[drawerTwin.psycheGovernanceState] }}
                >
                  {drawerTwin.psycheGovernanceState.toUpperCase()}
                </div>
              </Card>
            </div>

            <SectionTitle>Linked Routes</SectionTitle>
            <div className="flex flex-wrap gap-1">
              {drawerTwin.linkedRoutes.map((r) => (
                <span
                  key={r}
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${GOLD}10`, color: GOLD }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
