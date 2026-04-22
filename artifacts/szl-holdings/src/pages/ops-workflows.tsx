import { useCallback, useMemo, useRef, useState } from "react";
import {
  STARTER_WORKFLOWS,
  type WorkflowDescriptor,
  type WorkflowId,
  type ProofEnvelope,
  type LedgerEntry,
  type PolicyCheckResult,
} from "@szl-holdings/shared-contracts";
import {
  createWorkflowRun,
  executeWorkflowRun,
  type WorkflowRun,
  type StepRunRecord,
} from "@szl-holdings/workflow-runtime";
import { PolicyGuardEngine, BASELINE_POLICY_RULES } from "@szl-holdings/policy-guard";
import { EvidenceLedger } from "@szl-holdings/evidence-ledger";
import { Timeline, type TimelineEvent, type TimelineEventStatus, EvidencePanel } from '@szl-holdings/design-system';
import {
  Lock,
  Workflow as WorkflowIcon,
  Play,
  X,
  ShieldAlert,
  Shield,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const policyEngine = new PolicyGuardEngine(BASELINE_POLICY_RULES);
const ledger = new EvidenceLedger();

type StepMeta = { policy?: PolicyCheckResult; envelope?: ProofEnvelope; ledgerEntryId?: string };

const TIER_STYLE: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
};

const VERDICT_STYLE: Record<string, string> = {
  allowed: "text-emerald-400",
  "requires-approval": "text-amber-400",
  blocked: "text-red-400",
  override: "text-violet-400",
};

const RUN_STATE_STYLE: Record<string, string> = {
  queued: "bg-muted/30 text-muted-foreground border-border",
  running: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
  "approval-required": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-muted/30 text-muted-foreground border-border",
};

const WORKFLOW_LIST: WorkflowDescriptor[] = Object.values(STARTER_WORKFLOWS);

function stepStateToTimeline(state: StepRunRecord["state"]): TimelineEventStatus {
  return state as TimelineEventStatus;
}

function fmtTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

function fmtDuration(ms?: number): string | undefined {
  if (ms === undefined) return undefined;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function OpsWorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<WorkflowId>(WORKFLOW_LIST[0].id);
  const [runs, setRuns] = useState<Record<string, WorkflowRun>>({});
  const [stepMeta, setStepMeta] = useState<Record<string, StepMeta>>({});
  const [drawerRunId, setDrawerRunId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const pendingApprovals = useRef<Map<string, (decision: "approved" | "rejected") => void>>(new Map());
  const [_approvalNonce, setApprovalNonce] = useState(0);

  const selectedWorkflow = useMemo(
    () => STARTER_WORKFLOWS[selectedWorkflowId],
    [selectedWorkflowId],
  );

  const workflowRuns = useMemo(
    () =>
      Object.values(runs)
        .filter((r) => r.workflowId === selectedWorkflowId)
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
    [runs, selectedWorkflowId],
  );

  const setRunSnapshot = useCallback((run: WorkflowRun) => {
    setRuns((prev) => ({
      ...prev,
      [run.runId]: { ...run, steps: run.steps.map((s) => ({ ...s })) },
    }));
  }, []);

  const triggerRun = useCallback(
    async (descriptor: WorkflowDescriptor) => {
      const run = createWorkflowRun(descriptor, { triggeredBy: "ops-console" });
      setRunSnapshot(run);
      setDrawerRunId(run.runId);
      setSelectedStepId(run.steps[0]?.stepId ?? null);

      await executeWorkflowRun(run, {
        onStateChange: (r) => setRunSnapshot(r),
        onApprovalRequired: (r, step) =>
          new Promise<"approved" | "rejected">((resolve) => {
            const key = `${r.runId}:${step.stepId}`;
            pendingApprovals.current.set(key, (decision) => {
              pendingApprovals.current.delete(key);
              setApprovalNonce((n) => n + 1);
              resolve(decision);
            });
            setApprovalNonce((n) => n + 1);
          }),
        stepExecutor: async (step, r) => {
          const stepDescriptor = descriptor.steps.find((s) => s.stepId === step.stepId);
          const policyResult = policyEngine.evaluate({
            actionType: step.stepId,
            agentRole: stepDescriptor?.agentRole,
            toolId: stepDescriptor?.toolIds[0],
            workflowId: descriptor.id,
            traceId: step.traceId,
          });

          await new Promise((res) => setTimeout(res, 350 + Math.random() * 350));

          const envelopeBase: Omit<ProofEnvelope, "generatedAt"> = {
            traceId: step.traceId,
            workflowRunId: r.runId,
            stepId: step.stepId,
            ...(stepDescriptor?.agentRole !== undefined ? { agentRole: stepDescriptor.agentRole } : {}),
            sources: stepDescriptor?.evidenceRequired
              ? [
                  {
                    sourceId: `src_${step.stepId}_a`,
                    title: `${step.name} — primary source`,
                    sourceUri: `aeep://${descriptor.id}/${step.stepId}/primary`,
                    score: 0.88,
                    profileVersion: "v1.2.0",
                    retrievalPath: "vector→rerank",
                    retrievedAt: new Date().toISOString(),
                  },
                  {
                    sourceId: `src_${step.stepId}_b`,
                    title: `${step.name} — corroborating source`,
                    sourceUri: `aeep://${descriptor.id}/${step.stepId}/secondary`,
                    score: 0.74,
                    profileVersion: "v1.2.0",
                    retrievalPath: "memory.read",
                    retrievedAt: new Date().toISOString(),
                  },
                ]
              : [],
            toolCalls: (stepDescriptor?.toolIds ?? []).map((toolId) => ({
              toolId,
              status: "success" as const,
              durationMs: 50 + Math.floor(Math.random() * 200),
              inputSummary: `${toolId} invoked for ${step.stepId}`,
              outputSummary: `${toolId} returned ok`,
              timestamp: new Date().toISOString(),
            })),
            confidence: policyResult.verdict === "blocked" ? "low" : "high",
            freshness: "fresh",
            policyVerdict: policyResult.verdict,
            ...(policyResult.reason !== undefined ? { policyReason: policyResult.reason } : {}),
            ...(policyResult.approvalId !== undefined ? { approvalId: policyResult.approvalId } : {}),
          };

          const entry = ledger.append({
            entityType: "workflow_step",
            entityId: `${r.runId}:${step.stepId}`,
            action: step.name,
            actor: "ops-console",
            actorRole: stepDescriptor?.agentRole,
            envelope: envelopeBase,
          });

          setStepMeta((prev) => ({
            ...prev,
            [step.traceId]: {
              policy: policyResult,
              envelope: entry.envelope,
              ledgerEntryId: entry.entryId,
            },
          }));

          if (policyResult.verdict === "blocked") {
            return { success: false, error: policyResult.reason ?? "Policy blocked this step" };
          }
          return { success: true };
        },
      });
    },
    [setRunSnapshot],
  );

  const resolveApproval = useCallback((runId: string, stepId: string, decision: "approved" | "rejected") => {
    const key = `${runId}:${stepId}`;
    const resolver = pendingApprovals.current.get(key);
    if (resolver) resolver(decision);
  }, []);

  const drawerRun = drawerRunId ? runs[drawerRunId] : null;
  const drawerWorkflow = drawerRun ? STARTER_WORKFLOWS[drawerRun.workflowId as WorkflowId] : null;
  const drawerStep = drawerRun && selectedStepId ? drawerRun.steps.find((s) => s.stepId === selectedStepId) : null;
  const drawerStepMeta = drawerStep ? stepMeta[drawerStep.traceId] : undefined;
  const drawerLedgerEntries = drawerRun ? ledger.getByWorkflowRun(drawerRun.runId) : [];

  // Surface any pending approvals for the active drawer run
  const pendingApprovalStep = drawerRun
    ? drawerRun.steps.find(
        (s) => s.state === "approval-required" && pendingApprovals.current.has(`${drawerRun.runId}:${s.stepId}`),
      )
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/40 bg-card/50 px-6 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span className="font-semibold text-amber-500 uppercase tracking-wider text-[10px]">
            Internal — Workflow Runtime
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <WorkflowIcon className="w-4 h-4 text-primary" />
            Ops Workflows — Live Run Console
          </h1>
          <span className="text-[11px] text-muted-foreground">
            {WORKFLOW_LIST.length} starter workflows · {Object.keys(runs).length} runs this session
          </span>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Workflow registry sidebar */}
        <aside className="w-64 border-r border-border/40 py-3 shrink-0 overflow-y-auto">
          <nav className="space-y-0.5 px-2">
            {WORKFLOW_LIST.map((wf) => {
              const isActive = wf.id === selectedWorkflowId;
              return (
                <button
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  className={cn(
                    "w-full text-left flex flex-col gap-0.5 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                  data-testid={`workflow-list-${wf.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{wf.name}</span>
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border",
                        TIER_STYLE[wf.policyTier],
                      )}
                    >
                      {wf.policyTier}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground line-clamp-2">{wf.description}</span>
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {wf.category} · {wf.steps.length} steps
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Selected workflow detail + recent runs */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedWorkflow.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedWorkflow.description}</p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider text-[10px]",
                      TIER_STYLE[selectedWorkflow.policyTier],
                    )}
                  >
                    {selectedWorkflow.policyTier} tier
                  </span>
                  <span>·</span>
                  <span>{selectedWorkflow.category}</span>
                  <span>·</span>
                  <span>triggers: {selectedWorkflow.triggerTypes.join(", ")}</span>
                </div>
              </div>
              <button
                onClick={() => triggerRun(selectedWorkflow)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                data-testid="trigger-run-button"
              >
                <Play className="w-3.5 h-3.5" />
                Trigger run
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Step Plan ({selectedWorkflow.steps.length})
              </h3>
              <ol className="space-y-2">
                {selectedWorkflow.steps.map((step, idx) => (
                  <li
                    key={step.stepId}
                    className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground w-5 mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{step.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                          {step.agentRole}
                        </span>
                        {step.requiresApproval && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            approval gate
                          </span>
                        )}
                        {step.policyCheck && (
                          <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            policy
                          </span>
                        )}
                        {step.evidenceRequired && (
                          <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            evidence
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        tools: {step.toolIds.join(", ")}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Runs</h3>
              {workflowRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No runs yet. Click <span className="text-foreground font-medium">Trigger run</span> to launch one.
                </p>
              ) : (
                <ul className="space-y-2">
                  {workflowRuns.map((run) => {
                    const completed = run.steps.filter((s) => s.state === "complete" || s.state === "approved").length;
                    return (
                      <li key={run.runId}>
                        <button
                          onClick={() => {
                            setDrawerRunId(run.runId);
                            setSelectedStepId(run.steps[0]?.stepId ?? null);
                          }}
                          className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                          data-testid={`run-row-${run.runId}`}
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <code className="text-xs text-muted-foreground">{run.runId}</code>
                            <span className="text-[11px] text-muted-foreground">
                              started {fmtTime(run.startedAt)} · {completed}/{run.steps.length} steps
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border",
                              RUN_STATE_STYLE[run.state] ?? RUN_STATE_STYLE.queued,
                            )}
                          >
                            {run.state}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </main>

        {/* Run detail drawer */}
        {drawerRun && drawerWorkflow && (
          <aside className="w-[460px] border-l border-border/40 bg-card/40 flex flex-col">
            <div className="px-4 py-3 border-b border-border/40 flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground">Run detail</span>
                <code className="text-xs text-foreground truncate">{drawerRun.runId}</code>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border w-fit mt-1",
                    RUN_STATE_STYLE[drawerRun.state] ?? RUN_STATE_STYLE.queued,
                  )}
                >
                  {drawerRun.state}
                </span>
              </div>
              <button
                onClick={() => {
                  setDrawerRunId(null);
                  setSelectedStepId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close drawer"
                data-testid="drawer-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Approval card */}
            {pendingApprovalStep && (
              <div
                className="m-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/5"
                data-testid="approval-card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">Approval required</span>
                </div>
                <p className="text-xs text-foreground">
                  Step <span className="font-medium">{pendingApprovalStep.name}</span> is awaiting human decision.
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Trace <code>{pendingApprovalStep.traceId}</code>
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => resolveApproval(drawerRun.runId, pendingApprovalStep.stepId, "approved")}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-xs font-medium hover:bg-emerald-500/25"
                    data-testid="approve-button"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => resolveApproval(drawerRun.runId, pendingApprovalStep.stepId, "rejected")}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/40 text-xs font-medium hover:bg-red-500/25"
                    data-testid="reject-button"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {/* Step timeline with policy verdict */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Steps
                </h4>
                <Timeline
                  events={drawerRun.steps.map<TimelineEvent>((step) => {
                    const meta = stepMeta[step.traceId];
                    const verdict = meta?.policy?.verdict;
                    return {
                      id: step.stepId,
                      label: step.name,
                      status: stepStateToTimeline(step.state),
                      ...(step.traceId !== undefined ? { traceId: step.traceId } : {}),
                      ...(step.startedAt !== undefined ? { timestamp: fmtTime(step.startedAt) ?? "" } : {}),
                      ...(step.durationMs !== undefined ? { duration: fmtDuration(step.durationMs) ?? "" } : {}),
                      description: verdict
                        ? `policy: ${verdict}${meta?.policy?.matchedPolicyId ? ` (${meta.policy.matchedPolicyId})` : ""}`
                        : step.error,
                    };
                  })}
                  onEventClick={(ev) => setSelectedStepId(ev.id)}
                />
              </section>

              {/* Selected step proof envelope */}
              {drawerStep && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Evidence — {drawerStep.name}
                  </h4>
                  {drawerStepMeta?.envelope ? (
                    <div
                      className="rounded-lg border border-border/40 bg-background/50"
                      data-testid="evidence-panel"
                    >
                      <EvidencePanel
                        traceId={drawerStepMeta.envelope.traceId}
                        sources={drawerStepMeta.envelope.sources.map((s) => ({
                          sourceId: s.sourceId,
                          ...(s.sourceUri !== undefined ? { sourceUri: s.sourceUri } : {}),
                          ...(s.title !== undefined ? { title: s.title } : {}),
                          ...(s.score !== undefined ? { score: s.score } : {}),
                          ...(s.profileVersion !== undefined ? { profileVersion: s.profileVersion } : {}),
                          ...(s.retrievalPath !== undefined ? { retrievalPath: s.retrievalPath } : {}),
                        }))}
                        policyChecks={
                          drawerStepMeta.policy
                            ? [
                                {
                                  policyId: drawerStepMeta.policy.matchedPolicyId ?? "POL-DEFAULT",
                                  verdict: drawerStepMeta.policy.verdict,
                                  ...(drawerStepMeta.policy.reason !== undefined
                                    ? { reason: drawerStepMeta.policy.reason }
                                    : {}),
                                },
                              ]
                            : []
                        }
                        toolsUsed={drawerStepMeta.envelope.toolCalls.map((t) => t.toolId)}
                        approvalStatus={
                          drawerStep.state === "approved"
                            ? "approved"
                            : drawerStep.state === "rejected"
                              ? "rejected"
                              : drawerStep.state === "approval-required"
                                ? "pending"
                                : "none"
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No evidence yet — step has not produced a proof envelope.
                    </p>
                  )}
                </section>
              )}

              {/* Ledger entries summary */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Ledger ({drawerLedgerEntries.length})
                </h4>
                {drawerLedgerEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No ledger entries yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {drawerLedgerEntries.map((entry: LedgerEntry) => (
                      <li
                        key={entry.entryId}
                        className="text-[11px] flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-border/30 bg-background/40"
                      >
                        <code className="text-muted-foreground truncate">{entry.entryId}</code>
                        <span className="text-foreground truncate">{entry.action}</span>
                        <span
                          className={cn(
                            "font-medium flex-shrink-0",
                            VERDICT_STYLE[entry.envelope.policyVerdict ?? "allowed"],
                          )}
                        >
                          {entry.envelope.policyVerdict ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
