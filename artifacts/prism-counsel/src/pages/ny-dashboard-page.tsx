import { Scale, Clock, AlertTriangle, DollarSign, MapPin, Building2, Shield, ArrowRight, Eye, FileCheck, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { DEMO_MATTERS } from "../data/demo-matters";
import { WATCHLIST_ITEMS, NO_FAULT_CLAIMS, VENUE_PROFILES, INSURER_PROFILES, CLOCK_RULES, DEMAND_PACKETS } from "../data/ny-data";

export default function NYDashboardPage() {
  const nyMatters = DEMO_MATTERS.filter((m) => m.jurisdiction.includes("NY") || m.jurisdiction.includes("New York"));
  const criticalWatchItems = WATCHLIST_ITEMS.filter((w) => w.riskLevel === "critical" || w.riskLevel === "high");

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">New York Litigation Command</h1>
            <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
              NY JURISDICTION
            </span>
          </div>
          <p className="text-xs text-slate-500">Insurance litigation operations for New York — no-fault, bodily injury, premises, coverage disputes</p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Active Matters", value: nyMatters.length, icon: FileCheck },
          { label: "Total Exposure", value: `$${(nyMatters.reduce((s, m) => s + m.totalDamages, 0) / 1000000).toFixed(1)}M`, icon: DollarSign },
          { label: "No-Fault Claims", value: NO_FAULT_CLAIMS.length, icon: Shield },
          { label: "Watchlist Items", value: criticalWatchItems.length, sub: "critical + high", icon: AlertTriangle },
          { label: "Venues Tracked", value: VENUE_PROFILES.filter((v) => v.state === "New York").length, icon: MapPin },
        ].map((kpi, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="w-3 h-3 text-[#d4a054]" />
              <div className="text-[9px] text-slate-500 uppercase">{kpi.label}</div>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{kpi.value}</div>
            {"sub" in kpi && kpi.sub && <div className="text-[9px] text-slate-600">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Priority Watchlist</h2>
              <Link href="/watchlist">
                <span className="text-[10px] text-[#4a90b8] hover:text-[#5aa0c8] cursor-pointer flex items-center gap-1">
                  View all <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </Link>
            </div>
            <div className="space-y-2">
              {criticalWatchItems.slice(0, 5).map((item, i) => {
                const riskColor = item.riskLevel === "critical" ? "#c45a4a" : "#c8953c";
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-0">
                    <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: riskColor }} />
                    <div className="flex-1">
                      <div className="text-xs text-slate-200">{item.description}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span>{item.matterTitle}</span>
                        {item.daysUntil !== null && <span className="font-mono" style={{ color: riskColor }}>{item.daysUntil}d</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Matter Health</h2>
            </div>
            {nyMatters.map((m) => (
              <Link key={m.id} href={`/prism-counsel/matters/${m.id}`}>
                <div className="flex items-center gap-4 py-2.5 border-b border-white/[0.03] last:border-0 cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono text-white"
                    style={{ background: m.healthScore >= 70 ? "#1a3a2a" : m.healthScore >= 55 ? "#3a2a1a" : "#3a1a1a" }}
                  >
                    {m.healthScore}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-200">{m.title}</div>
                    <div className="text-[10px] text-slate-500">{m.caseNumber} · {m.jurisdiction}</div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[8px] font-medium uppercase"
                    style={{ background: "#d4a054" + "15", color: "#d4a054", border: "1px solid #d4a05430" }}
                  >
                    {m.status.replace(/_/g, " ")}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </Link>
            ))}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Demand Readiness</h2>
            </div>
            {DEMAND_PACKETS.map((dp, i) => (
              <div key={i} className="py-3 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-medium text-slate-200">{dp.matterTitle}</div>
                    <div className="text-[10px] text-slate-500">Target: {dp.targetDate} · Status: <span className="capitalize">{dp.status.replace(/_/g, " ")}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono" style={{ color: dp.readinessScore >= 75 ? "#4a7a5a" : dp.readinessScore >= 50 ? "#c8953c" : "#c45a4a" }}>
                      {dp.readinessScore}%
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${dp.readinessScore}%`,
                      background: dp.readinessScore >= 75 ? "#4a7a5a" : dp.readinessScore >= 50 ? "#c8953c" : "#c45a4a",
                    }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dp.missingItems.slice(0, 3).map((item, j) => (
                    <span key={j} className="px-1.5 py-0.5 rounded text-[8px] bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">
                      Missing: {item}
                    </span>
                  ))}
                  {dp.missingItems.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] text-slate-500">+{dp.missingItems.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">No-Fault Claims</h2>
              <Link href="/no-fault">
                <span className="text-[10px] text-[#4a90b8] hover:text-[#5aa0c8] cursor-pointer flex items-center gap-1">
                  Details <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </Link>
            </div>
            {NO_FAULT_CLAIMS.map((nf) => (
              <div key={nf.id} className="py-2 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-slate-300">{nf.claimNumber}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[8px] font-medium capitalize"
                    style={{ color: STATUS_COLORS_NF[nf.status] || "#d4a054" }}
                  >
                    {nf.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">{nf.carrier}</div>
                <div className="flex gap-3 mt-1 text-[9px] text-slate-500">
                  <span>Billed: <span className="font-mono text-slate-400">${(nf.totalBilled / 1000).toFixed(1)}K</span></span>
                  <span>Paid: <span className="font-mono" style={{ color: "#4a7a5a" }}>${(nf.totalPaid / 1000).toFixed(1)}K</span></span>
                  {nf.totalDenied > 0 && <span>Denied: <span className="font-mono" style={{ color: "#c45a4a" }}>${(nf.totalDenied / 1000).toFixed(1)}K</span></span>}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Carrier Intelligence</h2>
              <Link href="/insurer-intel">
                <span className="text-[10px] text-[#4a90b8] hover:text-[#5aa0c8] cursor-pointer flex items-center gap-1">
                  Full profiles <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </Link>
            </div>
            {INSURER_PROFILES.slice(0, 3).map((carrier) => (
              <div key={carrier.id} className="py-2 border-b border-white/[0.03] last:border-0">
                <div className="text-xs text-slate-300">{carrier.carrierName}</div>
                <div className="flex gap-3 mt-1 text-[9px] text-slate-500">
                  <span>Avg resp: <span className="font-mono text-slate-400">{carrier.avgResponseDays}d</span></span>
                  <span>Denial: <span className="font-mono" style={{ color: carrier.denialRate > 0.2 ? "#c45a4a" : "#d4a054" }}>{(carrier.denialRate * 100).toFixed(0)}%</span></span>
                  <span>Silence: <span className="font-mono text-slate-400">{carrier.silenceWindowDays}d</span></span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Active Clocks</h2>
            </div>
            <div className="space-y-2">
              {CLOCK_RULES.slice(0, 4).map((rule) => (
                <div key={rule.id} className="flex items-start gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                  <Clock className="w-3 h-3 text-[#d4a054] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-300">{rule.name}</div>
                    <div className="text-[9px] text-[#4a90b8] font-mono">{rule.ruleRef}</div>
                    <div className="text-[9px] text-slate-500">{rule.durationDays > 0 ? `${rule.durationDays} days` : "No fixed deadline"} · {rule.matterType.replace(/_/g, " ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">NY Venue Snapshot</h2>
              <Link href="/venue-intel">
                <span className="text-[10px] text-[#4a90b8] hover:text-[#5aa0c8] cursor-pointer flex items-center gap-1">
                  All venues <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </Link>
            </div>
            {VENUE_PROFILES.filter((v) => v.state === "New York").slice(0, 3).map((v) => {
              const velColor = v.observedVelocity === "fast" ? "#4a90b8" : v.observedVelocity === "moderate" ? "#d4a054" : "#c45a4a";
              return (
                <div key={v.id} className="py-2 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-300">{v.county}</div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: velColor }} />
                      <span className="text-[9px] capitalize" style={{ color: velColor }}>{v.observedVelocity}</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500">{v.part} · Avg trial: {v.avgDaysToTrial}d</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS_NF: Record<string, string> = {
  partial_payment: "#c8953c",
  open: "#4a90b8",
  denied: "#c45a4a",
  paid: "#4a7a5a",
};
