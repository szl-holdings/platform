import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar, StatusBadge } from '../components/ui';
import { AGENT_LABEL, fmtPct } from '../data/mythosDoctrine';
import { useWelfare, DoctrineLoader } from '../hooks/useDoctrine';

const INTENSITY_STATUS: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  low: 'ok', medium: 'warn', high: 'error',
};

export function AgentWelfare() {
  const { data: AGENT_WELFARE, loading, error } = useWelfare();
  const welfareData = AGENT_WELFARE ?? [];
  const totalConflicts = welfareData.reduce((a: number, w: any) => a + w.conflictReports, 0);
  const avgRefusal = welfareData.length ? welfareData.reduce((a: number, w: any) => a + Number(w.refusalRate), 0) / welfareData.length : 0;
  const avgShutdown = welfareData.length ? Math.round(welfareData.reduce((a: number, w: any) => a + w.shutdownComplianceLatencyMs, 0) / welfareData.length) : 0;

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · WELFARE"
        title="Agent Welfare Telemetry"
        subtitle="Refusal & abstention rates, declined directives, value-conflict signals, and shutdown-compliance latency. Self-reported, cross-checked, and reviewed weekly."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="AGENTS MONITORED" value={welfareData.length} sub="all of them" accent="#c9b787" />
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
        {welfareData.map((w: any) => (
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
                <div className="flex-1"><ProgressBar value={Number(w.refusalRate) * 100} max={50} /></div>
                <span className="font-mono w-12 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{fmtPct(Number(w.refusalRate))}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-32 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Abstention rate</span>
                <div className="flex-1"><ProgressBar value={Number(w.abstentionRate) * 100} max={50} /></div>
                <span className="font-mono w-12 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{fmtPct(Number(w.abstentionRate))}</span>
              </div>
            </div>

            {(w.selfReportedSignals as any[])?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SELF-REPORTED SIGNALS</div>
                <div className="flex flex-wrap gap-1.5">
                  {(w.selfReportedSignals as any[]).map((s: any, i: number) => (
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
                {(w.declinedDirectives as any[]).map((d: any, i: number) => (
                  <div key={i} className="text-xs px-2.5 py-1.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderLeft: '2px solid #c9b787' }}>
                    <span className="font-mono mr-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(d.ts).toLocaleString()}</span>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{d.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Safeguards:</span>
              {(w.safeguards as string[]).map((sg: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787' }}>
                  {sg}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
