import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Users, AlertTriangle, ArrowUpRight, BarChart3, Package, Zap } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchRevenueSummary() {
  const res = await fetch(`${API_BASE}/api/forge-portal/revenue/summary`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch revenue summary");
  const json = await res.json();
  return json.data ?? json;
}

function StatCard({ label, value, subValue, icon: Icon, accent }: { label: string; value: string; subValue?: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
        </div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-white w-20 text-right">${(value / 1000).toFixed(1)}k</span>
    </div>
  );
}

export default function RevenueIntelligence() {
  const { data, isLoading, error } = useQuery({ queryKey: ["revenue-summary"], queryFn: fetchRevenueSummary });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 rounded-full animate-spin border-amber-500/25 border-t-amber-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-500/50" />
        <p className="text-sm text-slate-400">Unable to load revenue data</p>
      </div>
    );
  }

  const maxDomainRev = Math.max(...(data.revenueByDomain ?? []).map((d: { revenue: number }) => d.revenue));
  const maxPkgRev = Math.max(...(data.revenueByPackage ?? []).map((p: { revenue: number }) => p.revenue));
  const domainColors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];
  const pkgColors = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue Intelligence</h1>
          <p className="text-sm text-slate-400 mt-0.5">Autonomous revenue engine performance — updated {new Date(data.computedAt).toLocaleTimeString()}</p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Recurring" value={`$${(data.mrr / 1000).toFixed(1)}k`} subValue={`ARR: $${(data.arr / 1e6).toFixed(1)}M`} icon={DollarSign} accent="#10B981" />
        <StatCard label="MRR Growth" value={`+${data.mrrGrowth}%`} subValue="Month over month" icon={TrendingUp} accent="#3B82F6" />
        <StatCard label="Active Clients" value={`${data.activeClients}`} subValue={`${data.totalClients} total`} icon={Users} accent="#8B5CF6" />
        <StatCard label="Churn Rate" value={`${data.churnRate}%`} subValue={`LTV: $${(data.avgLtv / 1000).toFixed(0)}k`} icon={AlertTriangle} accent={data.churnRate > 5 ? "#EF4444" : "#F59E0B"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {Object.entries(data.pipeline ?? {}).map(([stage, count]) => (
          <div key={stage} className="bg-[#141820] border border-slate-800/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{count as number}</p>
            <p className="text-xs text-slate-400 mt-1 capitalize">{stage}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Revenue by Domain</h3>
          </div>
          <div className="space-y-3">
            {(data.revenueByDomain ?? []).map((d: { domain: string; revenue: number; percentage: number; clients: number }, i: number) => (
              <div key={d.domain}>
                <BarRow label={d.domain} value={d.revenue} max={maxDomainRev} color={domainColors[i % domainColors.length]} />
                <div className="flex gap-4 ml-[7.75rem] mt-1">
                  <span className="text-[10px] text-slate-500">{d.percentage}% of total</span>
                  <span className="text-[10px] text-slate-500">{d.clients} clients</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Revenue by Package</h3>
          </div>
          <div className="space-y-3">
            {(data.revenueByPackage ?? []).map((p: { package: string; revenue: number; subscribers: number }, i: number) => (
              <div key={p.package}>
                <BarRow label={p.package} value={p.revenue} max={maxPkgRev} color={pkgColors[i % pkgColors.length]} />
                <span className="text-[10px] text-slate-500 ml-[7.75rem]">{p.subscribers} subscribers</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Upsell Opportunities</h3>
          </div>
          <div className="space-y-3">
            {(data.upsellOpportunities ?? []).map((opp: { clientName: string; currentPackage: string; recommended: string; incrementalMrr: number; probability: number }, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{opp.clientName}</p>
                  <p className="text-[11px] text-slate-400">{opp.currentPackage} → {opp.recommended}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-400">+${(opp.incrementalMrr / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-slate-500">{opp.probability}% prob</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">AI-Attributed Revenue</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-white">${(data.aiAttributedRevenue?.total / 1000).toFixed(1)}k</p>
              <p className="text-xs text-slate-400">{data.aiAttributedRevenue?.percentage}% of MRR</p>
            </div>
            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${data.aiAttributedRevenue?.percentage ?? 0}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {(data.aiAttributedRevenue?.topInsights ?? []).map((ins: { insight: string; attributedRevenue: number }, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/50">
                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300">{ins.insight}</p>
                  <p className="text-[10px] text-amber-400/70 mt-0.5">${(ins.attributedRevenue / 1000).toFixed(1)}k attributed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Churn Risk Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Low", count: data.churnRisk?.low ?? 0, color: "#10B981" },
            { label: "Medium", count: data.churnRisk?.medium ?? 0, color: "#F59E0B" },
            { label: "High", count: data.churnRisk?.high ?? 0, color: "#F97316" },
            { label: "Critical", count: data.churnRisk?.critical ?? 0, color: "#EF4444" },
          ].map(risk => (
            <div key={risk.label} className="text-center p-3 rounded-lg" style={{ background: `${risk.color}08`, border: `1px solid ${risk.color}20` }}>
              <p className="text-2xl font-bold" style={{ color: risk.color }}>{risk.count}</p>
              <p className="text-xs text-slate-400 mt-1">{risk.label} Risk</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#141820] border border-slate-800/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">MRR Trend (6 Months)</h3>
        <div className="flex items-end gap-2 h-40">
          {(data.monthlyTrend ?? []).map((m: { month: string; mrr: number; clients: number }, i: number) => {
            const maxMrr = Math.max(...(data.monthlyTrend ?? []).map((t: { mrr: number }) => t.mrr));
            const pct = (m.mrr / maxMrr) * 100;
            const isLast = i === (data.monthlyTrend ?? []).length - 1;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">${(m.mrr / 1000).toFixed(0)}k</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${pct}%`, background: isLast ? "#D4A054" : "#334155" }} />
                <span className="text-[10px] text-slate-500 truncate max-w-full">{m.month.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
