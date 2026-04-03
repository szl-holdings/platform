import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Activity, Brain, Globe, Shield, Layers } from "lucide-react";
import { useCostSummary } from "../../hooks/use-prism-s31";

const DEMO_COSTS = {
  total: 847.32, period: "30d", entries: 342,
  byCategory: { model_inference: 412.50, hf_endpoint: 89.20, worldline_fetch: 12.40, storage: 45.00, compute: 288.22 },
  byWorkflow: { copilot_workbench: 198.40, document_extraction: 156.80, forecast_compute: 124.30, pressure_graph: 89.50, proof_chain: 45.20, worldline_ingest: 33.12, matter_twin: 200.00 },
};

export default function CostTrackingPage() {
  const [days, setDays] = useState(30);
  const { data: costData } = useCostSummary(days);

  const costs = costData?.total != null ? costData : DEMO_COSTS;
  const isDemo = costData?.total == null;
  const byCategory = costs.byCategory ?? {};
  const byWorkflow = costs.byWorkflow ?? {};
  const maxCatVal = Math.max(...Object.values(byCategory) as number[], 1);
  const maxWfVal = Math.max(...Object.values(byWorkflow) as number[], 1);

  const WORKFLOW_ICONS: Record<string, any> = {
    copilot_workbench: Brain, document_extraction: Activity, forecast_compute: TrendingUp,
    pressure_graph: Activity, proof_chain: Shield, worldline_ingest: Globe, matter_twin: Layers,
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Cost Tracking</h1>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Per-tenant, per-matter, per-workflow cost attribution</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${days === d ? "bg-[#d4a054]/15 text-[#d4a054]" : "text-slate-600 hover:text-slate-400"}`}>{d}d</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Spend", value: `$${costs.total?.toFixed(2)}`, color: "#d4a054" },
          { label: "Transactions", value: String(costs.entries), color: "#4a90b8" },
          { label: "Daily Avg", value: `$${(costs.total / days).toFixed(2)}`, color: "#8b7ac8" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">By Category</h3>
          <div className="space-y-3">
            {Object.entries(byCategory).sort(([,a], [,b]) => (b as number) - (a as number)).map(([key, val]) => {
              const pct = ((val as number) / maxCatVal) * 100;
              return (
                <div key={key}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-300">{key.replace(/_/g, " ")}</span>
                    <span className="text-slate-400 font-mono">${(val as number).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-[#d4a054]/60 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">By Workflow</h3>
          <div className="space-y-2">
            {Object.entries(byWorkflow).sort(([,a], [,b]) => (b as number) - (a as number)).map(([key, val]) => {
              const Icon = WORKFLOW_ICONS[key] ?? Activity;
              const pct = ((val as number) / maxWfVal) * 100;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-300">{key.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-slate-400 font-mono">${(val as number).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-[#8b7ac8]/60 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
