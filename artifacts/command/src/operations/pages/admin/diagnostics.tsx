
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Server, Zap, RefreshCw, ShieldCheck, BarChart3, ShieldAlert, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useStandardQuery } from "@szl-holdings/api-client-react";

interface SecurityAlert {
  id: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  body: string;
  status: string;
  receivedAt: string;
  obsRef: "OBS-005" | "OBS-006" | null;
  category: "tenant-isolation" | "auth-failure" | "other";
  violationCount: number | null;
  authFailureRatePerMin: number | null;
  samplePath: string | null;
  detailUrl: string;
}

interface SecurityAlertsResponse {
  timestamp: string;
  total: number;
  items: SecurityAlert[];
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return new Date(iso).toLocaleString();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

interface HealthCheck {
  status: string;
  latencyMs?: number;
  details?: string;
}

interface HealthDashboard {
  timestamp: string;
  technical: {
    requestCount: number;
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    throughputPerHour: number;
    authFailures: number;
    workflowFailureRate: number;
    dbLatencyMs: number;
    dbStatus: string;
  };
  product: {
    pendingApprovals: number;
    jobFailures: number;
    workflowCompletions: number;
  };
  jobs: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    recentFailures: { id: string; type: string; error?: string }[];
  };
  alerts: {
    active: number;
    items: { type: string; message: string; severity: string; raisedAt: number }[];
  };
  uptime: number;
}

interface DetailedHealth {
  status: string;
  uptime: number;
  version: string;
  environment: string;
  checks: Record<string, HealthCheck>;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "healthy" || status === "ok" || status === "connected"
      ? "bg-[#6b8f71]"
      : status === "warning" || status === "elevated_errors" || status === "backpressure"
        ? "bg-[#d4a054]"
        : "bg-[#c45a4a]";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} shrink-0`} />;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "healthy" || status === "ok" || status === "connected"
      ? "text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20"
      : status === "warning" || status === "elevated_errors" || status === "backpressure"
        ? "text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20"
        : "text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${color}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function MetricCard({ label, value, sub, icon: Icon, warn }: { label: string; value: string | number; sub?: string; icon: React.ElementType; warn?: boolean }) {
  return (
    <div className={`rounded-xl border ${warn ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${warn ? "text-amber-500" : "text-muted-foreground"}`} />
      </div>
      <div className={`text-xl font-bold tabular-nums ${warn ? "text-amber-400" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AdminDiagnosticsPage() {
  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash, dataUpdatedAt } = useStandardQuery<HealthDashboard>({
    queryKey: ["admin-health-dashboard"],
    queryFn: () => apiFetch<HealthDashboard>("/admin/health-dashboard"),
    refetchInterval: 30_000,
  });

  const { data: detailed, isLoading: detailedLoading, refetch: refetchDetailed } = useStandardQuery<DetailedHealth>({
    queryKey: ["admin-detailed-health"],
    queryFn: () => apiFetch<DetailedHealth>("/health/detailed"),
    refetchInterval: 30_000,
  });

  const { data: securityAlerts, refetch: refetchSecurity } = useStandardQuery<SecurityAlertsResponse>({
    queryKey: ["admin-security-alerts"],
    queryFn: () => apiFetch<SecurityAlertsResponse>("/admin/security-alerts?limit=10"),
    refetchInterval: 30_000,
  });

  const isLoading = dashLoading || detailedLoading;
  const overallStatus = detailed?.status ?? "unknown";

  function handleRefresh() {
    refetchDash();
    refetchDetailed();
    refetchSecurity();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            System Diagnostics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time platform health at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <StatusDot status={overallStatus} />
            <div>
              <span className="text-sm font-medium">Overall Platform Status: </span>
              <StatusBadge status={overallStatus} />
            </div>
            {detailed && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                v{detailed.version} · {detailed.environment} · uptime {formatUptime(detailed.uptime)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Error Rate"
              value={`${(dashboard?.technical.errorRate ?? 0).toFixed(1)}%`}
              sub="Last rolling window"
              icon={AlertTriangle}
              warn={(dashboard?.technical.errorRate ?? 0) > 3}
            />
            <MetricCard
              label="P95 Latency"
              value={`${Math.round(dashboard?.technical.p95Latency ?? 0)}ms`}
              sub={`P50: ${Math.round(dashboard?.technical.p50Latency ?? 0)}ms · P99: ${Math.round(dashboard?.technical.p99Latency ?? 0)}ms`}
              icon={Clock}
              warn={(dashboard?.technical.p95Latency ?? 0) > 2000}
            />
            <MetricCard
              label="Request Count"
              value={(dashboard?.technical.requestCount ?? 0).toLocaleString()}
              sub={`~${dashboard?.technical.throughputPerHour ?? 0}/hr`}
              icon={Activity}
            />
            <MetricCard
              label="Auth Failures"
              value={dashboard?.technical.authFailures ?? 0}
              sub="Since last restart"
              icon={ShieldCheck}
              warn={(dashboard?.technical.authFailures ?? 0) > 10}
            />
            <MetricCard
              label="Job Queue"
              value={`${dashboard?.jobs.pending ?? 0} pending`}
              sub={`${dashboard?.jobs.running ?? 0} running · ${dashboard?.jobs.completed ?? 0} done · ${dashboard?.jobs.failed ?? 0} failed`}
              icon={Zap}
              warn={(dashboard?.jobs.failed ?? 0) > 0}
            />
            <MetricCard
              label="DB Latency"
              value={`${dashboard?.technical.dbLatencyMs ?? "—"}ms`}
              sub={`Status: ${dashboard?.technical.dbStatus ?? "unknown"}`}
              icon={Database}
              warn={dashboard?.technical.dbStatus !== "healthy"}
            />
            <MetricCard
              label="Pending Approvals"
              value={dashboard?.product.pendingApprovals ?? 0}
              sub="Alloy action queue"
              icon={BarChart3}
            />
            <MetricCard
              label="Active Alerts"
              value={dashboard?.alerts.active ?? 0}
              sub="Raised by self-monitor"
              icon={AlertTriangle}
              warn={(dashboard?.alerts.active ?? 0) > 0}
            />
          </div>

          {detailed?.checks && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                Service Checks
              </h2>
              <div className="space-y-2">
                {Object.entries(detailed.checks).map(([name, check]) => (
                  <div key={name} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <StatusDot status={check.status} />
                      <span className="font-medium capitalize">{name.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {check.latencyMs != null && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">{check.latencyMs}ms</span>
                      )}
                      {check.details && (
                        <span className="text-[10px] text-muted-foreground max-w-[280px] truncate">{check.details}</span>
                      )}
                      <StatusBadge status={check.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailed?.memory && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Memory Usage
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Heap Used", value: `${detailed.memory.heapUsedMb} MB` },
                  { label: "Heap Total", value: `${detailed.memory.heapTotalMb} MB` },
                  { label: "RSS", value: `${detailed.memory.rssMb} MB` },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <div className="text-lg font-bold tabular-nums">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dashboard?.alerts.active ?? 0) > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Active Alerts ({dashboard?.alerts.active})
              </h2>
              <div className="space-y-2">
                {dashboard?.alerts.items.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${alert.severity === "critical" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                    <div>
                      <span className="font-medium">[{alert.type}]</span>{" "}
                      <span className="text-muted-foreground">{alert.message}</span>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                      {new Date(alert.raisedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dashboard?.jobs.recentFailures?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-[#c45a4a]/20 bg-[#c45a4a]/5 p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#c45a4a]">
                <Zap className="w-4 h-4" />
                Recent Job Failures
              </h2>
              <div className="space-y-2">
                {dashboard?.jobs.recentFailures.map((job) => (
                  <div key={job.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">{job.id.slice(0, 8)}</span>
                    <span className="font-medium">{job.type}</span>
                    {job.error && <span className="text-muted-foreground truncate max-w-[300px]">{job.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                Security Alerts
                {(securityAlerts?.total ?? 0) > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-[#c45a4a]/10 text-[#c45a4a] border-[#c45a4a]/20">
                    {securityAlerts?.total}
                  </span>
                )}
              </h2>
              <Link href="/operations/prism/signals" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                Open signals feed
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Recent OBS-005 (tenant isolation) and OBS-006 (auth-failure rate) signals from Command Self-Monitor.
            </p>
            {(securityAlerts?.items?.length ?? 0) === 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#6b8f71]" />
                No recent auth-failure or tenant-isolation alerts.
              </div>
            ) : (
              <div className="space-y-2">
                {securityAlerts?.items.map((alert) => {
                  const sevColor =
                    alert.severity === "critical"
                      ? "bg-[#c45a4a] text-[#c45a4a] border-[#c45a4a]/30 bg-[#c45a4a]/10"
                      : alert.severity === "high"
                        ? "bg-[#d4a054] text-[#d4a054] border-[#d4a054]/30 bg-[#d4a054]/10"
                        : "bg-muted text-muted-foreground border-border";
                  const refColor = alert.obsRef === "OBS-005" ? "text-[#c45a4a]" : "text-[#d4a054]";
                  return (
                    <Link
                      key={alert.id}
                      href={alert.detailUrl}
                      className="flex items-start gap-3 text-xs py-2 px-3 rounded-lg border border-border/60 bg-background/40 hover:bg-muted/40 transition-colors"
                    >
                      <span className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${alert.severity === "critical" ? "bg-[#c45a4a]" : alert.severity === "high" ? "bg-[#d4a054]" : "bg-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {alert.obsRef && (
                            <span className={`text-[10px] font-bold tracking-wide ${refColor}`}>{alert.obsRef}</span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${sevColor}`}>
                            {alert.severity}
                          </span>
                          <span className="font-medium text-foreground truncate">{alert.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{formatRelativeTime(alert.receivedAt)}</span>
                          {alert.violationCount != null && (
                            <span>{alert.violationCount} attempt{alert.violationCount === 1 ? "" : "s"}</span>
                          )}
                          {alert.authFailureRatePerMin != null && (
                            <span>{alert.authFailureRatePerMin.toFixed(1)}/min</span>
                          )}
                          {alert.samplePath && (
                            <span className="font-mono truncate max-w-[260px]">{alert.samplePath}</span>
                          )}
                          <span className="capitalize">{alert.status}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {!dashboard?.alerts.active && !dashboard?.jobs.recentFailures?.length && overallStatus === "healthy" && (
            <div className="flex items-center gap-2 p-4 rounded-xl border border-[#6b8f71]/30 bg-[#6b8f71]/5 text-sm text-[#6b8f71]">
              <CheckCircle className="w-4 h-4" />
              All systems healthy. No active alerts or job failures.
            </div>
          )}
        </>
      )}
    </div>
  );
}
