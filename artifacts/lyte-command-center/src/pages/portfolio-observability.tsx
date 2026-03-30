import { useState, useEffect, useMemo, useCallback } from "react";
import { type AppObservabilityState, type PillarId, PILLARS } from "@workspace/observability";
import { ALL_CONFIGS } from "@workspace/observability/configs";

function statusColor(status: string): string {
  switch (status) {
    case "healthy": return "text-emerald-400";
    case "degraded": return "text-amber-400";
    case "critical": return "text-red-400";
    default: return "text-slate-400";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "healthy": return "bg-emerald-400/10 border-emerald-400/20";
    case "degraded": return "bg-amber-400/10 border-amber-400/20";
    case "critical": return "bg-red-400/10 border-red-400/20";
    default: return "bg-slate-400/10 border-slate-400/20";
  }
}

function PortfolioScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">Portfolio</span>
      </div>
    </div>
  );
}

function AppHealthCard({ state }: { state: AppObservabilityState }) {
  const config = ALL_CONFIGS.find((c) => c.appSlug === state.appSlug);
  const name = config?.appName || state.appSlug;

  return (
    <div className={`rounded-xl border p-4 ${statusBg(state.overallStatus)} transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white truncate pr-2">{name}</h4>
        <span className={`text-lg font-bold ${statusColor(state.overallStatus)}`}>{state.overallScore}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {state.pillars.slice(0, 6).map((p) => (
          <div key={p.pillarId} className="flex flex-col items-center">
            <span className={`text-xs font-mono font-bold ${statusColor(p.status)}`}>{p.score}</span>
            <span className="text-[9px] text-slate-500 truncate max-w-full text-center">
              {PILLARS.find((pd) => pd.id === p.pillarId)?.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>{state.metrics.length} metrics</span>
        <span>{state.events.filter((e) => e.severity !== "info").length} alerts</span>
      </div>
    </div>
  );
}

function PillarAggregateRow({ pillarId, apps }: { pillarId: PillarId; apps: AppObservabilityState[] }) {
  const pillar = PILLARS.find((p) => p.id === pillarId)!;
  const scores = apps.map((a) => a.pillars.find((p) => p.pillarId === pillarId)?.score ?? 0);
  const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
  const status = avg >= 80 ? "healthy" : avg >= 50 ? "degraded" : "critical";

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{pillar.name}</div>
        <div className="text-xs text-slate-500">{pillar.description}</div>
      </div>
      <div className="flex items-center gap-2">
        {scores.map((s, i) => (
          <div key={i} className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${s >= 80 ? "bg-emerald-400/10 text-emerald-400" : s >= 50 ? "bg-amber-400/10 text-amber-400" : "bg-red-400/10 text-red-400"}`}>
            {s}
          </div>
        ))}
      </div>
      <span className={`text-lg font-bold min-w-[40px] text-right ${statusColor(status)}`}>{avg}</span>
    </div>
  );
}

function resolveApiBase(): string {
  if (typeof window === "undefined") return "/api/";
  return `${window.location.origin}/api/`;
}

export default function PortfolioObservability() {
  const [appStates, setAppStates] = useState<AppObservabilityState[]>([]);
  const apiBase = useMemo(() => resolveApiBase(), []);

  const fetchFromApi = useCallback(async () => {
    try {
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
    } catch { /* silent */ }
  }, [apiBase]);

  useEffect(() => {
    fetchFromApi();
    const interval = setInterval(fetchFromApi, 5000);
    return () => clearInterval(interval);
  }, [fetchFromApi]);

  const portfolioScore = useMemo(() => {
    if (appStates.length === 0) return 0;
    return Math.round(appStates.reduce((s, a) => s + a.overallScore, 0) / appStates.length);
  }, [appStates]);

  const portfolioStatus = portfolioScore >= 80 ? "healthy" : portfolioScore >= 50 ? "degraded" : "critical";

  const recentEvents = useMemo(() => {
    return appStates
      .flatMap((a) => a.events.map((e) => ({ ...e, appSlug: a.appSlug })))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);
  }, [appStates]);

  const pillarIds: PillarId[] = ["performance", "business", "userExperience", "predictiveHealth", "operational", "strategic"];

  if (appStates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-500 animate-pulse">Loading portfolio observability...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Portfolio Observability</h2>
          <p className="text-sm text-slate-400 mt-1">Cross-app health intelligence across {appStates.length} applications</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${statusBg(portfolioStatus)} ${statusColor(portfolioStatus)}`}>
            <span className={`w-2 h-2 rounded-full ${portfolioStatus === "healthy" ? "bg-emerald-400" : portfolioStatus === "degraded" ? "bg-amber-400" : "bg-red-400"}`} />
            Portfolio: {portfolioStatus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="flex flex-col items-center gap-4">
          <PortfolioScoreRing score={portfolioScore} />
          <div className="text-center">
            <div className="text-sm text-slate-400">Overall Health</div>
            <div className={`text-sm font-semibold capitalize ${statusColor(portfolioStatus)}`}>{portfolioStatus}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-lg font-bold text-white">{appStates.length}</div>
              <div className="text-xs text-slate-500">Apps</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-lg font-bold text-white">{appStates.reduce((s, a) => s + a.metrics.length, 0)}</div>
              <div className="text-xs text-slate-500">Metrics</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {appStates.map((state) => (
            <AppHealthCard key={state.appSlug} state={state} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Pillar Aggregates</h3>
          <p className="text-xs text-slate-400">Cross-app pillar scores (each box = one app)</p>
        </div>
        <div className="divide-y divide-white/5">
          {pillarIds.map((id) => (
            <PillarAggregateRow key={id} pillarId={id} apps={appStates} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Cross-Portfolio Events</h3>
        </div>
        <div className="divide-y divide-white/5">
          {recentEvents.map((e) => (
            <div key={e.id} className="flex items-start gap-3 py-2 px-4 hover:bg-white/5 transition-colors">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0 mt-0.5 ${e.severity === "critical" ? "text-red-400 bg-red-400/10" : e.severity === "warning" ? "text-amber-400 bg-amber-400/10" : "text-blue-400 bg-blue-400/10"}`}>
                {e.severity === "critical" ? "!" : e.severity === "warning" ? "▲" : "●"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 truncate">{e.message}</div>
                <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                  <span className="text-cyan-400">{ALL_CONFIGS.find((c) => c.appSlug === e.appSlug)?.appName || e.appSlug}</span>
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
