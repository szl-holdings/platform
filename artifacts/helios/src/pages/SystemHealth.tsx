import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle, Clock, Database, Radio, Zap } from 'lucide-react';
import { heliosApi } from '../lib/api';

function HealthRow({ label, value, status }: { label: string; value: string; status: 'ok' | 'warn' | 'err' }) {
  const color = status === 'ok' ? '#34d399' : status === 'warn' ? '#f59e0b' : '#f87171';
  const Icon = status === 'ok' ? CheckCircle : status === 'warn' ? Clock : Activity;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <Icon size={12} color={color} />
      <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--helios-text-dim)' }}>{label}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
    </div>
  );
}

export default function SystemHealth() {
  const { data: stats } = useQuery({ queryKey: ['helios-stats'], queryFn: () => heliosApi.getStats() });
  const { data: scanners } = useQuery({ queryKey: ['scanners'], queryFn: () => heliosApi.getScanners() });

  const errorCount = (scanners?.scanners ?? []).filter(s => s.status === 'error').length;
  const degradedCount = (scanners?.scanners ?? []).filter(s => s.status === 'degraded').length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Activity size={20} color="var(--helios-amber)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
            System Health
          </h1>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)' }}>
          Runtime status of the Helios intelligence pipeline.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Signal pipeline */}
        <div className="section-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Radio size={14} color="var(--helios-amber)" />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '0.02em' }}>Signal Pipeline</div>
          </div>
          <HealthRow label="Scanners running" value={`${stats?.scannersActive ?? '—'} / ${(scanners?.scanners ?? []).length}`} status="ok" />
          <HealthRow label="Scanner errors" value={String(errorCount)} status={errorCount > 0 ? 'err' : 'ok'} />
          <HealthRow label="Scanner degraded" value={String(degradedCount)} status={degradedCount > 0 ? 'warn' : 'ok'} />
          <HealthRow label="Signals today" value={String(stats?.signalsToday ?? '—')} status="ok" />
        </div>

        {/* Evolution engine */}
        <div className="section-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={14} color="var(--helios-amber)" />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '0.02em' }}>Evolution Engine</div>
          </div>
          <HealthRow label="Open proposals" value={String(stats?.proposalsOpen ?? '—')} status="ok" />
          <HealthRow label="Avg signal confidence" value={stats ? `${Math.round(stats.avgConfidence * 100)}%` : '—'} status={stats && stats.avgConfidence >= 0.7 ? 'ok' : 'warn'} />
          <HealthRow label="Evolution cadence" value="Daily" status="ok" />
          <HealthRow label="Memo cadence" value="Weekly" status="ok" />
        </div>

        {/* Mythos Index */}
        <div className="section-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Database size={14} color="var(--helios-amber)" />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '0.02em' }}>Mythos Index</div>
          </div>
          <HealthRow label="Vector store" value="Online" status="ok" />
          <HealthRow label="Graph backend" value="Online" status="ok" />
          <HealthRow label="MCP endpoint" value="/api/helios/mcp" status="ok" />
          <HealthRow label="Semantic search" value="Available" status="ok" />
        </div>

        {/* Integrations */}
        <div className="section-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Activity size={14} color="var(--helios-amber)" />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '0.02em' }}>Integrations</div>
          </div>
          <HealthRow label="Pulse widget" value="Connected" status="ok" />
          <HealthRow label="Command inbox" value="Connected" status="ok" />
          <HealthRow label="Project tasks push" value="Available" status="ok" />
          <HealthRow label="Benchmark runner" value="Scheduled" status="ok" />
        </div>
      </div>

      {/* Top signal kinds */}
      {stats?.topKinds && (
        <div className="section-card" style={{ padding: '16px 18px', marginTop: 16 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 12 }}>
            Signal Distribution (Today)
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {stats.topKinds.map(({ kind, count }) => (
              <div key={kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--helios-amber)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--helios-text-muted)', marginTop: 4, textTransform: 'capitalize', fontWeight: 600 }}>
                  {kind}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
