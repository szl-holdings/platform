import { useState } from "react";
import { Link } from "wouter";
import {
  ShieldAlert, AlertTriangle, Clock, DollarSign,
  RefreshCw, XCircle, ChevronRight, FileText, CheckCircle
} from "lucide-react";

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

const LIFECYCLE_COLORS: Record<string, string> = {
  awaiting_response: "#d4a054",
  documentation_requested: "#c8953c",
  dispute_flagged: "#c45a4a",
  amount_pending: "#c8953c",
  amount_known: "#4a90b8",
  ready_for_settlement_handling: "#22c55e",
};

const MY_RECOVERY_ITEMS = [
  {
    id: 1,
    matterTitle: "Rodriguez v. National General",
    lienHolder: "Florida Medicaid AHCA",
    category: "Medicaid",
    lifecycleState: "awaiting_response",
    assertedAmount: 22300,
    amountStatus: "pending",
    blocksSettlement: true,
    isStale: true,
    daysSinceActivity: 47,
    nextAction: "Send escalation letter — AHCA non-responsive 47 days",
  },
  {
    id: 2,
    matterTitle: "Rodriguez v. National General",
    lienHolder: "PhysioFirst PT",
    category: "Provider Lien",
    lifecycleState: "amount_known",
    assertedAmount: 14400,
    amountStatus: "confirmed",
    blocksSettlement: false,
    isStale: false,
    daysSinceActivity: 5,
    nextAction: "Negotiate reduction — amount confirmed",
  },
  {
    id: 3,
    matterTitle: "Rodriguez v. National General",
    lienHolder: "Jackson Memorial Hospital",
    category: "Hospital Lien",
    lifecycleState: "dispute_flagged",
    assertedAmount: 5600,
    amountStatus: "inferred",
    blocksSettlement: true,
    isStale: false,
    daysSinceActivity: 12,
    nextAction: "Follow up on dispute letter — 14-day deadline approaching",
  },
  {
    id: 4,
    matterTitle: "Thompson v. Westfield",
    lienHolder: "Blue Cross Blue Shield NJ",
    category: "Private Health / ERISA",
    lifecycleState: "documentation_requested",
    assertedAmount: 18900,
    amountStatus: "pending",
    blocksSettlement: true,
    isStale: false,
    daysSinceActivity: 8,
    nextAction: "Follow up with BCBS plan administrator",
  },
];

export default function RecoveryView() {
  const [filter, setFilter] = useState<"all" | "blocking" | "stale" | "awaiting">("all");

  const filtered = MY_RECOVERY_ITEMS.filter(item => {
    if (filter === "blocking") return item.blocksSettlement;
    if (filter === "stale") return item.isStale;
    if (filter === "awaiting") return item.lifecycleState === "awaiting_response" || item.lifecycleState === "documentation_requested";
    return true;
  });

  const blockingCount = MY_RECOVERY_ITEMS.filter(i => i.blocksSettlement).length;
  const staleCount = MY_RECOVERY_ITEMS.filter(i => i.isStale).length;
  const awaitingCount = MY_RECOVERY_ITEMS.filter(i => i.lifecycleState === "awaiting_response" || i.lifecycleState === "documentation_requested").length;

  return (
    <div className="p-5 max-w-[900px] mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#c45a4a]" />
            <h1 className="text-base font-semibold text-slate-100">Recovery & Lien View</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Your recovery items — unresolved, stale, awaiting response, settlement blockers</p>
        </div>
        <Link href="/prism-counsel/recovery-ops">
          <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:border-white/[0.12] transition-colors">
            Firm View <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-white/[0.06] p-3 cursor-pointer hover:border-white/[0.12] transition-colors" onClick={() => setFilter("blocking")} style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle className="w-3 h-3 text-[#c45a4a]" />
            <span className="text-[9px] text-slate-600 uppercase">Blocking Settlement</span>
          </div>
          <div className="text-2xl font-bold text-[#c45a4a]">{blockingCount}</div>
        </div>
        <div className="rounded border border-white/[0.06] p-3 cursor-pointer hover:border-white/[0.12] transition-colors" onClick={() => setFilter("awaiting")} style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-[#d4a054]" />
            <span className="text-[9px] text-slate-600 uppercase">Awaiting Response</span>
          </div>
          <div className="text-2xl font-bold text-[#d4a054]">{awaitingCount}</div>
        </div>
        <div className="rounded border border-white/[0.06] p-3 cursor-pointer hover:border-white/[0.12] transition-colors" onClick={() => setFilter("stale")} style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <RefreshCw className="w-3 h-3 text-[#c8953c]" />
            <span className="text-[9px] text-slate-600 uppercase">Stale Amounts</span>
          </div>
          <div className="text-2xl font-bold text-[#c8953c]">{staleCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {([
          { key: "all", label: "All" },
          { key: "blocking", label: "Blocking" },
          { key: "awaiting", label: "Awaiting" },
          { key: "stale", label: "Stale" },
        ] as { key: typeof filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              filter === f.key ? "bg-[#c45a4a]/20 text-[#c45a4a]" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => {
          const stateColor = LIFECYCLE_COLORS[item.lifecycleState] ?? "#6b7280";
          return (
            <div key={item.id} className="rounded-lg border border-white/[0.06] p-3 hover:border-white/[0.10] transition-colors" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-100">{item.lienHolder}</span>
                    {item.blocksSettlement && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a]">BLOCKING</span>
                    )}
                    {item.isStale && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#c8953c]/10 text-[#c8953c]">STALE</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mb-1.5">
                    <span className="text-[#4a90b8]">{item.category}</span>
                    <span className="mx-1">·</span>
                    <span>{item.matterTitle}</span>
                  </div>
                  <div className="rounded border border-white/[0.04] px-2 py-1.5" style={{ background: "#080c14" }}>
                    <span className="text-[10px] text-[#4a90b8]">{item.nextAction}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-mono text-slate-200">
                    ${(item.assertedAmount / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: item.amountStatus === "confirmed" ? "#22c55e" : "#d4a054" }}>
                    {item.amountStatus}
                  </div>
                  <div className="mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${stateColor}18`, color: stateColor }}>
                      {LIFECYCLE_LABELS[item.lifecycleState]}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-600 mt-1">{item.daysSinceActivity}d since activity</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
