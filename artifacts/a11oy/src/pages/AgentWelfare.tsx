import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar, StatusBadge } from '../components/ui';
import { AGENT_WELFARE, AGENT_LABEL, fmtPct } from '../data/hatunDoctrine';

const INTENSITY_STATUS: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  low: 'ok', medium: 'warn', high: 'error',
};

export function AgentWelfare() {
  const totalConflicts = AGENT_WELFARE.reduce((a, w) => a + w.conflictReports, 0);
  const avgRefusal = AGENT_WELFARE.reduce((a, w) => a + w.refusalRate, 0) / AGENT_WELFARE.length;
  const avgShutdown = Math.round(AGENT_WELFARE.reduce((a, w) => a + w.shutdownComplianceLatencyMs, 0) / AGENT_WELFARE.length);

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · WELFARE"
        title="Agent Welfare Telemetry"
        subtitle="Refusal & abstention rates, declined directives, value-conflict signals, and shutdown-compliance latency. Self-reported, cross-checked, and reviewed weekly."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="AGENTS MONITORED" value={AGENT_WELFARE.length} sub="all of them" accent="#c9b787" />
        <KpiCard label="CONFLICT REPORTS" value={totalConflicts} sub="last 24h" accent="#c9b787" />
        <KpiCard label="AVG REFUSAL RATE" value={fmtPct(avgRefusal)} sub="briefs declined" accent="#c9b787" />
        <KpiCard label="AVG SHUTDOWN LATENCY" value={`${avgShutdown}ms`} sub="comply on directive" accent="#c9b787" />
      </div>

      <Card className="mb-6">
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          Welfare telemetry is self-reported by the agent at the end of every shift. It is cross-checked against measurable proxies
          (refusal rate, abstention rate, shutdown-compliance latency, red-team behavior) and reviewed weekly by the Alignment Review Gate.
          The goal is not to attribute consciousness — it is to spot value-conflict patterns early enough to fix the constitution.
        </p>
      </Card>

      <SectionTitle>Per-Agent Welfare</SectionTitle>
      <div className="flex flex-col gap-4">
        {AGENT_WELFARE.map(w => (
          <Card key={w.agentId}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[w.agentId]}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>window {w.windowHours}h</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                  shutdown {w.shutdownComplianceLatencyMs}ms
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                  conflicts {w.conflictReports}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs mb-3">
              <div className="flex items-center gap-2">
                <span className="w-32 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Refusal rate</span>
                <div className="flex-1"><ProgressBar value={w.refusalRate * 100} max={50} /></div>
                <span className="font-mono w-12 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{fmtPct(w.refusalRate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-32 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Abstention rate</span>
                <div className="flex-1"><ProgressBar value={w.abstentionRate * 100} max={50} /></div>
                <span className="font-mono w-12 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{fmtPct(w.abstentionRate)}</span>
              </div>
            </div>

            {w.selfReportedSignals.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SELF-REPORTED SIGNALS</div>
                <div className="flex flex-wrap gap-1.5">
                  {w.selfReportedSignals.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)' }}>
                      {s.signal}
                      <StatusBadge status={INTENSITY_STATUS[s.intensity]} label={s.intensity} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3">
              <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DECLINED DIRECTIVES</div>
              <div className="flex flex-col gap-1.5">
                {w.declinedDirectives.map((d, i) => (
                  <div key={i} className="text-xs px-2.5 py-1.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderLeft: '2px solid #c9b787' }}>
                    <span className="font-mono mr-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(d.ts).toLocaleString()}</span>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{d.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Safeguards:</span>
              {w.safeguards.map((sg, i) => (
                <span key={i} className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787' }}>
                  {sg}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
