import { useState, useMemo } from "react";
import { useObservability } from "./provider.js";
import { PILLARS, type PillarId, type PillarScore, type MetricSnapshot, type ObservabilityEvent } from "../types.js";

const PILLAR_ACCENTS: Record<string, string> = {
  performance: "#3b82f6",
  business: "#10b981",
  userExperience: "#8b5cf6",
  predictiveHealth: "#f59e0b",
  operational: "#94a3b8",
  strategic: "#f43f5e",
  securityPosture: "#ef4444",
  innovationVelocity: "#6366f1",
};

const PILLAR_ICONS: Record<string, string> = {
  performance: "⚡",
  business: "📈",
  userExperience: "👥",
  predictiveHealth: "🧠",
  operational: "🖥️",
  strategic: "🎯",
  securityPosture: "🛡️",
  innovationVelocity: "🚀",
};

function formatValue(value: number, unit: string): string {
  if (unit === "percent" || unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "ms") return `${value.toFixed(0)}ms`;
  if (unit === "seconds" || unit === "sec") return `${value.toFixed(1)}s`;
  if (unit === "score") return value.toFixed(0);
  if (unit === "per_hour" || unit === "/hr") return `${value.toFixed(0)}/hr`;
  if (unit === "count") return value.toFixed(0);
  return value.toFixed(1);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function statusColor(status: string): string {
  switch (status) {
    case "healthy":
    case "normal":
      return "text-emerald-400";
    case "degraded":
    case "warning":
      return "text-amber-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "healthy":
    case "normal":
      return "bg-emerald-400/10 border-emerald-400/20";
    case "degraded":
    case "warning":
      return "bg-amber-400/10 border-amber-400/20";
    case "critical":
      return "bg-red-400/10 border-red-400/20";
    default:
      return "bg-slate-400/10 border-slate-400/20";
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-400 bg-red-400/10";
    case "warning":
      return "text-amber-400 bg-amber-400/10";
    default:
      return "text-blue-400 bg-blue-400/10";
  }
}

function SparkLine({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PillarCard({ pillar, score }: { pillar: typeof PILLARS[0]; score: PillarScore }) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score.score / 100) * circumference;
  const accent = PILLAR_ACCENTS[pillar.id] || "#94a3b8";
  const icon = PILLAR_ICONS[pillar.id] || "●";

  return (
    <div className={`rounded-xl border p-4 ${statusBg(score.status)} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{icon}</span>
          <h4 className="text-sm font-medium text-white/90 truncate">{pillar.name}</h4>
        </div>
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
            <circle
              cx="20" cy="20" r="18" fill="none"
              stroke={score.status === "healthy" ? accent : score.status === "degraded" ? "#f59e0b" : "#ef4444"}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${statusColor(score.status)}`}>
            {score.score}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 line-clamp-2">{pillar.description}</p>
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>{score.metricCount} metrics</span>
        {score.anomalyCount > 0 && (
          <span className="text-red-400">{score.anomalyCount} anomal{score.anomalyCount === 1 ? "y" : "ies"}</span>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/5">
        <span className="text-[10px] text-white/20 uppercase tracking-wider">{pillar.inspiredBy}</span>
      </div>
    </div>
  );
}

function MetricRow({ snapshot, config }: { snapshot: MetricSnapshot; config: { metrics: { id: string; name: string; unit: string; pillar: PillarId }[] } }) {
  const def = config.metrics.find((m) => m.id === snapshot.metricId);
  if (!def) return null;

  const sparkColor = snapshot.status === "critical" ? "#ef4444" : snapshot.status === "warning" ? "#f59e0b" : "#10b981";

  return (
    <div className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90 truncate">{def.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>{PILLAR_ICONS[def.pillar] || "●"}</span>
          <span className="capitalize">{def.pillar.replace(/([A-Z])/g, " $1").trim()}</span>
        </div>
      </div>
      <SparkLine data={snapshot.trend} color={sparkColor} />
      <div className="text-right min-w-[60px]">
        <div className={`text-sm font-mono font-medium ${statusColor(snapshot.status)}`}>
          {formatValue(snapshot.current, def.unit)}
        </div>
        <div className={`text-xs ${snapshot.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {snapshot.changePercent >= 0 ? "+" : ""}{snapshot.changePercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ObservabilityEvent }) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0 mt-0.5 ${severityColor(event.severity)}`}>
        {event.severity === "critical" ? "!" : event.severity === "warning" ? "▲" : "●"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/80 truncate">{event.message}</div>
        <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
          <span>{PILLAR_ICONS[event.pillar] || "●"}</span>
          <span className="capitalize">{event.pillar.replace(/([A-Z])/g, " $1").trim()}</span>
          <span>·</span>
          <span>{event.type.replace(/_/g, " ")}</span>
          <span>·</span>
          <span>{timeAgo(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

type TabId = "pillars" | "metrics" | "events";

export function ObservabilityPanel() {
  const { state, config } = useObservability();
  const [activeTab, setActiveTab] = useState<TabId>("pillars");
  const [pillarFilter, setPillarFilter] = useState<PillarId | "all">("all");

  const filteredMetrics = useMemo(() => {
    if (pillarFilter === "all") return state.metrics;
    return state.metrics.filter((m) => {
      const def = config.metrics.find((d) => d.id === m.metricId);
      return def?.pillar === pillarFilter;
    });
  }, [state.metrics, config.metrics, pillarFilter]);

  const filteredEvents = useMemo(() => {
    if (pillarFilter === "all") return state.events;
    return state.events.filter((e) => e.pillar === pillarFilter);
  }, [state.events, pillarFilter]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "pillars", label: "8 Pillars" },
    { id: "metrics", label: "Metrics" },
    { id: "events", label: "Events" },
  ];

  const maturityLevel = config.maturityLevel || 3;
  const maturityNames = ["", "Reactive", "Proactive", "Predictive", "Intelligent", "Autonomous"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">◆</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{config.appName}</h2>
              <p className="text-xs text-indigo-400/70 font-medium">DreamStack Intelligence</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-1">{config.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
            L{maturityLevel} {maturityNames[maturityLevel]}
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${statusBg(state.overallStatus)} ${statusColor(state.overallStatus)}`}>
            <span className={`w-2 h-2 rounded-full ${state.overallStatus === "healthy" ? "bg-emerald-400" : state.overallStatus === "degraded" ? "bg-amber-400" : "bg-red-400"}`} />
            Score: {state.overallScore}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "text-white bg-white/10 border-b-2 border-indigo-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value as PillarId | "all")}
            className="bg-white/5 border border-white/10 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
          >
            <option value="all">All Pillars</option>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>{PILLAR_ICONS[p.id]} {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === "pillars" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((pillar) => {
            const score = state.pillars.find((p) => p.pillarId === pillar.id);
            if (!score) return null;
            if (pillarFilter !== "all" && pillar.id !== pillarFilter) return null;
            return <PillarCard key={pillar.id} pillar={pillar} score={score} />;
          })}
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {filteredMetrics.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No metrics for selected pillar</div>
          ) : (
            filteredMetrics.map((m) => (
              <MetricRow key={m.metricId} snapshot={m} config={config} />
            ))
          )}
        </div>
      )}

      {activeTab === "events" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No events for selected pillar</div>
          ) : (
            filteredEvents.slice(0, 20).map((e) => (
              <EventRow key={e.id} event={e} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
