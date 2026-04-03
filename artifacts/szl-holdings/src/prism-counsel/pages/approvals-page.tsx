import { useState } from "react";
import { ShieldCheck, Clock, CheckCircle, XCircle, Wifi, WifiOff, Loader2 } from "lucide-react";
import { usePrismApprovals, usePrismResolveApproval } from "../hooks/use-prism-api";

const DEMO_APPROVALS = [
  { id: 1, type: "demand_send", title: "Send demand package — Rodriguez v. National General", status: "pending", requestedBy: "Sarah Chen", matter: "Rodriguez v. National General", date: "2026-03-28" },
  { id: 2, type: "expert_engagement", title: "Retain life care plan expert — Rodriguez", status: "pending", requestedBy: "Marcus Williams", matter: "Rodriguez v. National General", date: "2026-03-25" },
  { id: 3, type: "filing", title: "File motion to compel surveillance footage — Thompson", status: "pending", requestedBy: "Sarah Chen", matter: "Thompson v. Westfield", date: "2026-03-30" },
  { id: 4, type: "settlement_acceptance", title: "Counter-offer response — $95K from National General", status: "approved", requestedBy: "Sarah Chen", matter: "Rodriguez v. National General", date: "2026-01-18", approvedBy: "James Whitfield" },
  { id: 5, type: "external_communication", title: "Client update letter — Thompson matter status", status: "approved", requestedBy: "Lisa Park", matter: "Thompson v. Westfield", date: "2026-02-10", approvedBy: "Sarah Chen" },
];

const STATUS_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "#d4a054", bg: "#d4a054" },
  approved: { icon: CheckCircle, color: "#4a90b8", bg: "#4a90b8" },
  rejected: { icon: XCircle, color: "#c45a4a", bg: "#c45a4a" },
};

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const pendingQ = usePrismApprovals("pending");
  const resolvedQ = usePrismApprovals("approved");
  const resolveMut = usePrismResolveApproval();

  const isLive = !!pendingQ.data?.approvals;
  const isLoading = pendingQ.isLoading;

  const pending = isLive
    ? pendingQ.data!.approvals.map(a => ({
        id: a.id,
        type: a.requestType,
        title: a.title,
        status: a.status,
        requestedBy: `User #${a.requestedBy ?? "?"}`,
        matter: a.description ?? "",
        date: a.requestedAt,
      }))
    : DEMO_APPROVALS.filter(a => a.status === "pending");

  const resolved = isLive
    ? (resolvedQ.data?.approvals ?? []).map(a => ({
        id: a.id,
        type: a.requestType,
        title: a.title,
        status: a.status,
        requestedBy: `User #${a.requestedBy ?? "?"}`,
        matter: a.description ?? "",
        date: a.requestedAt,
        approvedBy: a.approvedBy ? `User #${a.approvedBy}` : undefined,
      }))
    : DEMO_APPROVALS.filter(a => a.status !== "pending");

  function handleResolve(approvalId: number, decision: "approved" | "rejected") {
    if (!isLive) return;
    resolveMut.mutate({ approvalId, decision });
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Approval Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">All consequential actions require explicit approval before execution</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {isLoading ? "LOADING" : isLive ? "LIVE" : "DEMO"}
        </span>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pending ({pending.length})</h2>
        {pending.length === 0 && (
          <div className="rounded-lg border border-white/[0.06] p-6 text-center" style={{ background: "#0c1220" }}>
            <CheckCircle className="w-6 h-6 text-[#4a90b8] mx-auto mb-2" />
            <p className="text-xs text-slate-400">No pending approvals</p>
          </div>
        )}
        {pending.map((a) => {
          const s = STATUS_MAP[a.status] || STATUS_MAP.pending;
          const Icon = s.icon;
          return (
            <div key={a.id} className="rounded-lg border border-white/[0.06] p-4 flex items-center gap-4" style={{ background: "#0c1220" }}>
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: s.bg + "15" }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-200">{a.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Requested by {a.requestedBy} · {a.type.replace(/_/g, " ")} · {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve(a.id, "approved")}
                  disabled={resolveMut.isPending}
                  className="px-3 py-1 rounded text-[10px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleResolve(a.id, "rejected")}
                  disabled={resolveMut.isPending}
                  className="px-3 py-1 rounded text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Deny
                </button>
              </div>
            </div>
          );
        })}

        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-6">Resolved ({resolved.length})</h2>
        {resolved.map((a) => {
          const s = STATUS_MAP[a.status] || STATUS_MAP.approved;
          const Icon = s.icon;
          return (
            <div key={a.id} className="rounded-lg border border-white/[0.04] p-3 flex items-center gap-3 opacity-70" style={{ background: "#0a0f18" }}>
              <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <div className="flex-1">
                <div className="text-[11px] text-slate-300">{a.title}</div>
                <div className="text-[9px] text-slate-500">{(a as any).approvedBy ? `Approved by ${(a as any).approvedBy}` : ""} · {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: s.bg + "15", color: s.color }}>{a.status.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
