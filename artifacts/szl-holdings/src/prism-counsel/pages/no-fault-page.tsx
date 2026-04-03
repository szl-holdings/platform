import { Shield, Clock, AlertTriangle, FileCheck, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { NO_FAULT_CLAIMS, CLOCK_RULES } from "../data/demo-ny";
import { useState } from "react";

type Tab = "claims" | "clocks";

const STATUS_COLORS: Record<string, string> = {
  partial_payment: "#c8953c",
  open: "#4a90b8",
  denied: "#c45a4a",
  paid: "#4a7a5a",
  pending: "#d4a054",
  acknowledged: "#4a7a5a",
  acknowledged_late: "#c45a4a",
};

export default function NoFaultPage() {
  const [tab, setTab] = useState<Tab>("claims");

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">No-Fault & PIP Claims</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
            NEW YORK
          </span>
        </div>
        <p className="text-xs text-slate-500">NY Insurance Regulation 68 compliance tracking — claim clocks, verification windows, and arbitration risk</p>
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] pb-px">
        {([
          { key: "claims" as Tab, label: "Active Claims", icon: DollarSign },
          { key: "clocks" as Tab, label: "Clock Rules (11 NYCRR 65)", icon: Clock },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors ${
              tab === t.key ? "bg-white/[0.06] text-slate-100 border-b-2 border-[#d4a054]" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "claims" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="text-[9px] text-slate-500 uppercase">Active Claims</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">{NO_FAULT_CLAIMS.length}</div>
            </div>
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="text-[9px] text-slate-500 uppercase">Total Billed</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                ${(NO_FAULT_CLAIMS.reduce((s, c) => s + c.totalBilled, 0) / 1000).toFixed(1)}K
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="text-[9px] text-slate-500 uppercase">Total Paid</div>
              <div className="text-2xl font-bold font-mono" style={{ color: "#4a7a5a" }}>
                ${(NO_FAULT_CLAIMS.reduce((s, c) => s + c.totalPaid, 0) / 1000).toFixed(1)}K
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="text-[9px] text-slate-500 uppercase">Total Denied</div>
              <div className="text-2xl font-bold font-mono" style={{ color: "#c45a4a" }}>
                ${(NO_FAULT_CLAIMS.reduce((s, c) => s + c.totalDenied, 0) / 1000).toFixed(1)}K
              </div>
            </div>
          </div>

          {NO_FAULT_CLAIMS.map((claim) => (
            <div key={claim.id} className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200 font-mono">{claim.claimNumber}</h3>
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-medium uppercase"
                      style={{ background: `${STATUS_COLORS[claim.status]}15`, color: STATUS_COLORS[claim.status], border: `1px solid ${STATUS_COLORS[claim.status]}30` }}
                    >
                      {claim.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Link href={`/prism-counsel/matters/${claim.matterId}`}>
                    <span className="text-[10px] text-[#4a90b8] hover:text-[#5aa0c8] cursor-pointer flex items-center gap-1 mt-0.5">
                      {claim.matterTitle} <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </Link>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500">Arbitration Risk</div>
                  <div className="text-xs font-medium capitalize" style={{ color: claim.arbitrationRisk === "high" ? "#c45a4a" : claim.arbitrationRisk === "medium" ? "#c8953c" : "#4a90b8" }}>
                    {claim.arbitrationRisk}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 mb-3">
                <div>
                  <div className="text-[9px] text-slate-500">Type</div>
                  <div className="text-[11px] text-slate-300 capitalize">{claim.claimType.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Date of Loss</div>
                  <div className="text-[11px] text-slate-300">{claim.dateOfLoss}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Notice Date</div>
                  <div className="text-[11px] text-slate-300">{claim.noticeDate}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Ack Status</div>
                  <div className="text-[11px] capitalize" style={{ color: STATUS_COLORS[claim.ackStatus] || "#d4a054" }}>
                    {claim.ackStatus.replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Pay/Deny Deadline</div>
                  <div className="text-[11px] text-slate-300">{claim.payDenyDeadline}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Pending Bills</div>
                  <div className="text-[11px] font-mono text-slate-300">{claim.pendingBills}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-2">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">Billed:</span>
                  <span className="font-mono text-slate-300">${(claim.totalBilled / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">Paid:</span>
                  <span className="font-mono" style={{ color: "#4a7a5a" }}>${(claim.totalPaid / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">Denied:</span>
                  <span className="font-mono" style={{ color: "#c45a4a" }}>${(claim.totalDenied / 1000).toFixed(1)}K</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic">{claim.notes}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "clocks" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 mb-2">
            New York Insurance Regulation 68 (11 NYCRR Part 65) — compliance clocks and escalation rules for no-fault claims processing
          </div>
          {CLOCK_RULES.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">{rule.name}</h3>
                  <div className="text-[10px] text-[#4a90b8] font-mono mt-0.5">{rule.ruleRef}</div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.tollingApplies && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-[#c8953c]/10 text-[#c8953c] border border-[#c8953c]/20">
                      TOLLING APPLIES
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06] font-mono">
                    {rule.durationDays > 0 ? `${rule.durationDays}d` : "No fixed deadline"}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mb-2">{rule.description}</div>
              <div className="text-[10px] text-slate-500 mb-1">
                <span className="text-slate-400 font-medium">Trigger: </span>{rule.triggerEvent}
              </div>
              <div className="text-[10px] text-slate-500 mb-2">
                <span className="text-[#d4a054] font-medium">Next action: </span>{rule.nextAction}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rule.escalationLadder.map((step, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] bg-white/[0.03] text-slate-500 border border-white/[0.04]">
                    <span className="text-[#d4a054]">{i + 1}.</span> {step}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
