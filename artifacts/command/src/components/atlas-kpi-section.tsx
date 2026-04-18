import { useQuery } from "@tanstack/react-query";
import { Layers, GitBranch, Shield, Globe, Network, Activity, Zap, AlertTriangle, CheckCircle, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface DomainTwinSummary {
  domain: string;
  label: string;
  color: string;
  twinCount: number;
  stableCount: number;
  degradedCount: number;
  awaitingCount: number;
  driftAvg: number;
  pendingActions: number;
  worldline: string;
  appPath: string;
  icon: typeof Globe;
}

const DOMAIN_CONFIG: Omit<DomainTwinSummary, "twinCount" | "stableCount" | "degradedCount" | "awaitingCount" | "driftAvg" | "pendingActions" | "worldline">[] = [
  { domain: "aegis", label: "Aegis — Defense", color: "#ef4444", appPath: "/aegis", icon: Shield },
  { domain: "terra", label: "Terra — Real Estate", color: "#10b981", appPath: "/terra", icon: Globe },
  { domain: "vessels", label: "Vessels — Maritime", color: "#06b6d4", appPath: "/vessels", icon: Network },
  { domain: "alloy", label: "Alloy — Execution", color: "#4B8BDB", appPath: `${BASE}/operations`, icon: Zap },
  { domain: "prism", label: "Prism — Counsel", color: "#f59e0b", appPath: `${BASE}/operations/prism`, icon: Activity },
  { domain: "lyte", label: "Lyte — AIOps", color: "#d4a054", appPath: `${BASE}/operations`, icon: Activity },
];

const DEMO_SUMMARIES: DomainTwinSummary[] = [
  { ...DOMAIN_CONFIG[0], twinCount: 8, stableCount: 5, degradedCount: 2, awaitingCount: 1, driftAvg: 12, pendingActions: 4, worldline: "WL-BETA" },
  { ...DOMAIN_CONFIG[1], twinCount: 4, stableCount: 4, degradedCount: 0, awaitingCount: 0, driftAvg: 4, pendingActions: 0, worldline: "WL-ALPHA" },
  { ...DOMAIN_CONFIG[2], twinCount: 6, stableCount: 5, degradedCount: 0, awaitingCount: 1, driftAvg: 8, pendingActions: 2, worldline: "WL-DELTA" },
  { ...DOMAIN_CONFIG[3], twinCount: 3, stableCount: 3, degradedCount: 0, awaitingCount: 0, driftAvg: 2, pendingActions: 0, worldline: "WL-ALPHA" },
  { ...DOMAIN_CONFIG[4], twinCount: 2, stableCount: 2, degradedCount: 0, awaitingCount: 0, driftAvg: 3, pendingActions: 0, worldline: "WL-ALPHA" },
  { ...DOMAIN_CONFIG[5], twinCount: 4, stableCount: 2, degradedCount: 2, awaitingCount: 0, driftAvg: 18, pendingActions: 4, worldline: "WL-BETA" },
];

interface ApiRunSummary {
  domain: string;
  runCount: number;
  successCount: number;
  pendingCount: number;
}

function useAtlasRunSummary() {
  return useQuery<{ data: ApiRunSummary[] }>({
    queryKey: ["atlas-run-summary"],
    queryFn: async () => {
      const domains = ["aegis", "vessels", "terra"];
      const results = await Promise.all(
        domains.map(async d => {
          try {
            const r = await fetch(`/api/${d}/atlas/runs?limit=5`);
            if (!r.ok) return null;
            const body = await r.json();
            const runs: { status?: string }[] = body?.data?.runs ?? body?.runs ?? [];
            return {
              domain: d,
              runCount: runs.length,
              successCount: runs.filter(r => r.status === "completed").length,
              pendingCount: runs.filter(r => r.status === "pending" || r.status === "running").length,
            } as ApiRunSummary;
          } catch {
            return null;
          }
        })
      );
      return { data: results.filter(Boolean) as ApiRunSummary[] };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

interface CrossDomainSummaryResponse {
  domains: Array<{ domain: string; twinCount: number; stableCount: number; degradedCount: number; avgDriftScore: number; activeBranches: number; lastSync: string }>;
  totals: { totalTwins: number; stableTotal: number; degradedTotal: number; activeBranchesTotal: number; avgDriftScore: number };
  generatedAt: string;
}

function useCrossDomainSummary() {
  return useQuery<CrossDomainSummaryResponse>({
    queryKey: ["atlas-cross-domain-summary"],
    queryFn: () => fetch("/api/atlas/spatial/cross-domain/summary").then(r => r.ok ? r.json() : Promise.reject(r.status)).then(r => r.data ?? r),
    staleTime: 60_000,
    retry: 1,
  });
}

export function AtlasKpiSection() {
  const { data: runData, isLoading } = useAtlasRunSummary();
  const { data: crossDomain } = useCrossDomainSummary();
  const runSummaries: ApiRunSummary[] = runData?.data ?? [];

  const totalTwins = crossDomain?.totals.totalTwins ?? DEMO_SUMMARIES.reduce((s, d) => s + d.twinCount, 0);
  const totalDegraded = crossDomain?.totals.degradedTotal ?? DEMO_SUMMARIES.reduce((s, d) => s + d.degradedCount + d.awaitingCount, 0);
  const totalPending = DEMO_SUMMARIES.reduce((s, d) => s + d.pendingActions, 0);
  const stableTotal = crossDomain?.totals.stableTotal ?? DEMO_SUMMARIES.reduce((s, d) => s + d.stableCount, 0);
  const stablePercent = totalTwins > 0 ? Math.round((stableTotal / totalTwins) * 100) : 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", padding: "24px" }}
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: "#8b7ac8" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>
            ATLAS Spatial Runtime — Cross-Domain Health
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalDegraded > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border" style={{ color: "#f59e0b", borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.06)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
              {totalDegraded} twin{totalDegraded !== 1 ? "s" : ""} need attention
            </span>
          )}
          <Link
            href={`${BASE}/strategy/atlas-runtime`}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5"
            style={{ color: "#8b7ac8", borderColor: "rgba(139,122,200,0.25)", background: "rgba(139,122,200,0.06)" }}
          >
            <Layers className="w-3 h-3" />
            Twin View
          </Link>
          <Link
            href={`${BASE}/strategy/worldline-registry`}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5"
            style={{ color: "#8b7ac8", borderColor: "rgba(139,122,200,0.25)", background: "rgba(139,122,200,0.06)" }}
          >
            <GitBranch className="w-3 h-3" />
            Worldlines →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Twins", value: totalTwins, color: "#8b7ac8" },
          { label: "Stable", value: `${stablePercent}%`, color: "#10b981" },
          { label: "Need Attention", value: totalDegraded, color: totalDegraded > 0 ? "#f59e0b" : "#10b981", pulse: totalDegraded > 0 },
          { label: "Pending Actions", value: totalPending, color: totalPending > 0 ? "#ef4444" : "#10b981", pulse: totalPending > 0 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />}
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_SUMMARIES.map(d => {
          const DIcon = d.icon;
          const isHealthy = d.degradedCount === 0 && d.awaitingCount === 0;
          const statusColor = isHealthy ? "#10b981" : d.degradedCount > 0 ? "#f59e0b" : "#8b7ac8";
          const runData = runSummaries.find(r => r.domain === d.domain);

          return (
            <div
              key={d.domain}
              className="rounded-xl border p-3 flex flex-col gap-2"
              style={{ borderColor: `${statusColor}18`, background: `${statusColor}04` }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${d.color}12`, border: `1px solid ${d.color}20` }}>
                  <DIcon className="w-3 h-3" style={{ color: d.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: d.color }}>{d.label}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isHealthy
                    ? <CheckCircle className="w-3 h-3" style={{ color: "#10b981" }} />
                    : <AlertTriangle className="w-3 h-3 animate-pulse" style={{ color: statusColor }} />}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Twins", value: d.twinCount, color: "rgba(255,255,255,0.6)" },
                  { label: "Stable", value: d.stableCount, color: "#10b981" },
                  { label: "Drift Avg", value: `Δ${d.driftAvg}%`, color: d.driftAvg <= 5 ? "#10b981" : d.driftAvg <= 15 ? "#f59e0b" : "#ef4444" },
                ].map(m => (
                  <div key={m.label} className="rounded border px-1.5 py-1 text-center" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="text-[7px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{m.label}</div>
                    <div className="text-[9px] font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[9px]">
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {d.worldline}
                  {d.pendingActions > 0 && (
                    <span className="ml-2 font-bold" style={{ color: "#f59e0b" }}>{d.pendingActions} pending</span>
                  )}
                </span>
                {runData && (
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>
                    {runData.runCount} run{runData.runCount !== 1 ? "s" : ""}
                    {runData.pendingCount > 0 && <span className="text-amber-400 ml-1">({runData.pendingCount} active)</span>}
                  </span>
                )}
                {isLoading && !runData && (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
