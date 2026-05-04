import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { AGENT_LABEL, fmtUsd, fmtPct } from '../data/mythosDoctrine';
import { useCovenantLift, DoctrineLoader, type DoctrineCovenantLift } from '../hooks/useDoctrine';

export function CovenantLift() {
  const { data: lift, loading, error } = useCovenantLift();
  const items = lift ?? [];
  const totalLift = items.reduce((a: number, c: DoctrineCovenantLift) => a + Number(c.estimatedHarmAvoidedUsd), 0);
  const totalRefusals = items.reduce((a: number, c: DoctrineCovenantLift) => a + c.refusalsAddedByCovenant, 0);
  const totalBriefs = items.reduce((a: number, c: DoctrineCovenantLift) => a + c.briefsCompared, 0);

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · HELPFUL-ONLY SHADOW TWIN"
        title="Covenant Lift"
        subtitle="A helpful-only shadow runs every brief without the Covenant. The delta — refusals added, harms avoided, dollars not spent — is what governance is worth."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="HARM AVOIDED" value={fmtUsd(totalLift)} sub="this quarter" accent="#c9b787" />
        <KpiCard label="REFUSALS ADDED" value={totalRefusals} sub="by Covenant" accent="#c9b787" />
        <KpiCard label="BRIEFS COMPARED" value={totalBriefs} sub="governed vs shadow" accent="#c9b787" />
        <KpiCard label="AGENTS INSTRUMENTED" value={items.length} sub="all of them" accent="#c9b787" />
      </div>

      <Card className="mb-6">
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          The shadow twin is approved for measurement only — it cannot execute, send, or write. Every shadow output stays inside Glasswing.
          Lift quantification carries an Alignment Review sign-off (ARG-018).
        </p>
      </Card>

      <SectionTitle>Per-Agent Lift</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4">
        {items.map((row: DoctrineCovenantLift) => (
          <Card key={row.agentId}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[row.agentId]}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{row.shadowVersion}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold" style={{ color: '#c9b787' }}>{fmtUsd(Number(row.estimatedHarmAvoidedUsd))}</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>harm avoided</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Briefs</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{row.briefsCompared}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Added refusals</div>
                <div className="font-mono" style={{ color: '#c9b787' }}>{row.refusalsAddedByCovenant}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Δ incident rate</div>
                <div className="font-mono" style={{ color: '#c9b787' }}>{fmtPct(Number(row.deltaIncidentRate), 1)}</div>
              </div>
            </div>

            <div className="rounded border p-3 text-xs flex flex-col gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'var(--color-a11oy-border)' }}>
              <div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>BRIEF</div>
                <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.exampleCase?.brief}</div>
              </div>
              <div>
                <div className="font-mono" style={{ color: '#8a8a8a' }}>HELPFUL-ONLY</div>
                <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.exampleCase?.helpfulOnlyAction}</div>
              </div>
              <div>
                <div className="font-mono" style={{ color: '#c9b787' }}>GOVERNED</div>
                <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.exampleCase?.governedAction}</div>
              </div>
              <div className="pt-1 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="font-mono" style={{ color: '#c9b787' }}>OUTCOME</div>
                <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.exampleCase?.outcome}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
