import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ShieldAlert, AlertTriangle, Clock, DollarSign, ChevronRight,
  RefreshCw, FileText, CheckCircle, XCircle, Filter, Search,
  TrendingUp, Eye, Inbox, Layers, Building2
} from "lucide-react";

const LIFECYCLE_COLORS: Record<string, string> = {
  not_identified: "#6b7280",
  suspected: "#8b7ac8",
  identified: "#4a90b8",
  documentation_requested: "#c8953c",
  awaiting_response: "#d4a054",
  amount_pending: "#c8953c",
  amount_known: "#4a90b8",
  dispute_flagged: "#c45a4a",
  reviewed: "#4a90b8",
  ready_for_settlement_handling: "#22c55e",
  resolved: "#6b7280",
  archived: "#374151",
};

const LIFECYCLE_LABELS: Record<string, string> = {
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

const LIEN_CATEGORY_LABELS: Record<string, string> = {
  medicare_msp: "Medicare / MSP",
  medicaid: "Medicaid",
  private_health_reimbursement: "Private Health",
  workers_comp: "Workers' Comp",
  provider_lien: "Provider Lien",
  hospital_lien: "Hospital Lien",
  statutory_recovery: "Statutory Recovery",
  firm_internal: "Firm Internal",
  erisa: "ERISA",
  no_fault_reimbursement: "No-Fault Reimb.",
  child_support: "Child Support",
  other: "Other",
};

const DEMO_RECOVERY_ITEMS = [
  {
    id: 1,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    lienCategory: "medicaid",
    lienHolder: "Florida Medicaid AHCA",
    lifecycleState: "awaiting_response",
    assertedAmount: 22300,
    confirmedAmount: null,
    amountStatus: "pending",
    blocksSettlement: true,
    blocksExport: false,
    isStale: true,
    staleSince: "2026-02-15",
    daysSinceActivity: 47,
    confidence: 0.82,
    sourceClass: "government_letter",
    notes: "Conditional payment letter received Jan 2026. No updated amount provided despite follow-up.",
  },
  {
    id: 2,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    lienCategory: "provider_lien",
    lienHolder: "PhysioFirst PT",
    lifecycleState: "amount_known",
    assertedAmount: 14400,
    confirmedAmount: 14400,
    amountStatus: "confirmed",
    blocksSettlement: false,
    blocksExport: false,
    isStale: false,
    staleSince: null,
    daysSinceActivity: 5,
    confidence: 0.95,
    sourceClass: "provider_notice",
    notes: "Provider confirmed final amount. Negotiation pending.",
  },
  {
    id: 3,
    matterId: 1,
    matterTitle: "Rodriguez v. National General Insurance",
    caseNumber: "2025-CV-04821",
    lienCategory: "hospital_lien",
    lienHolder: "Jackson Memorial Hospital",
    lifecycleState: "dispute_flagged",
    assertedAmount: 5600,
    confirmedAmount: null,
    amountStatus: "inferred",
    blocksSettlement: true,
    blocksExport: true,
    isStale: false,
    staleSince: null,
    daysSinceActivity: 12,
    confidence: 0.65,
    sourceClass: "attorney_note",
    notes: "Hospital claims exceed covered amount. Dispute letter sent. Awaiting response.",
  },
  {
    id: 4,
    matterId: 2,
    matterTitle: "Thompson v. Westfield Mall Holdings",
    caseNumber: "2025-CV-07293",
    lienCategory: "private_health_reimbursement",
    lienHolder: "Blue Cross Blue Shield NJ",
    lifecycleState: "documentation_requested",
    assertedAmount: 18900,
    confirmedAmount: null,
    amountStatus: "pending",
    blocksSettlement: true,
    blocksExport: false,
    isStale: false,
    staleSince: null,
    daysSinceActivity: 8,
    confidence: 0.78,
    sourceClass: "carrier_document",
    notes: "ERISA plan. Documentation requested March 2026. Response due April 15.",
  },
  {
    id: 5,
    matterId: 3,
    matterTitle: "Meridian Holdings v. Atlantic Casualty",
    caseNumber: "2025-CV-11047",
    lienCategory: "statutory_recovery",
    lienHolder: "NY Workers' Comp Board",
    lifecycleState: "suspected",
    assertedAmount: null,
    confirmedAmount: null,
    amountStatus: "unknown",
    blocksSettlement: false,
    blocksExport: false,
    isStale: false,
    staleSince: null,
    daysSinceActivity: 3,
    confidence: 0.40,
    sourceClass: "inferred",
    notes: "Potential subrogation interest flagged. Verification needed before demand.",
  },
];

const DEMO_STATS = {
  totalItems: 5,
  blockingSettlement: 3,
  awaitingResponse: 2,
  staleAmounts: 1,
  totalAsserted: 61200,
  unresolvedCount: 4,
};

type RecoveryFilter = "all" | "blocking" | "awaiting" | "stale" | "unresolved";

export default function RecoveryOpsPage() {
  const [filter, setFilter] = useState<RecoveryFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = DEMO_RECOVERY_ITEMS.filter(item => {
    const matchesSearch = !search ||
      item.lienHolder.toLowerCase().includes(search.toLowerCase()) ||
      item.matterTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "blocking" && item.blocksSettlement) ||
      (filter === "awaiting" && item.lifecycleState === "awaiting_response") ||
      (filter === "stale" && item.isStale) ||
      (filter === "unresolved" && !["resolved", "archived"].includes(item.lifecycleState));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-[1300px] mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#c45a4a]" />
            <h1 className="text-lg font-semibold text-slate-100">Recovery & Lien Operations</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">PILOT TWO</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Firm-wide lien tracking, recovery lifecycle, and settlement blocker intelligence</p>
        </div>
        <Link href="/prism-counsel/settlement-blockers">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors">
            <Layers className="w-3.5 h-3.5" />
            Settlement Blockers
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Recovery Items", value: String(DEMO_STATS.totalItems), icon: ShieldAlert, accent: "#4a90b8" },
          { label: "Blocking Settlement", value: String(DEMO_STATS.blockingSettlement), icon: XCircle, accent: "#c45a4a" },
          { label: "Awaiting Response", value: String(DEMO_STATS.awaitingResponse), icon: Clock, accent: "#d4a054" },
          { label: "Stale Amounts", value: String(DEMO_STATS.staleAmounts), icon: RefreshCw, accent: "#c8953c" },
          { label: "Total Asserted", value: `$${(DEMO_STATS.totalAsserted / 1000).toFixed(1)}K`, icon: DollarSign, accent: "#8b7ac8" },
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

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by lien holder or matter..."
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-1">
              {([
                { key: "all", label: "All" },
                { key: "blocking", label: "Blocking" },
                { key: "awaiting", label: "Awaiting" },
                { key: "stale", label: "Stale" },
                { key: "unresolved", label: "Unresolved" },
              ] as { key: RecoveryFilter; label: string }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    filter === f.key
                      ? "bg-[#4a90b8]/20 text-[#4a90b8]"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map(item => {
              const stateColor = LIFECYCLE_COLORS[item.lifecycleState] ?? "#6b7280";
              return (
                <div key={item.id} className="rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.10] transition-colors" style={{ background: "#0c1220" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-slate-100">{item.lienHolder}</span>
                        {item.blocksSettlement && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a]">BLOCKS SETTLEMENT</span>
                        )}
                        {item.blocksExport && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a]">BLOCKS EXPORT</span>
                        )}
                        {item.isStale && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">STALE</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                        <span className="text-[#4a90b8]">{LIEN_CATEGORY_LABELS[item.lienCategory]}</span>
                        <span>·</span>
                        <span className="truncate">{item.matterTitle}</span>
                        <span>·</span>
                        <span className="font-mono">{item.caseNumber}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{item.notes}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded text-[9px] font-medium" style={{ background: `${stateColor}18`, color: stateColor }}>
                        {LIFECYCLE_LABELS[item.lifecycleState]}
                      </span>
                      <div className="text-right">
                        {item.confirmedAmount != null ? (
                          <>
                            <div className="text-sm font-mono text-slate-200">${(item.confirmedAmount / 1000).toFixed(1)}K</div>
                            <div className="text-[9px] text-[#22c55e]">confirmed</div>
                          </>
                        ) : item.assertedAmount != null ? (
                          <>
                            <div className="text-sm font-mono text-slate-200">${(item.assertedAmount / 1000).toFixed(1)}K</div>
                            <div className="text-[9px] text-[#d4a054]">{item.amountStatus}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-mono text-slate-500">—</div>
                            <div className="text-[9px] text-slate-600">unknown</div>
                          </>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono">conf: {Math.round((item.confidence ?? 0) * 100)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
                    <span className="text-[9px] text-slate-600">{item.daysSinceActivity}d since activity</span>
                    <span className="text-[9px] text-slate-600">·</span>
                    <span className="text-[9px] text-slate-600">{item.sourceClass.replace(/_/g, " ")}</span>
                    <div className="flex-1" />
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      Request Update
                    </button>
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      Add Note
                    </button>
                    <button className="px-2 py-0.5 rounded text-[9px] text-slate-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200 transition-colors">
                      View Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-[#c45a4a]" />
              Blocking Settlement
            </h3>
            <div className="space-y-2">
              {DEMO_RECOVERY_ITEMS.filter(i => i.blocksSettlement).map(item => (
                <div key={item.id} className="py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="text-[11px] text-slate-200">{item.lienHolder}</div>
                  <div className="text-[9px] text-slate-500">{item.matterTitle.split(" v. ")[0]}</div>
                  <div className="text-[9px] text-[#c45a4a] mt-0.5">{LIFECYCLE_LABELS[item.lifecycleState]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d4a054]" />
              Awaiting Response
            </h3>
            <div className="space-y-2">
              {DEMO_RECOVERY_ITEMS.filter(i => i.lifecycleState === "awaiting_response" || i.lifecycleState === "documentation_requested").map(item => (
                <div key={item.id} className="py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="text-[11px] text-slate-200">{item.lienHolder}</div>
                  <div className="text-[9px] text-slate-500">{LIEN_CATEGORY_LABELS[item.lienCategory]}</div>
                  <div className="text-[9px] text-[#d4a054] mt-0.5">{item.daysSinceActivity}d waiting</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#c8953c]" />
              Stale Amounts
            </h3>
            <div className="space-y-2">
              {DEMO_RECOVERY_ITEMS.filter(i => i.isStale).map(item => (
                <div key={item.id} className="py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="text-[11px] text-slate-200">{item.lienHolder}</div>
                  <div className="text-[9px] text-slate-500">${((item.assertedAmount ?? 0) / 1000).toFixed(1)}K asserted</div>
                  <div className="text-[9px] text-[#c8953c] mt-0.5">Stale since {item.staleSince}</div>
                </div>
              ))}
              {DEMO_RECOVERY_ITEMS.filter(i => i.isStale).length === 0 && (
                <p className="text-[10px] text-slate-500">No stale amounts</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <h3 className="text-[11px] font-semibold text-slate-300 mb-2">Auto-Signals</h3>
            <div className="space-y-1.5">
              {[
                { text: "Medicaid AHCA: stale 47d, matter advanced", color: "#c45a4a" },
                { text: "Jackson Memorial: export blocked by dispute", color: "#c45a4a" },
                { text: "BCBS NJ: docs requested, no response 8d", color: "#d4a054" },
                { text: "PhysioFirst: amount confirmed, ready to negotiate", color: "#22c55e" },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[9px] text-slate-500 leading-relaxed">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
