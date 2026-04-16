import React, { useState } from "react";

export type PolicyEffect = "allow" | "deny" | "escalate" | "pending";

export interface PolicyDecisionRecord {
  requestId?: string;
  effect: PolicyEffect;
  allowed: boolean;
  matchedPolicies?: string[];
  deniedBy?: string | null;
  reason?: string;
  evaluatedAt?: number | string;
  durationMs?: number;
  policyName?: string;
  policyDescription?: string;
  subject?: {
    userId?: string | null;
    roles?: string[];
  };
  resource?: {
    type?: string;
    domain?: string | null;
    actionClass?: string | null;
  };
  action?: string;
  escalationPath?: string[];
  approvalHistory?: Array<{
    approver: string;
    decision: "approved" | "denied" | "pending";
    at?: string;
    note?: string;
  }>;
  whatNeedsToChange?: string[];
  approvedAt?: string | null;
  approvedBy?: string | null;
  deniedAt?: string | null;
  deniedReason?: string | null;
  expiresAt?: string | null;
}

export interface PolicyResultProps {
  decision: PolicyDecisionRecord;
  variant?: "card" | "inline" | "banner";
  accentColor?: string;
  className?: string;
  onEscalate?: () => void | Promise<void>;
  onAppeal?: (reason: string) => void | Promise<void>;
  showDetails?: boolean;
}

const EFFECT_CONFIG: Record<PolicyEffect, { label: string; color: string; icon: string; bgColor: string; borderColor: string }> = {
  allow: { label: "Permitted", color: "#6b8f71", icon: "✓", bgColor: "rgba(107,143,113,0.08)", borderColor: "rgba(107,143,113,0.25)" },
  deny: { label: "Denied", color: "#ef4444", icon: "✕", bgColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" },
  escalate: { label: "Escalated", color: "#c8953c", icon: "↑", bgColor: "rgba(200,149,60,0.08)", borderColor: "rgba(200,149,60,0.25)" },
  pending: { label: "Pending Approval", color: "#4a90b8", icon: "⏳", bgColor: "rgba(74,144,184,0.08)", borderColor: "rgba(74,144,184,0.25)" },
};

const APPROVAL_CONFIG: Record<string, { color: string; icon: string }> = {
  approved: { color: "#6b8f71", icon: "✓" },
  denied: { color: "#ef4444", icon: "✕" },
  pending: { color: "#c8953c", icon: "⏳" },
};

const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
};
const BORDER = { subtle: "rgba(255,255,255,0.06)", muted: "rgba(255,255,255,0.08)" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>
      {children}
    </div>
  );
}

function timeAgo(d: string | number | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function PolicyResultBanner({ decision, accentColor }: { decision: PolicyDecisionRecord; accentColor?: string }) {
  const cfg = EFFECT_CONFIG[decision.effect] ?? EFFECT_CONFIG.deny;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
      background: cfg.bgColor, border: `1px solid ${cfg.borderColor}`,
      borderRadius: 7, fontSize: 12,
    }}>
      <span style={{ fontWeight: 700, color: cfg.color, fontSize: 15 }}>{cfg.icon}</span>
      <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
      {decision.reason && <span style={{ color: TEXT.secondary, marginLeft: 4 }}>— {decision.reason}</span>}
    </div>
  );
}

function PolicyResultCard({ decision, accentColor = "#8b5cf6", onEscalate, onAppeal, showDetails = true }: PolicyResultProps) {
  const cfg = EFFECT_CONFIG[decision.effect] ?? EFFECT_CONFIG.deny;
  const [appealText, setAppealText] = useState("");
  const [showAppeal, setShowAppeal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(showDetails);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: `1px solid ${cfg.borderColor}`,
      borderRadius: 10, overflow: "hidden", fontSize: 12,
    }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", background: cfg.bgColor, borderBottom: `1px solid ${cfg.borderColor}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: cfg.color, fontSize: 13 }}>
            {cfg.label}
            {decision.policyName && <span style={{ fontWeight: 400, color: TEXT.secondary }}> — {decision.policyName}</span>}
          </div>
          {decision.reason && (
            <div style={{ fontSize: 11, color: TEXT.secondary, marginTop: 1 }}>{decision.reason}</div>
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", color: TEXT.tertiary, cursor: "pointer", fontSize: 11 }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Request context */}
          {(decision.subject || decision.resource || decision.action) && (
            <div>
              <SectionLabel>Request Context</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {decision.subject?.roles && decision.subject.roles.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: TEXT.secondary }}>Roles</span>
                    <span style={{ color: TEXT.primary, fontFamily: "monospace", fontSize: 11 }}>{decision.subject.roles.join(", ")}</span>
                  </div>
                )}
                {decision.resource?.type && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: TEXT.secondary }}>Resource</span>
                    <span style={{ color: TEXT.primary }}>{decision.resource.type}{decision.resource.domain ? ` (${decision.resource.domain})` : ""}</span>
                  </div>
                )}
                {decision.action && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: TEXT.secondary }}>Action</span>
                    <span style={{ color: TEXT.primary, fontFamily: "monospace", fontSize: 11 }}>{decision.action}</span>
                  </div>
                )}
                {decision.matchedPolicies && decision.matchedPolicies.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: TEXT.secondary, flexShrink: 0 }}>Matched Policies</span>
                    <span style={{ color: TEXT.tertiary, fontSize: 10, fontFamily: "monospace", textAlign: "right" }}>{decision.matchedPolicies.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Escalation Path */}
          {decision.escalationPath && decision.escalationPath.length > 0 && (
            <div>
              <SectionLabel>Escalation Path</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {decision.escalationPath.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", background: i === 0 ? accentColor : "rgba(255,255,255,0.08)",
                      color: i === 0 ? "#fff" : TEXT.secondary, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ color: TEXT.primary }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval History */}
          {decision.approvalHistory && decision.approvalHistory.length > 0 && (
            <div>
              <SectionLabel>Approval History</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {decision.approvalHistory.map((h, i) => {
                  const hcfg = APPROVAL_CONFIG[h.decision] ?? APPROVAL_CONFIG.pending;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 5 }}>
                      <span style={{ color: hcfg.color, fontWeight: 700, flexShrink: 0 }}>{hcfg.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: TEXT.primary, fontWeight: 600 }}>{h.approver}</span>
                          <span style={{ color: TEXT.tertiary, fontSize: 10 }}>{timeAgo(h.at)}</span>
                        </div>
                        {h.note && <div style={{ fontSize: 10, color: TEXT.secondary, marginTop: 2, fontStyle: "italic" }}>{h.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What Needs to Change */}
          {decision.whatNeedsToChange && decision.whatNeedsToChange.length > 0 && (
            <div style={{ padding: "8px 10px", background: "rgba(200,149,60,0.07)", border: "1px solid rgba(200,149,60,0.18)", borderRadius: 7 }}>
              <SectionLabel>What Would Need to Change for This to Pass</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {decision.whatNeedsToChange.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#c8953c", display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0 }}>→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Denied by */}
          {decision.deniedBy && (
            <div style={{ fontSize: 11, color: TEXT.tertiary }}>
              Denied by rule: <span style={{ fontFamily: "monospace", color: "#ef8a8a" }}>{decision.deniedBy}</span>
            </div>
          )}

          {/* Evaluation metadata */}
          {decision.evaluatedAt && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT.tertiary }}>
              <span>Evaluated {timeAgo(decision.evaluatedAt)}</span>
              {decision.durationMs !== undefined && <span>{decision.durationMs}ms</span>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, paddingTop: 4, borderTop: `1px solid ${BORDER.subtle}` }}>
            {decision.effect === "escalate" && onEscalate && (
              <button
                onClick={onEscalate}
                style={{ flex: 1, padding: "6px 0", background: "#c8953c20", border: "1px solid #c8953c40", borderRadius: 5, color: "#c8953c", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
              >
                ↑ Escalate Now
              </button>
            )}
            {decision.effect === "deny" && onAppeal && (
              <button
                onClick={() => setShowAppeal(s => !s)}
                style={{ flex: 1, padding: "6px 0", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, borderRadius: 5, color: TEXT.secondary, fontSize: 11, cursor: "pointer" }}
              >
                Appeal Decision
              </button>
            )}
          </div>

          {showAppeal && onAppeal && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea
                value={appealText}
                onChange={e => setAppealText(e.target.value)}
                placeholder="Provide justification for appeal..."
                style={{ padding: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.muted}`, borderRadius: 6, color: TEXT.primary, fontSize: 11, resize: "vertical", minHeight: 60, outline: "none" }}
              />
              <button
                disabled={loading || !appealText.trim()}
                onClick={async () => {
                  setLoading(true);
                  await onAppeal(appealText);
                  setLoading(false);
                  setShowAppeal(false);
                  setAppealText("");
                }}
                style={{ padding: "6px 12px", background: accentColor, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600, opacity: !appealText.trim() ? 0.5 : 1 }}
              >
                {loading ? "Submitting…" : "Submit Appeal"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PolicyResult({ decision, variant = "card", accentColor = "#8b5cf6", className, onEscalate, onAppeal, showDetails }: PolicyResultProps) {
  if (variant === "banner") {
    return (
      <div className={className}>
        <PolicyResultBanner decision={decision} accentColor={accentColor} />
      </div>
    );
  }

  return (
    <div className={className}>
      <PolicyResultCard
        decision={decision}
        accentColor={accentColor}
        onEscalate={onEscalate}
        onAppeal={onAppeal}
        showDetails={showDetails}
        variant={variant}
      />
    </div>
  );
}

export function PolicyTimelineEntry({
  label,
  actor,
  actorType,
  at,
  outcome,
  effect,
  notes,
}: {
  label: string;
  actor: string;
  actorType: "human" | "ai" | "system";
  at?: string | number;
  outcome?: string;
  effect?: PolicyEffect;
  notes?: string;
}) {
  const actorIcon = actorType === "human" ? "👤" : actorType === "ai" ? "🤖" : "⚙️";
  const effectCfg = effect ? EFFECT_CONFIG[effect] : null;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: effectCfg ? effectCfg.bgColor : "rgba(255,255,255,0.04)", border: `1px solid ${effectCfg ? effectCfg.borderColor : BORDER.subtle}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
          {actorIcon}
        </div>
        <div style={{ width: 1, flex: 1, background: BORDER.subtle, minHeight: 16, marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.88)", fontSize: 12 }}>{label}</span>
          {effectCfg && <span style={{ fontSize: 10, color: effectCfg.color, fontWeight: 600 }}>{effectCfg.icon} {effectCfg.label}</span>}
          {at && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginLeft: "auto" }}>{timeAgo(at)}</span>}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>by {actor}</div>
        {outcome && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>→ {outcome}</div>}
        {notes && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3, fontStyle: "italic" }}>{notes}</div>}
      </div>
    </div>
  );
}
