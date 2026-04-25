import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle, SeverityDot, SeverityBadge, HashId, VerticalBadge } from '../components/ui';
import { SEED_SIGNALS, SEED_OUTCOMES, SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6',
  'vessels-maritime': '#06b6d4',
  'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444',
  'prism-counsel': '#8b5cf6',
  'carlota-jo': '#f59e0b',
  'alloy-core': '#6366f1',
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

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.round(diffMs / 3_600_000);
    if (diffH < 1) return `${Math.round(diffMs / 60000)}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  } catch { return ts; }
}

const activeSignals = SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated');
const criticalSignals = SEED_SIGNALS.filter(s => s.severity === 'critical');
const pendingWorkcells = SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running');
const failedWorkcells = SEED_WORKCELLS.filter(w => w.status === 'error');
const runningWorkcells = SEED_WORKCELLS.filter(w => w.status === 'running');
const outcomesAtRisk = SEED_OUTCOMES.filter(o => o.status === 'blocked' || o.status === 'missed');
const mirrorWarnCount = SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'warn' || w.mirrorEvalResult.verdict === 'fail').length;

const METRICS = [
  { label: 'LIVE SIGNALS',          value: activeSignals.length,       sub: `${criticalSignals.length} critical`,   accent: '#ef4444' },
  { label: 'OUTCOMES AT RISK',       value: outcomesAtRisk.length,      sub: 'blocked or missed',                    accent: '#f59e0b' },
  { label: 'PENDING APPROVALS',      value: pendingWorkcells.length,    sub: 'awaiting human gate',                  accent: '#8b5cf6' },
  { label: 'VERIFIED ACTIONS',       value: 47,                         sub: 'last 24 hours',                        accent: '#10b981' },
  { label: 'REVENUE EXPOSURE',       value: '$2.4M',                    sub: 'across 3 verticals',                   accent: '#ef4444' },
  { label: 'RISK EXPOSURE',          value: '$8.1M',                    sub: 'defense + maritime',                   accent: '#f59e0b' },
  { label: 'PROOF COVERAGE',         value: '91%',                      sub: '1,204 of 1,324 events',                accent: '#10b981' },
  { label: 'EXECUTION VELOCITY',     value: '12.4/hr',                  sub: 'verified actions per hour',            accent: '#3b82f6' },
  { label: 'AGENT TRUST SCORE',      value: 94,                         sub: 'out of 100',                           accent: '#10b981' },
  { label: 'PCE CONTRACT HEALTH',    value: '96%',                      sub: '19 of 20 valid',                       accent: '#10b981' },
  { label: 'FAILED WORKCELLS',       value: failedWorkcells.length,     sub: 'require attention',                    accent: failedWorkcells.length > 0 ? '#ef4444' : '#10b981' },
  { label: 'MIRROREVAL WARNINGS',    value: mirrorWarnCount,            sub: 'evaluation flags',                     accent: mirrorWarnCount > 0 ? '#f59e0b' : '#10b981' },
];

export function NowBoard() {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const topSignals = SEED_SIGNALS.slice(0, 20);

  return (
    <Layout>
      <PageHeader
        label="NOW BOARD"
        title="Live Operational Status"
        subtitle="Real-time pulse across all 7 enterprise verticals — 12 key operational metrics, active signals, workcells, and outcomes."
        status="DEMO"
      >
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#10b981' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
          All fabric layers operational
        </div>
      </PageHeader>

      {/* 12-Metric KPI Grid (spec requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
        {METRICS.map(m => (
          <KpiCard key={m.label} label={m.label} value={m.value} sub={m.sub} accent={m.accent} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Active Signals table */}
        <div className="lg:col-span-2">
          <SectionTitle>Active Signals ({activeSignals.length})</SectionTitle>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Sev', 'Vertical', 'Signal', 'Detected', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSignals.map((s, i) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedSignal(s.id === selectedSignal ? null : s.id)}
                    style={{
                      backgroundColor: selectedSignal === s.id ? 'rgba(59,130,246,0.06)' : i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)',
                      borderBottom: '1px solid var(--color-a11oy-border)',
                    }}
                  >
                    <td className="px-3 py-2"><SeverityDot severity={s.severity} /></td>
                    <td className="px-3 py-2">
                      <VerticalBadge vertical={VERTICAL_LABELS[s.vertical] ?? s.vertical} color={VERTICAL_COLORS[s.vertical] ?? '#9bacc4'} />
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text)', maxWidth: 220 }}>
                      <div className="truncate">{s.title}</div>
                    </td>
                    <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(s.detectedAt)}</td>
                    <td className="px-3 py-2"><SeverityBadge severity={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedSignal && (() => {
            const sig = SEED_SIGNALS.find(s => s.id === selectedSignal);
            if (!sig) return null;
            return (
              <Card className="mt-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityDot severity={sig.severity} />
                      <SeverityBadge severity={sig.severity} />
                      <VerticalBadge vertical={VERTICAL_LABELS[sig.vertical] ?? sig.vertical} color={VERTICAL_COLORS[sig.vertical] ?? '#9bacc4'} />
                    </div>
                    <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sig.title}</div>
                  </div>
                  <HashId id={sig.id} />
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{sig.description}</p>
                <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                  Business Impact: {sig.businessImpact}
                </div>
                <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Owner: {sig.owner} · Detected {fmt(sig.detectedAt)}
                </div>
              </Card>
            );
          })()}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <div>
            <SectionTitle>Active Workcells ({runningWorkcells.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {SEED_WORKCELLS.filter(w => w.status === 'running' || w.status === 'paused').slice(0, 6).map(wc => (
                <Card key={wc.id} className="text-xs">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{wc.name}</span>
                    <span className="font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: wc.status === 'running' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: wc.status === 'running' ? '#10b981' : '#f59e0b' }}>
                      {wc.status}
                    </span>
                  </div>
                  <div className="truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wc.objective}</div>
                  <div className="mt-1.5">
                    <VerticalBadge vertical={VERTICAL_LABELS[wc.vertical] ?? wc.vertical} color={VERTICAL_COLORS[wc.vertical] ?? '#9bacc4'} />
                    {wc.requiresApproval && <span className="ml-2 font-mono text-xs" style={{ color: '#8b5cf6' }}>⚬ approval needed</span>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Outcomes ({SEED_OUTCOMES.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {SEED_OUTCOMES.slice(0, 6).map(o => {
                const statusColor = o.status === 'achieved' ? '#10b981' : o.status === 'missed' ? '#ef4444' : o.status === 'blocked' ? '#f59e0b' : '#9bacc4';
                return (
                  <Card key={o.id} className="text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{o.title}</span>
                      <span className="font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${statusColor}18`, color: statusColor }}>{o.status}</span>
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{o.successMetric}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Distribution */}
      <SectionTitle>Signal Distribution by Vertical</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
          const sigs = SEED_SIGNALS.filter(s => s.vertical === id);
          const critical = sigs.filter(s => s.severity === 'critical').length;
          const high = sigs.filter(s => s.severity === 'high').length;
          const color = VERTICAL_COLORS[id] ?? '#9bacc4';
          return (
            <div key={id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: `2px solid ${color}` }}>
              <div className="text-xs font-medium mb-2 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{label}</div>
              <div className="text-2xl font-display font-semibold" style={{ color }}>{sigs.length}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {critical > 0 && <span style={{ color: '#ef4444' }}>{critical} crit </span>}
                {high > 0 && <span style={{ color: '#f59e0b' }}>{high} high</span>}
                {critical === 0 && high === 0 && 'nominal'}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
