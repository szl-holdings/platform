import { useState } from "react";
import { Radio, Zap, CheckCircle2, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

const DATA_PRODUCTS = [
  { id: "insurer_pressure_index", label: "Insurer Pressure Index", description: "Blends insurer response patterns, reservation history, and adjuster behavior signals", color: "#c45a4a" },
  { id: "venue_velocity_index", label: "Venue Velocity Index", description: "Court/venue settlement and verdict velocity based on county and judge-level outcomes", color: "#4a90b8" },
  { id: "incident_context_layer", label: "Incident Context Layer", description: "Crash/environmental context: weather at time of loss, road conditions, nearby incidents", color: "#5aa87a" },
  { id: "nofault_friction_score", label: "No-Fault Friction Score", description: "Carrier behavior in no-fault verification, denial, and payment timelines", color: "#d4a054" },
  { id: "settlement_friction_map", label: "Settlement Friction Map", description: "Geographic and carrier-level settlement resistance based on historical outcomes", color: "#8a7a6a" },
  { id: "ai_defensibility_index", label: "AI Defensibility Index", description: "Evidence strength, inconsistency flags, and privilege exposure scoring", color: "#a45a8a" },
];

export default function SignalForgePage() {
  const [view, setView] = useState<"forge" | "data_products">("forge");

  const { data: runsData, isLoading } = useQuery({
    queryKey: ["signal-forge-runs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prism-counsel/signal-forge/runs");
      return res.json();
    },
  });

  const { data: dataProductsData } = useQuery({
    queryKey: ["data-products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prism-counsel/data-products");
      return res.json();
    },
    enabled: view === "data_products",
  });

  const runs = runsData?.data?.runs ?? [];
  const scores = dataProductsData?.data?.scores ?? [];
  const scoresByProduct: Record<string, any[]> = {};
  for (const s of scores) scoresByProduct[s.product] = [...(scoresByProduct[s.product] ?? []), s];

  const PIPELINE_STAGES = [
    "ingest", "clean", "normalize", "enrich", "contradiction_detect",
    "feature_engineer", "quality_score"
  ];

  const latestRun = runs[0];

  return (
    <div className="p-5 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-[#a45a8a]" />
        <h1 className="text-sm font-semibold text-slate-200">Signal Forge</h1>
        <span className="px-2 py-0.5 rounded text-[9px] bg-[#a45a8a]/10 text-[#a45a8a] border border-[#a45a8a]/20">
          7 STAGES
        </span>
      </div>

      <div className="flex gap-2">
        {(["forge", "data_products"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              view === v ? "bg-white/[0.08] text-slate-100" : "text-slate-400 hover:text-slate-200 bg-white/[0.02]"
            }`}
          >
            {v === "forge" ? "Signal Forge Runs" : "Data Products"}
          </button>
        ))}
      </div>

      {view === "forge" && (
        <div className="space-y-4">
          {latestRun && (
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="text-xs font-semibold text-slate-200 mb-3">Latest Pipeline Run</div>
              <div className="flex items-center gap-4 mb-3">
                {PIPELINE_STAGES.map((stage, i) => {
                  const reached = PIPELINE_STAGES.indexOf(latestRun.stage) >= i;
                  const isActive = latestRun.stage === stage;
                  return (
                    <div key={stage} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        isActive ? "bg-[#d4a054]" : reached ? "bg-[#5aa87a]" : "bg-slate-700"
                      }`} />
                      {i < PIPELINE_STAGES.length - 1 && (
                        <div className={`w-6 h-px ${reached ? "bg-[#5aa87a]" : "bg-slate-700"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-3 text-[10px]">
                <div><span className="text-slate-500">Input: </span><span className="text-slate-300">{latestRun.inputCount ?? 0}</span></div>
                <div><span className="text-slate-500">Output: </span><span className="text-slate-300">{latestRun.outputCount ?? 0}</span></div>
                <div><span className="text-slate-500">Rejected: </span><span className="text-slate-300">{latestRun.rejectedCount ?? 0}</span></div>
                <div><span className="text-slate-500">Contradictions: </span><span className="text-[#d4a054]">{latestRun.contradictionsFound ?? 0}</span></div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-200 mb-3">Recent Runs</h3>
            {isLoading && <div className="text-xs text-slate-500">Loading…</div>}
            {!isLoading && runs.length === 0 && (
              <div className="text-xs text-slate-500">No signal forge runs yet. Initialize worldline sources first.</div>
            )}
            <div className="space-y-2">
              {runs.slice(0, 10).map((run: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <div className="text-xs text-slate-200 capitalize">{run.stage}</div>
                    <div className="text-[10px] text-slate-500">{new Date(run.startedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-slate-400">{run.inputCount ?? 0} in / {run.outputCount ?? 0} out</span>
                    <span className={`${run.stage === "complete" ? "text-[#5aa87a]" : run.stage === "failed" ? "text-[#c45a4a]" : "text-[#d4a054]"}`}>
                      {run.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "data_products" && (
        <div className="grid grid-cols-2 gap-4">
          {DATA_PRODUCTS.map(dp => {
            const latestScore = (scoresByProduct[dp.id] ?? [])[0];
            return (
              <div key={dp.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: dp.color }} />
                  <div className="text-xs font-semibold text-slate-200">{dp.label}</div>
                </div>
                <div className="text-[10px] text-slate-400 mb-3">{dp.description}</div>
                {latestScore ? (
                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <div className="text-2xl font-bold" style={{ color: dp.color }}>{latestScore.score.toFixed(1)}</div>
                      <div className="text-[10px] text-slate-500 mb-0.5">/ 100 · {latestScore.movement}</div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${latestScore.score}%`, background: dp.color }} />
                    </div>
                    {latestScore.confidence && (
                      <div className="text-[10px] text-slate-500">{(latestScore.confidence * 100).toFixed(0)}% confidence</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500">No scores computed yet</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
