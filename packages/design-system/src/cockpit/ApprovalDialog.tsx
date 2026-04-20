import { useEffect, useRef, useState } from "react";
import { X, Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  policyId?: string;
  requiredBy?: string;
  onApprove: (note?: string) => void;
  onReject: (reason: string) => void;
  accent?: string;
}

const RISK_CONFIG: Record<NonNullable<ApprovalDialogProps["riskLevel"]>, { color: string; label: string; icon: typeof Shield }> = {
  low:      { color: color.accent.green,  label: "Low Risk",      icon: CheckCircle },
  medium:   { color: color.accent.amber,  label: "Medium Risk",   icon: AlertTriangle },
  high:     { color: color.accent.amber,  label: "High Risk",     icon: AlertTriangle },
  critical: { color: color.accent.red,    label: "Critical Risk", icon: XCircle },
};

export function ApprovalDialog({
  open,
  onClose,
  title,
  description,
  riskLevel = "medium",
  policyId,
  requiredBy,
  onApprove,
  onReject,
  accent = color.accent.violet,
}: ApprovalDialogProps) {
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const risk = RISK_CONFIG[riskLevel];
  const RiskIcon = risk.icon;

  useEffect(() => {
    if (!open) {
      setMode("idle");
      setNote("");
      setReason("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(6,11,18,0.75)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl"
        style={{
          background: color.bg.surface,
          border: `1px solid ${color.border.default}`,
          borderTopColor: risk.color,
          borderTopWidth: 2,
        }}
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: color.bg.overlay, border: `1px solid ${color.border.default}` }}
          >
            <RiskIcon className="h-4.5 w-4.5" style={{ color: risk.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-bold leading-snug" style={{ color: color.text.primary }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="shrink-0 rounded p-1 transition-colors"
                style={{
                  border: `1px solid ${color.border.subtle}`,
                  color: color.text.muted,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {policyId && (
              <div className="mt-1 flex items-center gap-2">
                <Shield className="h-3 w-3" style={{ color: color.text.muted }} />
                <span className="font-mono text-xs" style={{ color: color.text.muted }}>{policyId}</span>
                {requiredBy && (
                  <span className="text-xs" style={{ color: color.text.muted }}>· required by {requiredBy}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4" style={{ borderTop: `1px solid ${color.border.subtle}` }}>
          <p className="text-sm leading-relaxed" style={{ color: color.text.secondary }}>{description}</p>

          <div
            className="mt-3 flex items-center gap-2 rounded px-3 py-2"
            style={{
              borderColor: color.border.default,
              background: color.bg.overlay,
              border: `1px solid ${color.border.default}`,
            }}
          >
            <RiskIcon className="h-3.5 w-3.5 shrink-0" style={{ color: risk.color }} />
            <span className="text-xs font-semibold" style={{ color: risk.color }}>
              {risk.label}
            </span>
          </div>
        </div>

        {mode === "idle" && (
          <div className="flex gap-3 px-5 py-4" style={{ borderTop: `1px solid ${color.border.subtle}` }}>
            <button
              onClick={() => setMode("reject")}
              className="flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors"
              style={{
                border: `1px solid ${color.border.default}`,
                color: color.accent.red,
                background: color.bg.overlay,
                cursor: "pointer",
              }}
            >
              Reject
            </button>
            <button
              onClick={() => setMode("approve")}
              className="flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors"
              style={{ background: accent, color: color.text.inverse, cursor: "pointer", border: "none" }}
            >
              Approve
            </button>
          </div>
        )}

        {mode === "approve" && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: `1px solid ${color.border.subtle}` }}>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: color.text.secondary }}>
              Approval note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context or conditions…"
              rows={2}
              className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none"
              style={{
                background: color.bg.overlay,
                border: `1px solid ${color.border.subtle}`,
                color: color.text.primary,
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode("idle")}
                className="flex-1 rounded-lg py-2 text-xs transition-colors"
                style={{
                  border: `1px solid ${color.border.subtle}`,
                  color: color.text.secondary,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={() => { onApprove(note || undefined); onClose(); }}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-colors"
                style={{ background: color.accent.green, color: color.text.inverse, cursor: "pointer", border: "none" }}
              >
                Confirm Approval
              </button>
            </div>
          </div>
        )}

        {mode === "reject" && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: `1px solid ${color.border.subtle}` }}>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: color.text.secondary }}>
              Rejection reason <span style={{ color: color.accent.red }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is being rejected…"
              rows={2}
              className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none"
              style={{
                background: color.bg.overlay,
                border: `1px solid ${color.border.subtle}`,
                color: color.text.primary,
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode("idle")}
                className="flex-1 rounded-lg py-2 text-xs transition-colors"
                style={{
                  border: `1px solid ${color.border.subtle}`,
                  color: color.text.secondary,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                disabled={!reason.trim()}
                onClick={() => { onReject(reason); onClose(); }}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-colors"
                style={{
                  background: reason.trim() ? color.accent.red : color.border.subtle,
                  color: color.text.primary,
                  cursor: reason.trim() ? "pointer" : "not-allowed",
                  border: "none",
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
