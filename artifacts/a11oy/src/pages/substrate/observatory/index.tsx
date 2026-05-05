import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';

const API = '/api/nexus-mcp';
const ACCENT = '#22d3ee';

interface McpSession {
  id: string;
  clientIdentity: string;
  clientType: string;
  serverIdentity: string;
  serverType: string;
  status: string;
  riskLevel: string;
  toolCallCount: number;
  errorCount: number;
  policyViolationCount: number;
  pendingApprovalCount: number;
  avgLatencyMs: number | null;
  startedAt: string;
  endedAt: string | null;
}

interface McpAnomaly {
  id: string;
  sessionId: string | null;
  anomalyType: string;
  severity: string;
  description: string;
  acknowledged: boolean;
  detectedAt: string;
}

interface ObservatoryStats {
  activeSessions: number;
  toolCallsPerMinute: number;
  avgLatencyMs: number;
  pendingApprovals: number;
  policyViolationsLastHour: number;
  unacknowledgedAnomalies: number;
  activeExternalServers: number;
}

function riskColor(level: string): string {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
}

function statusColor(status: string): string {
  if (status === 'active') return '#22c55e';
  if (status === 'completed') return ACCENT;
  return '#6b7280';
}

function severityColor(severity: string): string {
  if (severity === 'high' || severity === 'critical') return '#ef4444';
  if (severity === 'medium') return '#f59e0b';
  return ACCENT;
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const ms = end - start;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

function KpiCard({
  label,
  value,
  unit,
  color,
  icon: Icon,
  alert,
}: {
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  icon: React.ElementType;
  alert?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        background: alert ? `${color}10` : 'hsl(214,12%,8%)',
        borderColor: alert ? `${color}40` : 'hsla(0,0%,100%,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'hsl(214,7%,45%)' }}>
          {label}
        </span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-xs" style={{ color: 'hsl(214,7%,45%)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function AnomalyBadge({ anomaly, onAck }: { anomaly: McpAnomaly; onAck: (id: string) => void }) {
  const color = severityColor(anomaly.severity);
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b"
      style={{ borderColor: `${color}20`, background: `${color}06` }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `${color}20`, color }}
          >
            {anomaly.severity}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'hsl(214,7%,45%)' }}>
            {anomaly.anomalyType.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'hsl(38,8%,92%)' }}>
          {anomaly.description}
        </p>
        <p className="text-[9px] mt-1" style={{ color: 'hsl(214,7%,35%)' }}>
          {new Date(anomaly.detectedAt).toLocaleTimeString()}
        </p>
      </div>
      {!anomaly.acknowledged && (
        <button
          onClick={() => onAck(anomaly.id)}
          className="text-[9px] font-mono px-2 py-1 rounded transition-colors hover:opacity-80"
          style={{ background: `${color}20`, color }}
        >
          ACK
        </button>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: McpSession }) {
  return (
    <Link
      href={`/substrate/observatory/${session.id}`}
      className="flex items-center gap-4 px-4 py-3 border-b transition-colors hover:bg-white/3 cursor-pointer"
      style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
    >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusColor(session.status) }}
            />
            <span className="text-xs font-mono truncate" style={{ color: 'hsl(38,8%,92%)' }}>
              {session.clientIdentity}
            </span>
            <span className="text-[10px]" style={{ color: 'hsl(214,7%,35%)' }}>→</span>
            <span className="text-xs font-mono truncate" style={{ color: ACCENT }}>
              {session.serverIdentity}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: session.serverType === 'external' ? '#8b5cf620' : `${ACCENT}15`,
                color: session.serverType === 'external' ? '#8b5cf6' : ACCENT,
              }}
            >
              {session.serverType === 'external' ? 'EXTERNAL' : 'INTERNAL'}
            </span>
            <span className="text-[9px]" style={{ color: 'hsl(214,7%,45%)' }}>
              {session.toolCallCount} calls
            </span>
            {session.errorCount > 0 && (
              <span className="text-[9px]" style={{ color: '#ef4444' }}>
                {session.errorCount} errors
              </span>
            )}
            {session.policyViolationCount > 0 && (
              <span className="text-[9px]" style={{ color: '#f59e0b' }}>
                {session.policyViolationCount} violations
              </span>
            )}
            <span className="text-[9px]" style={{ color: 'hsl(214,7%,35%)' }}>
              {formatDuration(session.startedAt, session.endedAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: `${riskColor(session.riskLevel)}20`,
              color: riskColor(session.riskLevel),
            }}
          >
            {session.riskLevel.toUpperCase()}
          </span>
          {session.pendingApprovalCount > 0 && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: '#f59e0b20', color: '#f59e0b' }}
            >
              {session.pendingApprovalCount} pending
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5" style={{ color: 'hsl(214,7%,35%)' }} />
        </div>
    </Link>
  );
}

export function McpObservatory() {
  const [stats, setStats] = useState<ObservatoryStats | null>(null);
  const [sessions, setSessions] = useState<McpSession[]>([]);
  const [anomalies, setAnomalies] = useState<McpAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [statsRes, sessionsRes, anomaliesRes] = await Promise.all([
        fetch(`${API}/stats`, { credentials: 'include' }),
        fetch(`${API}/sessions?limit=50`, { credentials: 'include' }),
        fetch(`${API}/anomalies?acknowledged=false`, { credentials: 'include' }),
      ]);
      if (statsRes.ok) {
        const d = await statsRes.json() as { data: ObservatoryStats };
        setStats(d.data);
      }
      if (sessionsRes.ok) {
        const d = await sessionsRes.json() as { data: { sessions: McpSession[] } };
        setSessions(d.data.sessions ?? []);
      }
      if (anomaliesRes.ok) {
        const d = await anomaliesRes.json() as { data: McpAnomaly[] };
        setAnomalies(d.data ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAck = async (id: string) => {
    try {
      await fetch(`${API}/anomalies/${id}/acknowledge`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setAnomalies((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'active') return s.status === 'active';
    if (filter === 'completed') return s.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-full" style={{ background: 'hsl(214,16%,4%)', color: 'hsl(38,8%,92%)' }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'hsl(214,16%,4%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-sm font-semibold" style={{ color: ACCENT }}>
              MCP Observatory
            </h1>
            {anomalies.length > 0 && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: '#ef444420', color: '#ef4444' }}
              >
                {anomalies.length} anomaly{anomalies.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'hsl(214,7%,45%)' }}>
            Governed MCP session monitor — bidirectional control plane
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/substrate/observatory/compose">
            <a
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors hover:opacity-80"
              style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
            >
              <Zap className="w-3 h-3" />
              Compose Workflow
            </a>
          </Link>
          <button
            onClick={load}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" style={{ color: 'hsl(214,7%,45%)' }} />
          </button>
          <span className="text-[9px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
            {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: `${ACCENT}25`, borderTopColor: ACCENT }}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <KpiCard
                label="Active Sessions"
                value={stats?.activeSessions ?? 0}
                color={ACCENT}
                icon={Activity}
              />
              <KpiCard
                label="Tool Calls/Min"
                value={stats?.toolCallsPerMinute ?? 0}
                color="#8b5cf6"
                icon={Zap}
              />
              <KpiCard
                label="Avg Latency"
                value={stats?.avgLatencyMs ?? 0}
                unit="ms"
                color="#22c55e"
                icon={Clock}
              />
              <KpiCard
                label="Pending Approvals"
                value={stats?.pendingApprovals ?? 0}
                color="#f59e0b"
                icon={Shield}
                alert={(stats?.pendingApprovals ?? 0) > 0}
              />
              <KpiCard
                label="Policy Violations"
                value={stats?.policyViolationsLastHour ?? 0}
                color="#ef4444"
                icon={XCircle}
                alert={(stats?.policyViolationsLastHour ?? 0) > 0}
              />
              <KpiCard
                label="Anomalies"
                value={stats?.unacknowledgedAnomalies ?? 0}
                color="#f59e0b"
                icon={AlertTriangle}
                alert={(stats?.unacknowledgedAnomalies ?? 0) > 0}
              />
              <KpiCard
                label="External Servers"
                value={stats?.activeExternalServers ?? 0}
                color="#8b5cf6"
                icon={Globe}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div
                className="lg:col-span-2 rounded-lg border overflow-hidden"
                style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,6%)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span className="text-xs font-semibold">MCP Sessions</span>
                    <span className="text-[10px]" style={{ color: 'hsl(214,7%,45%)' }}>
                      ({filteredSessions.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['all', 'active', 'completed'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="px-2 py-0.5 rounded text-[9px] font-mono uppercase transition-colors"
                        style={{
                          background: filter === f ? `${ACCENT}20` : 'transparent',
                          color: filter === f ? ACCENT : 'hsl(214,7%,45%)',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Server className="w-8 h-8 mb-3" style={{ color: 'hsl(214,7%,25%)' }} />
                      <p className="text-xs" style={{ color: 'hsl(214,7%,35%)' }}>
                        No sessions in this window
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'hsl(214,7%,25%)' }}>
                        Sessions appear as MCP clients connect
                      </p>
                    </div>
                  ) : (
                    filteredSessions.map((s) => <SessionRow key={s.id} session={s} />)
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,6%)' }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                      <span className="text-xs font-semibold">Anomalies</span>
                    </div>
                    {anomalies.length > 0 && (
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{ background: '#ef444420', color: '#ef4444' }}
                      >
                        {anomalies.length}
                      </span>
                    )}
                  </div>
                  {anomalies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CheckCircle className="w-6 h-6 mb-2" style={{ color: '#22c55e' }} />
                      <p className="text-xs" style={{ color: 'hsl(214,7%,35%)' }}>
                        All clear
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {anomalies.slice(0, 5).map((a) => (
                        <AnomalyBadge key={a.id} anomaly={a} onAck={handleAck} />
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: 'hsla(0,0%,100%,0.08)', background: 'hsl(214,12%,6%)' }}
                >
                  <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}
                  >
                    <span className="text-xs font-semibold">Quick Actions</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <Link href="/substrate/observatory/compose">
                      <a
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs transition-colors hover:bg-white/5"
                        style={{ color: ACCENT }}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Compose Governed Workflow
                      </a>
                    </Link>
                    <a
                      href="/admin/nexus-mcp"
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs transition-colors hover:bg-white/5"
                      style={{ color: '#8b5cf6' }}
                    >
                      <Server className="w-3.5 h-3.5" />
                      Manage External Servers
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                    <Link href="/substrate/approvals">
                      <a
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs transition-colors hover:bg-white/5"
                        style={{ color: '#f59e0b' }}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Approval Queue
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
