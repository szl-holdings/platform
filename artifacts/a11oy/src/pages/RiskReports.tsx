import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityBadge } from '../components/ui';
import { useRiskReports, DoctrineLoader } from '../hooks/useDoctrine';

export function RiskReports() {
  const { data: reports, loading, error } = useRiskReports();
  const items = reports ?? [];
  const [selectedId, setSelectedId] = useState<string>('');
  const selId = selectedId || items[0]?.reportId || '';
  const report = items.find((r: any) => r.reportId === selId) ?? items[0];

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · RISK REPORTS"
        title="Quarterly Risk Report"
        subtitle="Frontier-lab style model card for the entire fleet of governed agents — capabilities, residual risks, sign-offs."
        status="LIVE"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {items.map((r: any) => (
          <button key={r.reportId} type="button" onClick={() => setSelectedId(r.reportId)}
            className="text-xs px-3 py-1.5 rounded font-mono"
            style={{
              backgroundColor: selId === r.reportId ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: selId === r.reportId ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${selId === r.reportId ? 'rgba(201,183,135,0.3)' : 'transparent'}`,
              cursor: 'pointer',
            }}>
            {r.period}
          </button>
        ))}
      </div>

      {report && (<>
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div>
            <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {report.period} · published {new Date(report.publishedAt).toLocaleString()}
            </div>
            <div className="text-base font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{report.headline}</div>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>
            {report.reportId}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{report.scope}</p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {(report.metrics as any[])?.map((m: any) => (
          <KpiCard key={m.label} label={m.label} value={m.value} accent="#c9b787" />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <SectionTitle>Capabilities</SectionTitle>
          <ul className="text-xs flex flex-col gap-1.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {(report.capabilities as string[])?.map((c: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: '#c9b787' }}>+</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle>Known Limitations</SectionTitle>
          <ul className="text-xs flex flex-col gap-1.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {(report.knownLimitations as string[])?.map((l: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: '#8a8a8a' }}>·</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <SectionTitle>Residual Risks</SectionTitle>
        <div className="flex flex-col gap-2">
          {(report.residualRisks as any[])?.map((r: any, i: number) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <SeverityBadge severity={r.severity} />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{r.area}</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>Mitigation: {r.mitigation}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Sign-offs</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(report.signoffs as any[])?.map((s: any, i: number) => (
            <div key={i} className="rounded border p-2.5" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{s.name}</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.role}</div>
            </div>
          ))}
        </div>
      </Card>
      </>)}
      </DoctrineLoader>
    </Layout>
  );
}
