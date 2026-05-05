import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

const WORKFLOWS = [
  { id: 'wf-1', name: 'Voyage Risk Assessment', domain: 'Maritime', runs: 842, p50: 4200, p99: 12000, errorRate: 0.12, lastRun: '09:01', status: 'healthy', avgLift: 38000 },
  { id: 'wf-2', name: 'Contract Review Pipeline', domain: 'Legal', runs: 212, p50: 28000, p99: 68000, errorRate: 0.00, lastRun: '08:45', status: 'healthy', avgLift: 125000 },
  { id: 'wf-3', name: 'Guardian NOC Alert Triage', domain: 'Security', runs: 18421, p50: 380, p99: 940, errorRate: 0.08, lastRun: '09:01', status: 'healthy', avgLift: 28000 },
  { id: 'wf-4', name: 'Sanctions Screening', domain: 'Compliance', runs: 1421, p50: 1200, p99: 3400, errorRate: 0.00, lastRun: '08:58', status: 'healthy', avgLift: 180000 },
  { id: 'wf-5', name: 'Research Synthesis', domain: 'Research', runs: 321, p50: 4800, p99: 9200, errorRate: 2.18, lastRun: '08:30', status: 'degraded', avgLift: 12000 },
  { id: 'wf-6', name: 'Terra Property Analysis', domain: 'Real Estate', runs: 88, p50: 6200, p99: 18000, errorRate: 0.00, lastRun: '07:42', status: 'healthy', avgLift: 8000 },
];

const STATUS_COLORS = { healthy: '#22c55e', degraded: GOLD, error: '#f87171' };

export function WorkflowHealth() {
  const totalRuns = WORKFLOWS.reduce((s, w) => s + w.runs, 0);
  const totalLift = WORKFLOWS.reduce((s, w) => s + w.avgLift * w.runs, 0);
  const avgError = WORKFLOWS.reduce((s, w) => s + w.errorRate, 0) / WORKFLOWS.length;
  const degraded = WORKFLOWS.filter(w => w.status === 'degraded').length;

  return (
    <Layout>
      <PageHeader
        label="DECISIONS / WORKFLOW HEALTH"
        title="Decision Workflow Health"
        subtitle="Health, latency, error rate, and Covenant Lift $ per governed decision workflow. Each workflow's P50/P99 and error rate is tracked against its Constitution-defined SLO."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="TOTAL RUNS TODAY" value={totalRuns.toLocaleString()} sub="all workflows" accent={GOLD} />
        <KpiCard label="DEGRADED" value={String(degraded)} sub={degraded > 0 ? 'needs attention' : 'all healthy'} accent={degraded > 0 ? '#f87171' : '#22c55e'} />
        <KpiCard label="AVG ERROR RATE" value={`${avgError.toFixed(2)}%`} sub="across workflows" accent={GOLD} />
        <KpiCard label="TOTAL LIFT $" value={`$${(totalLift / 1000000).toFixed(1)}M`} sub="today" accent="#22c55e" />
      </div>

      <div className="space-y-3">
        {WORKFLOWS.map(wf => {
          const sc = STATUS_COLORS[wf.status as keyof typeof STATUS_COLORS];
          const liftTotal = wf.avgLift * wf.runs;
          return (
            <Card key={wf.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc }} />
                    <span className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{wf.name}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wf.domain}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last run: {wf.lastRun} · {wf.runs.toLocaleString()} runs today</div>
                </div>
                <div className="text-right text-xs">
                  <div style={{ color: '#22c55e' }}>${(liftTotal / 1000).toFixed(0)}k lift</div>
                  <div style={{ color: wf.errorRate > 1 ? '#f87171' : '#22c55e' }}>{wf.errorRate.toFixed(2)}% errors</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>P50 Latency</div>
                  <div className="h-1.5 rounded-full mb-1" style={{ backgroundColor: 'rgba(201,183,135,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((wf.p50 / 30000) * 100, 100)}%`, backgroundColor: GOLD }} />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{wf.p50 >= 1000 ? `${(wf.p50 / 1000).toFixed(1)}s` : `${wf.p50}ms`}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>P99 Latency</div>
                  <div className="h-1.5 rounded-full mb-1" style={{ backgroundColor: 'rgba(201,183,135,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((wf.p99 / 70000) * 100, 100)}%`, backgroundColor: 'rgba(201,183,135,0.5)' }} />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{wf.p99 >= 1000 ? `${(wf.p99 / 1000).toFixed(1)}s` : `${wf.p99}ms`}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Error Rate</div>
                  <div className="h-1.5 rounded-full mb-1" style={{ backgroundColor: 'rgba(248,113,113,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(wf.errorRate * 10, 100)}%`, backgroundColor: wf.errorRate > 1 ? '#f87171' : '#22c55e' }} />
                  </div>
                  <div className="text-xs" style={{ color: wf.errorRate > 1 ? '#f87171' : '#22c55e' }}>{wf.errorRate.toFixed(2)}%</div>
                </div>
              </div>
              {wf.status === 'degraded' && (
                <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)' }}>
                  ⚠ {wf.name} error rate above SLO threshold (2.0%). Shadow Council auto-review dispatched.
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Workflow Health absorbs the Lyte ROI Lens workflow tracking view and the PRAXIS KernelDashboard execution health panel. One SLO surface per governed workflow.
      </div>
    </Layout>
  );
}
