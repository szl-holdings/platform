import { useState } from "react";
import { ActivityFeed } from "@workspace/shared-ui/collaboration";
import { Link } from "wouter";
import { AlertTriangle, TrendingDown, TrendingUp, ChevronRight, Clock, DollarSign, Users, Zap, Target, Activity, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";
import {
  signals,
  narrativeInsights,
  actionItems,
  kpiCards,
  varTrend,
  signalTrend,
  totalValueAtRisk,
  valueAtRiskBreakdown,
  severityColors,
  signalTypeLabels,
  getKPIsForRole,
  getActionsForRole,
  roleLabels,
  type RoleView,
  type SignalSeverity,
} from "@/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SeverityBadge({ severity }: { severity: SignalSeverity }) {
  const c = severityColors[severity];
  return (
    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide", c.text, c.bg, c.border)}>
      {severity}
    </span>
  );
}

function KPICard({ kpi }: { kpi: ReturnType<typeof getKPIsForRole>[number] }) {
  const c = severityColors[kpi.severity];
  const isNegativeTrend = kpi.trend > 0 && (kpi.id !== "kpi-var" || true);
  return (
    <div className={cn("rounded-xl p-4 border bg-white/[0.03] hover:bg-white/[0.05] transition-all", c.border)}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] text-slate-400 font-medium leading-tight">{kpi.label}</span>
        <span className={cn("text-[10px] font-mono flex items-center gap-0.5", isNegativeTrend ? "text-red-400" : "text-emerald-400")}>
          {isNegativeTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(kpi.trend).toFixed(1)}%
        </span>
      </div>
      <div className={cn("text-xl font-display font-bold mb-1", c.text)}>{kpi.value}</div>
      {kpi.sublabel && <div className="text-[10px] text-slate-500">{kpi.sublabel}</div>}
      <div className="text-[10px] text-slate-600 mt-1">{kpi.trendLabel}</div>
    </div>
  );
}

function SignalCard({ signal }: { signal: typeof signals[number] }) {
  const c = severityColors[signal.severity];
  return (
    <Link href={`/signals?id=${signal.id}`}>
      <div className={cn("rounded-lg p-3 border bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group", c.border)}>
        <div className="flex items-start gap-2.5">
          <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", c.dot, signal.severity === "critical" && "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]")} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[11px] font-medium text-white/90 leading-tight line-clamp-2">{signal.title}</span>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className={c.text}>{signalTypeLabels[signal.type]}</span>
              <span className="text-slate-600">•</span>
              <span>{signal.affectedFunction}</span>
              <span className="text-slate-600">•</span>
              <span className={cn("font-mono", c.text)}>{formatCurrency(signal.valueAtRisk)} at risk</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [role, setRole] = useState<RoleView>("executive");
  const kpis = getKPIsForRole(role);
  const actions = getActionsForRole(role);
  const criticalSignals = signals.filter(s => s.severity === "critical");
  const highSignals = signals.filter(s => s.severity === "high");

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Command Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Business observability · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {(Object.keys(roleLabels) as RoleView[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                role === r ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              )}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 xl:grid-cols-4">
        <div className="col-span-4 xl:col-span-1 rounded-xl p-5 border border-red-500/30 bg-red-500/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] text-red-400 font-mono uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            Total Value at Risk
          </div>
          <div className="font-display font-bold text-3xl text-red-300">{formatCurrency(totalValueAtRisk)}</div>
          <div className="text-[11px] text-slate-400">Across {signals.filter(s => s.status === "active").length} active signals</div>
          <div className="mt-2 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={varTrend}>
                <defs>
                  <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={1.5} fill="url(#varGrad)" dot={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`$${v}M`, "Value at Risk"]}
                  labelStyle={{ color: "#94a3b8" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {kpis.slice(0, 7).map(k => <KPICard key={k.id} kpi={k} />)}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                Active Signals
              </h2>
              <Link href="/signals" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {criticalSignals.map(s => <SignalCard key={s.id} signal={s} />)}
              {highSignals.slice(0, 3).map(s => <SignalCard key={s.id} signal={s} />)}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Value at Risk by Category
              </h2>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueAtRiskBreakdown} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" hide tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [formatCurrency(v), "At Risk"]}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {valueAtRiskBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.trend > 20 ? "#ef4444" : entry.trend > 10 ? "#f97316" : entry.trend > 0 ? "#f59e0b" : "#22c55e"}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {valueAtRiskBreakdown.map(r => (
                <div key={r.category} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{r.category}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-white">{formatCurrency(r.amount)}</span>
                    <span className={cn("text-[10px]", r.trend > 0 ? "text-red-400" : "text-emerald-400")}>
                      {r.trend > 0 ? "+" : ""}{r.trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Signal Volume Trend
              </h2>
              <span className="text-[10px] text-slate-500">Past 30 days</span>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signalTrend}>
                  <defs>
                    <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} fill="url(#critGrad)" dot={false} />
                  <Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={1.5} fill="url(#highGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Top Actions Required
              </h2>
              <Link href="/action-center" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {actions.slice(0, 4).map(a => (
                <div key={a.id} className={cn(
                  "p-3 rounded-lg border transition-all",
                  a.urgency === "immediate" ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02]"
                )}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[11px] font-medium text-white/90 leading-tight">{a.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-mono uppercase tracking-wide border",
                      a.urgency === "immediate" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                        a.urgency === "today" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" :
                          "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    )}>
                      {a.urgency.replace("_", " ")}
                    </span>
                    <span className="text-slate-500">{a.owner}</span>
                    <span className="ml-auto text-emerald-400 font-mono">{formatCurrency(a.valueProtected)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Ownership Gaps
              </h2>
              <Link href="/ownership-map" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                Map <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { area: "Enterprise Renewals (60d)", items: 7, risk: 2300000, status: "missing" as const },
                { area: "Implementation Queue", items: 14, risk: 890000, status: "missing" as const },
                { area: "Mid-Market Forecast Recovery", items: 22, risk: 3800000, status: "ambiguous" as const },
                { area: "Discount Approvals", items: 11, risk: 870000, status: "ambiguous" as const },
              ].map(g => (
                <div key={g.area} className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg border text-[11px]",
                  g.status === "missing" ? "border-red-500/15 bg-red-500/5" : "border-amber-500/15 bg-amber-500/5"
                )}>
                  <div>
                    <div className="font-medium text-white/90 mb-0.5">{g.area}</div>
                    <div className="text-slate-500">{g.items} items · {formatCurrency(g.risk)}</div>
                  </div>
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase",
                    g.status === "missing" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  )}>{g.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-violet-400" />
                Narrative Intelligence
              </h2>
              <Link href="/insights" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {narrativeInsights.slice(0, 2).map(ins => {
                const c = severityColors[ins.severity];
                return (
                  <div key={ins.id} className={cn("p-3 rounded-lg border", c.border, c.bg)}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", c.dot)} />
                      <span className="text-[11px] font-semibold text-white/90 leading-tight">{ins.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">{ins.body}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="text-slate-500">{ins.function}</span>
                      <span className={cn("ml-auto font-mono", c.text)}>{formatCurrency(ins.valueAtRisk)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Workflow Latency
              </h2>
              <Link href="/workflow-latency" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { name: "Enterprise Approval", actual: 14.2, expected: 3.2, risk: 2100000 },
                { name: "Implementation Handoff", actual: 11.4, expected: 2.0, risk: 890000 },
                { name: "PS SOW Signing", actual: 19.0, expected: 7.0, risk: 1100000 },
              ].map(w => {
                const ratio = w.actual / w.expected;
                const color = ratio > 3 ? "bg-red-400" : ratio > 2 ? "bg-orange-400" : "bg-amber-400";
                const pct = Math.min((w.actual / (w.expected * 5)) * 100, 100);
                return (
                  <div key={w.name}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-300">{w.name}</span>
                      <span className="font-mono text-slate-400">{w.actual}d / {w.expected}d target</span>
                    </div>
                    <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("absolute inset-y-0 left-0 rounded-full", color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ActivityFeed entityType="incident" title="Operations Team Activity" limit={8} compact />
    </div>
  );
}
