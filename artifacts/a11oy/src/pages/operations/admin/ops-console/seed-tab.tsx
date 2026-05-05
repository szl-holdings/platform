import { AlertTriangle, CheckCircle, Database, X } from 'lucide-react';
import { BG, BORDER, MetricCard, SectionHeader, StatusBadge, StatusIcon, TEXT } from './shared';
import type { SeedValidation } from './types';

interface Props {
  seedData: { data?: SeedValidation; isLoading: boolean };
}

export function SeedTab({ seedData }: Props) {
  const sd = seedData.data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {sd && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <MetricCard icon={Database} label="Total Tables" value={sd.summary.total} color="#d4a054" />
            <MetricCard icon={CheckCircle} label="Seeded" value={sd.summary.passed} color="#6b8f71" />
            <MetricCard icon={AlertTriangle} label="Insufficient" value={sd.summary.failed} color="#c45a4a" />
            <MetricCard icon={X} label="Errors" value={sd.summary.errors} color="#c45a4a" />
          </div>
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Database} title="Seed Validation" subtitle="Expected row counts vs actual for all seeded tables" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {sd.results.map((row) => (
                <div key={row.table} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '5px', background: row.status === 'fail' || row.status === 'error' ? 'rgba(196,90,74,0.04)' : BG.section, fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusIcon status={row.status === 'pass' ? 'healthy' : row.status === 'fail' ? 'down' : 'degraded'} />
                    <span style={{ color: TEXT.primary, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{row.table}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{ color: TEXT.muted, fontSize: '10px' }}>{row.actual}/{row.expected} rows</span>
                    <StatusBadge status={row.status === 'pass' ? 'healthy' : row.status === 'fail' ? 'down' : 'degraded'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {seedData.isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div style={{ width: 20, height: 20, border: '2px solid rgba(212,160,84,0.2)', borderTopColor: '#d4a054', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
    </div>
  );
}
