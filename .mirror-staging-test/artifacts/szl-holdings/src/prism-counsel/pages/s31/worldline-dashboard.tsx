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

const DEMO_SOURCES = [
  { id: 1, name: "NY DFS Complaints", sourceClass: "regulatory_insurance", status: "active", totalSignals: 847, lastFetchAt: "2026-04-03T10:00:00Z", lastFetchStatus: "success", description: "NY DFS insurance complaint data" },
  { id: 2, name: "NYC Open Data Crashes", sourceClass: "crash_incident", status: "active", totalSignals: 2341, lastFetchAt: "2026-04-03T09:30:00Z", lastFetchStatus: "success", description: "NYPD motor vehicle crash data" },
  { id: 3, name: "NWS Weather Alerts", sourceClass: "weather_environmental", status: "active", totalSignals: 156, lastFetchAt: "2026-04-03T10:15:00Z", lastFetchStatus: "success", description: "National Weather Service active alerts for NY" },
  { id: 4, name: "NWS Observations NYC", sourceClass: "weather_environmental", status: "active", totalSignals: 365, lastFetchAt: "2026-04-03T10:00:00Z", lastFetchStatus: "success", description: "NWS latest weather observations" },
  { id: 5, name: "Census ACS County Data", sourceClass: "county_demographic", status: "active", totalSignals: 62, lastFetchAt: "2026-04-02T08:00:00Z", lastFetchStatus: "success", description: "Census county-level demographics" },
  { id: 6, name: "NY Courts eCourts", sourceClass: "court_venue", status: "active", totalSignals: 423, lastFetchAt: "2026-04-03T08:00:00Z", lastFetchStatus: "success", description: "NY State court system data" },
  { id: 7, name: "CMS MSP Recovery", sourceClass: "lien_recovery", status: "active", totalSignals: 89, lastFetchAt: "2026-04-02T12:00:00Z", lastFetchStatus: "success", description: "CMS Medicare Secondary Payer recovery" },
];

const DEMO_SIGNALS = [
  { id: 1, sourceClass: "crash_incident", title: "Multi-vehicle collision — Belt Pkwy, Brooklyn", summary: "3-vehicle rear-end collision with injuries, NYPD report filed", freshnessScore: 0.95, provenanceScore: 0.9, legalUsefulnessScore: 0.85, jurisdiction: "NY", county: "Kings", createdAt: "2026-04-03T08:14:00Z" },
  { id: 2, sourceClass: "regulatory_insurance", title: "DFS complaint: Claim denial — National General", summary: "PIP claim denied for pre-existing condition, complaint filed with DFS", freshnessScore: 0.88, provenanceScore: 0.9, legalUsefulnessScore: 0.92, jurisdiction: "NY", county: "New York", createdAt: "2026-04-02T15:30:00Z" },
  { id: 3, sourceClass: "weather_environmental", title: "Winter Weather Advisory — Northern NY", summary: "6-8 inches snow expected, travel hazards anticipated", freshnessScore: 0.97, provenanceScore: 0.95, legalUsefulnessScore: 0.55, jurisdiction: "NY", county: "Albany", createdAt: "2026-04-03T06:00:00Z" },
  { id: 4, sourceClass: "court_venue", title: "Kings County Supreme — Scheduling update", summary: "Trial calendar adjustments for April 2026 term", freshnessScore: 0.85, provenanceScore: 0.88, legalUsefulnessScore: 0.90, jurisdiction: "NY", county: "Kings", createdAt: "2026-04-01T14:00:00Z" },
  { id: 5, sourceClass: "lien_recovery", title: "CMS conditional payment notice", summary: "Medicare lien identified for claimant — $12,847 conditional payments", freshnessScore: 0.78, provenanceScore: 0.92, legalUsefulnessScore: 0.88, jurisdiction: "NY", county: null, createdAt: "2026-03-30T10:00:00Z" },
];

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
