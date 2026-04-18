import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, CheckCircle, Clock, AlertTriangle, Shield, Activity, RotateCcw, RefreshCw, ChevronRight } from "lucide-react";
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

function PatternRow({ p, onToggle }: { p: FailurePattern; onToggle: (id: string) => void }) {
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
        <div className="text-[11px] font-medium" style={{ color: DS.text.primary }}>{p.name}</div>
        <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{p.trigger}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] font-mono" style={{ color: "#10b981" }}>{p.successRate}%</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>{p.matchCount} runs</div>
      </div>
      <div className="text-right shrink-0 hidden md:block">
        <div className="text-[10px] font-mono" style={{ color: GOLD }}>~{p.avgMttrSavedMins}m</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>avg MTTR saved</div>
      </div>
    </div>
  );
}

export default function SelfHealingPage() {
  const [tab, setTab] = useState<"runs" | "patterns">("runs");
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

  const toggleMutation = useMutation({
    mutationFn: (id: string) => {
      const csrfToken = getCsrfToken();
      return apiFetch<{ policy: FailurePattern }>(`/self-healing/policies/${id}/toggle`, {
        method: "PATCH",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["self-healing-policies"] });
      void qc.invalidateQueries({ queryKey: ["self-healing-stats"] });
    },
  });

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
                <div className="text-[10px] mb-3" style={{ color: DS.text.muted }}>
                  {policies.filter(p => p.enabled).length} patterns active · {policies.filter(p => !p.enabled).length} disabled
                </div>
              )}
              {policies.map(p => (
                <PatternRow
                  key={p.id}
                  p={p}
                  onToggle={(id) => toggleMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
