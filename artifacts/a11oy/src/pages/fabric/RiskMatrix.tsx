import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, KpiCard, SectionTitle } from '../../components/ui';
import {
  VERTICALS,
  FABRIC_RISKS,
  filterByVertical,
  rankRisksByScore,
  SEVERITY_COLORS,
  type VerticalId,
  type RiskCategory,
  type FabricRisk,
} from '../../data/fabric';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

const RISK_CATS: readonly RiskCategory[] = [
  'operational',
  'financial',
  'legal_workflow',
  'security',
  'compliance',
  'vendor',
  'asset',
  'deadline',
  'reputation',
  'data_quality',
  'decision_delay',
  'control_drift',
];

function scoreColor(score: number): string {
  if (score >= 30) return '#ef4444';
  if (score >= 20) return '#f59e0b';
  if (score >= 10) return GOLD;
  return SUB;
}

export function RiskMatrix() {
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'probability' | 'impact'>('score');
  const [drawerRisk, setDrawerRisk] = useState<FabricRisk | null>(null);

  let risks = filterByVertical(FABRIC_RISKS, verticalFilter);
  if (categoryFilter !== 'all') risks = risks.filter((r) => r.riskCategory === categoryFilter);
  if (sortBy === 'score') risks = rankRisksByScore(risks);
  else if (sortBy === 'probability')
    risks = [...risks].sort((a, b) => b.probability - a.probability);
  else risks = [...risks].sort((a, b) => b.impact - a.impact);

  const openRisks = FABRIC_RISKS.filter((r) => r.status === 'open');
  const criticalCount = openRisks.filter((r) => r.riskScore >= 30).length;
  const avgScore = Math.round(
    FABRIC_RISKS.reduce((s, r) => s + r.riskScore, 0) / FABRIC_RISKS.length,
  );

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · RISK MATRIX"
        title="Cross-Vertical Risk Command"
        subtitle="Unified risk scoring across all verticals. Probability, impact, and velocity combined into a single risk score."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="TOTAL RISKS"
          value={FABRIC_RISKS.length}
          sub="cross-vertical"
          accent={GOLD}
        />
        <KpiCard label="OPEN" value={openRisks.length} sub="requires attention" accent="#f59e0b" />
        <KpiCard label="CRITICAL" value={criticalCount} sub="score >= 30" accent="#ef4444" />
        <KpiCard label="AVG SCORE" value={avgScore} sub="P x I x V x 100" accent={GOLD} />
      </div>

      <SectionTitle>Risk Heatmap</SectionTitle>
      <div className="grid grid-cols-7 gap-1 mb-6">
        {VERTICALS.map((v) => {
          const vRisks = FABRIC_RISKS.filter((r) => r.verticalId === v.id);
          const maxScore = Math.max(...vRisks.map((r) => r.riskScore));
          const openCount = vRisks.filter((r) => r.status === 'open').length;
          return (
            <div
              key={v.id}
              className="rounded p-2 text-center cursor-pointer"
              onClick={() => setVerticalFilter(v.id)}
              style={{
                backgroundColor: `${scoreColor(maxScore)}18`,
                border: verticalFilter === v.id ? `1px solid ${GOLD}` : `1px solid transparent`,
              }}
            >
              <div className="text-sm mb-1">{v.icon}</div>
              <div className="text-[10px] font-mono" style={{ color: TEXT }}>
                {v.name}
              </div>
              <div className="text-lg font-bold" style={{ color: scoreColor(maxScore) }}>
                {openCount}
              </div>
              <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                open
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <FilterSelect
          label="VERTICAL"
          value={verticalFilter}
          onChange={(v) => setVerticalFilter(v as VerticalId | 'all')}
          options={[
            { value: 'all', label: 'ALL' },
            ...VERTICALS.map((v) => ({ value: v.id, label: v.name.toUpperCase() })),
          ]}
        />
        <FilterSelect
          label="CATEGORY"
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as RiskCategory | 'all')}
          options={[
            { value: 'all', label: 'ALL' },
            ...RISK_CATS.map((c) => ({ value: c, label: c.toUpperCase().replace('_', ' ') })),
          ]}
        />
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>
            SORT
          </span>
          {(['score', 'probability', 'impact'] as const).map((s) => (
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

      <div className="text-[10px] font-mono mb-3" style={{ color: GHOST }}>
        {risks.length} risks matching filters
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {risks.slice(0, 40).map((r) => (
          <div
            key={r.id}
            className="rounded border p-3 flex items-start gap-3 cursor-pointer hover:border-[#c9b787] transition-colors"
            onClick={() => setDrawerRisk(r)}
            style={{
              backgroundColor: SURFACE,
              borderColor: drawerRisk?.id === r.id ? GOLD : BORDER,
            }}
          >
            <div
              className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
              style={{
                backgroundColor: `${scoreColor(r.riskScore)}18`,
                color: scoreColor(r.riskScore),
              }}
            >
              {r.riskScore}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate mb-1" style={{ color: TEXT }}>
                {r.title}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
                >
                  {r.verticalId}
                </span>
                <span className="text-[10px] font-mono" style={{ color: SUB }}>
                  {r.riskCategory}
                </span>
                <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                  P:{r.probability} I:{r.impact} V:{r.velocity}
                </span>
                <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                  {r.owner}
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: r.status === 'open' ? '#f59e0b18' : 'rgba(255,255,255,0.05)',
                    color: r.status === 'open' ? '#f59e0b' : SUB,
                  }}
                >
                  {r.status}
                </span>
                {r.approvalRequired && (
                  <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>
                    APPROVAL
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {drawerRisk && (
        <div
          className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto"
          style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold" style={{ color: TEXT }}>
                {drawerRisk.title}
              </span>
              <button
                onClick={() => setDrawerRisk(null)}
                className="text-sm font-mono px-3 py-1 rounded"
                style={{ color: GHOST, border: `1px solid ${BORDER}` }}
              >
                Close
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: SUB }}>
              {drawerRisk.description}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded p-3 text-center" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  PROBABILITY
                </div>
                <div className="text-xl font-bold" style={{ color: GOLD }}>
                  {drawerRisk.probability}
                </div>
              </div>
              <div className="rounded p-3 text-center" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  IMPACT
                </div>
                <div className="text-xl font-bold" style={{ color: GOLD }}>
                  {drawerRisk.impact}
                </div>
              </div>
              <div className="rounded p-3 text-center" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  VELOCITY
                </div>
                <div className="text-xl font-bold" style={{ color: GOLD }}>
                  {drawerRisk.velocity}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Risk Score
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: scoreColor(drawerRisk.riskScore) }}
                >
                  {drawerRisk.riskScore}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Category
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerRisk.riskCategory}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Owner
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerRisk.owner}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Status
                </div>
                <div
                  className="text-xs"
                  style={{ color: drawerRisk.status === 'open' ? '#f59e0b' : TEXT }}
                >
                  {drawerRisk.status}
                </div>
              </div>
            </div>
            <div
              className="text-xs p-3 rounded mb-4"
              style={{ backgroundColor: `${GOLD}08`, color: TEXT }}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: GOLD }}>
                MITIGATION
              </div>
              {drawerRisk.mitigation}
            </div>
            <div className="text-[10px] font-mono" style={{ color: GHOST }}>
              <div>Related signals: {drawerRisk.relatedSignals.join(', ')}</div>
              <div>Evidence: {drawerRisk.evidenceIds.join(', ')}</div>
              <div>Approval required: {drawerRisk.approvalRequired ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-mono mr-1" style={{ color: GHOST }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[10px] font-mono px-2 py-1 rounded bg-transparent"
        style={{ color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ backgroundColor: '#0a0a0a' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
