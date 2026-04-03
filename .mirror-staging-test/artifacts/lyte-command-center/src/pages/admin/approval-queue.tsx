import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertTriangle, Clock, FileText, RefreshCw, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface Approval {
  id: number;
  approvalId: string;
  artifactType: string;
  artifactId: string;
  status: "pending" | "approved" | "rejected" | "expired";
  domain: string;
  summary: string;
  requestedByLabel?: string | null;
  reviewedByLabel?: string | null;
  reviewNote?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  expiresAt?: string | null;
  workflowRunId?: string | null;
}

interface ApprovalsResponse {
  approvals: Approval[];
  total: number;
  pendingCount: number;
  summary: { pending: number; approved: number; rejected: number; expired: number };
}

const statusStyles: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:  { label: "Pending",  color: "text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20",  icon: Clock },
  approved: { label: "Approved", color: "text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20", icon: XCircle },
  expired:  { label: "Expired",  color: "text-slate-400 bg-slate-500/10 border-slate-500/20",  icon: Clock },
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ApprovalQueue() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [reason, setReason] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<ApprovalsResponse>({
    queryKey: ["admin-approvals", filter],
    queryFn: () => apiFetch(`/admin/artifact-approvals${filter !== "all" ? `?status=${filter}` : ""}`),
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (approvalId: string) =>
      apiFetch(`/admin/artifact-approvals/${approvalId}/approve`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-approvals"] }); setSelected(null); setReason(""); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, reason: r }: { approvalId: string; reason?: string }) =>
      apiFetch(`/admin/artifact-approvals/${approvalId}/reject`, { method: "POST", body: JSON.stringify({ reason: r }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-approvals"] }); setSelected(null); setReason(""); },
  });

  if (error) {
    const msg = String(error);
    if (msg.includes("403")) {
      return (
        <div className="space-y-4">
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />Approval Queue
          </h1>
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Lock className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
            <p className="text-muted-foreground text-sm mb-1">Artifact Approvals feature is disabled</p>
            <p className="text-xs text-muted-foreground/60">Enable the <code className="text-[#d4a054]">alloy_artifact_approvals_enabled</code> feature flag to activate this queue.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />Approval Queue
        </h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Failed to load approvals — API unavailable</p>
        </div>
      </div>
    );
  }

  const approvals = data?.approvals ?? [];
  const pending = data?.pendingCount ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />Approval Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Alloy artifact approvals requiring human review</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#d4a054]/10 border border-[#d4a054]/20">
            <Clock className="w-3.5 h-3.5 text-[#d4a054]" />
            <span className="text-xs font-medium text-[#d4a054]">{pending} pending review</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
              filter === f ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
            )}
          >
            {f}
          </button>
        ))}
        <button onClick={() => qc.invalidateQueries({ queryKey: ["admin-approvals"] })} className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#6b8f71] mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No {filter !== "all" ? filter : ""} approvals found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Summary</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Type / Domain</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Requested</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => {
                const s = statusStyles[a.status] ?? statusStyles.pending;
                const StatusIcon = s.icon;
                return (
                  <tr key={a.approvalId} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-foreground block truncate max-w-[200px]">{a.summary}</span>
                          {a.requestedByLabel && <span className="text-muted-foreground/60 text-[10px]">{a.requestedByLabel}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div>
                        <span className="text-foreground">{a.artifactType}</span>
                        <span className="block text-[10px] text-muted-foreground">{a.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{timeAgo(a.requestedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", s.color)}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "pending" && (
                        <button
                          onClick={() => { setSelected(a); setReason(""); }}
                          className="px-2 py-1 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-base mb-1">{selected.summary}</h2>
            <p className="text-xs text-muted-foreground mb-1">
              Type: <span className="text-foreground">{selected.artifactType}</span> · Domain: <span className="text-foreground">{selected.domain}</span>
            </p>
            {selected.requestedByLabel && (
              <p className="text-xs text-muted-foreground mb-4">Requested by <span className="text-foreground">{selected.requestedByLabel}</span> · {timeAgo(selected.requestedAt)}</p>
            )}
            <div className="bg-black/20 border border-border/50 rounded-lg p-2.5 text-[10px] font-mono text-muted-foreground mb-4">
              <span className="text-muted-foreground/50">approval_id: </span>{selected.approvalId}
              <br />
              <span className="text-muted-foreground/50">artifact_id: </span>{selected.artifactId}
              {selected.workflowRunId && <><br /><span className="text-muted-foreground/50">run_id: </span>{selected.workflowRunId}</>}
            </div>
            <label className="block text-xs text-muted-foreground mb-1.5">Reason / notes (required for rejection)</label>
            <textarea
              className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-xs resize-none focus:outline-none focus:border-primary/50 text-foreground"
              rows={3}
              placeholder="Add reason or notes..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setSelected(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({ approvalId: selected.approvalId, reason })}
                disabled={rejectMutation.isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20 hover:bg-[#c45a4a]/20 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </button>
              <button
                onClick={() => approveMutation.mutate(selected.approvalId)}
                disabled={approveMutation.isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6b8f71]/10 text-[#6b8f71] border border-[#6b8f71]/20 hover:bg-[#6b8f71]/20 transition-colors disabled:opacity-50"
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
