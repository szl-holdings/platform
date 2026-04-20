import { useState } from "react";
import { Shield, Play, CheckCircle2, XCircle, Clock, AlertTriangle, Loader, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { runItems, type RunItem, type RunStatus } from "@/data/seed";
import { SubstrateWorkflowPanel } from "@/components/SubstrateWorkflowPanel";
import { useAgentRunStepLog, usePendingApprovals } from "@/data/api";

const STATUS_CONFIG: Record<RunStatus, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/20", label: "COMPLETED" },
  running: { icon: <Loader className="w-3.5 h-3.5 animate-spin" />, color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/20", label: "RUNNING" },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/25", label: "FAILED" },
  queued: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-sky-400", bg: "bg-sky-500/8", border: "border-sky-500/20", label: "QUEUED" },
  cancelled: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-amber-400/40", bg: "bg-amber-500/5", border: "border-amber-500/10", label: "CANCELLED" },
  rolled_back: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/20", label: "ROLLED BACK" },
};

const TYPE_LABELS: Record<string, string> = {
  signal_scan: "Signal Scan",
  recommendation_generation: "Recommendation",
  policy_evaluation: "Policy Eval",
  escalation_attempt: "Escalation",
  approval_chain_audit: "Chain Audit",
  portfolio_scan: "Portfolio Scan",
  simulation_run: "Simulation",
};

const POLICY_COLORS: Record<string, string> = {
  cleared: "text-emerald-400",
  conditional: "text-amber-400",
  blocked: "text-red-400",
  flagged: "text-orange-400",
  pending: "text-sky-400",
};

function RunRow({ run }: { run: RunItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[run.status];

  return (
    <div className={`cockpit-panel border ${cfg.border}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors" onClick={() => setExpanded(v => !v)}>
        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-amber-100">{run.agentName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-amber-400/40">{TYPE_LABELS[run.type] ?? run.type}</span>
                <span className="text-[10px] font-mono text-amber-400/30">·</span>
                <span className={`text-[10px] font-mono ${POLICY_COLORS[run.policyState]}`}>{run.policyState}</span>
                <span className="text-[10px] font-mono text-amber-400/30">·</span>
                <span className="text-[10px] font-mono text-amber-400/40">{run.trigger}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />}
            </div>
          </div>
          {run.entityLabel && (
            <p className="text-[10px] text-amber-100/50 mt-0.5 font-mono">→ {run.entityLabel}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-[10px] font-mono text-amber-400/30">
              {new Date(run.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            {run.durationMs !== undefined && (
              <span className="text-[10px] font-mono text-amber-400/30">{(run.durationMs / 1000).toFixed(1)}s</span>
            )}
            {run.tokensUsed !== undefined && (
              <span className="text-[10px] font-mono text-amber-400/30">{run.tokensUsed.toLocaleString()} tokens</span>
            )}
          </div>
        </div>
      </div>

      {expanded && run.outcome && (
        <div className="px-4 pb-4 border-t border-amber-500/10 pt-3 space-y-3">
          <div className={`rounded p-3 border ${run.status === "failed" ? "bg-red-500/5 border-red-500/15" : "bg-amber-500/4 border-amber-500/12"}`}>
            <p className="text-[9px] font-mono text-amber-400/40 mb-1">OUTCOME</p>
            <p className="text-xs text-amber-100/70 leading-relaxed">{run.outcome}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-4 text-[10px]">
              <div><span className="text-amber-400/40">Agent: </span><span className="text-amber-200/70 font-mono">{run.agentId}</span></div>
              {run.durationMs !== undefined && <div><span className="text-amber-400/40">Duration: </span><span className="text-amber-200/70 font-mono">{(run.durationMs / 1000).toFixed(1)}s</span></div>}
              {run.tokensUsed !== undefined && <div><span className="text-amber-400/40">Tokens: </span><span className="text-amber-200/70 font-mono">{run.tokensUsed.toLocaleString()}</span></div>}
            </div>
            <span className="proof-badge">
              <Shield className="w-2 h-2" />
              {run.proofRef}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function levelClass(level: string): string {
  if (level === "error") return "text-red-400";
  if (level === "warn") return "text-amber-400";
  if (level === "debug") return "text-amber-400/40";
  return "text-amber-200/70";
}

function StepLogPanel({ runId }: { runId: string | undefined }) {
  // Reads StepLogEntry records emitted by the cognitive-runtime orchestrator
  // through agents-core/step-log. Polls every 4s for live updates.
  const { data, isLoading, isError } = useAgentRunStepLog(runId);
  return (
    <div className="cockpit-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-widest">
          Step Log <span className="text-amber-400/30">· agents-core</span>
        </p>
        <span className="text-[9px] font-mono text-amber-400/30">
          {runId ? `run ${runId.slice(0, 8)}…` : "select a run"} · {data?.count ?? 0} entries
        </span>
      </div>
      {!runId && <p className="text-[10px] text-amber-400/40">No run selected.</p>}
      {runId && isLoading && <p className="text-[10px] text-amber-400/40">Loading step log…</p>}
      {runId && isError && <p className="text-[10px] text-red-400/70">Failed to load step log.</p>}
      {runId && data && data.entries.length === 0 && (
        <p className="text-[10px] text-amber-400/40">No step log entries yet.</p>
      )}
      {runId && data && data.entries.length > 0 && (
        <div className="space-y-1 max-h-72 overflow-y-auto font-mono text-[10px] leading-relaxed">
          {data.entries.map((e) => (
            <div key={`${e.stepId}-${e.timestamp}`} className="flex gap-2">
              <span className="text-amber-400/30 shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
              <span className={`uppercase shrink-0 ${levelClass(e.level)}`}>{e.level}</span>
              <span className="text-amber-300/70 shrink-0">{e.stepName}</span>
              <span className={levelClass(e.level)}>{e.message}</span>
              {e.durationMs !== undefined && (
                <span className="text-amber-400/30 shrink-0">{e.durationMs}ms</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingApprovalsPanel() {
  // Polls approvals-inbox PendingApprovalRequest entries written by the
  // ApprovalGate in agents-core. Operators can act on any pending step here.
  const { data, isLoading } = usePendingApprovals();
  const items = data?.pending ?? [];
  return (
    <div className="cockpit-panel p-4 space-y-3 border border-amber-500/20">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-widest">
          Guardian Approvals <span className="text-amber-400/30">· approvals-inbox</span>
        </p>
        <span className="text-[9px] font-mono text-amber-400/30">{items.length} pending</span>
      </div>
      {isLoading && <p className="text-[10px] text-amber-400/40">Loading approvals…</p>}
      {!isLoading && items.length === 0 && (
        <p className="text-[10px] text-amber-400/40">No pending approvals — runs are clear.</p>
      )}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="rounded p-3 bg-amber-500/4 border border-amber-500/15 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-100">{p.stepName}</p>
                <span className="text-[9px] font-mono text-amber-400/40">
                  run {p.runId.slice(0, 8)}…
                </span>
              </div>
              <p className="text-[10px] text-amber-200/70 font-mono">action: {p.action}</p>
              <p className="text-[10px] text-amber-100/60">{p.justification}</p>
              <div className="flex flex-wrap gap-3 text-[10px] text-amber-400/40 font-mono">
                <span>impact: {p.projectedImpact}</span>
                <span>risk: {p.projectedRisk}</span>
                <span>by: {p.requestedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RunConsolePage() {
  const running = runItems.filter(r => r.status === "running");
  const failed = runItems.filter(r => r.status === "failed");
  const completed = runItems.filter(r => r.status === "completed");

  const totalTokens = runItems.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0);
  const totalRuns = runItems.length;

  // First active or most recent run is selected for live step log
  const activeRunId = (running[0] ?? failed[0] ?? completed[0])?.id;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Run Console</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">Agent execution history — {totalRuns} runs recorded</p>
        </div>
      </div>

      <SubstrateWorkflowPanel />

      {/* Live agents-core surfaces */}
      <PendingApprovalsPanel />
      <StepLogPanel runId={activeRunId} />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="cockpit-panel p-3">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Total Runs</p>
          <p className="text-xl font-mono font-bold text-amber-300">{totalRuns}</p>
        </div>
        <div className="cockpit-panel p-3">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Running</p>
          <p className="text-xl font-mono font-bold text-amber-400">{running.length}</p>
        </div>
        <div className="cockpit-panel p-3 border border-red-500/15">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Failed</p>
          <p className="text-xl font-mono font-bold text-red-400">{failed.length}</p>
        </div>
        <div className="cockpit-panel p-3">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Tokens Used</p>
          <p className="text-xl font-mono font-bold text-amber-300">{(totalTokens / 1000).toFixed(1)}K</p>
        </div>
      </div>

      {/* Runs */}
      {running.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-widest">Active</p>
          {running.map(r => <RunRow key={r.id} run={r} />)}
        </div>
      )}

      {failed.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-red-400/40 uppercase tracking-widest">Failed</p>
          {failed.map(r => <RunRow key={r.id} run={r} />)}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-emerald-400/30 uppercase tracking-widest">Completed</p>
          {completed.map(r => <RunRow key={r.id} run={r} />)}
        </div>
      )}
    </div>
  );
}
