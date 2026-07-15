import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import {
  VERTICALS,
  DOMAIN_TWINS,
  FABRIC_SIGNALS,
  FABRIC_RISKS,
  FABRIC_DECISIONS,
  deriveFabricKpis,
  rankRisksByScore,
  rankSignalsBySeverity,
  SEVERITY_COLORS,
  GOVERNANCE_COLORS,
  type VerticalId,
} from '../../data/fabric';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const GOLD = '#c9b787';
const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';

export function FabricCockpit() {
  const kpis = deriveFabricKpis();
  const topRisks = rankRisksByScore(FABRIC_RISKS).slice(0, 8);
  const latestSignals = rankSignalsBySeverity(FABRIC_SIGNALS).slice(0, 8);
  const pendingDecs = FABRIC_DECISIONS.filter(
    (d) => d.status === 'draft' || d.status === 'awaiting_review',
  ).slice(0, 6);
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);

  return (
    <Layout>
      <PageHeader
        label="A11OY COMMAND FABRIC"
        title="Universal Intelligence Layer"
        subtitle="One intelligence layer across every vertical. Signals become risks, risks become decisions, decisions become outcomes, outcomes become memory."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="VERTICAL HEALTH"
          value={`${kpis.verticalHealth}%`}
          sub="avg across 7 verticals"
          accent={GOLD}
        />
        <KpiCard
          label="ACTIVE SIGNALS"
          value={kpis.activeSignals}
          sub="new + triaged"
          accent={GOLD}
        />
        <KpiCard
          label="OPEN RISKS"
          value={kpis.openRisks}
          sub="open + mitigating"
          accent="#f59e0b"
        />
        <KpiCard
          label="PENDING DECISIONS"
          value={kpis.pendingDecisions}
          sub="awaiting review"
          accent={GOLD}
        />
        <KpiCard
          label="APPROVAL QUEUE"
          value={kpis.approvalQueue}
          sub="across verticals"
          accent={GOLD}
        />
        <KpiCard
          label="EVIDENCE"
          value={`${kpis.evidenceCompleteness}%`}
          sub="completeness"
          accent={GOLD}
        />
        <KpiCard
          label="OUTCOME VELOCITY"
          value={kpis.outcomeVelocity}
          sub="decisions/30d"
          accent={GOLD}
        />
        <KpiCard
          label="CHAINLIGHT"
          value={kpis.chainlightConfidence}
          sub="avg confidence"
          accent={GOLD}
        />
      </div>

      <Card className="mb-8 p-5">
        <p className="text-sm leading-relaxed" style={{ color: SUB }}>
          A11oy Command Fabric is the universal intelligence layer across the SZL ecosystem. Each
          vertical keeps its domain identity. The Fabric gives them shared intelligence, evidence,
          governance, and consequence modeling. It turns signals into risks, risks into decisions,
          decisions into outcomes, and outcomes into memory. It ranks evidence, preserves proof,
          models consequences, routes approvals, and gives every vertical a shared command layer
          without erasing what makes each domain unique.
        </p>
      </Card>

      <SectionTitle>Vertical Command Map</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {VERTICALS.map((v) => {
          const twin = DOMAIN_TWINS.find((t) => t.verticalId === v.id);
          if (!twin) return null;
          const sigCount = FABRIC_SIGNALS.filter((s) => s.verticalId === v.id).length;
          const riskCount = FABRIC_RISKS.filter(
            (r) => r.verticalId === v.id && (r.status === 'open' || r.status === 'mitigating'),
          ).length;
          const isSelected = selectedVertical === v.id;
          return (
            <div
              key={v.id}
              className="rounded-lg border cursor-pointer transition-all p-4"
              onClick={() => setSelectedVertical(isSelected ? null : v.id)}
              style={{
                backgroundColor: isSelected ? `${v.colorToken}08` : 'rgba(255,255,255,0.018)',
                borderColor: isSelected ? v.colorToken : 'rgba(255,255,255,0.08)',
                borderTop: `3px solid ${v.colorToken}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: v.colorToken, fontSize: '1.1rem' }}>{v.icon}</span>
                  <span className="font-semibold text-sm" style={{ color: TEXT }}>
                    {v.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${GOVERNANCE_COLORS[twin.tenaxGovernanceState]}18`,
                    color: GOVERNANCE_COLORS[twin.tenaxGovernanceState],
                  }}
                >
                  {twin.tenaxGovernanceState.toUpperCase()}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: GHOST }}>
                {v.tagline}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <span style={{ color: GHOST }}>Health</span>{' '}
                  <span style={{ color: TEXT }}>{twin.healthScore}%</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Signals</span>{' '}
                  <span style={{ color: TEXT }}>{sigCount}</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Risks</span>{' '}
                  <span style={{ color: riskCount > 10 ? '#f59e0b' : TEXT }}>{riskCount}</span>
                </div>
                <div>
                  <span style={{ color: GHOST }}>Evidence</span>{' '}
                  <span style={{ color: TEXT }}>{twin.evidenceCompleteness}%</span>
                </div>
              </div>
              {isSelected && (
                <div
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="text-[10px] font-mono mb-2" style={{ color: GOLD }}>
                    Innovation Seed
                  </div>
                  <div className="text-xs font-medium mb-1" style={{ color: TEXT }}>
                    {v.innovationSeed.name}
                  </div>
                  <p className="text-[10px]" style={{ color: SUB }}>
                    {v.innovationSeed.description}
                  </p>
                  <Link
                    href={`${BASE}/fabric/verticals`}
                    className="inline-block mt-2 text-[10px] font-mono"
                    style={{ color: GOLD }}
                  >
                    View vertical detail →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionTitle>Top Cross-Vertical Risks</SectionTitle>
          <div className="flex flex-col gap-2">
            {topRisks.map((r) => (
              <div
                key={r.id}
                className="rounded border p-3 flex items-start gap-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.018)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                  style={{
                    backgroundColor: `${SEVERITY_COLORS[FABRIC_RISKS.indexOf(r) < 3 ? 'critical' : 'high']}18`,
                    color: SEVERITY_COLORS[FABRIC_RISKS.indexOf(r) < 3 ? 'critical' : 'high'],
                  }}
                >
                  {r.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: TEXT }}>
                    {r.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
                    >
                      {r.verticalId.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                      {r.owner}
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: r.status === 'open' ? '#f59e0b' : SUB,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`${BASE}/fabric/risks`}
            className="inline-block mt-3 text-xs font-mono"
            style={{ color: GOLD }}
          >
            View all risks →
          </Link>
        </div>

        <div>
          <SectionTitle>Pending Decisions</SectionTitle>
          <div className="flex flex-col gap-2">
            {pendingDecs.map((d) => (
              <div
                key={d.id}
                className="rounded border p-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.018)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-xs font-medium truncate" style={{ color: TEXT }}>
                    {d.title}
                  </div>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
                  >
                    {d.verticalId.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                    {d.humanOwner}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: SUB }}>
                    deadline {d.deadline}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: GOLD }}>
                    confidence {d.chainlightConfidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`${BASE}/fabric/decisions`}
            className="inline-block mt-3 text-xs font-mono"
            style={{ color: GOLD }}
          >
            View decision queue →
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionTitle>Signal Feed</SectionTitle>
          <div className="flex flex-col gap-2">
            {latestSignals.map((s) => (
              <div
                key={s.id}
                className="rounded border p-3 flex items-center gap-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.018)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SEVERITY_COLORS[s.severity] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ color: TEXT }}>
                    {s.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono" style={{ color: GOLD }}>
                      {s.verticalId.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                      {s.signalType}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                      {s.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`${BASE}/fabric/signals`}
            className="inline-block mt-3 text-xs font-mono"
            style={{ color: GOLD }}
          >
            View signal mesh →
          </Link>
        </div>

        <div>
          <SectionTitle>Domain Command Twins</SectionTitle>
          <div className="flex flex-col gap-2">
            {DOMAIN_TWINS.map((t) => {
              const v = VERTICALS.find((vt) => vt.id === t.verticalId);
              return (
                <div
                  key={t.id}
                  className="rounded border p-3 flex items-center gap-3"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.018)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <span style={{ color: v?.colorToken ?? GOLD }}>{v?.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: TEXT }}>
                      {t.name}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono">
                      <span style={{ color: GHOST }}>Health {t.healthScore}%</span>
                      <span style={{ color: GHOST }}>Signals {t.signalVolume}</span>
                      <span style={{ color: GOVERNANCE_COLORS[t.tenaxGovernanceState] }}>
                        {t.tenaxGovernanceState}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href={`${BASE}/fabric/twins`}
            className="inline-block mt-3 text-xs font-mono"
            style={{ color: GOLD }}
          >
            View all twins →
          </Link>
        </div>
      </div>

      <SectionTitle>Fabric Navigation</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          {
            href: '/fabric/verticals',
            label: 'Verticals Command',
            desc: 'All vertical profiles and domain health',
          },
          {
            href: '/fabric/twins',
            label: 'Domain Twins',
            desc: 'Operational models for each vertical',
          },
          {
            href: '/fabric/signals',
            label: 'Signal Mesh',
            desc: 'Unified cross-vertical signal stream',
          },
          {
            href: '/fabric/risks',
            label: 'Risk Matrix',
            desc: 'Cross-vertical risk command center',
          },
          {
            href: '/fabric/decisions',
            label: 'Decision Queue',
            desc: 'Human approval and decision support',
          },
          {
            href: '/fabric/outcomes',
            label: 'Outcome Memory',
            desc: 'Cross-vertical learning memory',
          },
          {
            href: '/fabric/evidence',
            label: 'Evidence Ledger',
            desc: 'Proof and evidence coverage',
          },
          {
            href: '/fabric/roadmap',
            label: 'Ecosystem Roadmap',
            desc: 'How A11oy evolves every vertical',
          },
        ].map((nav) => (
          <Link key={nav.href} href={`${BASE}${nav.href}`}>
            <Card
              className="h-full cursor-pointer hover:border-[#c9b787] transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: TEXT }}>
                {nav.label}
              </div>
              <p className="text-[10px]" style={{ color: GHOST }}>
                {nav.desc}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
