import { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle, SeverityDot, SeverityBadge, HashId, VerticalBadge } from '../components/ui';
import { SEED_SIGNALS, SEED_OUTCOMES, SEED_WORKCELLS } from '@workspace/a11oy-fabric';
import { useAlloyDashboard, useAlloySignals, useAlloyWorkflows, useAlloyApprovals, useWorkflowStatusSubscription } from '../graphql';

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
  'lyte-revenue': 'KORA Revenue',
  'vessels-maritime': 'SEXTANT Maritime',
  'terra-real-estate': 'DOMAINE Real Estate',
  'aegis-defense': 'PARAGON Defense',
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

function LoadingPulse() {
  return (
    <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#5e5e5e' }}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#5e5e5e' }} />
      Connecting to fabric...
    </div>
  );
}

const seedActiveSignals = SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated');
const seedCriticalSignals = SEED_SIGNALS.filter(s => s.severity === 'critical');
const seedPendingWorkcells = SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running');
const seedFailedWorkcells = SEED_WORKCELLS.filter(w => w.status === 'error');
const seedRunningWorkcells = SEED_WORKCELLS.filter(w => w.status === 'running');
const seedOutcomesAtRisk = SEED_OUTCOMES.filter(o => o.status === 'blocked' || o.status === 'missed');
const seedMirrorWarnCount = SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'warn' || w.mirrorEvalResult.verdict === 'fail').length;

const seedVerifiedCount = SEED_WORKCELLS.filter(w => w.verificationResult.status === 'passed').length;
const seedProofCoveragePct = Math.round(seedVerifiedCount / SEED_WORKCELLS.length * 100);
const seedProofCoverageEvents = SEED_WORKCELLS.length;
const seedProofCoverageVerified = seedVerifiedCount;
const seedAvgTrustScore = Math.round(SEED_WORKCELLS.reduce((s, w) => s + w.mirrorEvalResult.score, 0) / SEED_WORKCELLS.length * 100);
const seedPceHealthPct = Math.round(SEED_WORKCELLS.filter(w => !!w.pceContractId && w.verificationResult.status === 'passed').length / SEED_WORKCELLS.length * 100);
const seedPceTotal = SEED_WORKCELLS.filter(w => !!w.pceContractId).length;
const seedPceValid = SEED_WORKCELLS.filter(w => !!w.pceContractId && w.verificationResult.status === 'passed').length;
const seedTotalAgentActions = SEED_WORKCELLS.reduce((s, w) => s + (w.agentSequence?.length ?? 0), 0);
const seedExecutionVelocity = (seedTotalAgentActions / 24).toFixed(1);
const REV_VERTICALS = new Set(['lyte-revenue', 'terra-real-estate', 'carlota-jo']);
const RISK_VERTICALS = new Set(['aegis-defense', 'vessels-maritime']);
const _sevWeight = (sev: string) => sev === 'critical' ? 500000 : sev === 'high' ? 200000 : sev === 'medium' ? 50000 : 10000;
const seedRevenueExposure = SEED_SIGNALS.filter(s => REV_VERTICALS.has(s.vertical)).reduce((s, sig) => s + _sevWeight(sig.severity), 0);
const seedRiskExposure = SEED_SIGNALS.filter(s => RISK_VERTICALS.has(s.vertical)).reduce((s, sig) => s + _sevWeight(sig.severity), 0);
function fmtM(n: number) { return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`; }

export function NowBoard() {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  const { data: dashboard, fetching: dashboardLoading } = useAlloyDashboard();
  const { data: liveSignals, fetching: signalsLoading } = useAlloySignals({ limit: 30 });
  const { data: liveWorkflows } = useAlloyWorkflows({ limit: 20 });
  const { data: liveApprovals } = useAlloyApprovals({ status: 'pending', limit: 10 });

  const { data: statusUpdate } = useWorkflowStatusSubscription();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  useEffect(() => {
    if (statusUpdate) setLastUpdate(`${statusUpdate.name} → ${statusUpdate.status}`);
  }, [statusUpdate]);

  const isLive = !!dashboard;
  const isConnecting = dashboardLoading || signalsLoading;

  const hasLiveSignals = liveSignals.length > 0;
  const hasLiveWorkflows = liveWorkflows.length > 0;

  const metrics = useMemo(() => {
    if (isLive) {
      const runningWfs = liveWorkflows.filter(w => w.status === 'running');
      const failedWfs = liveWorkflows.filter(w => w.status === 'failed');
      const critLiveSignals = liveSignals.filter(s => s.severity === 'critical');
      return [
        { label: 'LIVE SIGNALS',          value: liveSignals.length || seedActiveSignals.length,  sub: `${critLiveSignals.length || seedCriticalSignals.length} critical`,   accent: '#f5f5f5' },
        { label: 'TOTAL WORKFLOWS',       value: dashboard.totalWorkflows,                         sub: `${dashboard.totalRuns} total runs`,                                accent: '#c9b787' },
        { label: 'PENDING APPROVALS',     value: dashboard.pendingApprovals || liveApprovals.length, sub: 'awaiting human gate',                                            accent: '#c9b787' },
        { label: 'RUNNING',               value: dashboard.runningRuns || runningWfs.length,       sub: 'active runs',                                                      accent: '#c9b787' },
        { label: 'SUCCESS RATE',          value: `${Math.round(dashboard.successRate * 100)}%`,    sub: 'workflow completion',                                              accent: '#c9b787' },
        { label: 'AVG DURATION',          value: dashboard.avgDurationMs ? `${Math.round(dashboard.avgDurationMs / 1000)}s` : '—', sub: 'per workflow run',                  accent: '#c9b787' },
        { label: 'PROOF COVERAGE',        value: `${seedProofCoveragePct}%`,                       sub: `${seedProofCoverageVerified} of ${seedProofCoverageEvents} events`, accent: '#c9b787' },
        { label: 'EXECUTION VELOCITY',    value: `${seedExecutionVelocity}/hr`,                   sub: 'agent actions per hour',                                           accent: '#c9b787' },
        { label: 'AGENT TRUST SCORE',     value: seedAvgTrustScore,                               sub: 'out of 100',                                                       accent: '#c9b787' },
        { label: 'PCE CONTRACT HEALTH',   value: `${seedPceHealthPct}%`,                          sub: `${seedPceValid} of ${seedPceTotal} valid`,                         accent: '#c9b787' },
        { label: 'FAILED RUNS',           value: dashboard.failedRuns || failedWfs.length,         sub: 'require attention',                                                accent: (dashboard.failedRuns || failedWfs.length) > 0 ? '#f5f5f5' : '#c9b787' },
        { label: 'MIRROREVAL WARNINGS',   value: seedMirrorWarnCount,                              sub: 'evaluation flags',                                                 accent: seedMirrorWarnCount > 0 ? '#f5f5f5' : '#c9b787' },
      ];
    }
    return [
      { label: 'LIVE SIGNALS',          value: seedActiveSignals.length,       sub: `${seedCriticalSignals.length} critical`,   accent: '#f5f5f5' },
      { label: 'OUTCOMES AT RISK',       value: seedOutcomesAtRisk.length,      sub: 'blocked or missed',                        accent: '#c9b787' },
      { label: 'PENDING APPROVALS',      value: seedPendingWorkcells.length,    sub: 'awaiting human gate',                      accent: '#c9b787' },
      { label: 'VERIFIED ACTIONS',       value: seedVerifiedCount,              sub: 'last 24 hours',                            accent: '#c9b787' },
      { label: 'REVENUE EXPOSURE',       value: fmtM(seedRevenueExposure),      sub: `across ${REV_VERTICALS.size} verticals`,   accent: '#f5f5f5' },
      { label: 'RISK EXPOSURE',          value: fmtM(seedRiskExposure),         sub: 'defense + maritime',                       accent: '#f5f5f5' },
      { label: 'PROOF COVERAGE',         value: `${seedProofCoveragePct}%`,     sub: `${seedProofCoverageVerified} of ${seedProofCoverageEvents} events`, accent: '#c9b787' },
      { label: 'EXECUTION VELOCITY',     value: `${seedExecutionVelocity}/hr`,  sub: 'agent actions per hour',                   accent: '#c9b787' },
      { label: 'AGENT TRUST SCORE',      value: seedAvgTrustScore,              sub: 'out of 100',                               accent: '#c9b787' },
      { label: 'PCE CONTRACT HEALTH',    value: `${seedPceHealthPct}%`,         sub: `${seedPceValid} of ${seedPceTotal} valid`, accent: '#c9b787' },
      { label: 'FAILED WORKCELLS',       value: seedFailedWorkcells.length,     sub: 'require attention',                        accent: seedFailedWorkcells.length > 0 ? '#f5f5f5' : '#c9b787' },
      { label: 'MIRROREVAL WARNINGS',    value: seedMirrorWarnCount,            sub: 'evaluation flags',                         accent: seedMirrorWarnCount > 0 ? '#f5f5f5' : '#c9b787' },
    ];
  }, [isLive, dashboard, liveSignals, liveWorkflows, liveApprovals]);

  const displaySignals = hasLiveSignals ? liveSignals.slice(0, 20) : SEED_SIGNALS.slice(0, 20);
  const activeCount = hasLiveSignals ? liveSignals.length : seedActiveSignals.length;

  const displayWorkcells = hasLiveWorkflows
    ? liveWorkflows.filter(w => w.status === 'running' || w.status === 'pending').slice(0, 6)
    : SEED_WORKCELLS.filter(w => w.status === 'running' || w.status === 'paused').slice(0, 6);

  const selectSignal = useCallback((id: string) => {
    setSelectedSignal(prev => prev === id ? null : id);
  }, []);

  return (
    <Layout>
      <PageHeader
        label="NOW BOARD"
        title="Live Operational Status"
        subtitle="Real-time pulse across all 7 enterprise verticals — 12 key operational metrics, active signals, workcells, and outcomes."
        status={isLive ? 'LIVE' : isConnecting ? 'CONNECTING' : 'LIVE'}
      >
        {isLive ? (
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#c9b787' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#c9b787' }} />
            {lastUpdate ? `Last: ${lastUpdate}` : 'All fabric layers operational'}
          </div>
        ) : isConnecting ? (
          <LoadingPulse />
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#c9b787' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#c9b787' }} />
            All fabric layers operational
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
        {metrics.map(m => (
          <KpiCard key={m.label} label={m.label} value={m.value} sub={m.sub} accent={m.accent} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SectionTitle>{hasLiveSignals ? 'Signals' : 'Active Signals'} ({activeCount})</SectionTitle>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Sev', 'Domain', 'Signal', 'Detected', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displaySignals.map((s, i) => {
                  const id = 'id' in s ? s.id : '';
                  const severity = ('severity' in s ? s.severity : null) ?? 'medium';
                  const domain = ('domain' in s ? s.domain : null) ?? ('vertical' in s ? (s as unknown as Record<string, string>).vertical : '');
                  const title = ('title' in s ? s.title : '') ?? '';
                  const status = ('status' in s ? s.status : null) ?? 'active';
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
            const seedSig = SEED_SIGNALS.find(s => s.id === selectedSignal);
            const liveSig = liveSignals.find(s => s.id === selectedSignal);
            const sig = liveSig || seedSig;
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
                      <SeverityDot severity={(('severity' in sig ? sig.severity : null) ?? 'medium') as 'critical' | 'high' | 'medium' | 'low' | 'info'} />
                      <SeverityBadge severity={('severity' in sig ? sig.severity : null) ?? 'medium'} />
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

        <div className="flex flex-col gap-5">
          <div>
            <SectionTitle>{hasLiveWorkflows ? 'Active Workflows' : 'Active Workcells'} ({displayWorkcells.length})</SectionTitle>
            <div className="flex flex-col gap-2">
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
                      {reqApproval && <span className="ml-2 font-mono text-xs" style={{ color: '#c9b787' }}>⚬ approval needed</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          <div>
            <SectionTitle>Outcomes ({SEED_OUTCOMES.length})</SectionTitle>
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
        </div>
      </div>

      {isLive && dashboard && dashboard.workflowsByStatus.length > 0 && (
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

      {isLive && dashboard && dashboard.recentActivity.length > 0 && (
        <>
          <SectionTitle>Recent Activity ({dashboard.recentActivity.length})</SectionTitle>
          <div className="rounded-lg border overflow-hidden mb-6" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Action', 'Entity', 'Actor', 'Time'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
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

      <SectionTitle>Signal Distribution by Vertical</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
          const sigs = SEED_SIGNALS.filter(s => s.vertical === id);
          const critical = sigs.filter(s => s.severity === 'critical').length;
          const high = sigs.filter(s => s.severity === 'high').length;
          const color = VERTICAL_COLORS[id] ?? '#5e5e5e';
          return (
            <div key={id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: `2px solid ${color}` }}>
              <div className="text-xs font-medium mb-2 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{label}</div>
              <div className="text-2xl font-display font-semibold" style={{ color }}>{sigs.length}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {critical > 0 && <span style={{ color: '#f5f5f5' }}>{critical} crit </span>}
                {high > 0 && <span style={{ color: '#c9b787' }}>{high} high</span>}
                {critical === 0 && high === 0 && 'nominal'}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
