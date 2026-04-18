import { useState } from "react";
import {
  Shield, CheckCircle, X, AlertTriangle, FileText,
  MessageSquare, ChevronRight, ArrowUpRight, Download, Clock
} from "lucide-react";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";
import { threatTwins, exposureTwins, incidentReadiness, type ThreatApproval } from "@/data/threat-twin";

const ACCENT = "hsl(220 72% 56%)";
const ACCENT_DIM = "hsl(220 72% 40%)";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "#c08a2c", bg: "#c08a2c20", label: "Pending" },
  approved: { color: "#40856a", bg: "#40856a20", label: "Approved" },
  rejected: { color: "#c04a2a", bg: "#c04a2a20", label: "Rejected" },
  escalated: { color: "#a855f7", bg: "#a855f720", label: "Escalated" },
  withdrawn: { color: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.04)", label: "Withdrawn" },
};

const ACTION_LABELS: Record<string, string> = {
  containment_action: "Containment",
  remediation_plan: "Remediation",
  risk_acceptance: "Risk Acceptance",
  escalation: "Escalation",
  governance_review: "Governance",
  export_report: "Report Export",
};

interface FlatApproval extends ThreatApproval {
  threatTitle: string;
}

function ApprovalCard({ approval, onAction }: { approval: FlatApproval; onAction: (id: string, action: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const ss = STATUS_STYLE[approval.status];

  return (
    <div className="rounded-xl border transition-all" style={{
      background: approval.status === "pending" ? "hsl(220 72% 56% / 0.04)" : "rgba(255,255,255,0.02)",
      borderColor: approval.priority === "critical" && approval.status === "pending" ? "#9b1c1c30" : approval.status === "pending" ? "#c08a2c20" : "rgba(255,255,255,0.06)",
    }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(220 72% 56% / 0.12)", color: ACCENT }}>
                {ACTION_LABELS[approval.actionClass] ?? approval.actionClass}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: approval.priority === "critical" ? "#9b1c1c20" : approval.priority === "high" ? "#c04a2a20" : "#c08a2c20",
                color: approval.priority === "critical" ? "#f87171" : approval.priority === "high" ? "#c04a2a" : "#c08a2c",
              }}>
                {approval.priority}
              </span>
            </div>
            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{approval.title}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {approval.threatTitle} · by {approval.requestedBy} · {relTime(approval.requestedAt)}
            </div>
          </div>
        </div>
        <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{approval.description}</p>
        {approval.comments.length > 0 && (
          <>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs mb-2 hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              <MessageSquare size={12} /> {approval.comments.length} comment{approval.comments.length > 1 ? "s" : ""}
              <ChevronRight size={12} style={{ transform: showComments ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {showComments && (
              <div className="mb-3 space-y-2 pl-4 border-l" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {approval.comments.map((c, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{c.author}</span>
                    <span style={{ color: "rgba(255,255,255,0.25)" }}> · {relTime(c.at)}</span>
                    {c.internal && <span className="ml-1 text-purple-400">(internal)</span>}
                    <p className="mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {approval.status === "pending" && (
          <div className="flex gap-2">
            <button onClick={() => onAction(approval.id, "approve")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: ACCENT_DIM, color: "white" }}>
              <CheckCircle size={12} /> Authorize
            </button>
            <button onClick={() => onAction(approval.id, "reject")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5"
              style={{ border: "1px solid #c04a2a40", color: "#c04a2a" }}>
              <X size={12} /> Reject
            </button>
            <button onClick={() => onAction(approval.id, "escalate")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              <ArrowUpRight size={12} /> Escalate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GovernanceIssueRow({ label, description, severity, daysOverdue }: {
  label: string; description: string; severity: "warning" | "critical"; daysOverdue?: number;
}) {
  const color = severity === "critical" ? "#c04a2a" : "#c08a2c";
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <AlertTriangle size={14} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{description}</div>
      </div>
      {daysOverdue !== undefined && (
        <span className="flex items-center gap-1 text-xs" style={{ color }}>
          <Clock size={10} /> {daysOverdue}d overdue
        </span>
      )}
    </div>
  );
}

export default function GovernanceReview() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [approvalStates, setApprovalStates] = useState<Record<string, string>>({});

  const allApprovals: FlatApproval[] = threatTwins.flatMap(t =>
    t.approvals.map(a => ({ ...a, threatTitle: t.title }))
  );

  function handleAction(id: string, action: string) {
    const map: Record<string, string> = { approve: "approved", reject: "rejected", escalate: "escalated" };
    setApprovalStates(prev => ({ ...prev, [id]: map[action] ?? action }));
  }

  const displayed = allApprovals.map(a => ({
    ...a,
    status: (approvalStates[a.id] ?? a.status) as ThreatApproval["status"],
  })).filter(a => statusFilter === "all" || a.status === statusFilter);

  const pending = allApprovals.filter(a => (approvalStates[a.id] ?? a.status) === "pending").length;
  const govIssues = incidentReadiness.find(a => a.area === "governance")?.issues ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Governance Review</h1>
            {pending > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#c08a2c20", color: "#c08a2c" }}>
                {pending} pending
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Authorization queue, governance gaps, policy exceptions, and security audit trail
          </p>
        </div>
      </div>

      {govIssues.length > 0 && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "#c04a2a05", borderColor: "#c04a2a20" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: "#c04a2a" }} />
            <h3 className="text-sm font-semibold" style={{ color: "#c04a2a" }}>Governance Gaps</h3>
          </div>
          {govIssues.map((issue, i) => (
            <GovernanceIssueRow key={i} label={issue} description="Action required" severity="warning" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {["all", "pending", "approved", "rejected"].map(s => {
          const count = s === "all" ? allApprovals.length : allApprovals.filter(a => (approvalStates[a.id] ?? a.status) === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className="rounded-xl border p-3 text-left transition-all"
              style={{
                background: statusFilter === s ? "hsl(220 72% 56% / 0.06)" : "rgba(255,255,255,0.01)",
                borderColor: statusFilter === s ? "hsl(220 72% 56% / 0.2)" : "rgba(255,255,255,0.04)",
              }}>
              <div className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{count}</div>
              <div className="text-xs capitalize mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {displayed.length === 0 ? (
          <EmptyState icon={Shield} headline="No approvals" description="No approvals match this filter." accentColor={ACCENT} />
        ) : (
          displayed.map(a => <ApprovalCard key={a.id} approval={a} onAction={handleAction} />)
        )}
      </div>

      <div className="mt-8 rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <h3 className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Security Audit Trace & Export</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          Generate a signed security governance report — approval log, action history, exposure summary, and audit chain. Immutable once generated.
        </p>
        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Download size={12} /> Generate Security Report
        </button>
      </div>
    </div>
  );
}
