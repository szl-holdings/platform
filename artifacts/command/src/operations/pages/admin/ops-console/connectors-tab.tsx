import { AlertTriangle, CheckCircle, Globe, WifiOff } from 'lucide-react';
import { BG, BORDER, MetricCard, SectionHeader, StatusBadge, TEXT } from './shared';
import type { ConnectorSummary } from './types';

interface Props {
  connectorsData: { data?: ConnectorSummary; error?: unknown };
}

export function ConnectorsTab({ connectorsData }: Props) {
  const cd = connectorsData.data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {cd && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <MetricCard icon={Globe} label="Total" value={cd.summary.total} color="#d4a054" />
            <MetricCard icon={CheckCircle} label="Live" value={cd.summary.liveConfigured} color="#6b8f71" />
            <MetricCard icon={AlertTriangle} label="Demo Mode" value={cd.summary.mockedDemoMode} color="#d4a054" />
            <MetricCard icon={WifiOff} label="Needs Config" value={cd.summary.manualRequired} color="#c45a4a" />
          </div>
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Globe} title="All Connectors" subtitle="Integration adapter status and sync health" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
              {cd.connectors.map((c) => {
                const status = c.status === 'LIVE_CONFIGURED' ? 'healthy' : c.status === 'MOCKED_DEMO_MODE' ? 'degraded' : 'down';
                return (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: BG.section, fontSize: '11px' }}>
                    <div>
                      <div style={{ color: TEXT.primary, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ color: TEXT.muted, fontSize: '10px' }}>{c.category}</div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {connectorsData.error && (
        <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(196,90,74,0.06)', border: '1px solid rgba(196,90,74,0.2)', color: '#c45a4a', fontSize: '12px' }}>
          Connector data unavailable. Admin credentials required.
        </div>
      )}
    </div>
  );
}
