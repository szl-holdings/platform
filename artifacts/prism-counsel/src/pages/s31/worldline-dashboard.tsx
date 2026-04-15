import { useState } from "react";
import { Globe, Radio, Zap, RefreshCw, Database, AlertTriangle, MapPin, Cloud, Gavel, Shield, Building2, FileText } from "lucide-react";
import { useWorldlineSources, useWorldlineSignals, useWorldlineInit } from "../../hooks/use-prism-s31";

const SOURCE_ICONS: Record<string, any> = {
  regulatory_insurance: Shield, crash_incident: AlertTriangle, weather_environmental: Cloud,
  county_demographic: MapPin, court_venue: Gavel, lien_recovery: FileText, internal_firm: Building2,
};

const SOURCE_COLORS: Record<string, string> = {
  regulatory_insurance: "#c45a4a", crash_incident: "#c8953c", weather_environmental: "#4a90b8",
  county_demographic: "#8b7ac8", court_venue: "#d4a054", lien_recovery: "#c45a4a", internal_firm: "#4a90b8",
};

const DEMO_SOURCES: any[] = [];
const DEMO_SIGNALS: any[] = [];

export default function WorldlineDashboard() {
  const { data: sourcesData } = useWorldlineSources();
  const { data: signalsData } = useWorldlineSignals(50);
  const initMutation = useWorldlineInit();
  const [filter, setFilter] = useState<string>("all");

  const sources = sourcesData?.sources?.length > 0 ? sourcesData.sources : DEMO_SOURCES;
  const signals = signalsData?.signals?.length > 0 ? signalsData.signals : DEMO_SIGNALS;
  const isDemo = !sourcesData?.sources?.length;

  const filteredSignals = filter === "all" ? signals : signals.filter((s: any) => s.sourceClass === filter);
  const totalSignals = sources.reduce((sum: number, s: any) => sum + (s.totalSignals ?? 0), 0);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#c8953c]" />
            <h1 className="text-lg font-semibold text-slate-100">Worldline Signal Refinery</h1>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-world signal ingestion from 7 source classes — scoring, normalization, and matter matching</p>
        </div>
        <button onClick={() => initMutation.mutate()} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium bg-[#c8953c]/10 text-[#c8953c] hover:bg-[#c8953c]/20 transition-colors">
          <RefreshCw className={`w-3 h-3 ${initMutation.isPending ? "animate-spin" : ""}`} />
          Initialize Sources
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Source Classes", value: "7", icon: Database, color: "#c8953c" },
          { label: "Active Sources", value: String(sources.length), icon: Radio, color: "#4a90b8" },
          { label: "Total Signals", value: totalSignals.toLocaleString(), icon: Zap, color: "#8b7ac8" },
          { label: "Legal Usefulness", value: "0.79 avg", icon: Gavel, color: "#d4a054" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-[10px] text-slate-500">{s.label}</span>
              </div>
              <div className="text-lg font-semibold text-slate-100">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Source Registry</h3>
        <div className="space-y-2">
          {sources.map((src: any) => {
            const Icon = SOURCE_ICONS[src.sourceClass] ?? Globe;
            const color = SOURCE_COLORS[src.sourceClass] ?? "#d4a054";
            return (
              <div key={src.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200">{src.name}</div>
                  <div className="text-[10px] text-slate-500">{src.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">{(src.totalSignals ?? 0).toLocaleString()} signals</div>
                  <div className="text-[9px] text-slate-600">{src.lastFetchStatus === "success" ? "✓ healthy" : src.lastFetchStatus ?? "pending"}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${src.status === "active" ? "bg-[#4a90b8]" : "bg-slate-600"}`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Recent Signals</h3>
          <div className="flex gap-1">
            {["all", "crash_incident", "regulatory_insurance", "weather_environmental", "court_venue", "lien_recovery"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${filter === f ? "bg-[#c8953c]/15 text-[#c8953c]" : "text-slate-600 hover:text-slate-400"}`}>
                {f === "all" ? "ALL" : f.split("_").map(w => w[0].toUpperCase()).join("")}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filteredSignals.slice(0, 10).map((sig: any, i: number) => {
            const Icon = SOURCE_ICONS[sig.sourceClass] ?? Globe;
            const color = SOURCE_COLORS[sig.sourceClass] ?? "#d4a054";
            return (
              <div key={sig.id ?? i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200">{sig.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{sig.summary}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[9px] text-slate-600">Fresh: {(sig.freshnessScore * 100).toFixed(0)}%</span>
                    <span className="text-[9px] text-slate-600">Provenance: {(sig.provenanceScore * 100).toFixed(0)}%</span>
                    <span className="text-[9px] text-slate-600">Legal: {(sig.legalUsefulnessScore * 100).toFixed(0)}%</span>
                    {sig.county && <span className="text-[9px] text-slate-600">📍 {sig.county}</span>}
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
