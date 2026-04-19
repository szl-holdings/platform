import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, Shield, Activity, RotateCcw, RefreshCw, ChevronRight, Plus, Pencil, Trash2, X, History } from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

type RemediationStatus = "executing" | "pending_approval" | "completed" | "failed" | "queued";
type PatternType = "restart" | "scale" | "failover" | "clear_queue" | "rollback";

interface RemediationStep {
  id: string;
  action: string;
  status: "done" | "running" | "pending" | "failed";
  durationMs?: number;
}

interface RemediationRun {
  id: string;
  patternId: string;
  patternName: string;
  patternType: PatternType;
  triggerSignal: string;
  service: string;
  detectedAt: number;
  startedAt?: number;
  completedAt?: number;
  status: RemediationStatus;
  steps: RemediationStep[];
  mttrSavedMins: number;
  approver?: string;
  auditRef: string;
}

interface FailurePattern {
  id: string;
  name: string;
  type: PatternType;
  matchCount: number;
  successRate: number;
  avgMttrSavedMins: number;
  enabled: boolean;
  trigger: string;
  runbook: string;
  lastEditedAt?: number;
  lastEditedBy?: string;
  lastEditedAction?: string;
}

interface PatternHistoryEntry {
  id: number;
  action: string;
  at: number;
  actor: string;
  actorEmail?: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

interface StatsResponse {
  totalRuns: number;
  executing: number;
  pendingApproval: number;
  completed: number;
  totalMttrSavedMins: number;
  successRate: number;
  patternsActive: number;
  patternsTotal: number;
}

const TYPE_COLOR: Record<PatternType, string> = {
  restart: "#3b82f6",
  scale: "#10b981",
  failover: "#f97316",
  clear_queue: "#8b5cf6",
  rollback: "#ef4444",
};

const STATUS_COLOR: Record<RemediationStatus, string> = {
  executing: "#f59e0b",
  pending_approval: "#8b5cf6",
  completed: "#10b981",
  failed: "#ef4444",
  queued: "#6b7280",
};

function fmtAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function StepRow({ step }: { step: RemediationStep }) {
  const colors = { done: "#10b981", running: "#f59e0b", pending: DS.text.muted, failed: "#ef4444" };
  const icons = { done: "✓", running: "⟳", pending: "○", failed: "✗" };
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-4 text-center font-mono font-bold shrink-0" style={{ color: colors[step.status] }}>{icons[step.status]}</span>
      <span style={{ color: step.status === "pending" ? DS.text.muted : DS.text.secondary }}>{step.action}</span>
      {step.durationMs && <span className="ml-auto font-mono text-[9px]" style={{ color: DS.text.muted }}>{(step.durationMs / 1000).toFixed(1)}s</span>}
      {step.status === "running" && <span className="ml-auto text-[8px] animate-pulse" style={{ color: "#f59e0b" }}>RUNNING</span>}
    </div>
  );
}

function RunCard({ run }: { run: RemediationRun }) {
  const [expanded, setExpanded] = useState(run.status === "executing" || run.status === "pending_approval");
  const tc = TYPE_COLOR[run.patternType];
  const sc = STATUS_COLOR[run.status];
  const doneSteps = run.steps.filter(s => s.status === "done").length;
  const progress = Math.round((doneSteps / run.steps.length) * 100);

  return (
    <div className="rounded-xl border" style={{ borderColor: `${tc}20`, background: `${tc}03` }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${tc}15`, color: tc }}>{run.patternType}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: DS.surface, color: DS.text.muted }}>#{run.id}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${sc}12`, color: sc }}>{run.status.replace("_", " ")}</span>
            </div>
            <div className="text-[12px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>{run.patternName}</div>
            <div className="text-[10px] mb-1" style={{ color: DS.text.muted }}>{run.triggerSignal}</div>
            <div className="flex items-center gap-3 text-[9px]" style={{ color: DS.text.muted }}>
              <span className="font-mono">{run.service}</span>
              <span>·</span>
              <span>Detected {fmtAgo(run.detectedAt)}</span>
              <span>·</span>
              <span>MTTR saved: <span style={{ color: "#10b981" }}>~{run.mttrSavedMins}m</span></span>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ color: DS.text.muted, transform: expanded ? "rotate(90deg)" : "none" }} />
          </button>
        </div>

        {run.status === "executing" && (
          <div className="mt-3">
            <div className="flex justify-between text-[9px] mb-1" style={{ color: DS.text.muted }}>
              <span>Execution progress</span>
              <span className="font-mono">{doneSteps}/{run.steps.length} steps</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full animate-pulse" style={{ width: `${progress}%`, background: tc }} />
            </div>
          </div>
        )}

        {run.status === "pending_approval" && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <Shield className="w-3 h-3 shrink-0" style={{ color: "#8b5cf6" }} />
            <span className="text-[10px]" style={{ color: "#8b5cf6" }}>Awaiting approval from <strong>{run.approver}</strong> — Alloy governance gate active</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-1.5" style={{ borderColor: DS.border }}>
          <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: DS.text.muted }}>Execution Audit Trail</div>
          {run.steps.map(step => <StepRow key={step.id} step={step} />)}
          <div className="pt-2 flex items-center justify-between text-[8px] font-mono" style={{ color: DS.text.muted, borderTop: `1px solid ${DS.border}` }}>
            <span>Audit ref: {run.auditRef}</span>
            <span>Alloy Governance · Immutable log</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PatternRow({ p, onToggle, onEdit, onDelete, onHistory }: { p: FailurePattern; onToggle: (id: string) => void; onEdit: (p: FailurePattern) => void; onDelete: (p: FailurePattern) => void; onHistory: (p: FailurePattern) => void }) {
  const tc = TYPE_COLOR[p.type];
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
      <button
        onClick={() => onToggle(p.id)}
        className="w-2 h-2 rounded-full shrink-0 transition-all hover:scale-125"
        style={{ background: p.enabled ? tc : DS.text.muted }}
        title={p.enabled ? "Click to disable" : "Click to enable"}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-medium truncate" style={{ color: DS.text.primary }}>{p.name}</div>
          <span className="text-[8px] px-1 py-0.5 rounded uppercase font-mono shrink-0" style={{ background: `${tc}15`, color: tc }}>{p.type}</span>
        </div>
        <div className="text-[9px] mt-0.5 truncate" style={{ color: DS.text.muted }}>{p.trigger}</div>
        {p.lastEditedAt && (
          <div className="text-[9px] mt-0.5 truncate" style={{ color: DS.text.muted }}>
            <span style={{ color: DS.text.secondary }}>{p.lastEditedAction === "create" ? "Created" : p.lastEditedAction === "delete" ? "Deleted" : "Edited"}</span> by{" "}
            <span style={{ color: DS.text.secondary }}>{p.lastEditedBy ?? "system"}</span> · {fmtAgo(p.lastEditedAt)}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] font-mono" style={{ color: "#10b981" }}>{p.successRate}%</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>{p.matchCount} runs</div>
      </div>
      <div className="text-right shrink-0 hidden md:block">
        <div className="text-[10px] font-mono" style={{ color: GOLD }}>~{p.avgMttrSavedMins}m</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>avg MTTR saved</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onHistory(p)}
          className="p-1.5 rounded hover:bg-white/5 transition-colors"
          style={{ color: DS.text.muted }}
          title="View change history"
        >
          <History className="w-3 h-3" />
        </button>
        <button
          onClick={() => onEdit(p)}
          className="p-1.5 rounded hover:bg-white/5 transition-colors"
          style={{ color: DS.text.muted }}
          title="Edit pattern"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(p)}
          className="p-1.5 rounded hover:bg-white/5 transition-colors"
          style={{ color: DS.text.muted }}
          title="Delete pattern"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const PATTERN_TYPES: PatternType[] = ["restart", "scale", "failover", "clear_queue", "rollback"];

interface PatternFormState {
  name: string;
  type: PatternType;
  trigger: string;
  runbook: string;
  enabled: boolean;
}

function emptyForm(): PatternFormState {
  return { name: "", type: "restart", trigger: "", runbook: "", enabled: true };
}

function PatternEditorModal({
  open,
  initial,
  saving,
  errorMessage,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: { mode: "create" } | { mode: "edit"; pattern: FailurePattern } | null;
  saving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (form: PatternFormState) => void;
}) {
  const [form, setForm] = useState<PatternFormState>(emptyForm());

  useEffect(() => {
    if (!open || !initial) return;
    if (initial.mode === "edit") {
      const p = initial.pattern;
      setForm({ name: p.name, type: p.type, trigger: p.trigger, runbook: p.runbook, enabled: p.enabled });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  if (!open || !initial) return null;

  const title = initial.mode === "create" ? "Add pattern" : "Edit pattern";
  const canSubmit = form.name.trim().length > 0 && form.trigger.trim().length > 0 && form.runbook.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border p-5"
        style={{ background: "#0a0a0a", borderColor: DS.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold" style={{ color: DS.text.primary }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5" style={{ color: DS.text.muted }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-[12px] outline-none focus:ring-1"
              style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.primary }}
              placeholder="e.g., Service Restart on OOM"
              maxLength={200}
            />
          </label>

          <label className="block">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PatternType }))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.primary }}
            >
              {PATTERN_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: "#0a0a0a" }}>{t}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>Trigger</span>
            <input
              value={form.trigger}
              onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.primary }}
              placeholder="e.g., CPU > 85% for 5 consecutive minutes"
              maxLength={500}
            />
          </label>

          <label className="block">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>Runbook</span>
            <textarea
              value={form.runbook}
              onChange={(e) => setForm((f) => ({ ...f, runbook: e.target.value }))}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
              style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.primary }}
              placeholder="e.g., RUNBOOK-001: Drain → Restart → Health-check → Reroute"
              maxLength={2000}
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            <span className="text-[11px]" style={{ color: DS.text.secondary }}>Enabled</span>
          </label>

          {errorMessage && (
            <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[11px]"
            style={{ background: DS.surface, color: DS.text.secondary, border: `1px solid ${DS.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSubmit || saving}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50"
            style={{ background: GOLD, color: "#0a0a0a" }}
          >
            {saving ? "Saving..." : "Save pattern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function actionLabel(action: string): string {
  switch (action) {
    case "create": return "Created";
    case "update": return "Updated";
    case "delete": return "Deleted";
    case "toggle": return "Toggled";
    default: return action;
  }
}

function actionColor(action: string): string {
  switch (action) {
    case "create": return "#10b981";
    case "update": return "#3b82f6";
    case "delete": return "#ef4444";
    case "toggle": return "#f59e0b";
    default: return DS.text.secondary;
  }
}

function diffFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null): Array<{ key: string; from: unknown; to: unknown }> {
  if (!before || !after) return [];
  const keys = ["name", "type", "trigger", "runbook", "enabled"];
  const out: Array<{ key: string; from: unknown; to: unknown }> = [];
  for (const k of keys) {
    if (JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify((after as Record<string, unknown>)[k])) {
      out.push({ key: k, from: (before as Record<string, unknown>)[k], to: (after as Record<string, unknown>)[k] });
    }
  }
  return out;
}

function PatternHistoryPanel({ pattern, onClose }: { pattern: FailurePattern; onClose: () => void }) {
  const historyQuery = useQuery<{ entries: PatternHistoryEntry[] }>({
    queryKey: ["self-healing-pattern-history", pattern.id],
    queryFn: () => apiFetch<{ entries: PatternHistoryEntry[] }>(`/self-healing/policies/${pattern.id}/history`),
  });
  const entries = historyQuery.data?.entries ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full overflow-y-auto border-l p-5"
        style={{ background: "#0a0a0a", borderColor: DS.border }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <h2 className="text-[13px] font-semibold truncate" style={{ color: DS.text.primary }}>Change history</h2>
            </div>
            <div className="text-[10px] truncate" style={{ color: DS.text.muted }}>{pattern.name}</div>
            <div className="text-[9px] font-mono mt-0.5" style={{ color: DS.text.muted }}>#{pattern.id}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 shrink-0" style={{ color: DS.text.muted }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[9px] uppercase tracking-widest mt-4 mb-2" style={{ color: DS.text.muted }}>
          Audit entries · platform_audit_log
        </div>

        {historyQuery.isLoading && (
          <div className="flex items-center justify-center h-24" style={{ color: DS.text.muted }}>
            <div className="w-5 h-5 border-2 rounded-full animate-spin mr-2" style={{ borderColor: "rgba(212,160,84,0.25)", borderTopColor: GOLD }} />
            <span className="text-[11px]">Loading history...</span>
          </div>
        )}

        {historyQuery.isError && (
          <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            Failed to load history: {(historyQuery.error as Error)?.message ?? "unknown error"}
          </div>
        )}

        {!historyQuery.isLoading && !historyQuery.isError && entries.length === 0 && (
          <div className="text-[10px] px-3 py-4 rounded-lg text-center" style={{ background: DS.surface, color: DS.text.muted, border: `1px solid ${DS.border}` }}>
            No audit entries recorded for this pattern yet.
          </div>
        )}

        <div className="space-y-2">
          {entries.map((e) => {
            const ac = actionColor(e.action);
            const diffs = diffFields(e.before, e.after);
            return (
              <div key={e.id} className="rounded-lg border p-3" style={{ background: DS.surface, borderColor: DS.border }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${ac}15`, color: ac }}>
                      {actionLabel(e.action)}
                    </span>
                    <span className="text-[10px] font-medium truncate" style={{ color: DS.text.primary }}>{e.actor}</span>
                  </div>
                  <span className="text-[9px] font-mono shrink-0" style={{ color: DS.text.muted }}>{fmtAgo(e.at)}</span>
                </div>
                {e.actorEmail && e.actorEmail !== e.actor && (
                  <div className="text-[9px] mb-1 truncate" style={{ color: DS.text.muted }}>{e.actorEmail}</div>
                )}
                <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                  {new Date(e.at).toLocaleString()}
                </div>
                {e.action === "update" && diffs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {diffs.map((d) => (
                      <div key={d.key} className="text-[9px]" style={{ color: DS.text.secondary }}>
                        <span className="uppercase tracking-widest" style={{ color: DS.text.muted }}>{d.key}:</span>{" "}
                        <span style={{ color: "#ef4444" }} className="line-through">{String(d.from ?? "—")}</span>{" → "}
                        <span style={{ color: "#10b981" }}>{String(d.to ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SelfHealingPage() {
  const [tab, setTab] = useState<"runs" | "patterns">("runs");
  const [editor, setEditor] = useState<{ mode: "create" } | { mode: "edit"; pattern: FailurePattern } | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [historyPattern, setHistoryPattern] = useState<FailurePattern | null>(null);
  const qc = useQueryClient();

  const statsQuery = useQuery<StatsResponse>({
    queryKey: ["self-healing-stats"],
    queryFn: () => apiFetch<StatsResponse>("/self-healing/stats"),
    refetchInterval: 15000,
  });

  const runsQuery = useQuery<{ runs: RemediationRun[]; total: number }>({
    queryKey: ["self-healing-runs"],
    queryFn: () => apiFetch<{ runs: RemediationRun[]; total: number }>("/self-healing/runs"),
    refetchInterval: 10000,
  });

  const policiesQuery = useQuery<{ policies: FailurePattern[] }>({
    queryKey: ["self-healing-policies"],
    queryFn: () => apiFetch<{ policies: FailurePattern[] }>("/self-healing/policies"),
  });

  const getCsrfToken = () => {
    const m = document.cookie.split(";").find((c) => c.trim().startsWith("csrf_token="));
    return m ? decodeURIComponent(m.split("=")[1]!) : undefined;
  };

  const invalidatePolicies = () => {
    void qc.invalidateQueries({ queryKey: ["self-healing-policies"] });
    void qc.invalidateQueries({ queryKey: ["self-healing-stats"] });
  };

  const toggleMutation = useMutation({
    mutationFn: (id: string) => {
      const csrfToken = getCsrfToken();
      return apiFetch<{ policy: FailurePattern }>(`/self-healing/policies/${id}/toggle`, {
        method: "PATCH",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
    },
    onSuccess: invalidatePolicies,
  });

  const createMutation = useMutation({
    mutationFn: (form: PatternFormState) => {
      const csrfToken = getCsrfToken();
      return apiFetch<{ policy: FailurePattern }>(`/self-healing/policies`, {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
        body: JSON.stringify(form),
      });
    },
    onSuccess: () => {
      invalidatePolicies();
      setEditor(null);
      setEditorError(null);
    },
    onError: (err: Error) => setEditorError(err.message || "Failed to create pattern"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: PatternFormState }) => {
      const csrfToken = getCsrfToken();
      return apiFetch<{ policy: FailurePattern }>(`/self-healing/policies/${id}`, {
        method: "PUT",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
        body: JSON.stringify(form),
      });
    },
    onSuccess: () => {
      invalidatePolicies();
      setEditor(null);
      setEditorError(null);
    },
    onError: (err: Error) => setEditorError(err.message || "Failed to update pattern"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const csrfToken = getCsrfToken();
      return apiFetch<void>(`/self-healing/policies/${id}`, {
        method: "DELETE",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
    },
    onSuccess: invalidatePolicies,
  });

  const handleSavePattern = (form: PatternFormState) => {
    setEditorError(null);
    if (editor?.mode === "edit") {
      updateMutation.mutate({ id: editor.pattern.id, form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDeletePattern = (p: FailurePattern) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete pattern "${p.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(p.id);
  };

  const stats = statsQuery.data;
  const runs = runsQuery.data?.runs ?? [];
  const policies = policiesQuery.data?.policies ?? [];

  const totalMttrSaved = stats?.totalMttrSavedMins ?? 0;
  const successRate = stats?.successRate ?? 0;
  const executing = stats?.executing ?? 0;
  const pendingApproval = stats?.pendingApproval ?? 0;

  const isLoading = statsQuery.isLoading && runsQuery.isLoading;

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>Self-Healing Orchestrator</h1>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>ACTIVE</span>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>Pattern-matched auto-remediation with Alloy approval gates and immutable audit trails. MTTR: hours → seconds.</p>
        </div>
        <button
          onClick={() => {
            void qc.invalidateQueries({ queryKey: ["self-healing-stats"] });
            void qc.invalidateQueries({ queryKey: ["self-healing-runs"] });
          }}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: DS.text.muted }}
        >
          <RefreshCw className={`w-4 h-4 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,160,84,0.25)", borderTopColor: GOLD }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "MTTR Saved Today", value: `${totalMttrSaved}m`, color: "#10b981", icon: Clock },
              { label: "Active Executions", value: String(executing), color: "#f59e0b", icon: Activity },
              { label: "Pending Approval", value: String(pendingApproval), color: "#8b5cf6", icon: Shield },
              { label: "Success Rate", value: `${successRate}%`, color: GOLD, icon: CheckCircle },
            ].map(k => (
              <div key={k.label} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>{k.label}</span>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
                <div className="text-[22px] font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 border-b" style={{ borderColor: DS.border }}>
            {(["runs", "patterns"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="text-[11px] px-4 py-2 capitalize transition-all" style={{
                color: tab === t ? GOLD : DS.text.muted,
                borderBottom: `2px solid ${tab === t ? GOLD : "transparent"}`,
              }}>{t === "runs" ? "Remediation Runs" : "Pattern Library"}</button>
            ))}
          </div>

          {tab === "runs" && (
            <div className="space-y-3">
              {runsQuery.isLoading && (
                <div className="flex items-center justify-center h-24" style={{ color: DS.text.muted }}>
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mr-2" style={{ borderColor: "rgba(212,160,84,0.25)", borderTopColor: GOLD }} />
                  Loading runs...
                </div>
              )}
              {!runsQuery.isLoading && runs.length === 0 && (
                <div className="flex items-center justify-center h-24 rounded-xl border" style={{ borderColor: DS.border, color: DS.text.muted }}>
                  <span className="text-[11px]">No remediation runs found</span>
                </div>
              )}
              {runs.map(r => <RunCard key={r.id} run={r} />)}
            </div>
          )}

          {tab === "patterns" && (
            <div className="space-y-2">
              {policiesQuery.isLoading && (
                <div className="flex items-center justify-center h-24" style={{ color: DS.text.muted }}>
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mr-2" style={{ borderColor: "rgba(212,160,84,0.25)", borderTopColor: GOLD }} />
                  Loading policies...
                </div>
              )}
              {!policiesQuery.isLoading && (
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px]" style={{ color: DS.text.muted }}>
                    {policies.filter(p => p.enabled).length} patterns active · {policies.filter(p => !p.enabled).length} disabled
                  </div>
                  <button
                    onClick={() => { setEditorError(null); setEditor({ mode: "create" }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                    style={{ background: GOLD, color: "#0a0a0a" }}
                  >
                    <Plus className="w-3 h-3" />
                    Add pattern
                  </button>
                </div>
              )}
              {policies.map(p => (
                <PatternRow
                  key={p.id}
                  p={p}
                  onToggle={(id) => toggleMutation.mutate(id)}
                  onEdit={(pattern) => { setEditorError(null); setEditor({ mode: "edit", pattern }); }}
                  onDelete={handleDeletePattern}
                  onHistory={(pattern) => setHistoryPattern(pattern)}
                />
              ))}
              {deleteMutation.isError && (
                <div className="text-[10px] px-3 py-2 rounded-lg mt-2" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  Failed to delete pattern: {(deleteMutation.error as Error)?.message ?? "unknown error"}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PatternEditorModal
        open={editor !== null}
        initial={editor}
        saving={createMutation.isPending || updateMutation.isPending}
        errorMessage={editorError}
        onClose={() => { setEditor(null); setEditorError(null); }}
        onSave={handleSavePattern}
      />

      {historyPattern && (
        <PatternHistoryPanel
          pattern={historyPattern}
          onClose={() => setHistoryPattern(null)}
        />
      )}
    </div>
  );
}
