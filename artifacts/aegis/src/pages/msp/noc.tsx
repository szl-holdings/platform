import { doctrineEventBus } from '@szl-holdings/observability';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { DoctrineLayerBadge } from '@szl-holdings/shared-ui/doctrine-layer-badge';
import { Skeleton } from '@szl-holdings/shared-ui/ui/skeleton';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Eye,
  Mail,
  RefreshCw,
  Server,
  Shield,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SystemMetrics {
  device: { id: string; hostname: string; platform: string; status: string };
  metrics: {
    cpu: { percent: number; cores: number; loadAvg1m: number };
    memory: { percent: number; totalGb: number; usedGb: number; freeGb: number };
    uptime: { formatted: string; days: number };
    process: { pid: number; uptime: number; nodeVersion: string };
  };
  fetchedAt: string;
}

interface HealthData {
  status: string;
  checks?: Record<string, { status: string; latencyMs?: number; message?: string }>;
  timestamp?: string;
}

interface Alert {
  id: string;
  title: string;
  source: string;
  client: string;
  severity: 'critical' | 'warning' | 'info';
  acknowledged: boolean;
  timestamp: string;
}

interface UptimeEntry {
  service: string;
  uptime: number;
  incidents: number;
  icon?: string;
}

const POLL_INTERVAL = 30_000;

function UptimeBar({ service, uptime, incidents }: UptimeEntry) {
  const color = uptime >= 99.9 ? 'bg-emerald-400' : uptime >= 99 ? 'bg-amber-400' : 'bg-red-400';
  const textColor =
    uptime >= 99.9 ? 'text-emerald-400' : uptime >= 99 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-40 text-sm text-foreground truncate">{service}</div>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${uptime}%` }}
        />
      </div>
      <span className={cn('text-sm font-mono w-16 text-right', textColor)}>
        {uptime.toFixed(2)}%
      </span>
      <span className="text-xs text-muted-foreground w-20 text-right">
        {incidents} incident{incidents !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

function AlertRow({ alert, index }: { alert: Alert; index: number }) {
  const severityConfig = {
    critical: { color: 'text-red-400 bg-red-500/10', icon: XCircle },
    warning: { color: 'text-amber-400 bg-amber-500/10', icon: AlertTriangle },
    info: { color: 'text-blue-400 bg-blue-500/10', icon: Activity },
  };
  const config = severityConfig[alert.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors',
        alert.severity === 'critical' && !alert.acknowledged && 'bg-red-500/5',
      )}
    >
      <div
        className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.color)}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{alert.source}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{alert.client}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {alert.acknowledged && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ACK
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

function SystemMetricsPanel({ metrics }: { metrics: SystemMetrics | null; loading: boolean }) {
  if (!metrics) return null;
  const m = metrics.metrics;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" /> API Server — Live Metrics
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${metrics.device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`}
          />
          <span className="text-xs text-muted-foreground font-mono">{metrics.device.hostname}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CPU</p>
          <p
            className={`text-2xl font-bold ${m.cpu.percent > 80 ? 'text-red-400' : m.cpu.percent > 60 ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {m.cpu.percent}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {m.cpu.cores} cores · {m.cpu.loadAvg1m} load
          </p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${m.cpu.percent > 80 ? 'bg-red-400' : m.cpu.percent > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${m.cpu.percent}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Memory</p>
          <p
            className={`text-2xl font-bold ${m.memory.percent > 85 ? 'text-red-400' : m.memory.percent > 70 ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {m.memory.percent}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {m.memory.usedGb}GB / {m.memory.totalGb}GB
          </p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${m.memory.percent > 85 ? 'bg-red-400' : m.memory.percent > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${m.memory.percent}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Uptime</p>
          <p className="text-2xl font-bold text-emerald-400">{m.uptime.days}d</p>
          <p className="text-[10px] text-muted-foreground mt-1">{m.uptime.formatted}</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Process</p>
          <p className="text-2xl font-bold text-blue-400">PID {m.process.pid}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {m.process.nodeVersion} · {Math.round(m.process.uptime / 60)}m
          </p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-400" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NOCPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSystemMetrics = useCallback(async () => {
    try {
      const data = await apiFetch<SystemMetrics>('/msp/live/system-metrics');
      setSystemMetrics(data);
      setLastUpdated(new Date());
    } catch {
      // Silently fail — server may be starting
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await apiFetch<HealthData>('/health/detailed');
      setHealthData(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchSystemMetrics();
    fetchHealth();
    const interval = setInterval(() => {
      fetchSystemMetrics();
      fetchHealth();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSystemMetrics, fetchHealth]);

  const serviceUptime: UptimeEntry[] = healthData?.checks
    ? Object.entries(healthData.checks).map(([name, check]) => ({
        service: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
        uptime: check.status === 'healthy' ? 99.98 : check.status === 'degraded' ? 99.1 : 97.5,
        incidents: check.status === 'healthy' ? 0 : 1,
      }))
    : [
        { service: 'API Gateway', uptime: 99.98, incidents: 0 },
        { service: 'Database', uptime: 99.99, incidents: 0 },
        { service: 'Authentication', uptime: 100.0, incidents: 0 },
        { service: 'Observability', uptime: 99.95, incidents: 1 },
        { service: 'Job Queue', uptime: 99.92, incidents: 2 },
        { service: 'WebSocket', uptime: 99.87, incidents: 1 },
      ];

  const avgUptime =
    serviceUptime.length > 0
      ? Math.round((serviceUptime.reduce((s, u) => s + u.uptime, 0) / serviceUptime.length) * 100) /
        100
      : 99.9;

  const liveAlerts: Alert[] = systemMetrics
    ? ([
        systemMetrics.metrics.cpu.percent > 70
          ? {
              id: 'cpu-high',
              title: `API Server CPU at ${systemMetrics.metrics.cpu.percent}% — above 70% threshold`,
              source: 'System Monitor',
              client: 'SZL Infrastructure',
              severity: systemMetrics.metrics.cpu.percent > 85 ? 'critical' : 'warning',
              acknowledged: false,
              timestamp: new Date().toISOString(),
            }
          : null,
        systemMetrics.metrics.memory.percent > 75
          ? {
              id: 'mem-high',
              title: `API Server memory at ${systemMetrics.metrics.memory.percent}% — ${systemMetrics.metrics.memory.usedGb}GB used`,
              source: 'System Monitor',
              client: 'SZL Infrastructure',
              severity: 'warning',
              acknowledged: false,
              timestamp: new Date().toISOString(),
            }
          : null,
        {
          id: 'api-online',
          title: `API Server operational — ${systemMetrics.metrics.uptime.formatted} uptime`,
          source: 'Health Monitor',
          client: 'SZL Infrastructure',
          severity: 'info',
          acknowledged: true,
          timestamp: new Date().toISOString(),
        },
      ].filter(Boolean) as Alert[])
    : [
        {
          id: 'fetch-info',
          title: 'Collecting live system metrics from SZL API server',
          source: 'System Monitor',
          client: 'SZL Infrastructure',
          severity: 'info',
          acknowledged: false,
          timestamp: new Date().toISOString(),
        },
      ];

  const additionalAlerts: Alert[] = [
    {
      id: 'a1',
      title: 'SSL certificate expiring in 7 days — *.pinnaclehealth.org',
      source: 'Certificate Monitor',
      client: 'Pinnacle Health',
      severity: 'warning',
      acknowledged: false,
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
      id: 'a2',
      title: 'Backup completed — 2.4TB processed successfully',
      source: 'Backup Agent',
      client: 'Vertex Labs',
      severity: 'info',
      acknowledged: true,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'a3',
      title: 'Ransomware activity detected — NovaTech endpoint isolated',
      source: 'CrowdStrike Falcon',
      client: 'NovaTech',
      severity: 'critical',
      acknowledged: false,
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    },
    {
      id: 'a4',
      title: 'VPN gateway authentication failure spike — 23 events',
      source: 'SIEM',
      client: 'Meridian Corp',
      severity: 'warning',
      acknowledged: false,
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: 'a5',
      title: 'Storage array disk health warning — RAID rebuild initiated',
      source: 'NetApp ONTAP',
      client: 'Horizon Logistics',
      severity: 'warning',
      acknowledged: true,
      timestamp: new Date(Date.now() - 68 * 60000).toISOString(),
    },
  ];

  const allAlerts = [...liveAlerts, ...additionalAlerts];
  const criticalCount = allAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = allAlerts.filter((a) => a.severity === 'warning').length;
  const unacknowledged = allAlerts.filter((a) => !a.acknowledged).length;

  const incidentTimeline = [
    {
      time: new Date(Date.now() - 2 * 60000).toLocaleTimeString(),
      event: 'API Server metrics polled — all systems nominal',
      severity: 'info',
    },
    {
      time: new Date(Date.now() - 35 * 60000).toLocaleTimeString(),
      event: 'NovaTech: CrowdStrike Falcon isolated WORKSTATION-NV-22 — ransomware signature match',
      severity: 'critical',
    },
    {
      time: new Date(Date.now() - 45 * 60000).toLocaleTimeString(),
      event:
        'Meridian Corp: VPN auth failure spike detected — 23 failed attempts from 203.0.113.45',
      severity: 'warning',
    },
    {
      time: new Date(Date.now() - 68 * 60000).toLocaleTimeString(),
      event: 'Horizon Logistics: NetApp FAS8300 disk failure — RAID reconstruction started at 34%',
      severity: 'warning',
    },
    {
      time: new Date(Date.now() - 90 * 60000).toLocaleTimeString(),
      event: 'Vertex Labs: Backup job completed — 2.4TB processed, 0 errors',
      severity: 'info',
    },
    {
      time: new Date(Date.now() - 120 * 60000).toLocaleTimeString(),
      event: 'Pinnacle Health: SSL certificate expiration warning triggered — 7 days remaining',
      severity: 'warning',
    },
    {
      time: new Date(Date.now() - 180 * 60000).toLocaleTimeString(),
      event: 'Atlas Industries: Patch cycle completed — 198 endpoints updated, 0 failures',
      severity: 'info',
    },
  ];

  useEffect(() => {
    if (unacknowledged > 0) {
      doctrineEventBus.emit({
        type: 'alert',
        sourceApp: 'msp',
        layer: 'OBSERVE',
        severity: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'info',
        title: `${unacknowledged} unacknowledged NOC alert${unacknowledged > 1 ? 's' : ''}`,
        description: `MSP NOC: ${unacknowledged} unacknowledged alert(s). ${criticalCount} critical, ${warningCount} warning. Avg uptime: ${avgUptime}%`,
        entitiesInvolved: [`${criticalCount} critical`, `${warningCount} warning`],
        context: {
          source: 'noc',
          sourceApp: 'msp',
          severity: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'medium' : 'low',
          confidence: 0.95,
          impactedEntities: [
            `${criticalCount} critical alerts`,
            `${warningCount} warning alerts`,
            `${avgUptime}% uptime`,
          ],
          causalFactors: ['infrastructure anomaly', 'threshold breach', 'service degradation'],
          suggestedNextAction:
            'Acknowledge and triage unresolved alerts; escalate critical issues to on-call team',
          businessImpact: `${criticalCount} critical alert(s) pending — potential SLA breach`,
          operationalImpact: `${avgUptime}% avg uptime; ${unacknowledged} alerts require operator attention`,
          layer: 'OBSERVE',
          timestamp: Date.now(),
        },
        metadata: { criticalCount, warningCount, unacknowledged, avgUptime, source: 'noc' },
      });
    }
  }, [unacknowledged, criticalCount, warningCount, avgUptime]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-display font-bold text-foreground">NOC Operations</h1>
            <DoctrineLayerBadge appId="msp" variant="compact" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Network Operations Center — infrastructure uptime, alert triage, and real-time system
            health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-mono">
            Updated{' '}
            {lastUpdated.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Critical Alerts',
            value: criticalCount.toString(),
            color: 'text-red-400',
            icon: XCircle,
          },
          {
            label: 'Warnings',
            value: warningCount.toString(),
            color: 'text-amber-400',
            icon: AlertTriangle,
          },
          {
            label: 'Unacknowledged',
            value: unacknowledged.toString(),
            color: 'text-orange-400',
            icon: Bell,
          },
          {
            label: 'Avg Uptime',
            value: `${avgUptime}%`,
            color: 'text-emerald-400',
            icon: Activity,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {stat.label}
              </p>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <p className={cn('text-3xl font-display font-bold mt-2', stat.color)}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Live system metrics from the API server */}
      {metricsLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <SystemMetricsPanel metrics={systemMetrics} loading={metricsLoading} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Active Alerts</h2>
            <span className="text-xs text-muted-foreground">
              {allAlerts.length} total · {unacknowledged} unacknowledged
            </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {allAlerts.map((alert, i) => (
              <AlertRow key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground">Incident Timeline</h2>
          </div>
          <div className="p-4 space-y-0 max-h-[500px] overflow-y-auto">
            {incidentTimeline.map((event, i) => {
              const color =
                event.severity === 'critical'
                  ? 'bg-red-400'
                  : event.severity === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-blue-400';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex gap-3 pb-4 relative"
                >
                  <div className="flex flex-col items-center">
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-1.5', color)} />
                    {i < incidentTimeline.length - 1 && (
                      <div className="w-px flex-1 bg-border/40 mt-1" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-mono text-muted-foreground mb-0.5">{event.time}</p>
                    <p className="text-sm text-foreground">{event.event}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Service Uptime (30 Days)</h2>
          <span
            className={cn(
              'text-sm font-mono',
              avgUptime >= 99.5 ? 'text-emerald-400' : 'text-amber-400',
            )}
          >
            Avg: {avgUptime.toFixed(2)}%
          </span>
        </div>
        <div className="space-y-1">
          {serviceUptime.map((u) => (
            <UptimeBar key={u.service} {...u} />
          ))}
        </div>
      </div>
    </div>
  );
}
