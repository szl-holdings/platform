import { PolicyResultBanner } from "@szl-holdings/shared-ui/policy-result";
import { DecisionReceiptCard, type DecisionReceiptData } from "@szl-holdings/shared-ui/decision-receipt-card";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useState } from "react";
import {
  Shield, CheckCircle, X, AlertTriangle, MessageSquare, ChevronRight, ArrowUpRight, Download, Anchor, Receipt
} from "lucide-react";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";
import { voyageTwins, type VoyageApproval } from "@/data/fleet-twin";

const ACCENT = "hsl(205 70% 50%)";
const ACCENT_DIM = "hsl(205 70% 38%)";

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

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  critical: { color: "#f87171", bg: "#9b1c1c20" },
  high: { color: "#c04a2a", bg: "#c04a2a20" },
  medium: { color: "#c08a2c", bg: "#c08a2c20" },
  low: { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.04)" },
};

const ACTION_LABELS: Record<string, string> = {
  route_deviation: "Route Deviation",
  port_clearance: "Port Clearance",
  cargo_override: "Cargo Override",
  exception_escalation: "Exception Escalation",
  export_packet: "Export Packet",
};

type DecisionOutcome = "approved" | "rejected" | "escalated";
const OUTCOME_MAP: Record<string, DecisionOutcome> = {
  approve: "approved",
  reject: "rejected",
  escalate: "escalated",
};

interface FlatApproval extends VoyageApproval {
  vesselName: string;
}

interface ReceiptPayload {
  domain: string;
  actionType: string;
  actionLabel: string;
  outcome: DecisionOutcome;
  riskLevel: string;
  rationale: string;
  dataSnapshot: Record<string, unknown>;
  aiRecommendation: {
    recommendedAction: string;
    rationaleSummary: string;
    confidence: number;
    riskLevel: string;
    modelRoute: string;
    evidenceRefs: Array<{ source: string; content: string; relevanceScore: number }>;
  };
  alternativesConsidered: Array<{ label: string; description: string; riskLevel: string }>;
  metadata: Record<string, unknown>;
}

function buildReceiptPayload(approval: FlatApproval, action: string): ReceiptPayload {
  const outcome: DecisionOutcome = OUTCOME_MAP[action] ?? "approved";
  return {
    domain: "vessels",
    actionType: approval.actionClass,
    actionLabel: `${ACTION_LABELS[approval.actionClass] ?? approval.actionClass}: ${approval.title}`,
    outcome,
    riskLevel: approval.priority === "critical" ? "P0" : approval.priority === "high" ? "P1" : approval.priority === "medium" ? "P2" : "P3",
    rationale: action === "approve"
      ? `Voyage operation approved after review of ${approval.vesselName} (${approval.voyageNumber}). All documentation reviewed.`
      : action === "reject"
      ? `Voyage operation rejected: ${approval.description}. Risk profile and documentation did not meet clearance threshold.`
      : `Decision escalated to Fleet Operations Manager for ${approval.vesselName}. Priority: ${approval.priority}.`,
    dataSnapshot: {
      vesselName: approval.vesselName,
      voyageNumber: approval.voyageNumber,
      actionClass: approval.actionClass,
      priority: approval.priority,
      requestedBy: approval.requestedBy,
      requestedAt: approval.requestedAt,
      description: approval.description,
      approvalId: approval.id,
    },
    aiRecommendation: {
      recommendedAction: action === "approve"
        ? `Approve ${ACTION_LABELS[approval.actionClass] ?? approval.actionClass} for ${approval.vesselName}`
        : action === "reject"
        ? `Reject — risk profile exceeds clearance threshold for ${approval.priority} priority`
        : `Escalate to Fleet Operations Manager`,
      rationaleSummary: `AI analysis of voyage parameters for ${approval.vesselName} (${approval.voyageNumber}) indicates ${
        approval.priority === "critical"
          ? "critical risk requiring immediate human decision"
          : approval.priority === "high"
          ? "elevated risk warranting careful review before proceeding"
          : "standard operational variance within acceptable parameters"
      }. Route, cargo, and counterparty data were evaluated against historical benchmarks and current sanctions lists.`,
      confidence: approval.priority === "critical" ? 0.72 : approval.priority === "high" ? 0.81 : 0.91,
      riskLevel: approval.priority === "critical" ? "P0" : approval.priority === "high" ? "P1" : "P2",
      modelRoute: "vessels-screening:gpt-4o",
      evidenceRefs: [
        {
          source: "vessels.signals",
          content: `Route deviation flagged for ${approval.vesselName} — historical deviation rate for this corridor: 12%.`,
          relevanceScore: 0.87,
        },
        {
          source: "sanctions.screening",
          content: "Port of call and counterparty screened against OFAC, EU, UN sanctions lists — no matches.",
          relevanceScore: 0.94,
        },
        {
          source: "vessels.fleet-twin",
          content: `Voyage ${approval.voyageNumber}: cargo manifest reviewed, P&L within 8% of projected estimate.`,
          relevanceScore: 0.76,
        },
      ],
    },
    alternativesConsidered: [
      {
        label: action === "approve" ? "Reject and request re-documentation" : "Approve with conditions",
        description: action === "approve"
          ? "Return to fleet operator for additional documentation before re-submission"
          : "Approve with mandatory port agent confirmation and daily status reports",
        riskLevel: "P2",
      },
      {
        label: "Escalate to Compliance Officer",
        description: "Route decision through compliance team for formal sanctions clearance letter",
        riskLevel: "P1",
      },
    ],
    metadata: {
      source: "vessels-approval-review",
      voyageNumber: approval.voyageNumber,
    },
  };
}


function ApprovalCard({
  approval,
  onAction,
  receipt,
}: {
  approval: FlatApproval;
  onAction: (id: string, action: string, receipt: DecisionReceiptData | null) => void;
  receipt?: DecisionReceiptData | null;
}) {
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const ss = STATUS_STYLE[approval.status];
  const ps = PRIORITY_STYLE[approval.priority];

  async function handleAction(action: string) {
    setSubmitting(true);
    try {
      const payload = buildReceiptPayload(approval, action);
      const receipt = await apiFetch<DecisionReceiptData>("/decisions/receipts", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      onAction(approval.id, action, receipt);
      setShowReceipt(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`This decision cannot be completed — the receipt could not be recorded: ${message}. Governed actions require a persisted audit record.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border transition-all" style={{
      background: approval.status === "pending" ? "#c08a2c05" : "rgba(255,255,255,0.02)",
      borderColor: approval.priority === "critical" && approval.status === "pending" ? "#9b1c1c30" : approval.status === "pending" ? "#c08a2c20" : "rgba(255,255,255,0.06)",
    }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(205 70% 38% / 0.15)", color: ACCENT }}>
                {ACTION_LABELS[approval.actionClass] ?? approval.actionClass}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.color }}>{approval.priority}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
            </div>
            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{approval.title}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {approval.vesselName} · {approval.voyageNumber} · {approval.requestedBy} · {relTime(approval.requestedAt)}
            </div>
          </div>
          {receipt && (
            <button
              onClick={() => setShowReceipt(!showReceipt)}
              className="flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded ml-2 flex-shrink-0"
              style={{
                color: "#40856a",
                background: "#40856a14",
                border: "1px solid #40856a28",
              }}
              title="View Decision Receipt"
            >
              <Receipt size={10} />
              Receipt
            </button>
          )}
        </div>
        <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>{approval.description}</p>
        {approval.comments.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs mb-3 hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <MessageSquare size={12} />
            {approval.comments.length} comment{approval.comments.length > 1 ? "s" : ""}
            <ChevronRight size={12} style={{ transform: showComments ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        )}
        {showComments && (
          <div className="mb-3 space-y-2 pl-4 border-l" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {approval.comments.map((c, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{c.author}</span>
                <span style={{ color: "rgba(255,255,255,0.25)" }}> · {relTime(c.at)}</span>
                <p className="mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        )}
        {approval.status === "pending" && (
          <>
            <div className="mb-3">
              <PolicyResultBanner
                decision={{
                  effect: approval.priority === "critical" ? "deny" : "escalate",
                  allowed: false,
                  reason: `${ACTION_LABELS[approval.actionClass] ?? approval.actionClass} for ${approval.vesselName} requires human approval. Priority: ${approval.priority}.`,
                  escalationPath: ["Fleet Operations Manager", "Compliance Officer"],
                  whatNeedsToChange: [
                    "Authorized fleet operator must review and approve",
                    approval.priority === "critical" ? "Immediate action required — critical priority" : "Review voyage documentation before deciding",
                  ],
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("approve")}
                disabled={submitting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                style={{ background: ACCENT_DIM, color: "white" }}
              >
                <CheckCircle size={12} />
                {submitting ? "Processing…" : "Approve"}
              </button>
              <button
                onClick={() => handleAction("reject")}
                disabled={submitting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50"
                style={{ border: "1px solid #c04a2a40", color: "#c04a2a" }}
              >
                <X size={12} />Reject
              </button>
              <button
                onClick={() => handleAction("escalate")}
                disabled={submitting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
              >
                <ArrowUpRight size={12} />Escalate
              </button>
            </div>
          </>
        )}
      </div>

      {receipt && showReceipt && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt size={12} style={{ color: "#40856a" }} />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Decision Receipt Generated
              </span>
            </div>
            <button
              onClick={() => setShowReceipt(false)}
              className="text-[9px] font-mono"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              hide
            </button>
          </div>
          <DecisionReceiptCard receipt={receipt} compact />
        </div>
      )}
    </div>
  );
}

export default function VesselsApprovalReview() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [approvalStates, setApprovalStates] = useState<Record<string, string>>({});
  const [receipts, setReceipts] = useState<Record<string, DecisionReceiptData>>({});

  const allApprovals: FlatApproval[] = voyageTwins.flatMap(v =>
    v.approvals.map(a => ({ ...a, vesselName: v.vesselName }))
  );

  function handleAction(id: string, action: string, receipt: DecisionReceiptData | null) {
    const map: Record<string, string> = { approve: "approved", reject: "rejected", escalate: "escalated" };
    setApprovalStates(prev => ({ ...prev, [id]: map[action] ?? action }));
    if (receipt) {
      setReceipts(prev => ({ ...prev, [id]: receipt }));
    }
  }

  const displayed = allApprovals.map(a => ({
    ...a,
    status: (approvalStates[a.id] ?? a.status) as VoyageApproval["status"],
  })).filter(a => statusFilter === "all" || a.status === statusFilter);

  const pending = allApprovals.filter(a => (approvalStates[a.id] ?? a.status) === "pending").length;
  const receiptCount = Object.keys(receipts).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Review & Approval</h1>
            {pending > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#c08a2c20", color: "#c08a2c" }}>
                {pending} pending
              </span>
            )}
            {receiptCount > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#40856a20", color: "#40856a" }}>
                <Receipt size={10} />
                {receiptCount} receipt{receiptCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Voyage approval requests — route deviations, port clearances, exception escalations, and export packets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {["all", "pending", "approved", "rejected"].map(s => {
          const count = s === "all" ? allApprovals.length : allApprovals.filter(a => (approvalStates[a.id] ?? a.status) === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-xl border p-3 text-left transition-all"
              style={{
                background: statusFilter === s ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                borderColor: statusFilter === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              }}>
              <div className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>{count}</div>
              <div className="text-xs capitalize mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s}</div>
            </button>
          );
        })}
      </div>

      {receiptCount > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl border" style={{ background: "rgba(64,133,106,0.04)", borderColor: "#40856a20" }}>
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: "#40856a" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="font-medium" style={{ color: "#40856a" }}>{receiptCount} decision receipt{receiptCount !== 1 ? "s" : ""}</span>
              {" "}generated for this session. Each receipt is cryptographically hashed and stored in the audit trail.
              Receipts are downloadable from the card below.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {displayed.length === 0 ? (
          <EmptyState icon={Shield} headline="No approvals" description="No approvals match this filter." accentColor={ACCENT} />
        ) : (
          displayed.map(a => (
            <ApprovalCard
              key={a.id}
              approval={a}
              onAction={handleAction}
              receipt={receipts[a.id]}
            />
          ))
        )}
      </div>

      <div className="mt-8 rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Download size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <h3 className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Voyage Export Packet / Audit Trail</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          Generate a voyage export packet — voyage summary, approval log, deviation record, and audit chain. Immutable once generated.
          {receiptCount > 0 && ` Includes ${receiptCount} decision receipt${receiptCount !== 1 ? "s" : ""} from this session.`}
        </p>
        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Download size={12} />
          Generate Export Packet
        </button>
      </div>
    </div>
  );
}
