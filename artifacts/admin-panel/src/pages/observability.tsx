import { useState, useEffect, useMemo, useCallback } from "react";
import { type AppObservabilityState, type PillarId, PILLARS } from "@workspace/observability";
import { ALL_CONFIGS } from "@workspace/observability/configs";

const DATA_SOURCE_LABELS: Record<string, { label: string; real: boolean }> = {
  server_telemetry: { label: "API Latency & Throughput", real: true },
  integration_health: { label: "Service Health Checks", real: true },
  client_vitals: { label: "Web Vitals (LCP/CLS/INP)", real: true },
  domain_simulation: { label: "Domain KPI Simulation", real: false },
};

interface ServerTelemetrySnapshot {
  requestCount: number;
  avgResponseTime: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  clientErrorRate: number;
  throughputPerHour: number;
  uptimeSeconds: number;
  windowMs: number;
}

function statusColor(s: string) {
  return s === "healthy" ? "text-emerald-400" : s === "degraded" ? "text-amber-400" : s === "critical" ? "text-red-400" : "text-slate-400";
}
function statusBg(s: string) {
  return s === "healthy" ? "bg-emerald-400/10 border-emerald-400/20" : s === "degraded" ? "bg-amber-400/10 border-amber-400/20" : s === "critical" ? "bg-red-400/10 border-red-400/20" : "bg-slate-400/10 border-slate-400/20";
}

function resolveApiBase(): string {
  if (typeof window === "undefined") return "/api/";
  return `${window.location.origin}/api/`;
}

export default function SystemObservability() {
  const [appStates, setAppStates] = useState<AppObservabilityState[]>([]);
  const [serverStats, setServerStats] = useState<ServerTelemetrySnapshot | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const apiBase = useMemo(() => resolveApiBase(), []);

  const fetchFromApi = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}observability`);
      if (res.ok) {
        const data = await res.json();
        if (data.apps) {
          const states: AppObservabilityState[] = data.apps.map((app: Record<string, unknown>) => ({
            appSlug: app.appSlug as string,
            pillars: app.pillars,
            overallScore: app.overallScore as number,
            overallStatus: app.overallStatus as string,
            metrics: (app as Record<string, unknown>).metrics || [],
            events: (app as Record<string, unknown>).events || [],
            lastUpdated: Date.now(),
          }));
          setAppStates(states);
        }
        if (data.serverTelemetry) {
          setServerStats(data.serverTelemetry);
        }
        if (data.dataSources) {
          setDataSources(data.dataSources);
        }
        return true;
      }
    } catch { /* silent */ }
    return false;
  }, [apiBase]);

  const fetchPerAppDetails = useCallback(async () => {
    const results = await Promise.allSettled(
      ALL_CONFIGS.map(async (config) => {
        const res = await fetch(`${apiBase}observability/${config.appSlug}`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
          appSlug: data.appSlug,
          pillars: data.pillars,
          overallScore: data.overallScore,
          overallStatus: data.overallStatus,
          metrics: data.metrics || [],
          events: data.events || [],
          lastUpdated: Date.now(),
        } as AppObservabilityState;
      })
    );
    const states = results
      .filter((r): r is PromiseFulfilledResult<AppObservabilityState | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((s): s is AppObservabilityState => s !== null);

    if (states.length > 0) {
      setAppStates(states);
    }
  }, [apiBase]);

  useEffect(() => {
    const init = async () => {
      const ok = await fetchFromApi();
      if (ok) {
        await fetchPerAppDetails();
      }
    };
    init();

    const interval = setInterval(async () => {
      await fetchFromApi();
      await fetchPerAppDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchFromApi, fetchPerAppDetails]);

  const portfolioScore = useMemo(() => {
    if (appStates.length === 0) return 0;
    return Math.round(appStates.reduce((s, a) => s + a.overallScore, 0) / appStates.length);
  }, [appStates]);

  const pillarAverages = useMemo(() => {
    const pillarIds: PillarId[] = ["performance", "business", "userExperience", "predictiveHealth", "operational", "strategic"];
    return pillarIds.map((id) => {
      const scores = appStates.map((a) => a.pillars.find((p) => p.pillarId === id)?.score ?? 0);
      const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
      return { id, avg, status: avg >= 80 ? "healthy" : avg >= 50 ? "degraded" : "critical" };
    });
  }, [appStates]);

  const totalMetrics = appStates.reduce((s, a) => s + a.metrics.length, 0);
  const criticalApps = appStates.filter((a) => a.overallStatus === "critical").length;
  const degradedApps = appStates.filter((a) => a.overallStatus === "degraded").length;

  if (appStates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Observability</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time observability across {appStates.length} applications</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Portfolio Score</div>
          <div className={`text-3xl font-bold ${statusColor(portfolioScore >= 80 ? "healthy" : portfolioScore >= 50 ? "degraded" : "critical")}`}>{portfolioScore}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Applications</div>
          <div className="text-3xl font-bold text-foreground">{appStates.length}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Metrics</div>
          <div className="text-3xl font-bold text-foreground">{totalMetrics}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Critical</div>
          <div className={`text-3xl font-bold ${criticalApps > 0 ? "text-red-400" : "text-emerald-400"}`}>{criticalApps}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Degraded</div>
          <div className={`text-3xl font-bold ${degradedApps > 0 ? "text-amber-400" : "text-emerald-400"}`}>{degradedApps}</div>
        </div>
      </div>

      {dataSources.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold">Active Data Sources</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {dataSources.map((src) => {
              const info = DATA_SOURCE_LABELS[src];
              if (!info) return null;
              return (
                <span
                  key={src}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    info.real
                      ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                      : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${info.real ? "bg-emerald-400" : "bg-blue-400"}`} />
                  {info.label}
                  <span className="text-[10px] opacity-70">{info.real ? "LIVE" : "SIM"}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Application Health Matrix</h3>
          </div>
          <div className="divide-y">
            {appStates.map((state) => {
              const config = ALL_CONFIGS.find((c) => c.appSlug === state.appSlug);
              return (
                <div key={state.appSlug} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{config?.appName || state.appSlug}</div>
                    <div className="text-xs text-muted-foreground">{config?.domain}</div>
                  </div>
                  <div className="flex gap-1">
                    {state.pillars.map((p) => (
                      <div
                        key={p.pillarId}
                        className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center ${statusBg(p.status)} ${statusColor(p.status)}`}
                        title={PILLARS.find((pd) => pd.id === p.pillarId)?.name}
                      >
                        {p.score}
                      </div>
                    ))}
                  </div>
                  <div className={`text-lg font-bold min-w-[36px] text-right ${statusColor(state.overallStatus)}`}>
                    {state.overallScore}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Pillar Aggregates (System-wide)</h3>
          </div>
          <div className="divide-y">
            {pillarAverages.map(({ id, avg, status }) => {
              const pillar = PILLARS.find((p) => p.id === id)!;
              return (
                <div key={id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{pillar.name}</div>
                    <div className="text-xs text-muted-foreground">{pillar.description}</div>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${status === "healthy" ? "bg-emerald-400" : status === "degraded" ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold min-w-[36px] text-right ${statusColor(status)}`}>{avg}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {serverStats && (
        <div className="rounded-xl border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Live Server Telemetry</h3>
            <p className="text-xs text-muted-foreground mt-1">Real-time metrics from API request pipeline ({Math.round(serverStats.windowMs / 1000)}s window)</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg Response Time</div>
              <div className="text-xl font-bold text-foreground">{serverStats.avgResponseTime.toFixed(1)}ms</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">P95 Latency</div>
              <div className="text-xl font-bold text-foreground">{serverStats.p95Latency.toFixed(1)}ms</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">P99 Latency</div>
              <div className="text-xl font-bold text-foreground">{serverStats.p99Latency.toFixed(1)}ms</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Throughput</div>
              <div className="text-xl font-bold text-foreground">{serverStats.throughputPerHour.toFixed(0)}/hr</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Error Rate (5xx)</div>
              <div className={`text-xl font-bold ${serverStats.errorRate > 5 ? "text-red-400" : serverStats.errorRate > 1 ? "text-amber-400" : "text-emerald-400"}`}>{serverStats.errorRate.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Client Errors (4xx)</div>
              <div className="text-xl font-bold text-foreground">{serverStats.clientErrorRate.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Requests in Window</div>
              <div className="text-xl font-bold text-foreground">{serverStats.requestCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Server Uptime</div>
              <div className="text-xl font-bold text-foreground">{Math.floor(serverStats.uptimeSeconds / 60)}m</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Recent System Events</h3>
        </div>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {appStates
            .flatMap((a) => a.events.map((e) => ({ ...e, appSlug: a.appSlug })))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 30)
            .map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0 mt-0.5 ${e.severity === "critical" ? "text-red-400 bg-red-400/10" : e.severity === "warning" ? "text-amber-400 bg-amber-400/10" : "text-blue-400 bg-blue-400/10"}`}>
                  {e.severity === "critical" ? "!" : e.severity === "warning" ? "▲" : "●"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{e.message}</div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary">{ALL_CONFIGS.find((c) => c.appSlug === e.appSlug)?.appName || e.appSlug}</span>
                    <span>·</span>
                    <span className="capitalize">{e.pillar.replace(/([A-Z])/g, " $1").trim()}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
