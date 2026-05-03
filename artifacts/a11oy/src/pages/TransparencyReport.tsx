import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge, ActionButton } from '../components/ui';
import { useTransparencyReports, DoctrineLoader } from '../hooks/useDoctrine';

const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 10);
const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtSigned = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;

function NextReportSchedule({ currentReport }: { currentReport: any }) {
  const nextStart = new Date(currentReport.endedAt);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 90);
  const now = Date.now();
  const daysUntilPublish = Math.max(0, Math.floor((nextEnd.getTime() - now) / 86400000));
  const elapsed = Math.max(0, now - nextStart.getTime());
  const total = nextEnd.getTime() - nextStart.getTime();
  const pct = Math.min(100, (elapsed / total) * 100);

  return (
    <Card>
      <SectionTitle>Next report schedule</SectionTitle>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          {fmtDate(nextStart.toISOString())} → {fmtDate(nextEnd.toISOString())}
        </span>
        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>
          {daysUntilPublish}d until publication
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'rgba(201,183,135,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#c9b787', transition: 'width 0.3s' }} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        <div className="p-2 rounded border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
          <span className="font-mono block mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Data aggregation</span>
          <StatusBadge status={pct > 10 ? 'ok' : 'info'} label={pct > 10 ? 'RUNNING' : 'PENDING'} />
        </div>
        <div className="p-2 rounded border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
          <span className="font-mono block mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Reviewer signoff</span>
          <StatusBadge status={pct > 85 ? 'ok' : 'info'} label={pct > 85 ? 'OPEN' : 'NOT YET'} />
        </div>
        <div className="p-2 rounded border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
          <span className="font-mono block mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Auto-publish</span>
          <StatusBadge status="info" label={`T-${daysUntilPublish}D`} />
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.7 }}>
        Reports auto-aggregate metrics from the proof ledger, CAVD pipeline, behavioral audit logs, and welfare telemetry. Named-reviewer signoff opens 5 days before publication. Auto-publish on the 90-day cadence; permalink generated and posted to the public Trust Portal.
      </p>
    </Card>
  );
}

export function TransparencyReport() {
  const { data: reports, loading, error } = useTransparencyReports();
  const items = reports ?? [];
  const [activeId, setActiveId] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  const selId = activeId || items[0]?.reportId || '';
  const active = items.find((r: any) => r.reportId === selId) ?? items[0];

  const downloadPdf = async () => {
    if (!active) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const margin = 48;
      let y = margin;
      const metrics = active.metrics as any;
      const narrativeParagraphs = active.narrativeParagraphs as string[];
      const signoffs = active.signoffs as any[];

      doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
      doc.text('A11oy — 90-Day Transparency Report', margin, y); y += 26;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(active.label, margin, y); y += 16;
      doc.text(`Published: ${fmtDate(active.publishedAt)} · Visibility: ${active.visibility}`, margin, y); y += 22;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Metrics', margin, y); y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const lines = [
        `Governed decisions: ${fmtNum(metrics.governedDecisions)}`,
        `Approvals required: ${fmtNum(metrics.approvalsRequired)}`,
        `Policy blocks: ${fmtNum(metrics.policyBlocks)}`,
        `Behavioral-audit findings: ${fmtNum(metrics.behavioralAuditFindings)}`,
        `Robustness delta: ${fmtSigned(metrics.robustnessDelta)}`,
        `Welfare interventions: ${fmtNum(metrics.welfareInterventions)}`,
        `CAVD: opened ${metrics.cavd.opened} · embargoed ${metrics.cavd.embargoed} · disclosed ${metrics.cavd.disclosed} · patched ${metrics.cavd.patched}`,
      ];
      lines.forEach(l => { doc.text(l, margin, y); y += 14; });
      y += 8;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Narrative', margin, y); y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      narrativeParagraphs.forEach(p => {
        const wrapped = doc.splitTextToSize(p, 612 - margin * 2);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 13 + 6;
      });
      y += 8;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('Signoffs', margin, y); y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      signoffs.forEach(s => { doc.text(`${s.role}: ${s.actor} · ${fmtDate(s.signedAt)}`, margin, y); y += 14; });

      doc.save(`a11oy-${active.reportId}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      {active && (() => {
        const metrics = active.metrics as any;
        const narrativeParagraphs = active.narrativeParagraphs as string[];
        const signoffs = active.signoffs as any[];
        const notableEvents = active.notableEvents as any[];

        return (
        <>
      <PageHeader
        label="DOCTRINE · 90-DAY TRANSPARENCY"
        title="90-Day Transparency Report"
        subtitle="Quarterly cadence. Aggregated metrics, plain-language narrative, named-reviewer signoff. Permalinked on the public Trust Portal."
        status="LIVE"
      >
        <ActionButton variant="primary" onClick={downloadPdf} disabled={downloading}>
          {downloading ? 'Generating…' : 'Download PDF'}
        </ActionButton>
      </PageHeader>

      <Card className="mb-6">
        <SectionTitle>Reports</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          {items.map((r: any) => (
            <button
              key={r.reportId}
              onClick={() => setActiveId(r.reportId)}
              className="px-3 py-2 rounded text-xs font-mono"
              style={{
                backgroundColor: selId === r.reportId ? 'rgba(201,183,135,0.12)' : 'transparent',
                color: selId === r.reportId ? '#c9b787' : 'var(--color-a11oy-text-sub)',
                border: `1px solid ${selId === r.reportId ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`,
                cursor: 'pointer',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="GOVERNED DECISIONS" value={fmtNum(metrics.governedDecisions)} accent="#c9b787" />
        <KpiCard label="APPROVALS REQUIRED" value={fmtNum(metrics.approvalsRequired)} accent="#c9b787" />
        <KpiCard label="POLICY BLOCKS" value={fmtNum(metrics.policyBlocks)} accent="#c9b787" />
        <KpiCard label="ROBUSTNESS DELTA" value={fmtSigned(metrics.robustnessDelta)} sub="vs prev period" accent="#c9b787" trend={metrics.robustnessDelta >= 0 ? 'up' : 'down'} />
        <KpiCard label="BEHAVIORAL FINDINGS" value={fmtNum(metrics.behavioralAuditFindings)} accent="#c9b787" />
        <KpiCard label="WELFARE INTERVENTIONS" value={fmtNum(metrics.welfareInterventions)} accent="#c9b787" />
        <KpiCard label="CAVD OPENED" value={fmtNum(metrics.cavd.opened)} sub={`${metrics.cavd.disclosed} disclosed`} accent="#c9b787" />
        <KpiCard label="CAVD PATCHED" value={fmtNum(metrics.cavd.patched)} accent="#c9b787" />
      </div>

      <Card className="mb-4">
        <SectionTitle>Narrative</SectionTitle>
        <div className="flex flex-col gap-3">
          {narrativeParagraphs.map((p: string, i: number) => (
            <p key={i} className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{p}</p>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>Signoffs</SectionTitle>
          {signoffs.map((s: any, i: number) => (
            <InfoRow
              key={i}
              label={s.role.replace('-', ' ')}
              value={
                <span className="flex items-center gap-2">
                  <span className="font-mono">{s.actor}</span>
                  <StatusBadge status="ok" label={`signed ${fmtDate(s.signedAt)}`} />
                </span>
              }
            />
          ))}
        </Card>
        <Card>
          <SectionTitle>Notable events</SectionTitle>
          {notableEvents.map((e: any, i: number) => (
            <InfoRow key={i} label={fmtDate(e.at)} value={e.summary} />
          ))}
        </Card>
      </div>

      <Card className="mb-4">
        <SectionTitle>Publication</SectionTitle>
        <InfoRow label="visibility" value={<StatusBadge status="ok" label={active.visibility.toUpperCase()} />} />
        <InfoRow label="permalink" value={<span className="font-mono" style={{ color: '#c9b787' }}>{active.permalink}</span>} />
        <InfoRow label="period" value={`${fmtDate(active.startedAt)} → ${fmtDate(active.endedAt)}`} />
      </Card>

      <NextReportSchedule currentReport={active} />
        </>
        );
      })()}
      </DoctrineLoader>
    </Layout>
  );
}
