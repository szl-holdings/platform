import { Activity, AlertTriangle, CheckCircle, Shield, X } from 'lucide-react';
import { BG, BORDER, MetricCard, SectionHeader, StatusBadge, StatusIcon, TEXT } from './shared';
import type { SystemHealth } from './types';

interface Props {
  systemHealth: { data?: SystemHealth; isLoading: boolean; error?: unknown };
}

export function HealthTab({ systemHealth }: Props) {
  const sh = systemHealth.data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {systemHealth.isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div style={{ width: 20, height: 20, border: '2px solid rgba(212,160,84,0.2)', borderTopColor: '#d4a054', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
      {sh && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <MetricCard icon={Activity} label="Total Checks" value={sh.summary.total} color="#d4a054" />
            <MetricCard icon={CheckCircle} label="Healthy" value={sh.summary.healthy} color="#6b8f71" />
            <MetricCard icon={AlertTriangle} label="Degraded" value={sh.summary.degraded} color="#d4a054" />
            <MetricCard icon={X} label="Down" value={sh.summary.down} color="#c45a4a" />
          </div>
          {['Database', 'Auth', 'Storage', 'Integrations', 'Webhooks', 'Billing', 'Notifications', 'Apps'].map((category) => {
            const checks = sh.checks.filter((c) => c.category === category);
            if (checks.length === 0) return null;
            return (
              <div key={category} style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT.secondary, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: '0.625rem' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {checks.map((check) => (
                    <div key={check.name} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: BG.section, gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <StatusIcon status={check.status} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT.primary }}>{check.name}</div>
                          <div style={{ fontSize: '10px', color: TEXT.tertiary, marginTop: '1px' }}>{check.details}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {check.latencyMs !== null && <span style={{ fontSize: '10px', color: TEXT.muted, fontFamily: 'var(--font-mono)' }}>{check.latencyMs}ms</span>}
                        <StatusBadge status={check.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
      {systemHealth.error && (
        <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(196,90,74,0.06)', border: '1px solid rgba(196,90,74,0.2)', color: '#c45a4a', fontSize: '12px' }}>
          System health data unavailable — API server may not be running with admin credentials.
        </div>
      )}
    </div>
  );
}
