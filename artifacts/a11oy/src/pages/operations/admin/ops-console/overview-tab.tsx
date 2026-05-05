import { Cpu, Database, Globe, Radio, Server, Users, Zap } from 'lucide-react';
import { BG, BORDER, MetricCard, ProgressBar, SectionHeader, StatusBadge, StatusIcon, TEXT } from './shared';
import { formatBytes, formatUptime } from './utils';
import type { AdminOverview, ConnectorSummary } from './types';

interface Props {
  ov: AdminOverview | undefined;
  cd: ConnectorSummary | undefined;
}

export function OverviewTab({ ov, cd }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Server} title="System Runtime" subtitle="Node.js process and resource utilization" />
        {ov ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'Platform', value: ov.system.platform },
              { label: 'Node', value: ov.system.nodeVersion },
              { label: 'Uptime', value: formatUptime(ov.system.uptime) },
              { label: 'Heap Used', value: formatBytes(ov.system.memoryUsage.heapUsed) },
              { label: 'Heap Total', value: formatBytes(ov.system.memoryUsage.heapTotal) },
              { label: 'RSS', value: formatBytes(ov.system.memoryUsage.rss) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: TEXT.secondary }}>{label}</span>
                <span style={{ color: TEXT.primary, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{value}</span>
              </div>
            ))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: TEXT.muted, marginBottom: '4px' }}>
                <span>Heap usage</span>
                <span>{Math.round((ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal) * 100)}%</span>
              </div>
              <ProgressBar pct={(ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal) * 100} color={ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal > 0.8 ? '#c45a4a' : '#6b8f71'} />
            </div>
          </div>
        ) : <div style={{ color: TEXT.muted, fontSize: '12px' }}>Loading system info...</div>}
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Database} title="Database" subtitle="PostgreSQL connection pool and query health" />
        {ov ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <StatusIcon status={ov.database.status} />
              <StatusBadge status={ov.database.status === 'healthy' ? 'healthy' : 'degraded'} />
            </div>
            {[
              { label: 'Latency', value: `${ov.database.latency}ms` },
              { label: 'Connections', value: `${ov.database.connections}/${ov.database.maxConnections}` },
              { label: 'Status', value: ov.database.status },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: TEXT.secondary }}>{label}</span>
                <span style={{ color: TEXT.primary, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{value}</span>
              </div>
            ))}
            <div style={{ paddingTop: '8px', borderTop: `1px solid ${BORDER.subtle}` }}>
              <div style={{ fontSize: '10px', color: TEXT.tertiary }}>Storage</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: TEXT.secondary }}>Object Storage</span>
                <StatusBadge status={ov.storage.status === 'healthy' ? 'healthy' : 'degraded'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                <span style={{ color: TEXT.secondary }}>Used</span>
                <span style={{ color: TEXT.primary, fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{formatBytes(ov.storage.usedBytes)} / {formatBytes(ov.storage.totalBytes)}</span>
              </div>
              <ProgressBar pct={(ov.storage.usedBytes / ov.storage.totalBytes) * 100} />
            </div>
          </div>
        ) : <div style={{ color: TEXT.muted, fontSize: '12px' }}>Loading...</div>}
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Globe} title="Connector Sync" subtitle="Integration adapter health and sync status" />
        {cd ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[
                { label: 'Total', value: cd.summary.total, color: TEXT.primary },
                { label: 'Live', value: cd.summary.liveConfigured, color: '#6b8f71' },
                { label: 'Demo', value: cd.summary.mockedDemoMode, color: '#d4a054' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '0.5rem', borderRadius: '0.375rem', background: BG.section }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: '9px', color: TEXT.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {cd.connectors.slice(0, 6).map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
                  <span style={{ color: TEXT.secondary }}>{c.name}</span>
                  <StatusBadge status={c.status === 'LIVE_CONFIGURED' ? 'healthy' : c.status === 'MOCKED_DEMO_MODE' ? 'degraded' : 'down'} />
                </div>
              ))}
              {cd.connectors.length > 6 && <div style={{ fontSize: '10px', color: TEXT.muted, paddingTop: '4px' }}>+{cd.connectors.length - 6} more connectors</div>}
            </div>
          </div>
        ) : <div style={{ color: TEXT.muted, fontSize: '12px' }}>Loading connectors...</div>}
      </div>

      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Radio} title="Model Lane & Worldline" subtitle="AI inference layer and event fabric freshness" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { lane: 'Fast Lane (GPT-4o)', latency: '~800ms', status: 'healthy', model: 'gpt-4o' },
            { lane: 'Deep Lane (Claude 3.5)', latency: '~2.1s', status: 'healthy', model: 'claude-3-5-sonnet' },
            { lane: 'Economy Lane (Gemini)', latency: '~1.2s', status: 'healthy', model: 'gemini-1.5-flash' },
          ].map((lane) => (
            <div key={lane.lane} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: BG.section, border: `1px solid ${BORDER.subtle}` }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: TEXT.primary }}>{lane.lane}</div>
                <div style={{ fontSize: '10px', color: TEXT.muted, fontFamily: 'var(--font-mono)' }}>{lane.model}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: TEXT.tertiary, fontFamily: 'var(--font-mono)' }}>{lane.latency}</span>
                <StatusBadge status={lane.status as 'healthy'} />
              </div>
            </div>
          ))}
          <div style={{ paddingTop: '8px', borderTop: `1px solid ${BORDER.subtle}` }}>
            <div style={{ fontSize: '10px', color: TEXT.tertiary, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>Worldline Event Fabric</div>
            {[
              { source: 'Platform signals', freshness: 'Live', status: 'healthy' },
              { source: 'Terra NYC ingestion', freshness: 'Scheduled (6h)', status: 'healthy' },
              { source: 'Vessel positions', freshness: '5m interval', status: 'healthy' },
              { source: 'Aegis threat feed', freshness: 'Seeded', status: 'degraded' },
            ].map((s) => (
              <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
                <span style={{ color: TEXT.secondary }}>{s.source}</span>
                <span style={{ color: s.status === 'healthy' ? '#6b8f71' : '#d4a054', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{s.freshness}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
