import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAlloyApprovals,
  useDecideAlloyApproval,
  getListAlloyApprovalsQueryKey,
  type AlloyApproval,
} from "@szl-holdings/api-client-react";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface AccentClasses {
  text: string;
  textMuted: string;
  bg: string;
  border: string;
  button?: string;
}

interface PendingAutonomyApprovalsPanelProps {
  domain: string;
  accentColor: string;
  accentClasses: AccentClasses;
}

function impactBadge(role: string) {
  if (role.includes("compliance")) return { label: "CRITICAL", bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" };
  if (role.includes("acquisitions") || role.includes("fleet")) return { label: "HIGH", bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" };
  return { label: "MEDIUM", bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "rgba(255,255,255,0.1)" };
}

function waitHours(createdAt: string) {
  return ((Date.now() - new Date(createdAt).getTime()) / 3600000).toFixed(1);
}

export function PendingAutonomyApprovalsPanel({
  domain,
  accentColor,
  accentClasses,
}: PendingAutonomyApprovalsPanelProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useListAlloyApprovals({ status: "pending", limit: 20 });
  const decideMutation = useDecideAlloyApproval({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlloyApprovalsQueryKey({ status: "pending" }) });
        setDecidingId(null);
        setNoteText("");
        setVerdict(null);
      },
    },
  });

  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"approve" | "reject" | null>(null);
  const [noteText, setNoteText] = useState("");

  const approvals: AlloyApproval[] = (data?.approvals ?? []).filter(
    (a: AlloyApproval) => !a.artifactId || a.artifactId === domain,
  );

  function startDecide(id: string, v: "approve" | "reject") {
    setDecidingId(id);
    setVerdict(v);
    setNoteText("");
  }

  function cancelDecide() {
    setDecidingId(null);
    setVerdict(null);
    setNoteText("");
  }

  function submitDecide(id: string) {
    if (!verdict) return;
    decideMutation.mutate({ id, data: { decision: verdict === "approve" ? "approve" : "reject", reason: noteText || undefined } });
  }

  return (
    <div
      style={{
        borderRadius: "0.75rem",
        background: `${accentColor}07`,
        border: `1px solid ${accentColor}18`,
        padding: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, display: "inline-block" }} />
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor }}>
            Pending Autonomy Approvals
          </span>
        </div>
        <span
          className={`text-[0.625rem] font-mono px-2 py-0.5 rounded-full ${accentClasses.bg} ${accentClasses.text}`}
          style={{ border: `1px solid ${accentColor}25` }}
        >
          {isLoading ? "…" : `${approvals.length} pending`}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10 gap-2" style={{ color: `${accentColor}60` }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-mono">Loading approvals…</span>
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex items-center gap-2 py-4" style={{ color: "rgba(239,68,68,0.7)" }}>
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-mono">Could not reach approvals API — check API server connectivity</span>
        </div>
      )}

      {!isLoading && !isError && approvals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle style={{ width: 24, height: 24, color: `${accentColor}40` }} />
          <span className="text-xs font-mono" style={{ color: `${accentColor}60` }}>No pending approvals</span>
          <span className="text-[0.6875rem]" style={{ color: "rgba(255,255,255,0.2)" }}>All autonomy actions approved or queued</span>
        </div>
      )}

      {!isLoading && approvals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {approvals.map((item) => {
            const badge = impactBadge(item.requiredRole);
            const isExpanding = decidingId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: isExpanding ? `1px solid ${accentColor}30` : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "0.5rem",
                  padding: "0.875rem 1rem",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.45, margin: 0 }}>
                    {item.reason ?? `Approval required — ${item.requiredRole}`}
                  </p>
                  <span
                    style={{
                      fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 600,
                      letterSpacing: "0.08em", padding: "0.15rem 0.5rem", borderRadius: "2rem",
                      flexShrink: 0, background: badge.bg, color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.625rem" }}>
                  <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                    {item.requestedBy}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: accentColor, fontFamily: "monospace" }}>
                    role: {item.requiredRole}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Clock className="w-3 h-3 inline" />
                    {waitHours(item.createdAt)}h waiting
                  </span>
                </div>

                {!isExpanding && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => startDecide(item.id, "approve")}
                      style={{
                        fontSize: "0.6875rem", fontFamily: "monospace", fontWeight: 600,
                        padding: "0.3rem 0.75rem", borderRadius: "0.375rem",
                        background: "rgba(34,197,94,0.1)", color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                      }}
                    >
                      <CheckCircle className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => startDecide(item.id, "reject")}
                      style={{
                        fontSize: "0.6875rem", fontFamily: "monospace", fontWeight: 600,
                        padding: "0.3rem 0.75rem", borderRadius: "0.375rem",
                        background: "rgba(239,68,68,0.1)", color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                      }}
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}

                {isExpanding && (
                  <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", margin: 0, fontFamily: "monospace" }}>
                      {verdict === "approve" ? "Approve" : "Reject"} — add audit note (optional):
                    </p>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Rationale for audit trail…"
                      rows={2}
                      style={{
                        fontSize: "0.75rem", fontFamily: "monospace",
                        background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)",
                        border: `1px solid ${accentColor}28`, borderRadius: "0.375rem",
                        padding: "0.5rem 0.625rem", resize: "vertical",
                        outline: "none", width: "100%", boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => submitDecide(item.id)}
                        disabled={decideMutation.isPending}
                        style={{
                          fontSize: "0.6875rem", fontFamily: "monospace", fontWeight: 600,
                          padding: "0.3rem 0.75rem", borderRadius: "0.375rem",
                          background: verdict === "approve" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: verdict === "approve" ? "#4ade80" : "#f87171",
                          border: `1px solid ${verdict === "approve" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                          cursor: decideMutation.isPending ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", gap: "0.3rem",
                          opacity: decideMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        {decideMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : verdict === "approve" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Confirm {verdict === "approve" ? "Approval" : "Rejection"}
                      </button>
                      <button
                        onClick={cancelDecide}
                        style={{
                          fontSize: "0.6875rem", fontFamily: "monospace",
                          padding: "0.3rem 0.75rem", borderRadius: "0.375rem",
                          background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)",
                          border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "1rem", marginBottom: 0 }}>
        {domain} · covenant-policy gated · decisions logged to audit trail
      </p>
    </div>
  );
}
