import { useState, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle, SeverityDot, SeverityBadge, HashId, VerticalBadge } from '../components/ui';
import { SEED_SIGNALS, SEED_OUTCOMES, SEED_WORKCELLS } from '@workspace/a11oy-fabric';
import { useAlloyDashboard, useAlloySignals, useAlloyWorkflows, useAlloyApprovals } from '../graphql';
import { DashboardEvidence } from '../components/DashboardEvidence';
import type { EvidenceMode } from '../lib/query-evidence';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787',
  'vessels-maritime': '#8a8a8a',
  'terra-real-estate': '#8a8a8a',
  'aegis-defense': '#8a8a8a',
  'prism-counsel': '#8a8a8a',
  'carlota-jo': '#8a8a8a',
  'alloy-core': '#c9b787',
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
    if (!Number.isFinite(d.getTime())) return 'Unknown time';
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.round(diffMs / 3_600_000);
    if (diffH < 1) return `${Math.round(diffMs / 60000)}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  } catch { return ts; }
}

export function NowBoard() {
  const [mode, setMode] = useState<EvidenceMode>('api');
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const dashboardQuery = useAlloyDashboard();
  const signalsQuery = useAlloySignals({ limit: 30 });
  const workflowsQuery = useAlloyWorkflows({ limit: 20 });
  const approvalsQuery = useAlloyApprovals({ status: 'pending', limit: 10 });
  const isDemo = mode === 'demo';
  const dashboard = !isDemo && dashboardQuery.source.usable ? dashboardQuery.data : null;
  const observedSignals = signalsQuery.source.usable ? signalsQuery.data : [];
  const observedWorkflows = workflowsQuery.source.usable ? workflowsQuery.data : [];
  const displaySignals = (isDemo ? SEED_SIGNALS : observedSignals).slice(0, 20);
  const activeCount = isDemo ? SEED_SIGNALS.length : signalsQuery.source.usable ? observedSignals.length : '—';
  const displayWorkcells = isDemo
    ? SEED_WORKCELLS.filter(w => w.status === 'running' || w.status === 'paused').slice(0, 6)
    : observedWorkflows.filter(w => w.status === 'running' || w.status === 'pending').slice(0, 6);
  const unavailable = dashboardQuery.source.state;
  const metrics = isDemo ? [
    { label: 'DEMO SIGNALS', value: SEED_SIGNALS.length, sub: 'fictional fixture rows', accent: '#c9b787' },
    { label: 'DEMO WORKCELLS', value: SEED_WORKCELLS.length, sub: 'fictional fixture rows', accent: '#c9b787' },
    { label: 'DEMO RUNNING', value: SEED_WORKCELLS.filter(w => w.status === 'running').length, sub: 'fixture status only', accent: '#c9b787' },
    { label: 'DEMO OUTCOMES', value: SEED_OUTCOMES.length, sub: 'fictional fixture rows', accent: '#c9b787' },
  ] : [
    { label: 'SIGNALS RETURNED', value: signalsQuery.source.usable ? observedSignals.length : '—', sub: signalsQuery.source.usable ? 'response sample, limit 30' : signalsQuery.source.state, accent: '#c9b787' },
    { label: 'TOTAL WORKFLOWS', value: dashboard?.totalWorkflows ?? '—', sub: dashboard ? 'reported by dashboard' : unavailable, accent: '#c9b787' },
    { label: 'PENDING APPROVALS', value: dashboard?.pendingApprovals ?? '—', sub: dashboard ? 'reported by dashboard' : unavailable, accent: '#c9b787' },
    { label: 'RUNNING RUNS', value: dashboard?.runningRuns ?? '—', sub: dashboard ? 'reported by dashboard' : unavailable, accent: '#c9b787' },
    { label: 'TOTAL RUNS', value: dashboard?.totalRuns ?? '—', sub: dashboard ? 'reported count; not verified actions' : unavailable, accent: '#c9b787' },
    { label: 'SUCCESS RATE', value: typeof dashboard?.successRate === 'number' && Number.isFinite(dashboard.successRate) ? `${Math.round(dashboard.successRate * 100)}%` : '—', sub: dashboard ? 'reported by dashboard' : unavailable, accent: '#c9b787' },
    { label: 'AVG DURATION', value: dashboard?.avgDurationMs != null ? `${Math.round(dashboard.avgDurationMs / 1000)}s` : '—', sub: dashboard ? 'reported per run' : unavailable, accent: '#c9b787' },
    { label: 'FAILED RUNS', value: dashboard?.failedRuns ?? '—', sub: dashboard ? 'reported by dashboard' : unavailable, accent: '#c9b787' },
  ];

  const selectSignal = useCallback((id: string) => {
    setSelectedSignal(prev => prev === id ? null : id);
  }, []);

  return (
    <Layout>
      <PageHeader
        label="NOW BOARD"
        contextLabel="Review only"
        title="Operational Response Review"
        subtitle="Inspect each query independently. Empty responses, missing data and demonstration fixtures remain distinct."
        status={isDemo ? 'DEMO' : undefined}
      />
      <DashboardEvidence mode={mode} onModeChange={next => { setMode(next); setSelectedSignal(null); }} sources={{ dashboard: dashboardQuery.source, signals: signalsQuery.source, workflows: workflowsQuery.source, approvals: approvalsQuery.source }} />
      <Card className="mb-6 text-xs">Proof verification, agent trust, execution rate and contract health are unavailable: this view has no bound evidence source for those claims.</Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
        {metrics.map(m => (
          <KpiCard key={m.label} label={m.label} value={m.value} sub={m.sub} accent={m.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="min-w-0 lg:col-span-2">
          <SectionTitle>{isDemo ? 'Demo Signals' : 'Signals Returned'} ({activeCount})</SectionTitle>
          <div role="region" aria-label="Returned signals table" data-query-scroll className="rounded-lg border overflow-x-auto" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Sev', 'Domain', 'Signal', 'Detected', 'Status'].map(h => (
                    <th key={h} className="text-left whitespace-nowrap px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displaySignals.length === 0 && <tr><td colSpan={5} className="p-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>{signalsQuery.source.usable ? 'No signals returned in this response.' : signalsQuery.source.detail}</td></tr>}
                {displaySignals.map((s, i) => {
                  const id = 'id' in s ? s.id : '';
                  const severity = ('severity' in s ? s.severity : null) ?? 'unknown';
                  const domain = ('domain' in s ? s.domain : null) ?? ('vertical' in s ? (s as unknown as Record<string, string>).vertical : '');
                  const title = ('title' in s ? s.title : '') ?? '';
                  const status = ('status' in s ? s.status : null) ?? 'unknown';
                  const detected = ('createdAt' in s && s.createdAt) ? s.createdAt : ('detectedAt' in s ? (s as unknown as Record<string, string>).detectedAt : '');
                  const vertLabel = VERTICAL_LABELS[domain] ?? domain;
                  const vertColor = VERTICAL_COLORS[domain] ?? '#5e5e5e';

                  return (
                    <tr
                      key={id || i}
                      className="cursor-pointer transition-colors"
                      onClick={() => selectSignal(id)}
                      style={{
                        backgroundColor: selectedSignal === id ? 'rgba(201,183,135,0.06)' : i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)',
                        borderBottom: '1px solid var(--color-a11oy-border)',
                      }}
                    >
                      <td className="px-3 py-2"><SeverityDot severity={severity as 'critical' | 'high' | 'medium' | 'low' | 'info'} /></td>
                      <td className="px-3 py-2">
                        <VerticalBadge vertical={vertLabel} color={vertColor} />
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text)', maxWidth: 220 }}>
                        <div className="truncate">{title}</div>
                      </td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{detected ? fmt(detected) : '—'}</td>
                      <td className="px-3 py-2"><SeverityBadge severity={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedSignal && (() => {
            const sig = displaySignals.find(s => s.id === selectedSignal);
            if (!sig) return null;
            const domain = ('domain' in sig ? sig.domain : null) ?? ('vertical' in sig ? (sig as unknown as Record<string, string>).vertical : '');
            const desc = sig.description ?? '';
            const businessImpact = 'businessImpact' in sig ? (sig as unknown as Record<string, string>).businessImpact : null;
            const owner = 'ownerUserId' in sig ? sig.ownerUserId : ('owner' in sig ? (sig as unknown as Record<string, string>).owner : null);
            const detected = ('createdAt' in sig && sig.createdAt) ? sig.createdAt : ('detectedAt' in sig ? (sig as unknown as Record<string, string>).detectedAt : '');
            return (
              <Card className="mt-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityDot severity={(('severity' in sig ? sig.severity : null) ?? 'unknown') as 'critical' | 'high' | 'medium' | 'low' | 'info'} />
                      <SeverityBadge severity={('severity' in sig ? sig.severity : null) ?? 'unknown'} />
                      <VerticalBadge vertical={VERTICAL_LABELS[domain] ?? domain} color={VERTICAL_COLORS[domain] ?? '#5e5e5e'} />
                    </div>
                    <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sig.title}</div>
                  </div>
                  <HashId id={sig.id} />
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{desc}</p>
                {businessImpact && (
                  <div className="text-xs p-2 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}>
                    Business Impact: {businessImpact}
                  </div>
                )}
                <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {owner && <>Owner: {owner} · </>}Detected {detected ? fmt(detected) : '—'}
                </div>
              </Card>
            );
          })()}
        </div>

        <div className="min-w-0 flex flex-col gap-5">
          <div>
            <SectionTitle>{isDemo ? 'Demo Workcells' : 'Active Workflows Returned'} ({isDemo || workflowsQuery.source.usable ? displayWorkcells.length : '—'})</SectionTitle>
            <div className="flex flex-col gap-2">
              {displayWorkcells.length === 0 && <Card className="text-xs">{workflowsQuery.source.usable ? 'No active workflows in the returned rows.' : workflowsQuery.source.detail}</Card>}
              {displayWorkcells.map((wc, idx) => {
                const id = wc.id;
                const name = 'name' in wc ? wc.name : '';
                const status = 'status' in wc ? wc.status : '';
                const objective = ('description' in wc ? wc.description : null) ?? ('objective' in wc ? (wc as unknown as Record<string, string>).objective : '');
                const domain = ('domain' in wc ? wc.domain : null) ?? ('vertical' in wc ? (wc as unknown as Record<string, string>).vertical : '');
                const reqApproval = 'requiresApproval' in wc ? wc.requiresApproval : false;
                return (
                  <Card key={id || idx} className="text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{name}</span>
                      <span className="font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>
                        {status}
                      </span>
                    </div>
                    <div className="truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{objective}</div>
                    <div className="mt-1.5">
                      <VerticalBadge vertical={VERTICAL_LABELS[domain ?? ''] ?? domain ?? ''} color={VERTICAL_COLORS[domain ?? ''] ?? '#5e5e5e'} />
                      {reqApproval && <span className="ml-2 font-mono text-xs" style={{ color: '#c9b787' }}>⚬ approval requirement reported</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          {isDemo ? (
          <div>
            <SectionTitle>Demo Outcomes ({SEED_OUTCOMES.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {SEED_OUTCOMES.slice(0, 6).map(o => {
                const statusColor = o.status === 'achieved' ? '#c9b787' : o.status === 'missed' ? '#f5f5f5' : o.status === 'blocked' ? '#8a8a8a' : '#5e5e5e';
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
          ) : <Card className="text-xs">Outcomes UNAVAILABLE — no outcomes query is bound to this view.</Card>}
        </div>
      </div>

      {!isDemo && dashboard && dashboard.workflowsByStatus.length > 0 && (
        <>
          <SectionTitle>Workflow Status Distribution</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {dashboard.workflowsByStatus.map(ws => {
              const color = ws.status === 'completed' ? '#c9b787' : ws.status === 'failed' ? '#f5f5f5' : ws.status === 'running' ? '#c9b787' : '#8a8a8a';
              return (
                <div key={ws.status} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: `2px solid ${color}` }}>
                  <div className="text-xs font-mono uppercase mb-2 tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{ws.status}</div>
                  <div className="text-2xl font-display font-semibold" style={{ color }}>{ws.count}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!isDemo && dashboard && dashboard.recentActivity.length > 0 && (
        <>
          <SectionTitle>Recent Activity ({dashboard.recentActivity.length})</SectionTitle>
          <div role="region" aria-label="Returned activity table" data-query-scroll className="rounded-lg border overflow-x-auto mb-6" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Action', 'Entity', 'Actor', 'Time'].map(h => (
                    <th key={h} className="text-left whitespace-nowrap px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.recentActivity.slice(0, 10).map((a, i) => (
                  <tr key={a.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                    <td className="px-3 py-2 font-mono" style={{ color: '#c9b787' }}>{a.action}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text)' }}>{a.entityType}:{a.entityId?.slice(0, 8)}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.actorType}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SectionTitle>{isDemo ? 'Demo Signal Distribution' : 'Returned Signal Distribution'}</SectionTitle>
      {isDemo || signalsQuery.source.usable ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
            const rows = isDemo ? SEED_SIGNALS.filter(s => s.vertical === id) : observedSignals.filter(s => s.domain === id);
            const critical = rows.filter(s => s.severity === 'critical').length;
            const high = rows.filter(s => s.severity === 'high').length;
            const color = VERTICAL_COLORS[id] ?? '#5e5e5e';
            return (
              <div key={id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: '2px solid ' + color }}>
                <div className="text-xs font-medium mb-2 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{label}</div>
                <div className="text-2xl font-display font-semibold" style={{ color }}>{rows.length}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{critical} critical · {high} high in {isDemo ? 'fixtures' : 'returned rows'}</div>
              </div>
            );
          })}
        </div>
      ) : <Card className="text-xs">{signalsQuery.source.detail}</Card>}
    </Layout>
  );
}
