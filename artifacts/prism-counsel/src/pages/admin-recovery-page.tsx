import { useState } from "react";
import {
  ShieldAlert, AlertTriangle, Clock, DollarSign, BarChart3,
  RefreshCw, CheckCircle, XCircle, Building2, FileText,
  TrendingDown, Layers, Globe
} from "lucide-react";

const STATE_LABELS: Record<string, string> = {
  not_identified: "Not Identified",
  suspected: "Suspected",
  identified: "Identified",
  documentation_requested: "Docs Requested",
  awaiting_response: "Awaiting Response",
  amount_pending: "Amount Pending",
  amount_known: "Amount Known",
  dispute_flagged: "Dispute Flagged",
  reviewed: "Reviewed",
  ready_for_settlement_handling: "Ready",
  resolved: "Resolved",
  archived: "Archived",
};

const STATE_ORDER = [
  "not_identified", "suspected", "identified", "documentation_requested",
  "awaiting_response", "amount_pending", "amount_known", "dispute_flagged",
  "reviewed", "ready_for_settlement_handling", "resolved", "archived",
];

type StateEntry = { count: number; totalAsserted: number; blockers: number };
type StaleEntry = { id: number; lienHolder: string; matter: string; category: string; daysStale: number; assertedAmount: number; state: string };
type SlaBreachEntry = { id: number; lienHolder: string; matter: string; slaType: string; daysBeyond: number; assignee: string };
type CategoryEntry = { category: string; count: number; totalAsserted: number; blockingCount: number; avgDaysOpen: number };

const DEMO_BY_STATE: Record<string, StateEntry> = {};
const DEMO_STALE: StaleEntry[] = [];
const DEMO_SLA_BREACHES: SlaBreachEntry[] = [];
const DEMO_BY_CATEGORY: CategoryEntry[] = [];

export default function AdminRecoveryPage() {
  const [activeTab, setActiveTab] = useState<"backlog" | "stale" | "sla" | "categories">("backlog");

  const totalAsserted = Object.values(DEMO_BY_STATE).reduce((s, v) => s + v.totalAsserted, 0);
  const totalItems = Object.values(DEMO_BY_STATE).reduce((s, v) => s + v.count, 0);
  const totalBlockers = Object.values(DEMO_BY_STATE).reduce((s, v) => s + v.blockers, 0);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#c45a4a]" />
          <h1 className="text-lg font-semibold text-slate-100">Recovery Admin</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-white/[0.06]">ADMIN</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Firm-wide recovery backlog, SLA monitoring, and state-by-state lifecycle view</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Recovery Items", value: String(totalItems), icon: ShieldAlert, accent: "#4a90b8" },
          { label: "Blocking Settlement", value: String(totalBlockers), icon: XCircle, accent: "#c45a4a" },
          { label: "Stale Amounts", value: String(DEMO_STALE.length), icon: RefreshCw, accent: "#d4a054" },
          { label: "Total Asserted", value: `$${(totalAsserted / 1000000).toFixed(2)}M`, icon: DollarSign, accent: "#8b7ac8" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: stat.accent }} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-xl font-semibold text-slate-100">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {([
          { key: "backlog", label: "State Backlog", icon: BarChart3 },
          { key: "stale", label: "Stale Items", icon: RefreshCw },
          { key: "sla", label: "SLA Breaches", icon: AlertTriangle },
          { key: "categories", label: "By Category", icon: Layers },
        ] as { key: typeof activeTab; label: string; icon: any }[]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#d4a054] text-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "backlog" && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500">Recovery items by lifecycle state — firm-wide</p>
          {STATE_ORDER.filter(s => DEMO_BY_STATE[s]?.count > 0).map(state => {
            const data = DEMO_BY_STATE[state];
            if (!data) return null;
            const isProblematic = ["awaiting_response", "dispute_flagged", "documentation_requested"].includes(state);
            return (
              <div key={state} className="rounded-lg border border-white/[0.06] p-3 flex items-center gap-4" style={{ background: "#0c1220" }}>
                <div className="w-44 flex-shrink-0">
                  <span className={`text-[10px] font-medium ${isProblematic ? "text-[#d4a054]" : "text-slate-300"}`}>
                    {STATE_LABELS[state]}
                  </span>
                </div>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((data.count / 11) * 100, 100)}%`,
                      background: isProblematic ? "#d4a054" : "#4a90b8",
                    }}
                  />
                </div>
                <span className="w-6 text-xs font-mono text-slate-300 text-right">{data.count}</span>
                <span className="w-24 text-xs font-mono text-slate-500 text-right">
                  {data.totalAsserted > 0 ? `$${(data.totalAsserted / 1000).toFixed(0)}K` : "—"}
                </span>
                <span className="w-16 text-right">
                  {data.blockers > 0 ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">{data.blockers} blocking</span>
                  ) : (
                    <span className="text-[9px] text-slate-600">—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "stale" && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500">Recovery items where amounts have not been updated while matter has advanced</p>
          {DEMO_STALE.map(item => (
            <div key={item.id} className="rounded-lg border border-[#c8953c]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-100">{item.lienHolder}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.matter} · {item.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-slate-200">${(item.assertedAmount / 1000).toFixed(1)}K</div>
                  <div className="text-[9px] text-[#c8953c]">{item.daysStale} days stale</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-0.5 rounded text-[9px] bg-white/[0.04] text-slate-400">{STATE_LABELS[item.state]}</span>
                <div className="flex-1" />
                <button className="px-2 py-0.5 rounded text-[9px] text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/10 transition-colors">
                  Request Update
                </button>
                <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  Escalate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "sla" && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500">Recovery items where required follow-up actions have exceeded SLA thresholds</p>
          {DEMO_SLA_BREACHES.map(breach => (
            <div key={breach.id} className="rounded-lg border border-[#c45a4a]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-100">{breach.lienHolder}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{breach.matter}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">SLA type: <span className="text-slate-400">{breach.slaType}</span></div>
                </div>
                <div className="text-right">
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">
                    +{breach.daysBeyond}d over SLA
                  </span>
                  <div className="text-[9px] text-slate-500 mt-1">Assignee: {breach.assignee}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1" />
                <button className="px-2 py-0.5 rounded text-[9px] text-[#c45a4a] border border-[#c45a4a]/20 hover:bg-[#c45a4a]/10 transition-colors">
                  Escalate Now
                </button>
                <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  Reassign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500">Recovery exposure breakdown by lien / recovery category</p>
          {DEMO_BY_CATEGORY.map((cat, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-200 w-44 flex-shrink-0">{cat.category}</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((cat.count / 8) * 100, 100)}%`,
                      background: cat.blockingCount > 0 ? "#d4a054" : "#4a90b8",
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-6 text-right">{cat.count}</span>
                <span className="text-xs font-mono text-slate-500 w-24 text-right">
                  {cat.totalAsserted > 0 ? `$${(cat.totalAsserted / 1000).toFixed(0)}K` : "—"}
                </span>
                <span className="text-[10px] text-slate-500 w-16 text-right">avg {cat.avgDaysOpen}d</span>
                <span className="w-20 text-right">
                  {cat.blockingCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">{cat.blockingCount} blocking</span>
                  ) : (
                    <span className="text-[9px] text-[#22c55e]">clear</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
