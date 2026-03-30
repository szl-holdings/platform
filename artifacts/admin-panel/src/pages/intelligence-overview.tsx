import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { apiFetch } from "@workspace/shared-ui";
import { Activity, Shield, Globe, Brain, FileText, Zap, Clock, TrendingUp, ArrowRight, Radio, Ship, AlertTriangle, Database, Server } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let c = false;
    const s = performance.now();
    const step = (n: number) => { if (c) return; const p = Math.min((n - s) / duration, 1); setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    return () => { c = true; };
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export default function IntelligenceOverview() {
  const { data: threats = [] } = useQuery({ queryKey: ["admin-intel-threats"], queryFn: () => apiFetch<any[]>("/intelligence/threats") });
  const { data: cves = [] } = useQuery({ queryKey: ["admin-intel-cves"], queryFn: () => apiFetch<any[]>("/intelligence/cves") });
  const { data: stats } = useQuery({ queryKey: ["admin-intel-stats"], queryFn: () => apiFetch<any>("/intelligence/platform-stats"), refetchInterval: 30000 });
  const { data: dataFlows = [] } = useQuery({ queryKey: ["admin-intel-data-flow"], queryFn: () => apiFetch<any[]>("/intelligence/data-flow") });
  const { data: digest } = useQuery({ queryKey: ["admin-intel-digest"], queryFn: () => apiFetch<any>("/intelligence/daily-digest") });
  const { data: ecosystemHealth = [] } = useQuery({ queryKey: ["admin-intel-ecosystem"], queryFn: () => apiFetch<any[]>("/intelligence/ecosystem-health"), refetchInterval: 30000 });
  const { data: anomalies = [] } = useQuery({ queryKey: ["admin-intel-anomalies"], queryFn: () => apiFetch<any[]>("/intelligence/anomalies") });

  const criticalThreats = threats.filter((t: any) => t.severity === "critical").length;
  const criticalCves = cves.filter((c: any) => c.severity === "CRITICAL").length;
  const operationalApps = ecosystemHealth.filter((a: any) => a.status === "operational").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Intelligence Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-portfolio threat signals, anomaly correlation, and intelligence fusion across all SZL verticals</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 animate-pulse">
          <Radio className="w-3 h-3" /> All Systems Live
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Active Threats</span>
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold"><AnimatedCounter value={threats.length} /></div>
          <p className="text-xs text-red-400 mt-1">{criticalThreats} critical</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">CVE Advisories</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold"><AnimatedCounter value={cves.length} /></div>
          <p className="text-xs text-orange-400 mt-1">{criticalCves} critical</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">API Calls Today</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold"><AnimatedCounter value={stats?.apiCallsToday || 0} /></div>
          <p className="text-xs text-muted-foreground mt-1">{stats?.avgResponseMs || 0}ms avg</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Apps Operational</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold">{operationalApps}/{ecosystemHealth.length}</div>
          <p className="text-xs text-emerald-400 mt-1">{stats?.uptime || 0}% uptime</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Cross-App Data Flow
          </h3>
          <div className="space-y-2">
            {dataFlows.map((flow: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/20 transition-all">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded w-32 text-center truncate">{flow.source}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-0.5 bg-border relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary animate-pulse" style={{ width: `${Math.min((flow.volume / 25000) * 100, 100)}%` }} />
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-32 text-center truncate">{flow.target}</span>
                <span className="text-xs text-muted-foreground w-16 text-right">{flow.volume.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Platform Health
          </h3>
          <div className="space-y-2">
            {ecosystemHealth.map((app: any) => (
              <div key={app.app} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${app.status === "operational" ? "bg-emerald-500" : app.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
                  <span className="text-sm">{app.app}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{app.latency}ms</span>
                  <span>{app.uptime}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Daily Intelligence Digest
          </h3>
          {digest ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-muted-foreground">Threats</p>
                  <p className="text-lg font-bold text-red-400">{digest.threatSummary?.newThreats}</p>
                  <p className="text-[10px] text-muted-foreground">{digest.threatSummary?.criticalCount} critical</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <p className="text-xs text-muted-foreground">CVEs</p>
                  <p className="text-lg font-bold text-orange-400">{digest.cveSummary?.newCves}</p>
                  <p className="text-[10px] text-muted-foreground">{digest.cveSummary?.criticalCount} critical</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs text-muted-foreground">Maritime</p>
                  <p className="text-lg font-bold text-blue-400">{digest.maritimeSummary?.vesselsTracked}</p>
                  <p className="text-[10px] text-muted-foreground">{digest.maritimeSummary?.chokepointAlerts} alerts</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-xs text-muted-foreground">Anomalies</p>
                  <p className="text-lg font-bold text-amber-400">{digest.anomalySummary?.total}</p>
                  <p className="text-[10px] text-muted-foreground">{digest.anomalySummary?.critical} critical</p>
                </div>
              </div>
              {digest.threatSummary?.topThreat && (
                <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Top Threat</p>
                  <p className="text-sm font-medium">{digest.threatSummary.topThreat.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{digest.threatSummary.topThreat.description}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">Generated: {new Date(digest.generatedAt).toLocaleString()}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" /> Active Anomalies
          </h3>
          <div className="space-y-2">
            {anomalies.map((a: any) => (
              <div key={a.id} className={`p-3 rounded-lg border ${a.severity === "critical" ? "border-red-500/20 bg-red-500/5" : a.severity === "warning" ? "border-orange-500/20 bg-orange-500/5" : "border-border/50 bg-background/50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.severity === "critical" ? "bg-red-500/10 text-red-400" : a.severity === "warning" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>{a.severity}</span>
                  <span className={`text-xs ${a.status === "active" ? "text-red-400" : a.status === "investigating" ? "text-orange-400" : "text-blue-400"}`}>{a.status}</span>
                </div>
                <p className="text-sm">{a.description}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.detectedAt).toLocaleString()}</span>
                  <span>Confidence: {(a.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
