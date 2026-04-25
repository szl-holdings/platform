import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ApprovalGate, VerdictBadge, VerticalBadge } from '../components/ui';
import { SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6', 'vessels-maritime': '#06b6d4', 'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444', 'prism-counsel': '#8b5cf6', 'carlota-jo': '#f59e0b', 'alloy-core': '#6366f1',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels Maritime', 'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Alloy Core',
};
const STATUS_COLORS: Record<string, string> = {
  running: '#f59e0b', completed: '#10b981', paused: '#9bacc4', error: '#ef4444', idle: '#9bacc4',
};

export function Workcells() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVertical, setFilterVertical] = useState<string>('all');

  const filtered = SEED_WORKCELLS.filter(w =>
    (filterStatus === 'all' || w.status === filterStatus) &&
    (filterVertical === 'all' || w.vertical === filterVertical)
  );

  const running = SEED_WORKCELLS.filter(w => w.status === 'running');
  const completed = SEED_WORKCELLS.filter(w => w.status === 'completed');
  const pendingApproval = SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running');

  return (
    <Layout>
      <PageHeader
        label="WORKCELLS"
        title="Execution Workcell Engine"
        subtitle="Every workcell is a governed, traceable execution context. Inspect signal inputs, agent sequences, PCE contracts, and proof packets."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="RUNNING" value={running.length} sub="active cells" accent="#f59e0b" />
        <KpiCard label="COMPLETED" value={completed.length} sub="with proof" accent="#10b981" />
        <KpiCard label="APPROVAL GATES" value={pendingApproval.length} sub="awaiting human" accent="#8b5cf6" />
        <KpiCard label="TOTAL CELLS" value={SEED_WORKCELLS.length} sub="in registry" accent="#3b82f6" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {['all', 'running', 'completed', 'idle', 'paused', 'error'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-2.5 py-1 rounded font-mono transition-colors"
              style={{
                backgroundColor: filterStatus === s ? 'rgba(59,130,246,0.15)' : 'var(--color-a11oy-muted)',
                color: filterStatus === s ? '#3b82f6' : 'var(--color-a11oy-text-ghost)',
                border: filterStatus === s ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={filterVertical}
          onChange={e => setFilterVertical(e.target.value)}
          className="text-xs rounded px-2 py-1 border"
          style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
        >
          <option value="all">All verticals</option>
          {Object.entries(VERTICAL_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <span className="text-xs self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} workcells</span>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(wc => {
          const color = VERTICAL_COLORS[wc.vertical] ?? '#9bacc4';
          const statusColor = STATUS_COLORS[wc.status] ?? '#9bacc4';
          return (
            <Card key={wc.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColor}18`, color: statusColor }}>{wc.status}</span>
                    <VerticalBadge vertical={VERTICAL_LABELS[wc.vertical] ?? wc.vertical} color={color} />
                  </div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{wc.name}</div>
                </div>
                <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
              </div>

              <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{wc.objective}</p>

              <div className="flex flex-wrap gap-1">
                {wc.agentSequence.map((a, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                    {a.role}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wc.id}</span>
                <div className="flex items-center gap-2">
                  {wc.requiresApproval && <span className="font-mono" style={{ color: '#8b5cf6' }}>⚬ approval</span>}
                </div>
              </div>

              {wc.requiresApproval && wc.status === 'running' && (
                <ApprovalGate label={`Approval tier: ${wc.actionBrief.approvalTier}`} />
              )}

              <div className="flex gap-2 mt-auto">
                <Link
                  href={`${BASE}/workcells/${wc.id}`}
                  className="text-xs px-3 py-1.5 rounded font-medium"
                  style={{ backgroundColor: 'var(--color-a11oy-blue)', color: 'white', textDecoration: 'none' }}
                >
                  View Detail
                </Link>
                <Link
                  href={`${BASE}/workcells/${wc.id}/replay`}
                  className="text-xs px-3 py-1.5 rounded font-medium border"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-a11oy-text-sub)', borderColor: 'var(--color-a11oy-border)', textDecoration: 'none' }}
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
          <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>△</div>
          <div className="text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No workcells match the current filter.</div>
        </div>
      )}
    </Layout>
  );
}
