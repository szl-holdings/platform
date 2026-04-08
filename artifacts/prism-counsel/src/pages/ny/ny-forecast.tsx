import { useState } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { useNyMatters, useNyForecasts } from "../../hooks/use-ny-api";
import { useQueryClient } from "@tanstack/react-query";

const FORECAST_LABELS: Record<string, { label: string; desc: string }> = {
  deadline_breach_risk: { label: "Deadline Breach Risk", desc: "Probability that a statutory clock will breach before remediation" },
  no_fault_evidence_lock_risk: { label: "No-Fault Evidence-Lock Risk", desc: "Risk that evidence positions are locked by IME/peer denials" },
  disclaimer_vulnerability_score: { label: "Disclaimer Vulnerability Score", desc: "Strength of challenge to insurer's disclaimer timeliness or exclusion basis" },
  demand_readiness_score: { label: "Demand Readiness Score", desc: "Completeness of demand package across all required artifact categories" },
  offer_movement_forecast: { label: "Offer Movement Forecast", desc: "Predicted offer trajectory based on reserve movement and negotiation signals" },
  mediation_conversion_probability: { label: "Mediation Conversion Probability", desc: "Likelihood of settlement at scheduled mediation based on readiness and position gap" },
  venue_velocity_forecast: { label: "Venue / Part Velocity Forecast", desc: "Expected timeline and plaintiff-friendliness of assigned court part" },
  ai_defensibility_score: { label: "AI Defensibility Score", desc: "Governance quality of AI-generated outputs — grounding, approval, privilege compliance" },
};

export default function NyForecastPage() {
  const { data: matters, isLoading: mattersLoading } = useNyMatters();
  const [selectedMatterId, setSelectedMatterId] = useState<number | null>(null);
  const [computing, setComputing] = useState(false);
  const qc = useQueryClient();

  const effectiveMatterId = selectedMatterId ?? matters?.[0]?.id ?? null;
  const selectedMatter = matters?.find(m => m.id === effectiveMatterId) ?? matters?.[0] ?? null;

  const { data: forecasts, isLoading: forecastsLoading } = useNyForecasts(effectiveMatterId);

  const handleCompute = async () => {
    if (!effectiveMatterId) return;
    setComputing(true);
    try {
      await fetch(`/api/prism-counsel/ny/matters/${effectiveMatterId}/forecasts/compute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      await qc.invalidateQueries({ queryKey: ["ny-forecasts", effectiveMatterId] });
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="p-6 max-w-[1300px] mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">NY Forecast Engine</h1>
          </div>
          <p className="text-xs text-slate-500">8 forecast types · drivers, confidence, weekly delta, and next-best-action per matter</p>
        </div>

        <div className="flex items-center gap-2">
          {!mattersLoading && matters && matters.length > 0 && (
            <div className="relative">
              <select
                className="appearance-none bg-[#0c1220] border border-white/[0.08] rounded-lg px-3 py-2 pr-7 text-xs text-slate-200 focus:outline-none focus:border-[#d4a054]/40"
                value={effectiveMatterId ?? ""}
                onChange={e => setSelectedMatterId(Number(e.target.value))}
              >
                {matters.map(m => (
                  <option key={m.id} value={m.id}>{m.title.split(" (")[0]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          )}
          <button
            onClick={handleCompute}
            disabled={computing || !effectiveMatterId}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-[#d4a054]/10 border border-[#d4a054]/30 text-[#d4a054] hover:bg-[#d4a054]/20 transition-colors disabled:opacity-50"
          >
            {computing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {computing ? "Computing..." : "Run Forecasts"}
          </button>
        </div>
      </div>

      {mattersLoading || forecastsLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-8">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading forecast data from API...
        </div>
      ) : !effectiveMatterId || !forecasts || forecasts.length === 0 ? (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <TrendingUp className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <div className="text-sm text-slate-400 mb-1">No forecasts found</div>
          <div className="text-xs text-slate-500 mb-4">
            {!effectiveMatterId ? "No NY matters found. Use the seed endpoint to load demo data." : "Click \"Run Forecasts\" to compute forecasts for this matter."}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedMatter && (
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2">
              <span className="text-sm font-semibold text-[#d4a054]">{selectedMatter.title.split(" (")[0]}</span>
              <span className="text-[10px] text-slate-500 font-mono">{selectedMatter.caseNumber}</span>
              <span className="text-[9px] text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04]">{selectedMatter.jurisdiction}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {forecasts.map((f, fi) => {
              const meta = FORECAST_LABELS[f.forecastType] || { label: f.forecastType, desc: "" };
              const score = Number(f.score);
              const weeklyDelta = Number(f.weeklyDelta ?? 0);
              const confidence = Number(f.confidence ?? 0);
              const deltaColor = weeklyDelta > 0 ? "#4a90b8" : weeklyDelta < 0 ? "#c45a4a" : "#64748b";
              const DeltaIcon = weeklyDelta > 0 ? ArrowUpRight : weeklyDelta < 0 ? ArrowDownRight : Minus;
              const scoreColor = score >= 75 ? "#4a90b8" : score >= 50 ? "#d4a054" : "#c45a4a";

              return (
                <div key={fi} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-medium text-slate-200">{meta.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{meta.desc}</div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ml-4"
                      style={{ background: scoreColor + "20", color: scoreColor }}
                    >
                      {Math.round(score)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <div>
                      <div className="text-[9px] text-slate-600 mb-0.5">Confidence</div>
                      <div className="text-[11px] font-mono text-slate-300">{Math.round(confidence)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-600 mb-0.5">Weekly Delta</div>
                      <div className="flex items-center gap-0.5" style={{ color: deltaColor }}>
                        <DeltaIcon className="w-3 h-3" />
                        <span className="text-[11px] font-mono">{Math.abs(weeklyDelta).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {f.nextBestAction && (
                    <div className="rounded border border-[#d4a054]/10 p-2 mb-2" style={{ background: "#0e0d08" }}>
                      <div className="text-[9px] text-[#d4a054] uppercase font-medium mb-0.5">Next Best Action</div>
                      <div className="text-[10px] text-slate-400 leading-relaxed">{f.nextBestAction}</div>
                    </div>
                  )}

                  {f.drivers && f.drivers.length > 0 && (
                    <div className="space-y-1">
                      {f.drivers.map((d, di) => (
                        <div key={di} className="flex items-start gap-2">
                          <div className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${d.impact === "positive" ? "bg-[#4a90b8]" : d.impact === "negative" ? "bg-[#c45a4a]" : "bg-slate-500"}`} />
                          <div className="text-[10px] text-slate-500">
                            <span className="text-slate-400">{d.driverName}:</span> {d.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">Forecast Methodology</h2>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          NY Insurance forecasts are computed from rule-based scoring across 6 signal families: Claim Clock, Coverage/Denial, Matter Execution, Damages/Medical, Insurer/Negotiation, and AI/Governance. Each forecast returns a score (0–100), confidence percentage, weekly delta, contributing drivers with impact polarity, and a next-best-action recommendation. All forecasts require attorney review before informing case strategy and do not constitute legal advice.
        </p>
      </div>
    </div>
  );
}
