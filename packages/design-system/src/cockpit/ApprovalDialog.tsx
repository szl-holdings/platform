import { useEffect, useRef, useState } from "react";
import { X, Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "../utils";

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
  low:      { color: "#22c55e", label: "Low Risk",      icon: CheckCircle },
  medium:   { color: "#f59e0b", label: "Medium Risk",   icon: AlertTriangle },
  high:     { color: "#f97316", label: "High Risk",     icon: AlertTriangle },
  critical: { color: "#ef4444", label: "Critical Risk", icon: XCircle },
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
  accent = "#8b7ac8",
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
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#243040] bg-[#090e18] shadow-2xl"
        style={{ borderTopColor: risk.color, borderTopWidth: 2 }}
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${risk.color}18`, border: `1px solid ${risk.color}30` }}
          >
            <RiskIcon className="h-4.5 w-4.5" style={{ color: risk.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[14px] font-bold text-white leading-snug">{title}</h2>
              <button
                onClick={onClose}
                className="shrink-0 rounded border border-[#1a2535] p-1 text-[#4a6070] transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {policyId && (
              <div className="mt-1 flex items-center gap-2">
                <Shield className="h-3 w-3 text-[#334155]" />
                <span className="font-mono text-[10px] text-[#334155]">{policyId}</span>
                {requiredBy && <span className="text-[10px] text-[#243040]">· required by {requiredBy}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#1a2535] px-5 py-4">
          <p className="text-[13px] leading-relaxed text-[#94a3b8]">{description}</p>

          <div
            className="mt-3 flex items-center gap-2 rounded border px-3 py-2"
            style={{ borderColor: `${risk.color}30`, background: `${risk.color}08` }}
          >
            <RiskIcon className="h-3.5 w-3.5 shrink-0" style={{ color: risk.color }} />
            <span className="text-[12px] font-semibold" style={{ color: risk.color }}>
              {risk.label}
            </span>
          </div>
        </div>

        {mode === "idle" && (
          <div className="flex gap-3 border-t border-[#1a2535] px-5 py-4">
            <button
              onClick={() => setMode("reject")}
              className="flex-1 rounded-lg border border-[#ef444430] bg-[#ef44440a] py-2.5 text-[12px] font-semibold text-[#ef4444] transition-colors hover:bg-[#ef44441a]"
            >
              Reject
            </button>
            <button
              onClick={() => setMode("approve")}
              className="flex-1 rounded-lg py-2.5 text-[12px] font-semibold text-white transition-colors"
              style={{ background: accent, boxShadow: `0 2px 12px ${accent}40` }}
            >
              Approve
            </button>
          </div>
        )}

        {mode === "approve" && (
          <div className="border-t border-[#1a2535] px-5 py-4 space-y-3">
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
              Approval note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context or conditions…"
              rows={2}
              className="w-full resize-none rounded-lg border border-[#1a2535] bg-[#0d1520] px-3 py-2 text-[12px] text-white placeholder-[#334155] outline-none focus:border-[#243040]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode("idle")}
                className="flex-1 rounded-lg border border-[#1a2535] py-2 text-[12px] text-[#475569] transition-colors hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => { onApprove(note || undefined); onClose(); }}
                className="flex-1 rounded-lg py-2 text-[12px] font-semibold text-white transition-colors"
                style={{ background: "#22c55e", boxShadow: "0 2px 10px #22c55e30" }}
              >
                Confirm Approval
              </button>
            </div>
          </div>
        )}

        {mode === "reject" && (
          <div className="border-t border-[#1a2535] px-5 py-4 space-y-3">
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
              Rejection reason <span className="text-[#ef4444]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this action is being rejected…"
              rows={2}
              className="w-full resize-none rounded-lg border border-[#1a2535] bg-[#0d1520] px-3 py-2 text-[12px] text-white placeholder-[#334155] outline-none focus:border-[#243040]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setMode("idle")}
                className="flex-1 rounded-lg border border-[#1a2535] py-2 text-[12px] text-[#475569] transition-colors hover:text-white"
              >
                Back
              </button>
              <button
                disabled={!reason.trim()}
                onClick={() => { onReject(reason); onClose(); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[12px] font-semibold text-white transition-colors",
                  reason.trim() ? "bg-[#ef4444] shadow-[0_2px_10px_#ef444430]" : "bg-[#ef444440] cursor-not-allowed"
                )}
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
