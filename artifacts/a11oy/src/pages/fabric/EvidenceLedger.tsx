import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, KpiCard } from '../../components/ui';
import {
  VERTICALS,
  FABRIC_EVIDENCE,
  filterByVertical,
  type VerticalId,
  type EvidenceType,
  type FabricEvidence,
} from '../../data/fabric';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

const EV_TYPES: readonly EvidenceType[] = [
  'document',
  'ticket',
  'email_summary',
  'system_event',
  'scanner_result',
  'inspection_note',
  'legal_workflow_note',
  'voyage_signal',
  'vendor_update',
  'executive_decision',
  'approval_record',
  'audit_event',
  'policy_clause',
];

function authorityColor(score: number): string {
  if (score >= 0.85) return '#22c55e';
  if (score >= 0.7) return GOLD;
  return '#f59e0b';
}

export function EvidenceLedger() {
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EvidenceType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'authority' | 'type' | 'vertical'>('authority');
  const [drawerEv, setDrawerEv] = useState<FabricEvidence | null>(null);

  let evidence = filterByVertical(FABRIC_EVIDENCE, verticalFilter);
  if (typeFilter !== 'all') evidence = evidence.filter((e) => e.evidenceType === typeFilter);
  evidence = [...evidence].sort((a, b) => {
    if (sortBy === 'authority') return b.authorityScore - a.authorityScore;
    if (sortBy === 'type') return a.evidenceType.localeCompare(b.evidenceType);
    return a.verticalId.localeCompare(b.verticalId);
  });

  const avgAuthority = Math.round(
    (FABRIC_EVIDENCE.reduce((s, e) => s + e.authorityScore, 0) / FABRIC_EVIDENCE.length) * 100,
  );
  const verified = FABRIC_EVIDENCE.filter((e) => e.status === 'verified').length;
  const disputed = FABRIC_EVIDENCE.filter((e) => e.status === 'disputed').length;

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · EVIDENCE LEDGER"
        title="Unified Evidence Coverage"
        subtitle="Cross-vertical proof and evidence management. Every evidence item anchored in the Proof Chain for auditability."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="EVIDENCE" value={FABRIC_EVIDENCE.length} sub="records" accent={GOLD} />
        <KpiCard label="AVG AUTHORITY" value={`${avgAuthority}%`} sub="score" accent={GOLD} />
        <KpiCard label="VERIFIED" value={verified} sub="confirmed" accent="#22c55e" />
        <KpiCard label="DISPUTED" value={disputed} sub="needs review" accent="#ef4444" />
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {VERTICALS.map((v) => {
          const count = FABRIC_EVIDENCE.filter((e) => e.verticalId === v.id).length;
          const vAvg = Math.round(
            (FABRIC_EVIDENCE.filter((e) => e.verticalId === v.id).reduce(
              (s, e) => s + e.authorityScore,
              0,
            ) /
              count) *
              100,
          );
          return (
            <div
              key={v.id}
              className="rounded p-2 text-center cursor-pointer"
              onClick={() => setVerticalFilter(v.id)}
              style={{
                backgroundColor: verticalFilter === v.id ? `${GOLD}18` : SURFACE,
                border: verticalFilter === v.id ? `1px solid ${GOLD}` : `1px solid transparent`,
              }}
            >
              <div className="text-sm mb-1">{v.icon}</div>
              <div className="text-[10px] font-mono" style={{ color: TEXT }}>
                {v.name}
              </div>
              <div className="text-sm font-bold" style={{ color: GOLD }}>
                {count}
              </div>
              <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                {vAvg}% auth
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono mr-1" style={{ color: GHOST }}>
            TYPE
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EvidenceType | 'all')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-transparent"
            style={{ color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none' }}
          >
            <option value="all" style={{ backgroundColor: '#0a0a0a' }}>
              ALL
            </option>
            {EV_TYPES.map((t) => (
              <option key={t} value={t} style={{ backgroundColor: '#0a0a0a' }}>
                {t.toUpperCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>
            SORT
          </span>
          {(['authority', 'type', 'vertical'] as const).map((s) => (
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
        {evidence.length} evidence records
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left text-xs" style={{ color: TEXT }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                AUTH
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                EVIDENCE
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                VERTICAL
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                TYPE
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                SOURCE
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {evidence.slice(0, 50).map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setDrawerEv(e)}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <td className="py-2 pr-3">
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: authorityColor(e.authorityScore) }}
                  >
                    {Math.round(e.authorityScore * 100)}%
                  </span>
                </td>
                <td className="py-2 pr-3 max-w-[200px] truncate">{e.title}</td>
                <td className="py-2 pr-3">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
                  >
                    {e.verticalId}
                  </span>
                </td>
                <td className="py-2 pr-3 text-[10px] font-mono" style={{ color: SUB }}>
                  {e.evidenceType}
                </td>
                <td className="py-2 pr-3 text-[10px] font-mono" style={{ color: GHOST }}>
                  {e.sourceSystem}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        e.status === 'verified'
                          ? '#22c55e18'
                          : e.status === 'disputed'
                            ? '#ef444418'
                            : 'rgba(255,255,255,0.05)',
                      color:
                        e.status === 'verified'
                          ? '#22c55e'
                          : e.status === 'disputed'
                            ? '#ef4444'
                            : SUB,
                    }}
                  >
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerEv && (
        <div
          className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto"
          style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold" style={{ color: TEXT }}>
                {drawerEv.title}
              </span>
              <button
                onClick={() => setDrawerEv(null)}
                className="text-sm font-mono px-3 py-1 rounded"
                style={{ color: GHOST, border: `1px solid ${BORDER}` }}
              >
                Close
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: SUB }}>
              {drawerEv.summary}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Authority
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: authorityColor(drawerEv.authorityScore) }}
                >
                  {Math.round(drawerEv.authorityScore * 100)}%
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Type
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerEv.evidenceType}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Source
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerEv.sourceSystem}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Status
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerEv.status}
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono" style={{ color: GHOST }}>
              <div>Proof Chain: {drawerEv.proofChainAnchorId}</div>
              <div>Signals: {drawerEv.relatedSignals.join(', ')}</div>
              <div>Risks: {drawerEv.relatedRisks.join(', ')}</div>
              <div>Decisions: {drawerEv.relatedDecisions.join(', ')}</div>
              <div>Outcomes: {drawerEv.relatedOutcomes.join(', ')}</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
