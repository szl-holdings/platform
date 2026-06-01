import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, KpiCard } from '../../components/ui';
import {
  VERTICALS,
  FABRIC_DECISIONS,
  filterByVertical,
  type VerticalId,
  type DecisionStatus,
  type FabricDecision,
} from '../../data/fabric';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

const STATUS_COLORS: Record<DecisionStatus, string> = {
  draft: '#8a8a8a',
  awaiting_review: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
  executed: '#c9b787',
  deferred: '#8a8a8a',
};

export function DecisionQueue() {
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'all'>('all');
  const [localActions, setLocalActions] = useState<Record<string, DecisionStatus>>({});
  const [drawerDec, setDrawerDec] = useState<FabricDecision | null>(null);

  let decisions = filterByVertical(FABRIC_DECISIONS, verticalFilter);
  if (statusFilter !== 'all')
    decisions = decisions.filter((d) => (localActions[d.id] ?? d.status) === statusFilter);

  const applyAction = (id: string, action: DecisionStatus) => {
    setLocalActions((prev) => ({ ...prev, [id]: action }));
  };

  const pending = FABRIC_DECISIONS.filter(
    (d) => d.status === 'draft' || d.status === 'awaiting_review',
  ).length;
  const approved = FABRIC_DECISIONS.filter(
    (d) => d.status === 'approved' || d.status === 'executed',
  ).length;

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · DECISION QUEUE"
        title="Human Approval Queue"
        subtitle="Every high-impact decision across every vertical passes through this queue. Local approve, defer, or reject — no real execution."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="TOTAL DECISIONS"
          value={FABRIC_DECISIONS.length}
          sub="cross-vertical"
          accent={GOLD}
        />
        <KpiCard label="PENDING" value={pending} sub="draft + awaiting" accent="#f59e0b" />
        <KpiCard label="APPROVED" value={approved} sub="approved + executed" accent="#22c55e" />
        <KpiCard
          label="LOCAL ACTIONS"
          value={Object.keys(localActions).length}
          sub="this session"
          accent={GOLD}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono mr-1" style={{ color: GHOST }}>
            VERTICAL
          </span>
          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value as VerticalId | 'all')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-transparent"
            style={{ color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none' }}
          >
            <option value="all" style={{ backgroundColor: '#0a0a0a' }}>
              ALL
            </option>
            {VERTICALS.map((v) => (
              <option key={v.id} value={v.id} style={{ backgroundColor: '#0a0a0a' }}>
                {v.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono mr-1" style={{ color: GHOST }}>
            STATUS
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DecisionStatus | 'all')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-transparent"
            style={{ color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none' }}
          >
            <option value="all" style={{ backgroundColor: '#0a0a0a' }}>
              ALL
            </option>
            {(
              ['draft', 'awaiting_review', 'approved', 'rejected', 'executed', 'deferred'] as const
            ).map((s) => (
              <option key={s} value={s} style={{ backgroundColor: '#0a0a0a' }}>
                {s.toUpperCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[10px] font-mono mb-3" style={{ color: GHOST }}>
        {decisions.length} decisions matching filters
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {decisions.map((d) => {
          const currentStatus = localActions[d.id] ?? d.status;
          return (
            <div
              key={d.id}
              className="rounded-lg border p-4 cursor-pointer hover:border-[#c9b787] transition-colors"
              onClick={() => setDrawerDec(d)}
              style={{
                backgroundColor: SURFACE,
                borderColor: drawerDec?.id === d.id ? GOLD : BORDER,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate mb-1" style={{ color: TEXT }}>
                    {d.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
                    >
                      {d.verticalId}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: SUB }}>
                      {d.decisionType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                      {d.humanOwner}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                      deadline {d.deadline}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: `${STATUS_COLORS[currentStatus]}18`,
                    color: STATUS_COLORS[currentStatus],
                  }}
                >
                  {currentStatus.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Chainlight confidence:
                </span>
                <span className="text-[10px] font-mono" style={{ color: GOLD }}>
                  {d.chainlightConfidence}
                </span>
                <span className="text-[10px] font-mono ml-2" style={{ color: GHOST }}>
                  Recommended:
                </span>
                <span className="text-[10px] font-mono" style={{ color: TEXT }}>
                  {d.recommendedOption}
                </span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => applyAction(d.id, 'approved')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                  style={{
                    backgroundColor: currentStatus === 'approved' ? '#22c55e18' : 'transparent',
                    color: '#22c55e',
                    border: '1px solid #22c55e40',
                  }}
                >
                  APPROVE
                </button>
                <button
                  onClick={() => applyAction(d.id, 'deferred')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                  style={{
                    backgroundColor: currentStatus === 'deferred' ? `${GOLD}18` : 'transparent',
                    color: GOLD,
                    border: `1px solid ${GOLD}40`,
                  }}
                >
                  DEFER
                </button>
                <button
                  onClick={() => applyAction(d.id, 'rejected')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                  style={{
                    backgroundColor: currentStatus === 'rejected' ? '#ef444418' : 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef444440',
                  }}
                >
                  REJECT
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {drawerDec && (
        <div
          className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto"
          style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold" style={{ color: TEXT }}>
                {drawerDec.title}
              </span>
              <button
                onClick={() => setDrawerDec(null)}
                className="text-sm font-mono px-3 py-1 rounded"
                style={{ color: GHOST, border: `1px solid ${BORDER}` }}
              >
                Close
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: SUB }}>
              {drawerDec.summary}
            </p>
            <div className="mb-4">
              <div className="text-[10px] font-mono mb-2" style={{ color: GOLD }}>
                OPTIONS
              </div>
              {drawerDec.options.map((o, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded mb-1 flex items-center gap-2"
                  style={{
                    backgroundColor:
                      o === drawerDec.recommendedOption ? `${GOLD}08` : 'rgba(255,255,255,0.03)',
                    color: o === drawerDec.recommendedOption ? GOLD : SUB,
                  }}
                >
                  {o === drawerDec.recommendedOption && (
                    <span className="text-[10px]" style={{ color: GOLD }}>
                      ★
                    </span>
                  )}
                  {o}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Owner
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerDec.humanOwner}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Deadline
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerDec.deadline}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Confidence
                </div>
                <div className="text-xs" style={{ color: GOLD }}>
                  {drawerDec.chainlightConfidence}
                </div>
              </div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
                <div className="text-[10px] font-mono" style={{ color: GHOST }}>
                  Type
                </div>
                <div className="text-xs" style={{ color: TEXT }}>
                  {drawerDec.decisionType}
                </div>
              </div>
            </div>
            <div
              className="text-xs p-3 rounded mb-3"
              style={{ backgroundColor: '#22c55e08', color: TEXT }}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: '#22c55e' }}>
                EXPECTED OUTCOME
              </div>
              {drawerDec.expectedOutcome}
            </div>
            <div
              className="text-xs p-3 rounded"
              style={{ backgroundColor: '#ef444408', color: TEXT }}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: '#ef4444' }}>
                DOWNSIDE RISK
              </div>
              {drawerDec.downsideRisk}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
