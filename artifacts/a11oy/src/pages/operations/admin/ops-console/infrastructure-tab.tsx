import { Activity, AlertTriangle, CheckCircle, Clock, Server, Zap } from 'lucide-react';
import { BG, BORDER, MetricCard, ProgressBar, SectionHeader, StatusBadge, TEXT } from './shared';
import type { RmmHealth } from './types';

const PROVIDER_LABELS: Record<string, string> = {
  ninjaone: 'NinjaOne', connectwise_automate: 'CW Automate', connectwise_manage: 'CW Manage',
  halopsa: 'HaloPSA', datto_rmm: 'Datto RMM', autotask_psa: 'Autotask PSA',
};

interface Props {
  rmmHealth: { data?: RmmHealth; isLoading: boolean };
}

export function InfrastructureTab({ rmmHealth }: Props) {
  const rmm = rmmHealth.data;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Total Endpoints', value: rmm?.devices.total ?? 0, color: '#7aafcf', icon: Server },
            { label: 'Online', value: rmm?.devices.online ?? 0, color: '#6b8f71', icon: CheckCircle },
            { label: 'Critical Alerts', value: rmm?.devices.critical ?? 0, color: '#c45a4a', icon: AlertTriangle },
            { label: 'Pending Approvals', value: rmm?.healing.pendingApprovals ?? 0, color: '#d4a054', icon: Clock },
          ].map(({ label, value, color, icon: Icon }) => (
            <MetricCard key={label} icon={Icon} label={label} value={value} color={color} />
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Server} title="RMM / PSA Providers" subtitle="Connected provider status and device counts" />
        {rmmHealth.isLoading ? (
          <div style={{ color: TEXT.muted, fontSize: '12px' }}>Loading provider status…</div>
        ) : !rmm || rmm.providers.total === 0 ? (
          <div style={{ color: TEXT.muted, fontSize: '12px', padding: '0.75rem 0' }}>
            No providers configured. Add one at <span style={{ color: '#d4a054', fontFamily: 'var(--font-mono)' }}>/ops/provider-settings</span> in Sentra.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {rmm.providers.list.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', background: BG.section, border: `1px solid ${BORDER.muted}` }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT.primary }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: TEXT.tertiary, fontFamily: 'var(--font-mono)' }}>{PROVIDER_LABELS[p.provider] ?? p.provider} · {p.deviceCount ?? 0} devices</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Activity} title="Device Health Summary" subtitle="Aggregated metrics across all managed endpoints" />
        {rmm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Avg CPU', value: rmm.devices.avgCpu, unit: '%' },
              { label: 'Avg Memory', value: rmm.devices.avgMemory, unit: '%' },
              { label: 'Avg Disk', value: rmm.devices.avgDisk, unit: '%' },
            ].map(({ label, value, unit }) => {
              const color = value >= 85 ? '#c45a4a' : value >= 70 ? '#d4a054' : '#6b8f71';
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: TEXT.secondary }}>{label}</span>
                    <span style={{ color, fontFamily: 'var(--font-mono)' }}>{value}{unit}</span>
                  </div>
                  <ProgressBar pct={value} color={color} />
                </div>
              );
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
              {[
                { label: 'Online', value: rmm.devices.online, color: '#6b8f71' },
                { label: 'Warning', value: rmm.devices.warning, color: '#d4a054' },
                { label: 'Critical', value: rmm.devices.critical, color: '#c45a4a' },
                { label: 'Offline', value: rmm.devices.offline, color: 'rgba(255,255,255,0.3)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '0.5rem', borderRadius: '0.375rem', background: BG.section, border: `1px solid ${BORDER.muted}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: '10px', color: TEXT.tertiary }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : <div style={{ color: TEXT.muted, fontSize: '12px' }}>Loading device metrics…</div>}
      </div>

      <div style={{ gridColumn: '1 / -1', padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Zap} title="Auto-Healing Status" subtitle="Healing playbook execution statistics" />
        {rmm ? (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(rmm.healing.stats).map(([status, count]) => (
              <div key={status} style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', background: BG.section, border: `1px solid ${BORDER.muted}`, textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: status === 'completed' ? '#6b8f71' : status === 'failed' ? '#c45a4a' : status === 'pending_approval' ? '#d4a054' : TEXT.secondary }}>{count}</div>
                <div style={{ fontSize: '10px', color: TEXT.tertiary, textTransform: 'capitalize', marginTop: '2px' }}>{status.replace(/_/g, ' ')}</div>
              </div>
            ))}
            {rmm.healing.pendingApprovals > 0 && (
              <div style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', background: 'rgba(212,160,84,0.08)', border: '1px solid rgba(212,160,84,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle style={{ width: 14, height: 14, color: '#d4a054' }} />
                <span style={{ fontSize: '12px', color: '#d4a054' }}>{rmm.healing.pendingApprovals} execution{rmm.healing.pendingApprovals > 1 ? 's' : ''} awaiting approval in Sentra RMM Console</span>
              </div>
            )}
            {Object.keys(rmm.healing.stats).length === 0 && <div style={{ fontSize: '12px', color: TEXT.muted }}>No healing executions recorded yet. Configure playbooks in the Sentra Ops Console.</div>}
          </div>
        ) : <div style={{ color: TEXT.muted, fontSize: '12px' }}>Loading healing data…</div>}
      </div>
    </div>
  );
}
