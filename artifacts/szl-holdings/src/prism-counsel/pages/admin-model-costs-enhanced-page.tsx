import { useState } from "react";
import { DollarSign, BarChart3, Zap, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

function useModelCosts() {
  return useQuery({
    queryKey: ["model-costs-enhanced"],
    queryFn: async () => { const r = await fetch(`${API}/prism-counsel/s31/model-costs`); return r.json(); },
    staleTime: 60000, retry: false,
  });
}

const DEMO_LANE_COSTS = [
  { lane: "reasoning", provider: "Anthropic", model: "claude-3-5-sonnet", requests: 847, totalCost: 0.4238, avgLatencyMs: 1240, successRate: 0.992 },
  { lane: "extraction", provider: "OpenAI", model: "gpt-4o", requests: 1203, totalCost: 0.3611, avgLatencyMs: 890, successRate: 0.997 },
  { lane: "embedding", provider: "OpenAI", model: "text-embedding-3-large", requests: 4821, totalCost: 0.0724, avgLatencyMs: 142, successRate: 0.999 },
  { lane: "forecast", provider: "Anthropic", model: "claude-3-haiku", requests: 342, totalCost: 0.0171, avgLatencyMs: 640, successRate: 0.985 },
  { lane: "classification", provider: "HuggingFace", model: "szl/legal-classifier-v2", requests: 2341, totalCost: 0.0047, avgLatencyMs: 88, successRate: 0.994 },
  { lane: "policy_guardrail", provider: "Anthropic", model: "claude-3-haiku", requests: 2341, totalCost: 0.0117, avgLatencyMs: 210, successRate: 0.999 },
];

const DEMO_DAILY_TREND = [
  { date: "Mar 28", cost: 0.34 }, { date: "Mar 29", cost: 0.41 }, { date: "Mar 30", cost: 0.38 },
  { date: "Mar 31", cost: 0.45 }, { date: "Apr 1", cost: 0.51 }, { date: "Apr 2", cost: 0.62 }, { date: "Apr 3", cost: 0.47 },
];

const LANE_COLORS: Record<string, string> = {
  reasoning: "#4a90b8", extraction: "#8b7ac8", embedding: "#c8953c", forecast: "#d4a054",
  classification: "#4a90b8", policy_guardrail: "#c45a4a",
};

export default function AdminModelCostsEnhancedPage() {
  const [tab, setTab] = useState<"lanes" | "trend" | "budget">("lanes");
  const { data: costData } = useModelCosts();

  const lanes = costData?.data?.lanes ?? DEMO_LANE_COSTS;
  const isDemo = !costData?.data?.lanes;
  const totalCost = lanes.reduce((acc: number, l: any) => acc + Number(l.totalCost ?? 0), 0);
  const totalRequests = lanes.reduce((acc: number, l: any) => acc + Number(l.requests ?? 0), 0);
  const maxCost = Math.max(...DEMO_DAILY_TREND.map(d => d.cost));

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Model Costs</h1>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN</span>
          {isDemo && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#d4a054]/10 text-[#d4a054]">DEMO</span>}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">AI model usage costs, lane breakdown, daily spend trend, and budget tracking across all PRISM Counsel inference lanes</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Cost", value: `$${totalCost.toFixed(4)}`, color: "#d4a054" },
          { label: "Total Requests", value: totalRequests.toLocaleString(), color: "#4a90b8" },
          { label: "Active Lanes", value: lanes.length, color: "#8b7ac8" },
          { label: "7-Day Total", value: `$${DEMO_DAILY_TREND.reduce((a, d) => a + d.cost, 0).toFixed(2)}`, color: "#c8953c" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {(["lanes", "trend", "budget"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${tab === t ? "bg-[#d4a054]/15 text-[#d4a054]" : "text-slate-500 hover:text-slate-300"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "lanes" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Cost by Lane</h3>
          <div className="space-y-3">
            {lanes.map((lane: any, i: number) => {
              const color = LANE_COLORS[lane.lane] ?? "#64748b";
              const pct = totalCost > 0 ? (Number(lane.totalCost) / totalCost) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs text-slate-200 font-mono">{lane.lane}</span>
                      <span className="text-[9px] text-slate-500">{lane.provider} · {lane.model}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="text-slate-500">{Number(lane.requests).toLocaleString()} reqs</span>
                      <span className="text-slate-400">{lane.avgLatencyMs}ms avg</span>
                      <span className="text-slate-300 font-mono">${Number(lane.totalCost).toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#080c14" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="text-[8px] text-slate-600">{pct.toFixed(1)}% of daily spend · {(Number(lane.successRate) * 100).toFixed(1)}% success rate</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "trend" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-4">7-Day Spend Trend</h3>
          <div className="flex items-end gap-2 h-32">
            {DEMO_DAILY_TREND.map((d, i) => {
              const heightPct = (d.cost / maxCost) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[8px] text-slate-500">${d.cost.toFixed(2)}</div>
                  <div className="w-full rounded-t transition-all" style={{ height: `${heightPct}%`, background: "#4a90b8", minHeight: "4px" }} />
                  <div className="text-[8px] text-slate-600">{d.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "budget" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Budget & Limits</h3>
          <div className="space-y-3">
            {[
              { label: "Daily Budget", limit: 2.00, spent: totalCost, unit: "USD" },
              { label: "Monthly Budget", limit: 45.00, spent: DEMO_DAILY_TREND.reduce((a, d) => a + d.cost, 0) * 4.3, unit: "USD" },
              { label: "Anthropic Monthly Limit", limit: 25.00, spent: 12.40, unit: "USD" },
              { label: "OpenAI Monthly Limit", limit: 15.00, spent: 6.80, unit: "USD" },
            ].map((b, i) => {
              const pct = Math.min((b.spent / b.limit) * 100, 100);
              const color = pct > 80 ? "#c45a4a" : pct > 60 ? "#d4a054" : "#4a90b8";
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200">{b.label}</span>
                    <span className="text-[10px] text-slate-400">${b.spent.toFixed(2)} / ${b.limit.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#080c14" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="text-[8px]" style={{ color }}>{pct.toFixed(1)}% used</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
