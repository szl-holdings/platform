import { useState } from "react";
import { cn } from "@workspace/shared-ui/utils";
import { Link } from "wouter";
import { DataStateBadge } from "@workspace/shared-ui";
import {
  Building2, MapPin, TrendingUp, DollarSign, Users, Activity,
  ChevronRight, Flame, AlertTriangle, Eye, Clock, Home,
  ArrowRight, BarChart3, Target, Search, Shield, Zap, Globe
} from "lucide-react";
import { brokerageSummary, brokerageDeals, riskSignals, agents, automationRuns } from "@/data/brokerage";
import { RiskBadge, StageBadge, formatCurrency, AgentAvatar } from "@/components/brokerage-ui";

const TACTICAL_MODULES = [
  { id: "distress", label: "Distress Watch", icon: Flame, color: "#f97316", count: 3, href: "/distress-engine", desc: "Pre-foreclosure & auction tracking" },
  { id: "offmarket", label: "Off-Market Intel", icon: Eye, color: "#8b5cf6", count: 12, href: "/investor-mode", desc: "Ownership analysis & opportunities" },
  { id: "investor", label: "Investor Mode", icon: TrendingUp, color: "#10b981", count: 0, href: "/investor-mode", desc: "IRR modeling & scenario builder" },
  { id: "pipeline", label: "Deal Pipeline", icon: Activity, color: "#3b82f6", count: 8, href: "/deals", desc: "Active deals & stage tracking" },
  { id: "commercial", label: "Commercial Intel", icon: Building2, color: "#a07848", count: 0, href: "/commercial", desc: "Market comps & analysis" },
  { id: "brokers", label: "Broker Scorecards", icon: Users, color: "#06b6d4", count: 0, href: "/agents", desc: "Performance & conversion rates" },
];

const MARKET_SIGNALS = [
  { time: "5m ago", text: "New pre-foreclosure filing — 847 Park Ave, Queens (Est. $2.1M)", severity: "high" as const, type: "distress" },
  { time: "12m ago", text: "Price reduction: 1240 Broadway commercial listing dropped 8% ($4.2M → $3.9M)", severity: "medium" as const, type: "market" },
  { time: "28m ago", text: "Ownership transfer detected — LLC → individual on 3 Tribeca parcels", severity: "high" as const, type: "ownership" },
  { time: "45m ago", text: "New listing match: 2BR Chelsea, $890K — matches 3 active buyer profiles", severity: "medium" as const, type: "listing" },
  { time: "1h ago", text: "Distress cluster alert: 4 new filings in East Harlem zip 10029", severity: "critical" as const, type: "distress" },
  { time: "2h ago", text: "Broker response SLA warning — 2 inquiries aging past 4h target", severity: "high" as const, type: "ops" },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "rgba(255,255,255,0.3)",
};

const WATCHLIST = [
  { address: "847 Park Ave, Queens", type: "Pre-Foreclosure", value: "$2.1M", delta: "New filing", deltaColor: "#ef4444" },
  { address: "1240 Broadway, Manhattan", type: "Commercial", value: "$3.9M", delta: "-8%", deltaColor: "#f97316" },
  { address: "312 W 23rd St, Chelsea", type: "Residential", value: "$890K", delta: "3 matches", deltaColor: "#10b981" },
  { address: "45 Warren St, Tribeca", type: "Multi-Family", value: "$4.8M", delta: "LLC transfer", deltaColor: "#8b5cf6" },
  { address: "1890 Adam C Powell, Harlem", type: "Mixed-Use", value: "$1.6M", delta: "Cluster alert", deltaColor: "#ef4444" },
];

export default function TerraIntelligence() {
  const activeSignals = riskSignals.filter(s => !s.acknowledged);
  const criticalSignals = activeSignals.filter(s => s.severity === "critical");
  const topDeals = [...brokerageDeals].sort((a, b) => b.price - a.price).slice(0, 5);
  const topAgents = [...agents].sort((a, b) => b.commissionMTD - a.commissionMTD).slice(0, 4);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight font-display">Portfolio Intelligence</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(200,160,96,0.5)" }}>Property · Market · Pipeline — {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-3">
          <DataStateBadge state="demo" label="Demo Data" />
          {criticalSignals.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold animate-pulse" style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="w-3 h-3" />
              {criticalSignals.length} Critical
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="grid grid-cols-3 md:grid-cols-6">
          {[
            { label: "Active Listings", value: brokerageSummary.activeListings.toString(), color: "#c8a060" },
            { label: "Distress Signals", value: "3", color: "#f97316", pulse: true },
            { label: "Deals in Motion", value: brokerageSummary.activeDeals.toString(), color: "#3b82f6" },
            { label: "Broker Response", value: "2.4h", color: "#10b981", sub: "avg" },
            { label: "Portfolio Tracked", value: "$2.4B", color: "#c8a060" },
            { label: "Market Movement", value: "+2.1%", color: "#10b981", sub: "30d" },
          ].map((c, i) => (
            <div key={c.label} className="px-3 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-base font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[8px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.sub && <div className="text-[7px] mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {TACTICAL_MODULES.map((mod) => (
          <Link key={mod.id} href={mod.href} className="group rounded-xl border p-3 transition-all hover:scale-[1.02] cursor-pointer" style={{
            borderColor: `${mod.color}15`,
            background: `linear-gradient(135deg, ${mod.color}04, transparent)`,
          }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${mod.color}12`, border: `1px solid ${mod.color}20` }}>
                <mod.icon className="w-3.5 h-3.5" style={{ color: mod.color }} />
              </div>
              {mod.count > 0 && <span className="text-[9px] font-bold font-mono" style={{ color: mod.color }}>{mod.count}</span>}
            </div>
            <div className="text-[10px] font-semibold text-white/80">{mod.label}</div>
            <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{mod.desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5" style={{ color: "#c8a060" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(200,160,96,0.6)" }}>Active Watchlist</span>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>({WATCHLIST.length})</span>
            </div>
            <div className="space-y-0">
              {WATCHLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 hover:bg-white/[0.02] transition-colors" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(200,160,96,0.08)", border: "1px solid rgba(200,160,96,0.15)" }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: "#c8a060" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/80 truncate">{item.address}</p>
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.type}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold" style={{ color: "#c8a060" }}>{item.value}</span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{
                    color: item.deltaColor,
                    background: `${item.deltaColor}10`,
                    border: `1px solid ${item.deltaColor}15`,
                  }}>{item.delta}</span>
                </div>
              ))}
            </div>
            <Link href="/listings" className="flex items-center gap-1 mt-3 text-[10px] font-medium hover:opacity-80 transition-opacity" style={{ color: "#c8a060" }}>
              View all properties <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(59,130,246,0.6)" }}>Deal Pipeline — Top Deals</span>
            </div>
            <div className="space-y-0">
              {topDeals.map((deal, i) => (
                <div key={deal.id} className="flex items-center gap-3 py-2 hover:bg-white/[0.02] transition-colors" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/80 truncate">{deal.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {deal.buyerName && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{deal.buyerName}</span>}
                    </div>
                  </div>
                  <StageBadge stage={deal.stage} />
                  <RiskBadge level={deal.riskLevel} />
                  <span className="text-[11px] font-mono font-bold" style={{ color: "#c8a060" }}>{formatCurrency(deal.price)}</span>
                </div>
              ))}
            </div>
            <Link href="/deals" className="flex items-center gap-1 mt-3 text-[10px] font-medium hover:opacity-80 transition-opacity" style={{ color: "#3b82f6" }}>
              View full pipeline <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(249,115,22,0.6)" }}>Market Signals</span>
            </div>
            <div className="space-y-0">
              {MARKET_SIGNALS.map((sig, i) => (
                <div key={i} className="flex gap-2.5 py-2" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLORS[sig.severity] }} />
                    {i < MARKET_SIGNALS.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.05)" }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{sig.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{sig.time}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded uppercase" style={{
                        color: SEVERITY_COLORS[sig.severity],
                        background: `${SEVERITY_COLORS[sig.severity]}10`,
                      }}>{sig.severity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(6,182,212,0.6)" }}>Top Brokers</span>
            </div>
            {topAgents.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-3 py-2" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <AgentAvatar agent={agent} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-white/70">{agent.name}</p>
                  <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>{agent.activeDeals} deals · {agent.conversionRate}% conv</p>
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: "#10b981" }}>{formatCurrency(agent.commissionMTD)}</span>
              </div>
            ))}
            <Link href="/agents" className="flex items-center gap-1 mt-2 text-[10px] font-medium hover:opacity-80 transition-opacity" style={{ color: "#06b6d4" }}>
              Full scorecards <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>System</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                <span className="text-[9px] font-mono" style={{ color: "#10b981" }}>Demo</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>Occupancy</div>
                <div className="text-[10px] font-mono font-bold" style={{ color: "#c8a060" }}>81%</div>
              </div>
              <div>
                <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>Pipeline</div>
                <div className="text-[10px] font-mono font-bold" style={{ color: "#3b82f6" }}>{formatCurrency(brokerageSummary.pipelineValue)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
