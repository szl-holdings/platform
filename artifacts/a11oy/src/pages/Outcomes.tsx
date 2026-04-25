import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, VerticalBadge } from '../components/ui';
import { SEED_OUTCOMES, SEED_SIGNALS, SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6', 'vessels-maritime': '#06b6d4', 'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444', 'prism-counsel': '#8b5cf6', 'carlota-jo': '#f59e0b', 'alloy-core': '#6366f1',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels Maritime', 'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense', 'prism-counsel': 'PRISM Counsel', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Alloy Core',
};
const STATUS_COLORS: Record<string, string> = {
  achieved: '#10b981', missed: '#ef4444', blocked: '#f59e0b', in_progress: '#3b82f6', at_risk: '#f59e0b',
};

const STATUSES = ['all', 'achieved', 'in_progress', 'at_risk', 'blocked', 'missed'];

export function Outcomes() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = SEED_OUTCOMES.filter(o =>
    (filterStatus === 'all' || o.status === filterStatus) &&
    (filterVertical === 'all' || o.vertical === filterVertical)
  );

  const achieved = SEED_OUTCOMES.filter(o => o.status === 'achieved');
  const atRisk = SEED_OUTCOMES.filter(o => o.status === 'blocked' || o.status === 'at_risk' || o.status === 'missed');
  const inProgress = SEED_OUTCOMES.filter(o => o.status === 'in_progress');

  const selectedOutcome = selected ? SEED_OUTCOMES.find(o => o.id === selected) : null;

  return (
    <Layout>
      <PageHeader
        label="OUTCOMES BOARD"
        title="Enterprise Outcome Tracker"
        subtitle="Board-level view of outcome achievement, risk status, and signal-to-outcome traceability across all 7 verticals."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL OUTCOMES" value={SEED_OUTCOMES.length} sub="in registry" accent="#3b82f6" />
        <KpiCard label="ACHIEVED" value={achieved.length} sub="on track" accent="#10b981" />
        <KpiCard label="AT RISK" value={atRisk.length} sub="blocked or missed" accent="#ef4444" />
        <KpiCard label="IN PROGRESS" value={inProgress.length} sub="active" accent="#f59e0b" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-2.5 py-1 rounded font-mono transition-colors"
              style={{
                backgroundColor: filterStatus === s ? 'rgba(59,130,246,0.15)' : 'var(--color-a11oy-muted)',
                color: filterStatus === s ? '#3b82f6' : 'var(--color-a11oy-text-ghost)',
                border: filterStatus === s ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent', cursor: 'pointer',
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
          {Object.entries(VERTICAL_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <span className="text-xs self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} outcomes</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Outcome list */}
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-2">
            {filtered.map(o => {
              const statusColor = STATUS_COLORS[o.status] ?? '#9bacc4';
              const color = VERTICAL_COLORS[o.vertical] ?? '#9bacc4';
              const isSelected = o.id === selected;
              const signals = SEED_SIGNALS.filter(s => o.signalRefs.includes(s.id));
              const workcell = SEED_WORKCELLS.find(w => w.id === o.workcellId);
              return (
                <div
                  key={o.id}
                  className="rounded-lg border cursor-pointer transition-all p-4"
                  onClick={() => setSelected(isSelected ? null : o.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(59,130,246,0.04)' : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? '#3b82f6' : 'var(--color-a11oy-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColor}18`, color: statusColor }}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                        <VerticalBadge vertical={VERTICAL_LABELS[o.vertical] ?? o.vertical} color={color} />
                      </div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{o.title}</div>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Owner: {o.owner}</div>
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{o.description}</p>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Success metric: <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{o.successMetric}</span>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LINKED SIGNALS ({signals.length})</div>
                          {signals.slice(0, 3).map(s => (
                            <div key={s.id} style={{ color: 'var(--color-a11oy-text-sub)' }}>• {s.title.slice(0, 48)}</div>
                          ))}
                          {signals.length > 3 && <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>…and {signals.length - 3} more</div>}
                        </div>
                        <div>
                          <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LINKED WORKCELL</div>
                          {workcell ? (
                            <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{workcell.name}</div>
                          ) : (
                            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>None assigned</div>
                          )}
                          <div className="mt-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DEADLINE</div>
                          <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{o.deadline ?? '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No outcomes match the current filters.</div>
            )}
          </div>
        </div>

        {/* Right rail: summary */}
        <div className="flex flex-col gap-6">
          {/* Status breakdown */}
          <div>
            <SectionTitle>Status Breakdown</SectionTitle>
            <div className="flex flex-col gap-2">
              {STATUSES.filter(s => s !== 'all').map(s => {
                const count = SEED_OUTCOMES.filter(o => o.status === s).length;
                const pct = SEED_OUTCOMES.length > 0 ? (count / SEED_OUTCOMES.length) * 100 : 0;
                const color = STATUS_COLORS[s] ?? '#9bacc4';
                return (
                  <div key={s} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.replace(/_/g, ' ')}</span>
                      <span className="font-mono" style={{ color }}>{count}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top at-risk */}
          <div>
            <SectionTitle>At-Risk Outcomes</SectionTitle>
            <div className="flex flex-col gap-2">
              {atRisk.slice(0, 5).map(o => (
                <Card key={o.id} className="text-xs">
                  <div className="font-medium mb-0.5" style={{ color: '#f59e0b' }}>{o.title}</div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{o.status.replace(/_/g, ' ')} · {o.owner}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* Vertical coverage */}
          <div>
            <SectionTitle>By Vertical</SectionTitle>
            <div className="flex flex-col gap-2">
              {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
                const count = SEED_OUTCOMES.filter(o => o.vertical === id).length;
                const color = VERTICAL_COLORS[id] ?? '#9bacc4';
                return (
                  <div key={id} className="flex items-center justify-between text-xs">
                    <VerticalBadge vertical={label} color={color} />
                    <span className="font-mono" style={{ color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
