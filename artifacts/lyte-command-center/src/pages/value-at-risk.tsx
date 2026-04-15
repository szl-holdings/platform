import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { cn } from "@/lib/utils";
import {
  valueAtRiskBreakdown,
  varTrend,
  totalValueAtRisk,
  workflowLatencies,
  signals,
  severityColors,
  signalTypeLabels,
} from "@/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const categoryColors: Record<string, string> = {
  "Forecast Drift": "#c45a4a",
  "Ownership Gaps": "#c8953c",
  "Approval Latency": "#d4a054",
  "Stalled Workflows": "#eab308",
  "Handoff Failures": "#a78bfa",
  "Pipeline Hygiene": "#60a5fa",
  "Revenue Leakage": "#34d399",
};

export default function ValueAtRiskPage() {
  const byWorkflow = workflowLatencies.map(wf => ({
    name: wf.name.length > 22 ? wf.name.slice(0, 22) + "…" : wf.name,
    amount: wf.valueAtRisk / 1_000_000,
    severity: wf.severity,
  }));

  const activeSignals = signals.filter(s => s.status === "active");
  const totalActual = activeSignals.reduce((sum, s) => sum + s.valueAtRisk, 0);

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Value at Risk</h1>
        <p className="text-sm text-slate-400 mt-1">Value at risk from workflow failures, ownership gaps, and execution delays</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3 md:col-span-1 rounded-xl p-5 border border-[#c45a4a]/30 bg-[#c45a4a]/5">
          <div className="text-[11px] text-[#c45a4a] font-mono uppercase tracking-wide mb-2">Total Value at Risk</div>
          <div className="font-display font-bold text-4xl text-[#c45a4a] mb-1">{formatCurrency(totalValueAtRisk)}</div>
          <div className="text-[11px] text-slate-400 mb-4">Across {activeSignals.length} active signals</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={varTrend}>
                <defs>
                  <linearGradient id="varGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c45a4a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#c45a4a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="#c45a4a" strokeWidth={2} fill="url(#varGrad2)" dot={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(196,90,74,0.2)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`$${v}M`, "Value at Risk"]}
                  labelStyle={{ color: "#94a3b8" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 md:col-span-2 rounded-xl p-5 border border-white/5 bg-white/[0.02]">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-4">Risk by Category</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueAtRiskBreakdown} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [formatCurrency(v), "At Risk"]}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {valueAtRiskBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={categoryColors[entry.category] || "#64748b"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <h3 className="font-display font-semibold text-sm text-white mb-4">Risk by Signal Type</h3>
          <div className="space-y-3">
            {valueAtRiskBreakdown.map(r => (
              <div key={r.category}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300">{r.category}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("flex items-center gap-0.5 text-[10px]", r.trend > 0 ? "text-[#c45a4a]" : "text-[#6b8f71]")}>
                      {r.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(r.trend).toFixed(1)}%
                    </span>
                    <span className="font-mono font-semibold text-white">{formatCurrency(r.amount)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(r.amount / totalValueAtRisk) * 100}%`,
                      backgroundColor: categoryColors[r.category] || "#64748b",
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
          <h3 className="font-display font-semibold text-sm text-white mb-4">Risk by Workflow</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byWorkflow} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`$${v}M`, "At Risk"]}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {byWorkflow.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.severity === "critical" ? "#c45a4a" : entry.severity === "high" ? "#c8953c" : "#d4a054"}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
        <h3 className="font-display font-semibold text-sm text-white mb-4">Signal-Level Risk Detail</h3>
        <div className="grid grid-cols-2 gap-2">
          {activeSignals
            .sort((a, b) => b.valueAtRisk - a.valueAtRisk)
            .map(sig => {
              const c = severityColors[sig.severity];
              const pct = (sig.valueAtRisk / totalActual) * 100;
              return (
                <div key={sig.id} className={cn("p-3 rounded-lg border", c.border, c.bg)}>
                  <div className="flex items-start gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", c.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white/90 leading-tight mb-1 line-clamp-2">{sig.title}</div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">{signalTypeLabels[sig.type]}</span>
                        <span className={cn("font-mono font-semibold", c.text)}>{formatCurrency(sig.valueAtRisk)}</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", c.dot.split(" ")[0])} style={{ width: `${pct}%`, opacity: 0.7 }} />
                      </div>
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
