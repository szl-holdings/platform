import { useState } from "react";
import { Globe, Radio, Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface WorldlineSource {
  id: number;
  orgId: number;
  sourceClass: string;
  name: string;
  description: string | null;
  fetchMethod: string;
  schedule: string | null;
  status: string;
  lastFetchAt: string | null;
  lastFetchStatus: string | null;
  totalSignals: number | null;
  createdAt: string;
}

interface WorldlineSignal {
  id: number;
  orgId: number;
  sourceId: number | null;
  sourceClass: string;
  eventType: string;
  title: string;
  summary: string | null;
  jurisdiction: string | null;
  county: string | null;
  freshnessScore: number | null;
  provenanceScore: number | null;
  legalUsefulnessScore: number | null;
  fetchedAt: string;
  createdAt: string;
}

interface WorldlineSourcesResponse { sources: WorldlineSource[] }
interface WorldlineSignalsResponse { signals: WorldlineSignal[] }

const SOURCE_CLASSES = [
  { id: "regulatory_insurance", label: "Regulatory / Insurance", color: "#4a90b8", icon: "📋" },
  { id: "crash_incident", label: "Crash / Incident", color: "#c45a4a", icon: "🚨" },
  { id: "weather_environmental", label: "Weather / Environmental", color: "#5aa87a", icon: "🌤" },
  { id: "county_demographic", label: "County / Demographic", color: "#8a7a6a", icon: "🏛" },
  { id: "court_venue", label: "Court / Venue", color: "#d4a054", icon: "⚖️" },
  { id: "lien_recovery", label: "Lien / Recovery", color: "#a45a8a", icon: "💰" },
  { id: "internal_firm", label: "Internal Firm Outcomes", color: "#4a90b8", icon: "📊" },
];

const PIPELINE_STEPS = [
  "source_registration", "fetch", "schema_validation", "normalization",
  "geolink", "freshness_scoring", "provenance_scoring", "usefulness_scoring",
  "matter_jurisdiction_matching", "feature_generation", "publish_pressure_graph",
  "forecast_recompute", "audit_event"
];

function SourceClassCard({ cls, signalCount }: { cls: typeof SOURCE_CLASSES[number]; signalCount: number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{cls.icon}</span>
        <div>
          <div className="text-xs font-semibold text-slate-200">{cls.label}</div>
          <div className="text-[10px] text-slate-500">Source class</div>
        </div>
      </div>
      <div className="flex items-end gap-1">
        <div className="text-xl font-bold" style={{ color: cls.color }}>{signalCount}</div>
        <div className="text-[10px] text-slate-500 mb-0.5">signals</div>
      </div>
      <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (signalCount / 50) * 100)}%`, background: cls.color }} />
      </div>
    </div>
  );
}

export default function WorldlinePage() {
  const [view, setView] = useState<"sources" | "signals" | "pipeline">("sources");

  const { data: sourcesData, isLoading } = useQuery<WorldlineSourcesResponse>({
    queryKey: ["worldline-sources"],
    queryFn: () => apiRequest<WorldlineSourcesResponse>("GET", "/api/prism-counsel/s31/worldline/sources"),
  });

  const { data: signalsData } = useQuery<WorldlineSignalsResponse>({
    queryKey: ["worldline-signals"],
    queryFn: () => apiRequest<WorldlineSignalsResponse>("GET", "/api/prism-counsel/worldline/signals"),
    enabled: view === "signals",
  });

  const sources: WorldlineSource[] = sourcesData?.sources ?? [];
  const signals: WorldlineSignal[] = signalsData?.signals ?? [];

  const activeSources = sources.filter((s) => s.status === "active").length;
  const errorSources = sources.filter((s) => s.status === "error").length;
  const totalSignals = sources.reduce((sum, s) => sum + (s.totalSignals ?? 0), 0);

  return (
    <div className="p-5 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#5aa87a]" />
          <h1 className="text-sm font-semibold text-slate-200">Worldline Engine</h1>
          <span className="px-2 py-0.5 rounded text-[9px] bg-[#5aa87a]/10 text-[#5aa87a] border border-[#5aa87a]/20">
            SIGNAL REFINERY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {errorSources > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#c45a4a]">
              <AlertTriangle className="w-3 h-3" /> {errorSources} source error(s)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Sources", value: activeSources, color: "#5aa87a" },
          { label: "Error Sources", value: errorSources, color: "#c45a4a" },
          { label: "Total Signals", value: totalSignals, color: "#4a90b8" },
          { label: "Source Classes", value: 7, color: "#d4a054" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["sources", "signals", "pipeline"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
              view === v ? "bg-white/[0.08] text-slate-100" : "text-slate-400 hover:text-slate-200 bg-white/[0.02]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "sources" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {SOURCE_CLASSES.map(cls => {
              const liveSource = sources.find((s) => s.sourceClass === cls.id);
              return <SourceClassCard key={cls.id} cls={cls} signalCount={liveSource?.totalSignals ?? 0} />;
            })}
          </div>
          {isLoading && <div className="text-xs text-slate-500">Loading sources…</div>}
          {!isLoading && sources.length > 0 && (
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-xs font-semibold text-slate-200 mb-3">Registered Sources</h3>
              <div className="space-y-2">
                {sources.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div>
                      <div className="text-xs text-slate-200">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.sourceClass} · {s.fetchMethod}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] text-slate-500">{s.totalSignals ?? 0} signals</div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        s.status === "active" ? "bg-[#5aa87a]/10 text-[#5aa87a]" :
                        s.status === "error" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                        "bg-slate-500/10 text-slate-400"
                      }`}>
                        {s.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isLoading && sources.length === 0 && (
            <div className="rounded-lg border border-white/[0.06] p-6 text-center" style={{ background: "#0c1220" }}>
              <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-xs text-slate-500 mb-3">No worldline sources registered</div>
              <div className="text-[10px] text-slate-600">Initialize default sources via POST /api/prism-counsel/s31/worldline/initialize</div>
            </div>
          )}
        </div>
      )}

      {view === "signals" && (
        <div className="space-y-2">
          {signals.length === 0 && <div className="text-xs text-slate-500">No signals ingested yet</div>}
          {signals.map((s, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3 flex items-center justify-between" style={{ background: "#0c1220" }}>
              <div>
                <div className="text-xs text-slate-200">{s.title ?? s.eventType ?? "Signal"}</div>
                <div className="text-[10px] text-slate-500">{s.sourceClass} · {s.jurisdiction ?? "—"}</div>
              </div>
              <div className="text-right">
                {s.freshnessScore && <div className="text-[10px] text-slate-400">Fresh: {(s.freshnessScore * 100).toFixed(0)}%</div>}
                {s.provenanceScore && <div className="text-[10px] text-slate-400">Prov: {(s.provenanceScore * 100).toFixed(0)}%</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "pipeline" && (
        <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-200 mb-4">13-Step Signal Pipeline</h3>
          <div className="space-y-2">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono border border-white/[0.10] text-slate-400">
                  {i + 1}
                </div>
                <div className="flex-1 h-px bg-white/[0.04]" />
                <div className="text-[11px] text-slate-400 capitalize">{step.replace(/_/g, " ")}</div>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
