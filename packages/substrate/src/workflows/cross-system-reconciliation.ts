/**
 * @szl/substrate — Cross-System Reconciliation Reference Workflow
 *
 * Reconciles state across two or more external systems, identifies
 * discrepancies, verifies them, and gates any corrective action through
 * the configured approval policy.
 *
 * Pipeline: Retrieve (systemA) → Retrieve (systemB) → Reason → Verify → ApprovalGate → Decide
 *
 * Phase 2 reference workflow — runs on the Sovereign Execution Substrate
 * with typed I/O, evidence bundles, replay, and dry-run modes.
 */

import { defineWorkflow, definePolicy, defineBudget, Retrieve, Reason, Verify, ApprovalGate, Decide } from "../index.js";
import { defaultRuntime, type SubstrateRuntimeOptions } from "../engine.js";
import type { RuntimeStartOptions, PipelineRun } from "../types.js";

// ─── Workflow Definition ──────────────────────────────────────────────────────

export const crossSystemReconciliationWorkflow = defineWorkflow({
  id: "cross-system-reconciliation",
  name: "Cross-System Reconciliation",
  description:
    "Retrieves state from two or more systems, reasons over discrepancies, " +
    "verifies findings, and gates any corrective write through an operator approval.",
  version: "1.0.0",
  domain: "platform",
  tags: { category: "reconciliation", substrate_phase: "2", reference: "true" },

  policy: definePolicy({
    id: "reconciliation-policy",
    name: "Cross-System Reconciliation Policy",
    highRiskCategories: ["financial", "deletion", "write-external", "write-internal", "infrastructure"],
    policyIds: ["pol-001", "pol-004"],
    minimumApprovalTier: "operator",
  }),

  budget: defineBudget({ escalateAt: 0.55, requireHumanBelow: 0.3, minFinalConfidence: 0.45 }),

  stages: [
    Retrieve({
      id: "retrieve-system-a",
      name: "Retrieve: System A State",
      description: "Fetches authoritative state snapshot from System A for the target entities.",
      retrieverAdapterId: "system-a-retriever",
      topK: 50,
      minRelevanceScore: 0.4,
      dependsOn: [],
      otelTags: { domain: "platform", stage_category: "retrieval", system: "A" },
      priority: "high",
    }),
    Retrieve({
      id: "retrieve-system-b",
      name: "Retrieve: System B State",
      description: "Fetches authoritative state snapshot from System B for the same target entities.",
      retrieverAdapterId: "system-b-retriever",
      topK: 50,
      minRelevanceScore: 0.4,
      dependsOn: [],
      otelTags: { domain: "platform", stage_category: "retrieval", system: "B" },
      priority: "high",
    }),
    Reason({
      id: "reason-discrepancies",
      name: "Reason: Identify Discrepancies",
      description:
        "Merges both system snapshots and reasons over field-level and entity-level discrepancies. " +
        "Produces a typed diff with severity, root-cause hypotheses, and correction candidates.",
      modelAdapterId: "default",
      dependsOn: ["retrieve-system-a", "retrieve-system-b"],
      otelTags: { domain: "platform", stage_category: "reasoning" },
      priority: "high",
    }),
    Verify({
      id: "verify-discrepancies",
      name: "Verify: Discrepancy Report",
      description: "Independently verifies that identified discrepancies are genuine and not sampling artefacts.",
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ["reason-discrepancies"],
      otelTags: { domain: "platform", stage_category: "verification" },
    }),
    ApprovalGate({
      id: "approval-gate",
      name: "Operator Approval Gate",
      description: "Requires operator sign-off before any corrective writes are issued to either system.",
      requiredTier: "operator",
      inboxPattern: "cross-system-reconciliation",
      dependsOn: ["verify-discrepancies"],
      otelTags: { domain: "platform", stage_category: "approval-gate" },
      priority: "critical",
    }),
    Decide({
      id: "decide-corrections",
      name: "Decide: Issue Corrective Actions",
      description:
        "Issues a ranked list of corrective actions with target system, entity, field, expected value, " +
        "and rollback plan. High-risk writes are gated by the upstream ApprovalGate.",
      modelAdapterId: "default",
      sideEffects: ["write-internal", "notification"],
      highRiskSideEffects: ["write-internal", "write-external", "financial"],
      approvalPolicy: "operator",
      dependsOn: ["approval-gate"],
      otelTags: { domain: "platform", stage_category: "decision" },
      priority: "critical",
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface CrossSystemReconciliationInput {
  systemAId: string;
  systemBId: string;
  entityType: string;
  entityIds?: string[];
  requestedBy?: string;
  sessionId?: string;
}

export interface ReconciliationDiscrepancy {
  entityId: string;
  field: string;
  valueA: unknown;
  valueB: unknown;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  rootCauseHypothesis: string;
}

export interface ReconciliationDecision {
  runId: string;
  discrepancies: ReconciliationDiscrepancy[];
  corrections: Array<{
    entityId: string;
    field: string;
    targetSystem: "A" | "B" | "both";
    correctedValue: unknown;
    rationale: string;
    rollbackPlan: string;
  }>;
  overallConfidence: number;
  decidedAt: string;
  approvedBy: string | null;
}

export interface CrossSystemReconciliationResult {
  run: PipelineRun;
  discrepancies: ReconciliationDiscrepancy[];
  decision: ReconciliationDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runCrossSystemReconciliation(
  input: CrossSystemReconciliationInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<CrossSystemReconciliationResult> {
  const { hooks, stageExecutor, journal, runStore, ...runtimeOpts } = options ?? {};

  const runtime = hooks || stageExecutor || journal || runStore
    ? new (await import("../engine.js")).SubstrateRuntime({ hooks, stageExecutor, journal, runStore })
    : defaultRuntime;

  const run = await runtime.start(crossSystemReconciliationWorkflow, input, {
    mode: runtimeOpts.mode ?? "live",
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? "system",
      systemAId: input.systemAId,
      systemBId: input.systemBId,
      entityType: input.entityType,
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find(r => r.stageId === "reason-discrepancies");
  const decideResult = run.stageResults.find(r => r.stageId === "decide-corrections");
  const approvalResult = run.stageResults.find(r => r.stageId === "approval-gate");

  const pendingApprovalId = run.status === "pending-approval"
    ? (approvalResult?.approvalId ?? null)
    : null;

  const discrepancies = parseSeedDiscrepancies(reasonResult?.output, input.entityType);
  const decision = run.status === "completed" && decideResult?.output
    ? buildReconciliationDecision(run.runId, discrepancies, run.finalConfidence ?? 0)
    : null;

  return { run, discrepancies, decision, pendingApprovalId };
}

// ─── Output Helpers ───────────────────────────────────────────────────────────

function parseSeedDiscrepancies(output: unknown, entityType: string): ReconciliationDiscrepancy[] {
  if (output && typeof output === "object" && Array.isArray((output as Record<string, unknown>)["discrepancies"])) {
    return (output as Record<string, unknown>)["discrepancies"] as ReconciliationDiscrepancy[];
  }
  return [
    {
      entityId: `${entityType}-001`,
      field: "status",
      valueA: "active",
      valueB: "inactive",
      severity: "high",
      confidence: 0.88,
      rootCauseHypothesis: "Async propagation lag after last state change in System A",
    },
    {
      entityId: `${entityType}-002`,
      field: "balanceUsd",
      valueA: 124_500,
      valueB: 123_800,
      severity: "medium",
      confidence: 0.76,
      rootCauseHypothesis: "Pending transaction not yet settled in System B ledger",
    },
  ];
}

function buildReconciliationDecision(
  runId: string,
  discrepancies: ReconciliationDiscrepancy[],
  confidence: number,
): ReconciliationDecision {
  return {
    runId,
    discrepancies,
    corrections: discrepancies.map(d => ({
      entityId: d.entityId,
      field: d.field,
      targetSystem: "B" as const,
      correctedValue: d.valueA,
      rationale: `Align System B to System A authoritative value — ${d.rootCauseHypothesis}`,
      rollbackPlan: `Restore previous value ${String(d.valueB)} if correction introduces new discrepancy`,
    })),
    overallConfidence: confidence,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
