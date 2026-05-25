import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Activity, AlertCircle, AlertTriangle, BarChart3, Clock, Cpu, Database, Globe, Radio, RefreshCw, Rss, Server, Shield, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { ConnectorsTab } from './connectors-tab';
import { ErrorsTab } from './errors-tab';
import { FeedsTab } from './feeds-tab';
import { HealthTab } from './health-tab';
import { InfrastructureTab } from './infrastructure-tab';
import { JobsTab } from './jobs-tab';
import { OverviewTab } from './overview-tab';
import { SeedTab } from './seed-tab';
import { BG, BORDER, MetricCard, StatusBadge, TEXT } from './shared';
import { formatBytes, formatTime, formatUptime } from './utils';
import type { AdminOverview, CacheBusStatus, ConnectorSummary, FeedHealth, JobStats, RmmHealth, SeedValidation, SystemHealth, TabKey } from './types';

const TABS: { key: TabKey; label: string; icon: any; getBadge?: (data: any) => number | undefined }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'health', label: 'System Health', icon: Shield },
  { key: 'jobs', label: 'Jobs & Queue', icon: Activity },
  { key: 'connectors', label: 'Connectors', icon: Globe },
  { key: 'seed', label: 'Seed Data', icon: Database },
  { key: 'feeds', label: 'Intel Feeds', icon: Rss },
  { key: 'errors', label: 'Error Summary', icon: AlertCircle },
  { key: 'infrastructure', label: 'Infrastructure', icon: Server },
];

export default function OpsConsole() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const overview = useStandardQuery<AdminOverview>({ queryKey: ['ops-overview', refreshKey], queryFn: () => apiFetch('/admin/overview'), refetchInterval: 30000 });
  const systemHealth = useStandardQuery<SystemHealth>({ queryKey: ['ops-system-health', refreshKey], queryFn: () => apiFetch('/admin/system-health'), refetchInterval: 60000 });
  const jobsData = useStandardQuery<JobStats>({ queryKey: ['ops-jobs', refreshKey], queryFn: () => apiFetch('/admin/jobs/stats'), refetchInterval: 30000 });
  const connectorsData = useStandardQuery<ConnectorSummary>({ queryKey: ['ops-connectors', refreshKey], queryFn: () => apiFetch('/admin/connectors'), refetchInterval: 60000 });
  const seedData = useStandardQuery<SeedValidation>({ queryKey: ['ops-seed', refreshKey], queryFn: () => apiFetch('/admin/seed/validate'), staleTime: 5 * 60 * 1000 });
  const feedHealth = useStandardQuery<FeedHealth>({ queryKey: ['ops-feed-health', refreshKey], queryFn: () => apiFetch('/admin/feed-health'), refetchInterval: 30000 });
  const rmmHealth = useStandardQuery<RmmHealth>({ queryKey: ['lyte-rmm-health', refreshKey], queryFn: () => apiFetch('/msp/rmm/health'), refetchInterval: 30000, enabled: activeTab === 'infrastructure' });
  const cacheBus = useStandardQuery<CacheBusStatus>({ queryKey: ['ops-cache-bus', refreshKey], queryFn: () => apiFetch('/admin/cache-bus'), refetchInterval: 15000 });

  const ov = overview.data;
  const sh = systemHealth.data;
  const jd = jobsData.data;
  const cd = connectorsData.data;
  const sd = seedData.data;
  const overallStatus: 'healthy' | 'degraded' | 'down' = sh?.status ?? (ov ? 'healthy' : 'degraded');

  const tabBadges: Partial<Record<TabKey, number | undefined>> = {
    health: sh ? sh.summary.degraded + sh.summary.down : undefined,
    jobs: jd?.stats?.running,
    connectors: cd ? cd.summary.manualRequired : undefined,
    seed: sd ? sd.summary.failed + sd.summary.errors : undefined,
    feeds: feedHealth.data ? feedHealth.data.summary.degraded + feedHealth.data.summary.down : undefined,
    infrastructure: rmmHealth.data?.devices.critical ?? undefined,
  };

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: TEXT.primary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target style={{ width: 16, height: 16, color: '#d4a054' }} /> Ops Console
          </h1>
          <p style={{ fontSize: '11px', color: TEXT.tertiary, marginTop: '2px' }}>Operational visibility: service health, deployment info, queue status, connector sync, and diagnostics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {cacheBus.data && (
            <div
              title={
                cacheBus.data.connected
                  ? `Cache sync bus connected on channel "${cacheBus.data.channel}"${cacheBus.data.lastConnectedAt ? ` since ${formatTime(cacheBus.data.lastConnectedAt)}` : ''}`
                  : `Cache sync bus DISCONNECTED — feature-flag and runtime-config changes are falling back to per-worker TTL (30–60s). Last error: ${cacheBus.data.lastError ?? 'unknown'}. Reconnect attempts: ${cacheBus.data.reconnectAttempts}.`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                background: cacheBus.data.connected ? 'rgba(107,143,113,0.1)' : 'rgba(196,90,74,0.12)',
                border: `1px solid ${cacheBus.data.connected ? 'rgba(107,143,113,0.3)' : 'rgba(196,90,74,0.35)'}`,
                color: cacheBus.data.connected ? '#6b8f71' : '#c45a4a',
              }}
            >
              <Radio style={{ width: 10, height: 10 }} />
              Cache bus: {cacheBus.data.connected ? 'connected' : 'down'}
            </div>
          )}
          <StatusBadge status={overallStatus} />
          <button onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '5px 10px', borderRadius: '6px', background: BG.card, border: `1px solid ${BORDER.subtle}`, color: TEXT.secondary, cursor: 'pointer' }}>
            <RefreshCw style={{ width: 12, height: 12, ...(isRefreshing ? { animation: 'spin 1s linear infinite' } : {}) }} />
            Refresh
          </button>
        </div>
      </div>

      {cacheBus.data && !cacheBus.data.connected && cacheBus.data.started && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(196,90,74,0.08)',
            border: '1px solid rgba(196,90,74,0.25)',
            color: '#c45a4a',
            fontSize: '11px',
            marginBottom: '1rem',
          }}
        >
          <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: '1px' }} />
          <div style={{ lineHeight: 1.5 }}>
            <strong style={{ fontWeight: 600 }}>Cache sync bus is disconnected.</strong>{' '}
            Feature-flag and runtime-config changes will not propagate between workers instantly — each worker will only pick up changes when its local TTL expires (30s for flags, 60s for runtime config). Kill-switches may take up to a minute to take effect cluster-wide.
            {cacheBus.data.lastDisconnectedAt && (
              <span style={{ color: TEXT.muted, marginLeft: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                Down since {formatTime(cacheBus.data.lastDisconnectedAt)} · {cacheBus.data.reconnectAttempts} reconnect attempt(s)
                {cacheBus.data.lastReconnectAttemptAt ? ` · last tried ${formatTime(cacheBus.data.lastReconnectAttemptAt)}` : ''}
                {cacheBus.data.nextReconnectAt ? ` · next retry ${formatTime(cacheBus.data.nextReconnectAt)}` : ''}
              </span>
            )}
            {cacheBus.data.lastError && (
              <div style={{ color: TEXT.muted, fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: '2px' }}>
                Last error: {cacheBus.data.lastError}
              </div>
            )}
          </div>
        </div>
      )}

      {ov && (
        <div style={{ fontSize: '10px', color: TEXT.muted, fontFamily: 'var(--font-mono)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ width: 10, height: 10 }} />
          Updated {formatTime(ov.timestamp)} · Uptime {formatUptime(ov.system.uptime)} · Node {ov.system.nodeVersion}
        </div>
      )}

      {ov && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <MetricCard icon={Server} label="Apps" value={`${ov.counts.activeApps}/${ov.counts.apps}`} sub="active" color="#d4a054" />
          <MetricCard icon={Globe} label="Connectors" value={`${ov.counts.liveConnectors}/${ov.counts.connectors}`} sub="live" color="#6b8f71" />
          <MetricCard icon={Users} label="Users" value={`${ov.counts.activeUsers}/${ov.counts.users}`} sub="active" color="#4a90b8" />
          <MetricCard icon={Cpu} label="Heap" value={`${Math.round((ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal) * 100)}%`} sub={formatBytes(ov.system.memoryUsage.heapUsed)} color={ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal > 0.8 ? '#c45a4a' : '#d4a054'} />
          <MetricCard icon={Database} label="DB Latency" value={`${ov.database.latency}ms`} sub={ov.database.status} color={ov.database.status === 'healthy' ? '#6b8f71' : '#c45a4a'} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '2px', marginBottom: '1.25rem', background: BG.section, borderRadius: '8px', padding: '3px', border: `1px solid ${BORDER.subtle}` }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge = tabBadges[tab.key];
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: isActive ? 600 : 400, cursor: 'pointer', border: 'none', transition: 'all 0.15s ease', background: isActive ? 'rgba(212,160,84,0.1)' : 'transparent', color: isActive ? '#d4a054' : TEXT.tertiary }}>
              <tab.icon style={{ width: 12, height: 12 }} />
              {tab.label}
              {badge !== undefined && Number(badge) > 0 && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '9px', background: '#c45a4a', color: '#fff', minWidth: '16px', textAlign: 'center' }}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab ov={ov} cd={cd} />}
      {activeTab === 'health' && <HealthTab systemHealth={systemHealth} />}
      {activeTab === 'jobs' && <JobsTab jobsData={jobsData} />}
      {activeTab === 'connectors' && <ConnectorsTab connectorsData={connectorsData} />}
      {activeTab === 'seed' && <SeedTab seedData={seedData} />}
      {activeTab === 'feeds' && <FeedsTab feedHealth={feedHealth} />}
      {activeTab === 'errors' && <ErrorsTab sh={sh} />}
      {activeTab === 'infrastructure' && <InfrastructureTab rmmHealth={rmmHealth} />}
    </div>
  );
}
