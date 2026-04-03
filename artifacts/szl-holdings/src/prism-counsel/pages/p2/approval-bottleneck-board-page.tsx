import { useState } from "react";
import { ShieldCheck, Clock, TrendingUp, ChevronDown, ChevronUp, ArrowRight, AlertTriangle } from "lucide-react";

const DEMO_APPROVALS = [
  { id: 201, title: "Settlement acceptance — Rodriguez v. National General", approvalType: "settlement_acceptance", requestedBy: "S. Chen", pendingWith: "Partner (J. Lutar)", ageDays: 5.2, urgency: "critical", amountAtStake: 385000, riskNote: "Carrier offer expires Apr 10 — 7 days remaining", matters: "Rodriguez v. National General", blocksDownstream: ["Export packet", "File closure"] },
  { id: 202, title: "Demand send approval — Thompson v. Westfield", approvalType: "demand_send", requestedBy: "R. Patel", pendingWith: "Partner (J. Lutar)", ageDays: 3.1, urgency: "high", amountAtStake: 520000, riskNote: "Mediation in 22 days — demand must be sent to carrier 14d prior", matters: "Thompson v. Westfield", blocksDownstream: ["Carrier review", "Mediation prep"] },
  { id: 203, title: "Expert engagement — Martinez v. Allstate", approvalType: "expert_engagement", requestedBy: "M. Williams", pendingWith: "Managing Partner", ageDays: 8.3, urgency: "high", amountAtStake: 45000, riskNote: "Expert disclosure deadline approaching — 14 days", matters: "Martinez v. Allstate", blocksDownstream: ["Expert report", "Discovery completion"] },
  { id: 204, title: "Fee approval — Chen v. GEICO Direct", approvalType: "fee_approval", requestedBy: "K. Roberts", pendingWith: "Finance", ageDays: 2.0, urgency: "medium", amountAtStake: 12000, riskNote: "Standard approval; no imminent deadline", matters: "Chen v. GEICO Direct", blocksDownstream: ["Vendor payment"] },
];

const APPROVAL_META: Record<string, { label: string; color: string }> = {
  settlement_acceptance: { label: "Settlement", color: "#d4a054" },
  demand_send: { label: "Demand Send", color: "#4a90b8" },
  expert_engagement: { label: "Expert", color: "#8b7ac8" },
  fee_approval: { label: "Fee", color: "#4a90b8" },
};

const URGENCY_COLOR: Record<string, string> = { critical: "#c45a4a", high: "#c8953c", medium: "#d4a054" };

function ApprovalRow({ item }: { item: typeof DEMO_APPROVALS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const meta = APPROVAL_META[item.approvalType];
  const uc = URGENCY_COLOR[item.urgency];

  return (
    <div className="rounded border border-white/[0.06] overflow-hidden" style={{ background: "#080c14" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${uc}15`, color: uc }}>{item.ageDays.toFixed(1)}d</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">{item.title}</span>
            {meta && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${meta.color}15`, color: meta.color }}>{meta.label}</span>}
            {item.urgency === "critical" && <AlertTriangle className="w-3 h-3 text-[#c45a4a]" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500">Pending: {item.pendingWith}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">${(item.amountAtStake / 1000).toFixed(0)}K at stake</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] p-3 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Risk Note</div>
            <div className="text-[11px] text-[#c8953c] leading-relaxed">{item.riskNote}</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Blocks Downstream</div>
            {item.blocksDownstream.map((b, i) => <div key={i} className="text-[10px] text-slate-400">• {b}</div>)}
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Actions</div>
            {["Escalate to partner", "Send reminder", "View approval request"].map(a => (
              <button key={a} className="w-full text-left px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center gap-1">
                <ArrowRight className="w-2.5 h-2.5" />{a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalBottleneckBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#8b7ac8]" />
          <h1 className="text-lg font-semibold text-slate-100">Approval Bottleneck Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Pending approvals ranked by urgency — who is waiting, what is blocked, and what is at risk</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Pending", count: DEMO_APPROVALS.length, color: "#8b7ac8" },
          { label: "Critical Urgency", count: DEMO_APPROVALS.filter(i => i.urgency === "critical").length, color: "#c45a4a" },
          { label: "Avg Age (days)", count: (DEMO_APPROVALS.reduce((s, i) => s + i.ageDays, 0) / DEMO_APPROVALS.length).toFixed(1), color: "#d4a054" },
          { label: "Total $ At Stake", count: `$${(DEMO_APPROVALS.reduce((s, i) => s + i.amountAtStake, 0) / 1000).toFixed(0)}K`, color: "#4a90b8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {DEMO_APPROVALS.map(item => <ApprovalRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}
