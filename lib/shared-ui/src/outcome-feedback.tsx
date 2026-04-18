import * as React from "react";
import { useState, useCallback } from "react";

const BG = { surface: "#0c1018", elevated: "#10141e", card: "#111620" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" };
const ACCENT = { green: "#6b8f71", amber: "#c8953c", red: "#c45a4a", blue: "#4a90b8", purple: "#8b7ac8" };

export type OutcomeDecision = "accepted" | "rejected" | "overridden" | "deferred";

export interface OutcomeFeedbackProps {
  outcomeId: number;
  recommendationText: string;
  recommendationAction?: string;
  confidence?: number;
  agentId?: string;
  domain?: string;
  onDecision?: (decision: OutcomeDecision, reason?: string) => void | Promise<void>;
  className?: string;
  compact?: boolean;
}

export interface OutcomeFeedbackBarProps {
  outcomeId: number;
  onDecision?: (decision: OutcomeDecision, reason?: string) => void | Promise<void>;
  className?: string;
}

function ConfidencePip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? ACCENT.green : pct >= 55 ? ACCENT.amber : ACCENT.red;
  return (
    <span style={{ color, fontSize: 11, fontFamily: "monospace" }}>{pct}% conf</span>
  );
}

export function OutcomeFeedbackBar({ outcomeId, onDecision, className }: OutcomeFeedbackBarProps) {
  const [submitted, setSubmitted] = useState<OutcomeDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");

  const handleDecision = useCallback(async (decision: OutcomeDecision, r?: string) => {
    if (loading || submitted) return;
    setLoading(true);
    try {
      await onDecision?.(decision, r);
      setSubmitted(decision);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [loading, submitted, onDecision]);

  if (submitted) {
    const labels: Record<OutcomeDecision, string> = {
      accepted: "Accepted",
      rejected: "Rejected",
      overridden: "Overridden",
      deferred: "Deferred",
    };
    const colors: Record<OutcomeDecision, string> = {
      accepted: ACCENT.green,
      rejected: ACCENT.red,
      overridden: ACCENT.amber,
      deferred: TEXT.secondary,
    };
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: BG.elevated, borderRadius: 6, border: `1px solid ${BORDER.subtle}` }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors[submitted], display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: TEXT.secondary }}>{labels[submitted]}</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => handleDecision("accepted")}
          disabled={loading}
          title="Accept this recommendation"
          style={{
            padding: "3px 10px", borderRadius: 5, border: `1px solid ${ACCENT.green}40`,
            background: `${ACCENT.green}10`, color: ACCENT.green, fontSize: 11, cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >Accept</button>
        <button
          onClick={() => handleDecision("rejected")}
          disabled={loading}
          title="Reject this recommendation"
          style={{
            padding: "3px 10px", borderRadius: 5, border: `1px solid ${ACCENT.red}40`,
            background: `${ACCENT.red}10`, color: ACCENT.red, fontSize: 11, cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >Reject</button>
        <button
          onClick={() => setShowOverride(v => !v)}
          disabled={loading}
          title="Override with a different action"
          style={{
            padding: "3px 10px", borderRadius: 5, border: `1px solid ${ACCENT.amber}40`,
            background: `${ACCENT.amber}10`, color: ACCENT.amber, fontSize: 11, cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >Override</button>
        <button
          onClick={() => handleDecision("deferred")}
          disabled={loading}
          title="Defer this recommendation"
          style={{
            padding: "3px 10px", borderRadius: 5, border: `1px solid ${BORDER.muted}`,
            background: BG.elevated, color: TEXT.secondary, fontSize: 11, cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >Defer</button>
      </div>
      {showOverride && (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why are you overriding? (optional)"
            style={{
              flex: 1, padding: "4px 8px", borderRadius: 5, border: `1px solid ${BORDER.muted}`,
              background: BG.surface, color: TEXT.primary, fontSize: 11, outline: "none",
            }}
            onKeyDown={e => { if (e.key === "Enter") { handleDecision("overridden", reason); setShowOverride(false); } }}
          />
          <button
            onClick={() => { handleDecision("overridden", reason); setShowOverride(false); }}
            style={{
              padding: "4px 10px", borderRadius: 5, border: `1px solid ${ACCENT.amber}40`,
              background: `${ACCENT.amber}18`, color: ACCENT.amber, fontSize: 11, cursor: "pointer",
            }}
          >Confirm</button>
        </div>
      )}
    </div>
  );
}

export function OutcomeFeedbackCard({ outcomeId, recommendationText, recommendationAction, confidence, agentId, domain, onDecision, className, compact = false }: OutcomeFeedbackProps) {
  const [submitted, setSubmitted] = useState<OutcomeDecision | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDecision = useCallback(async (decision: OutcomeDecision, reason?: string) => {
    if (loading || submitted) return;
    setLoading(true);
    try {
      await onDecision?.(decision, reason);
      setSubmitted(decision);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [loading, submitted, onDecision]);

  return (
    <div
      className={className}
      style={{
        background: BG.card,
        border: `1px solid ${BORDER.muted}`,
        borderRadius: 10,
        padding: compact ? "10px 14px" : "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          {!compact && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {agentId && (
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: ACCENT.purple, fontFamily: "monospace" }}>
                  {agentId}
                </span>
              )}
              {domain && (
                <span style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>{domain}</span>
              )}
            </div>
          )}
          <p style={{ fontSize: compact ? 12 : 13, color: TEXT.primary, lineHeight: 1.5, margin: 0 }}>
            {recommendationText}
          </p>
          {recommendationAction && !compact && (
            <p style={{ fontSize: 11, color: TEXT.secondary, marginTop: 4 }}>
              Action: <span style={{ color: ACCENT.blue }}>{recommendationAction}</span>
            </p>
          )}
        </div>
        {confidence !== undefined && !compact && <ConfidencePip value={confidence} />}
      </div>

      <OutcomeFeedbackBar
        outcomeId={outcomeId}
        onDecision={handleDecision}
      />
    </div>
  );
}

export interface InlineFeedbackBarProps {
  recommendationKey: string;
  domain?: string;
  recommendationText: string;
  apiBaseUrl?: string;
  className?: string;
}

const LS_PREFIX = "inline_feedback_";

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1] ?? "") : "";
}

async function ensureCsrfToken(apiBaseUrl: string): Promise<string> {
  const existing = getCsrfToken();
  if (existing) return existing;
  try {
    await fetch(`${apiBaseUrl}/csrf-token`, { credentials: "include" });
  } catch {
    return "";
  }
  return getCsrfToken();
}

function loadFeedbackState(key: string): { vote: "up" | "down"; comment?: string } | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFeedbackState(key: string, vote: "up" | "down", comment?: string) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ vote, comment }));
  } catch {
  }
}

export function InlineFeedbackBar({
  recommendationKey,
  domain = "general",
  recommendationText,
  apiBaseUrl = "/api",
  className,
}: InlineFeedbackBarProps) {
  const [submitted, setSubmitted] = React.useState<"up" | "down" | null>(() => loadFeedbackState(recommendationKey)?.vote ?? null);
  const [submittedComment, setSubmittedComment] = React.useState<string | undefined>(() => loadFeedbackState(recommendationKey)?.comment);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [showComment, setShowComment] = React.useState(false);
  const [pendingVote, setPendingVote] = React.useState<"up" | "down" | null>(null);
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    const state = loadFeedbackState(recommendationKey);
    setSubmitted(state?.vote ?? null);
    setSubmittedComment(state?.comment);
    setLoading(false);
    setError(false);
    setShowComment(false);
    setPendingVote(null);
    setComment("");
  }, [recommendationKey]);

  const handleVoteClick = (vote: "up" | "down") => {
    if (submitted || loading) return;
    setError(false);
    setPendingVote(vote);
    setShowComment(true);
  };

  const handleSubmit = React.useCallback(async (vote: "up" | "down", c?: string) => {
    if (loading || submitted) return;
    setLoading(true);
    setError(false);
    try {
      const csrfToken = await ensureCsrfToken(apiBaseUrl);
      const res = await fetch(`${apiBaseUrl}/outcome-graph/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          recommendationKey,
          domain,
          recommendationText,
          vote,
          comment: c || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      saveFeedbackState(recommendationKey, vote, c);
      setSubmitted(vote);
      setSubmittedComment(c || undefined);
      setShowComment(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, submitted, apiBaseUrl, recommendationKey, domain, recommendationText]);

  if (submitted) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <span style={{ fontSize: 11, color: TEXT.tertiary }}>Your feedback:</span>
        <span style={{
          fontSize: 13,
          color: submitted === "up" ? ACCENT.green : ACCENT.red,
          lineHeight: 1,
        }}>
          {submitted === "up" ? "👍" : "👎"}
        </span>
        {submittedComment && (
          <span style={{ fontSize: 11, color: TEXT.secondary, fontStyle: "italic" }}>"{submittedComment}"</span>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: TEXT.tertiary }}>Was this recommendation helpful?</span>
        <button
          onClick={() => handleVoteClick("up")}
          disabled={loading}
          title="Thumbs up — helpful"
          style={{
            padding: "2px 8px", borderRadius: 5,
            border: `1px solid ${ACCENT.green}40`,
            background: pendingVote === "up" ? `${ACCENT.green}20` : `${ACCENT.green}08`,
            color: ACCENT.green, fontSize: 14, cursor: "pointer",
            opacity: loading ? 0.5 : 1, lineHeight: 1.6,
          }}
        >👍</button>
        <button
          onClick={() => handleVoteClick("down")}
          disabled={loading}
          title="Thumbs down — not helpful"
          style={{
            padding: "2px 8px", borderRadius: 5,
            border: `1px solid ${ACCENT.red}40`,
            background: pendingVote === "down" ? `${ACCENT.red}20` : `${ACCENT.red}08`,
            color: ACCENT.red, fontSize: 14, cursor: "pointer",
            opacity: loading ? 0.5 : 1, lineHeight: 1.6,
          }}
        >👎</button>
        {error && (
          <span style={{ fontSize: 11, color: ACCENT.red }}>Failed to submit — please try again.</span>
        )}
      </div>
      {showComment && pendingVote && (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            autoFocus
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            style={{
              flex: 1, padding: "4px 8px", borderRadius: 5,
              border: `1px solid ${BORDER.muted}`,
              background: BG.surface, color: TEXT.primary, fontSize: 11, outline: "none",
            }}
            onKeyDown={e => {
              if (e.key === "Enter") handleSubmit(pendingVote, comment);
              if (e.key === "Escape") { setShowComment(false); setPendingVote(null); }
            }}
          />
          <button
            onClick={() => handleSubmit(pendingVote, comment)}
            disabled={loading}
            style={{
              padding: "4px 10px", borderRadius: 5,
              border: `1px solid ${pendingVote === "up" ? ACCENT.green : ACCENT.red}40`,
              background: `${pendingVote === "up" ? ACCENT.green : ACCENT.red}18`,
              color: pendingVote === "up" ? ACCENT.green : ACCENT.red,
              fontSize: 11, cursor: "pointer",
            }}
          >Submit</button>
          <button
            onClick={() => handleSubmit(pendingVote)}
            disabled={loading}
            style={{
              padding: "4px 8px", borderRadius: 5,
              border: `1px solid ${BORDER.muted}`,
              background: BG.elevated, color: TEXT.tertiary, fontSize: 11, cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >Skip comment</button>
        </div>
      )}
    </div>
  );
}

export interface OutcomeDashboardProps {
  orgId?: number;
  domain?: string;
  apiBaseUrl?: string;
}

interface OutcomeRow {
  id: number;
  domain: string;
  entityType: string;
  recommendationText: string;
  recommendationAction?: string;
  confidence: number;
  agentId?: string;
  status: string;
  userDecision?: string;
  outcomeResult?: string;
  createdAt: string;
}

export function OutcomeDashboard({ apiBaseUrl = "/api-server" }: OutcomeDashboardProps) {
  const [outcomes, setOutcomes] = React.useState<OutcomeRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<Array<{ domain: string; total: string; avgConfidence: string }>>([]);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${apiBaseUrl}/outcome-graph/recommendations?limit=20`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${apiBaseUrl}/outcome-graph/stats`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([recs, statsData]) => {
      setOutcomes(recs.data ?? []);
      setStats(statsData.data ?? []);
    }).finally(() => setLoading(false));
  }, [apiBaseUrl]);

  const statusColors: Record<string, string> = {
    pending: ACCENT.amber,
    accepted: ACCENT.green,
    rejected: ACCENT.red,
    overridden: ACCENT.amber,
    executed: ACCENT.blue,
    deferred: TEXT.tertiary,
    expired: TEXT.tertiary,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {stats.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {stats.map(s => (
            <div key={s.domain} style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: 1 }}>{s.domain}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: TEXT.primary, marginTop: 2 }}>{s.total}</div>
              <div style={{ fontSize: 11, color: TEXT.secondary }}>
                {Math.round(Number(s.avgConfidence) * 100)}% avg confidence
              </div>
            </div>
          ))}
        </div>
      )}
      {loading ? (
        <div style={{ color: TEXT.secondary, fontSize: 13, textAlign: "center", padding: 40 }}>Loading outcomes…</div>
      ) : outcomes.length === 0 ? (
        <div style={{ color: TEXT.secondary, fontSize: 13, textAlign: "center", padding: 40 }}>No outcome records yet. They will appear here as recommendations are made and acted on.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {outcomes.map(o => (
            <div key={o.id} style={{ background: BG.card, border: `1px solid ${BORDER.muted}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColors[o.status] ?? TEXT.tertiary, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: ACCENT.purple, fontFamily: "monospace" }}>{o.agentId ?? "—"}</span>
                  <span style={{ fontSize: 10, color: TEXT.tertiary }}>{o.domain}</span>
                  <span style={{ fontSize: 10, color: TEXT.tertiary }}>{o.entityType}</span>
                </div>
                <p style={{ fontSize: 12, color: TEXT.primary, margin: 0, lineHeight: 1.4 }}>{o.recommendationText}</p>
                {o.recommendationAction && (
                  <p style={{ fontSize: 11, color: TEXT.secondary, margin: "2px 0 0" }}>→ {o.recommendationAction}</p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: statusColors[o.status] ?? TEXT.tertiary, background: `${statusColors[o.status] ?? TEXT.tertiary}15`, padding: "2px 6px", borderRadius: 4 }}>
                  {o.userDecision ?? o.status}
                </span>
                {o.outcomeResult && (
                  <span style={{ fontSize: 10, color: TEXT.secondary }}>{o.outcomeResult}</span>
                )}
                <span style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: "monospace" }}>
                  {Math.round(o.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
