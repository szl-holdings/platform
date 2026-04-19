import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock, Bot, Inbox } from "lucide-react";

interface ApprovalRecord {
  id: number;
  orgId: number | null;
  resourceType: string;
  resourceId: string;
  title: string;
  description?: string | null;
  actionClass?: string | null;
  priority?: string | null;
  status: string;
  createdAt?: string;
  expiresAt?: string | null;
  correlationId?: string | null;
  payload?: Record<string, unknown> | null;
}

interface Props {
  domain: "vessels" | "terra";
  accentColor: string;
  accentClasses: {
    text: string;
    textMuted: string;
    bg: string;
    border: string;
    button: string;
  };
}

function priorityChip(priority: string | null | undefined) {
  const p = (priority ?? "medium").toLowerCase();
  const map: Record<string, { fg: string; bg: string; border: string }> = {
    critical: { fg: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)" },
    high:     { fg: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" },
    medium:   { fg: "#0ea5e9", bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.35)" },
    low:      { fg: "#a1a1aa", bg: "rgba(161,161,170,0.12)", border: "rgba(161,161,170,0.35)" },
  };
  const c = map[p] ?? map["medium"]!;
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border"
      style={{ color: c.fg, background: c.bg, borderColor: c.border }}
    >
      {p}
    </span>
  );
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function PendingAutonomyApprovalsPanel({ domain, accentColor, accentClasses }: Props) {
  const [items, setItems] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [resultBanner, setResultBanner] = useState<{ id: number; kind: "approved" | "rejected"; ts: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/approvals?status=pending&limit=100`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data?: ApprovalRecord[] } | ApprovalRecord[];
      const all = Array.isArray(json) ? json : (json.data ?? []);
      const scoped = all.filter((a) => {
        if (a.resourceType !== "alloy_recommendation") return false;
        const payload = (a.payload ?? {}) as { domain?: string };
        return (payload.domain ?? "").toLowerCase() === domain;
      });
      setItems(scoped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => { void load(); }, [load]);

  async function review(id: number, decision: "approved" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/approvals/${id}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: notes[id] ?? undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setResultBanner({ id, kind: decision, ts: Date.now() });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${decision} approval`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 gap-3 ${accentClasses.textMuted}`}>
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-xs">Loading queued approvals…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 gap-3 ${accentClasses.textMuted}`}>
        <AlertCircle className="w-6 h-6" />
        <span className="text-xs">Failed to load queued approvals</span>
        <button
          onClick={() => void load()}
          className={`text-xs ${accentClasses.textMuted} hover:${accentClasses.text} border ${accentClasses.border} rounded px-3 py-1 transition-colors`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className={`text-xs ${accentClasses.textMuted}`}>
          Pending autonomy decisions queued by /alloy/recommend (ask-to-act / draft) for the {domain} domain — approve or reject in place. Same audit trail as the operator inbox.
        </p>
        <button
          data-testid="refresh-pending-approvals"
          onClick={() => void load()}
          className={`text-[11px] ${accentClasses.textMuted} hover:${accentClasses.text} border ${accentClasses.border} rounded px-2 py-1 transition-colors`}
        >
          Refresh
        </button>
      </div>

      {resultBanner && Date.now() - resultBanner.ts < 8000 && (
        <div
          className="text-xs px-3 py-2 rounded border flex items-center gap-2"
          style={{
            color: resultBanner.kind === "approved" ? "#22c55e" : "#ef4444",
            background: resultBanner.kind === "approved" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            borderColor: resultBanner.kind === "approved" ? "rgba(34,197,94,0.30)" : "rgba(239,68,68,0.30)",
          }}
        >
          {resultBanner.kind === "approved" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          Approval #{resultBanner.id} {resultBanner.kind}. Decision logged to audit trail.
        </div>
      )}

      {items.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-12 gap-2 ${accentClasses.textMuted}`}>
          <Inbox className="w-6 h-6" />
          <span className="text-xs">No queued autonomy items waiting for review.</span>
        </div>
      ) : (
        items.map((approval) => {
          const payload = (approval.payload ?? {}) as Record<string, unknown>;
          const recommendationId = String(payload["recommendationId"] ?? approval.resourceId);
          const summary = String(payload["summary"] ?? approval.description ?? "");
          const suggestedAction = (payload["suggestedAction"] ?? null) as Record<string, unknown> | null;
          const autonomyMode = String(payload["autonomyMode"] ?? "");
          const policyState = String(payload["policyState"] ?? "");
          const policyReason = String(payload["policyReason"] ?? "");
          const confidence = typeof payload["confidence"] === "number" ? (payload["confidence"] as number) : null;
          const isBusy = busyId === approval.id;

          return (
            <div
              key={approval.id}
              data-testid={`pending-approval-${approval.id}`}
              className={`bg-slate-900/80 border ${accentClasses.border} rounded-xl p-4 space-y-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className={`text-sm font-semibold ${accentClasses.text}`}>{approval.title}</div>
                  <div className={`text-[11px] ${accentClasses.textMuted} flex items-center gap-2 flex-wrap`}>
                    <Bot className="w-3 h-3" /> rec {recommendationId.substring(0, 12)}
                    <Clock className="w-3 h-3" /> {timeAgo(approval.createdAt)}
                    {autonomyMode && <span className="opacity-70">mode {autonomyMode}</span>}
                    {policyState && <span className="opacity-70">policy {policyState}</span>}
                    {confidence !== null && <span className="opacity-70">conf {(confidence * 100).toFixed(0)}%</span>}
                  </div>
                </div>
                {priorityChip(approval.priority)}
              </div>

              {summary && <p className="text-xs text-slate-300/85 leading-relaxed">{summary}</p>}

              {policyReason && (
                <div className="text-[11px] text-amber-200/80 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5">
                  <span className="font-semibold">Policy:</span> {policyReason}
                </div>
              )}

              {suggestedAction && (
                <details className="text-[11px]">
                  <summary className={`cursor-pointer ${accentClasses.textMuted} hover:${accentClasses.text}`}>
                    View suggested action payload
                  </summary>
                  <pre className="mt-2 p-2 rounded bg-black/30 text-slate-300/80 overflow-x-auto text-[10px]">
                    {JSON.stringify(suggestedAction, null, 2)}
                  </pre>
                </details>
              )}

              <textarea
                value={notes[approval.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [approval.id]: e.target.value }))}
                placeholder="Optional reviewer note (recorded on the audit trail)…"
                className={`w-full text-xs bg-black/30 border ${accentClasses.border} rounded px-2 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1`}
                style={{ ['--tw-ring-color' as string]: accentColor }}
                rows={2}
                data-testid={`approval-note-${approval.id}`}
              />

              <div className="flex items-center gap-2">
                <button
                  data-testid={`approve-approval-${approval.id}`}
                  disabled={isBusy}
                  onClick={() => void review(approval.id, "approved")}
                  className="text-xs font-medium px-3 py-1.5 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: "#22c55e",
                    background: "rgba(34,197,94,0.10)",
                    borderColor: "rgba(34,197,94,0.35)",
                  }}
                >
                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  Approve
                </button>
                <button
                  data-testid={`reject-approval-${approval.id}`}
                  disabled={isBusy}
                  onClick={() => void review(approval.id, "rejected")}
                  className="text-xs font-medium px-3 py-1.5 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.10)",
                    borderColor: "rgba(239,68,68,0.35)",
                  }}
                >
                  <XCircle className="w-3 h-3 inline mr-1" />
                  Reject
                </button>
                <span className="text-[10px] text-slate-500 ml-auto">approval #{approval.id}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default PendingAutonomyApprovalsPanel;
