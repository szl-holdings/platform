import { useState, useEffect, useMemo, useCallback } from "react";
import { type AppObservabilityState, type LensId, LENSES } from "@szl-holdings/observability";
import { ALL_CONFIGS } from "@szl-holdings/observability/configs";
import { PageDataSkeleton } from "@szl-holdings/shared-ui";

const LENS_ICONS: Record<string, string> = {
  signal: "◎",
  impact: "$",
  anticipation: "◈",
  topology: "⬡",
  posture: "◆",
  velocity: "▲",
};

function statusColor(status: string): string {
  switch (status) {
    case "healthy": return "text-[#6b8f71]";
    case "degraded": return "text-[#d4a054]";
    case "critical": return "text-[#c45a4a]";
    default: return "text-slate-400";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "healthy": return "bg-[#6b8f71]/10 border-[#6b8f71]/20";
    case "degraded": return "bg-[#d4a054]/10 border-[#d4a054]/20";
    case "critical": return "bg-[#c45a4a]/10 border-[#c45a4a]/20";
    default: return "bg-slate-400/10 border-slate-400/20";
  }
}

function PortfolioScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#6b8f71" : score >= 50 ? "#d4a054" : "#c45a4a";

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
        <span className="text-xs text-slate-400">Posture</span>
      </div>
    </div>
  );
}

function AppLensCard({ state }: { state: AppObservabilityState }) {
  const config = ALL_CONFIGS.find((c) => c.appSlug === state.appSlug);
  const name = config?.appName || state.appSlug;
  const lenses = state.lenses || state.pillars || [];
  const postureScore = state.postureScore ?? state.overallScore;

  return (
    <div className={`rounded-xl border p-4 ${statusBg(state.overallStatus)} transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-white truncate pr-2">{name}</h4>
        <span className={`text-lg font-bold ${statusColor(state.overallStatus)}`}>{postureScore}</span>
      </div>
      {state.topSignal && (
        <p className="text-[10px] text-white/40 truncate mb-2">◎ {state.topSignal}</p>
      )}
      <div className="grid grid-cols-3 gap-1">
        {lenses.map((lens) => {
          const lensId = (lens.lensId || (lens as { pillarId?: string }).pillarId || "") as string;
          return (
            <div key={lensId} className="flex flex-col items-center py-1">
              <span className={`text-xs font-mono font-bold ${statusColor(lens.status)}`}>{lens.score}</span>
              <span className="text-[8px] text-slate-500">{LENS_ICONS[lensId] || lensId.slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span>{state.metrics.length} signals</span>
        <span>{state.events.filter((e) => e.severity !== "info").length} alerts</span>
      </div>
    </div>
  );
}

function LensAggregateRow({ lensId, apps }: { lensId: LensId; apps: AppObservabilityState[] }) {
  const lens = LENSES.find((l) => l.id === lensId)!;
  const scores = apps.map((a) => {
    const lenses = a.lenses || a.pillars || [];
    return (lenses.find((l) => l.lensId === lensId || (l as { pillarId?: string }).pillarId === lensId))?.score ?? 0;
  });
  const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
  const status = avg >= 80 ? "healthy" : avg >= 50 ? "degraded" : "critical";

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
      <div className="w-7 h-7 rounded flex items-center justify-center bg-white/5 text-white/40 text-sm flex-shrink-0">
        {LENS_ICONS[lensId] || "◆"}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{lens.name}</div>
        <div className="text-xs text-slate-500 line-clamp-1">{lens.tagline}</div>
      </div>
      <div className="flex items-center gap-1">
        {scores.map((s, i) => (
          <div key={i} className={`w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center ${s >= 80 ? "bg-[#6b8f71]/10 text-[#6b8f71]" : s >= 50 ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#c45a4a]/10 text-[#c45a4a]"}`}>
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
            lenses: data.lenses || data.pillars,
            pillars: data.lenses || data.pillars,
            overallScore: data.overallScore,
            overallStatus: data.overallStatus,
            postureScore: data.postureScore,
            topSignal: data.topSignal,
            velocityTrend: data.velocityTrend,
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

  const lensIds: LensId[] = ["signal", "impact", "anticipation", "topology", "posture", "velocity"];

  if (appStates.length === 0) {
    return <PageDataSkeleton rows={6} accentColor="#6366f1" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Portfolio Observability</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">6 Lenses</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">The 6 Lenses of Business Observability across {appStates.length} portfolio applications</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${statusBg(portfolioStatus)} ${statusColor(portfolioStatus)}`}>
          <span className={`w-2 h-2 rounded-full ${portfolioStatus === "healthy" ? "bg-[#6b8f71]" : portfolioStatus === "degraded" ? "bg-[#d4a054]" : "bg-[#c45a4a]"}`} />
          Portfolio: {portfolioStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="flex flex-col items-center gap-4">
          <PortfolioScoreRing score={portfolioScore} />
          <div className="text-center">
            <div className="text-sm text-slate-400">Portfolio Posture</div>
            <div className={`text-sm font-semibold capitalize ${statusColor(portfolioStatus)}`}>{portfolioStatus}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-lg font-bold text-white">{appStates.length}</div>
              <div className="text-xs text-slate-500">Apps</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-lg font-bold text-white">{appStates.reduce((s, a) => s + a.metrics.length, 0)}</div>
              <div className="text-xs text-slate-500">Signals</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {appStates.map((state) => (
            <AppLensCard key={state.appSlug} state={state} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Lens Aggregates — Portfolio-Wide</h3>
          <p className="text-xs text-slate-400">Average score per lens across all {appStates.length} applications (each box = one app)</p>
        </div>
        <div className="divide-y divide-white/5">
          {lensIds.map((id) => (
            <LensAggregateRow key={id} lensId={id} apps={appStates} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Cross-Portfolio Lens Events</h3>
        </div>
        <div className="divide-y divide-white/5">
          {recentEvents.map((e) => {
            const lensId = e.lens || e.pillar;
            return (
              <div key={e.id} className="flex items-start gap-3 py-2 px-4 hover:bg-white/5 transition-colors">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0 mt-0.5 ${e.severity === "critical" ? "text-[#c45a4a] bg-[#c45a4a]/10" : e.severity === "warning" ? "text-[#d4a054] bg-[#d4a054]/10" : "text-[#4a90b8] bg-[#4a90b8]/10"}`}>
                  {e.severity === "critical" ? "!" : e.severity === "warning" ? "▲" : "●"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 truncate">{e.message}</div>
                  <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                    <span className="text-cyan-400">{ALL_CONFIGS.find((c) => c.appSlug === e.appSlug)?.appName || e.appSlug}</span>
                    <span>·</span>
                    <span className="capitalize text-white/30">{LENS_ICONS[lensId] || "◆"} {lensId} lens</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
