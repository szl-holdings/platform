import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  PageHeader,
  Card,
  KpiCard,
  ApprovalGate,
  VerdictBadge,
  VerticalBadge,
} from '../components/ui';
import { SEED_WORKCELLS, type OperationalAvailability } from '@workspace/a11oy-fabric';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787',
  'vessels-maritime': '#8a8a8a',
  'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5',
  'prism-counsel': '#8a8a8a',
  'carlota-jo': '#c9b787',
  'alloy-core': '#8a8a8a',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue',
  'vessels-maritime': 'Vessels Maritime',
  'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense',
  'prism-counsel': 'Counsel',
  'carlota-jo': 'Carlota Jo',
  'alloy-core': 'Alloy Core',
};
const STATUS_COLORS: Record<string, string> = {
  running: '#c9b787',
  completed: '#c9b787',
  paused: '#5e5e5e',
  error: '#f5f5f5',
  idle: '#5e5e5e',
};
const OPERATIONAL_COLORS: Record<OperationalAvailability, string> = {
  REAL: '#8ed6b3',
  DEMO: '#e5d29e',
  UNAVAILABLE: '#8a8a8a',
  DEGRADED: '#e6b87a',
  BLOCKED: '#f1a487',
  ROADMAP: '#8a8a8a',
};

export function Workcells() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVertical, setFilterVertical] = useState<string>('all');

  const filtered = SEED_WORKCELLS.filter(
    (w) =>
      (filterStatus === 'all' || w.status === filterStatus) &&
      (filterVertical === 'all' || w.vertical === filterVertical),
  );

  const running = SEED_WORKCELLS.filter((w) => w.status === 'running');
  const completed = SEED_WORKCELLS.filter((w) => w.status === 'completed');
  const pendingApproval = SEED_WORKCELLS.filter(
    (w) => w.requiresApproval && w.status === 'running',
  );

  return (
    <Layout>
      <div id="main-content" tabIndex={-1}>
        <PageHeader
          label="WORKCELLS"
          title="Execution Workcell Engine"
          subtitle="Workflow progress is shown separately from operational availability. Every listed Workcell is deterministic demo data with an explicit evidence boundary."
          status="DEMO"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <KpiCard
            label="WORKFLOW RUNNING"
            value={running.length}
            sub="seeded cells"
            accent="#c9b787"
          />
          <KpiCard
            label="WORKFLOW COMPLETE"
            value={completed.length}
            sub="demo receipts"
            accent="#c9b787"
          />
          <KpiCard
            label="APPROVAL GATES"
            value={pendingApproval.length}
            sub="awaiting human"
            accent="#8a8a8a"
          />
          <KpiCard
            label="TOTAL CELLS"
            value={SEED_WORKCELLS.length}
            sub="in registry"
            accent="#c9b787"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <fieldset className="flex gap-1">
            <legend className="sr-only">Filter workcells by status</legend>
            {['all', 'running', 'completed', 'idle', 'paused', 'error'].map((s) => (
              <button
                type="button"
                key={s}
                aria-pressed={filterStatus === s}
                onClick={() => setFilterStatus(s)}
                className="min-h-11 text-xs px-2.5 py-1 rounded font-mono transition-colors"
                style={{
                  backgroundColor:
                    filterStatus === s ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
                  color: filterStatus === s ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
                  border:
                    filterStatus === s
                      ? '1px solid rgba(201,183,135,0.3)'
                      : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </fieldset>
          <label htmlFor="workcell-vertical-filter" className="sr-only">
            Filter workcells by vertical
          </label>
          <select
            id="workcell-vertical-filter"
            name="workcell-vertical-filter"
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="min-h-11 text-xs rounded px-2 py-1 border"
            style={{
              backgroundColor: 'var(--color-a11oy-card)',
              borderColor: 'var(--color-a11oy-border)',
              color: 'var(--color-a11oy-text)',
            }}
          >
            <option value="all">All verticals</option>
            {Object.entries(VERTICAL_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <span className="text-xs self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            {filtered.length} workcells
          </span>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((wc) => {
            const color = VERTICAL_COLORS[wc.vertical] ?? '#5e5e5e';
            const statusColor = STATUS_COLORS[wc.status] ?? '#5e5e5e';
            const operationalColor = OPERATIONAL_COLORS[wc.operationalAvailability] ?? '#8a8a8a';
            return (
              <Card key={wc.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="font-mono text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${statusColor}18`, color: statusColor }}
                      >
                        {wc.status}
                      </span>
                      <VerticalBadge
                        vertical={VERTICAL_LABELS[wc.vertical] ?? wc.vertical}
                        color={color}
                      />
                    </div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: 'var(--color-a11oy-text)' }}
                    >
                      {wc.name}
                    </div>
                  </div>
                  <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
                </div>

                <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  {wc.objective}
                </p>

                <div
                  className="rounded-md border px-3 py-2"
                  style={{
                    backgroundColor: `${operationalColor}0d`,
                    borderColor: `${operationalColor}33`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-[10px] tracking-wider"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      OPERATIONAL AVAILABILITY
                    </span>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: operationalColor }}
                    >
                      {wc.operationalAvailability}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-xs leading-5"
                    style={{ color: 'var(--color-a11oy-text-sub)' }}
                  >
                    {wc.operationalEvidence}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {wc.agentSequence.map((a) => (
                    <span
                      key={`${a.agentId}:${a.role}:${a.action}`}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--color-a11oy-muted)',
                        color: 'var(--color-a11oy-text-ghost)',
                      }}
                    >
                      {a.role}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {wc.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {wc.requiresApproval && (
                      <span className="font-mono" style={{ color: '#8a8a8a' }}>
                        ⚬ approval
                      </span>
                    )}
                  </div>
                </div>

                {wc.requiresApproval && wc.status === 'running' && (
                  <ApprovalGate label={`Approval tier: ${wc.actionBrief.approvalTier}`} />
                )}

                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`${BASE}/workcells/${wc.id}`}
                    className="flex min-h-11 items-center text-xs px-3 py-1.5 rounded font-medium"
                    style={{
                      backgroundColor: 'var(--color-a11oy-blue)',
                      color: 'white',
                      textDecoration: 'none',
                    }}
                  >
                    View Detail
                  </Link>
                  <Link
                    href={`${BASE}/workcells/${wc.id}/replay`}
                    className="flex min-h-11 items-center text-xs px-3 py-1.5 rounded font-medium border"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--color-a11oy-text-sub)',
                      borderColor: 'var(--color-a11oy-border)',
                      textDecoration: 'none',
                    }}
                  >
                    Replay
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>
              △
            </div>
            <div className="text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              No workcells match the current filter.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
