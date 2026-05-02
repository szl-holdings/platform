/**
 * Approval workflow — human-in-the-loop gate for production deploys,
 * schema migrations, break-glass, and policy exceptions.
 *
 * Signals: approvalDecisionSignal, cancelApprovalSignal
 * Activities: evaluatePolicyActivity, requestApprovalActivity,
 *             recordEvidenceActivity, emitLyteVisibilityActivity
 */

import {
  proxyActivities,
  defineSignal,
  setHandler,
  sleep,
  workflowInfo,
  condition,
} from "@temporalio/workflow";
import type * as approvalActivities from "../activities/approval-activities.js";
import type {
  ApprovalWorkflowInput,
  ApprovalWorkflowResult,
  ApprovalRecord,
} from "../types/workflow-types.js";

// ---------------------------------------------------------------------------
// Activity proxy (with retry policy)
// ---------------------------------------------------------------------------

const {
  evaluatePolicyActivity,
  requestApprovalActivity,
  recordEvidenceActivity,
  emitLyteVisibilityActivity,
} = proxyActivities<typeof approvalActivities>({
  startToCloseTimeout: "30s",
  retry: {
    maximumAttempts: 3,
    initialInterval: "2s",
    backoffCoefficient: 2,
    maximumInterval: "30s",
    nonRetryableErrorTypes: ["PolicyEvaluationError"],
  },
});

// ---------------------------------------------------------------------------
// Signal definitions
// ---------------------------------------------------------------------------

export const approvalDecisionSignal = defineSignal<[ApprovalRecord]>("approvalDecision");
export const cancelApprovalSignal = defineSignal<[{ reason: string }]>("cancelApproval");

// ---------------------------------------------------------------------------
// Workflow definition
// ---------------------------------------------------------------------------

export async function approvalWorkflow(
  input: ApprovalWorkflowInput
): Promise<ApprovalWorkflowResult> {
  const { workflowId, runId } = workflowInfo();
  const startedAt = new Date().toISOString();

  const approvals: ApprovalRecord[] = [];
  let cancelled = false;
  let cancelReason = "";
  // Any rejection short-circuits — first rejection is immediately terminal.
  let rejected = false;
  let rejectionRecord: ApprovalRecord | null = null;

  // Register signal handlers
  setHandler(approvalDecisionSignal, (record: ApprovalRecord) => {
    approvals.push(record);
    if (record.decision === "rejected" && !rejected) {
      rejected = true;
      rejectionRecord = record;
    }
  });

  setHandler(cancelApprovalSignal, ({ reason }: { reason: string }) => {
    cancelled = true;
    cancelReason = reason;
  });

  // Step 1: Evaluate OPA policy to confirm approval is required
  const policyResult = await evaluatePolicyActivity({
    policyPackage: "szl.approval",
    inputData: {
      operation_type: input.operationType,
      environment: input.targetEnvironment,
      approvals: [],
      service: input.targetService,
    },
  });

  if (policyResult.allowed && policyResult.denialMessages.length === 0) {
    // Policy says approval not required — short-circuit
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: "temporal-approval-workflow",
      actorType: "temporal-workflow",
      action: "approval-skipped-policy-allows",
      outcome: "success",
      service: input.targetService,
      environment: input.targetEnvironment,
      details: { workflowId, reason: "Policy determined approval not required", policyId: input.policyId },
    });

    return {
      outcome: "approved",
      approvals: [],
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - new Date(startedAt).getTime(),
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Step 2: Create approval request and notify approvers
  await requestApprovalActivity({
    approvalRequestId: workflowId,
    operationType: input.operationType,
    targetService: input.targetService,
    targetEnvironment: input.targetEnvironment,
    targetVersion: input.targetVersion,
    requestedApproverGroups: input.requestedApproverGroups,
    requiredCount: input.requiredApprovalCount,
    context: input.context,
    notificationChannels: ["#platform-approvals"],
  });

  // Step 3: Record that approval was requested
  const requestEvidenceResult = await recordEvidenceActivity({
    category: "approval",
    actorId: input.initiatedBy,
    actorType: "user",
    action: "approval-requested",
    outcome: "pending",
    service: input.targetService,
    environment: input.targetEnvironment,
    details: {
      workflowId,
      runId,
      operationType: input.operationType,
      policyId: input.policyId,
      requiredApprovers: input.requestedApproverGroups,
    },
  });

  // Step 4: Emit Lyte visibility event (pending approval)
  await emitLyteVisibilityActivity({
    event: {
      eventType: "approval-workflow.pending",
      workflowType: "approval-workflow",
      workflowId,
      runId,
      timestamp: new Date().toISOString(),
      payload: {
        operationType: input.operationType,
        targetService: input.targetService,
        targetEnvironment: input.targetEnvironment,
        requiredApprovalCount: input.requiredApprovalCount,
      },
    },
  });

  // Step 5: Wait for sufficient approvals or timeout
  const timeoutMs = input.timeoutMs;

  const resolved = await condition(
    () => {
      // Terminal conditions (in priority order):
      // 1. Any rejection — immediately terminal, do not wait for more approvals
      // 2. Cancel signal
      // 3. Sufficient approvals collected
      if (rejected || cancelled) return true;
      const approved = approvals.filter((a) => a.decision === "approved");
      return approved.length >= input.requiredApprovalCount;
    },
    timeoutMs
  );

  const finalAt = new Date().toISOString();
  const durationMs = Date.now() - new Date(startedAt).getTime();

  let outcome: "approved" | "rejected" | "expired";

  if (!resolved) {
    outcome = "expired";
  } else if (rejected) {
    // Rejection signal received — immediately terminal regardless of any prior approvals
    outcome = "rejected";
  } else if (cancelled) {
    outcome = "rejected";
  } else {
    outcome = "approved";
  }

  // Step 6: Record the final decision in the evidence ledger
  const outcomeEvidenceResult = await recordEvidenceActivity({
    category: "approval",
    actorId: approvals[0]?.approverUserId ?? "system",
    actorType: "user",
    action: `approval-${outcome}`,
    outcome: outcome === "approved" ? "success" : "failure",
    service: input.targetService,
    environment: input.targetEnvironment,
    details: {
      workflowId,
      runId,
      outcome,
      approvals,
      cancelReason: cancelled ? cancelReason : undefined,
      durationMs,
    },
  });

  // Step 7: Emit final Lyte visibility event
  await emitLyteVisibilityActivity({
    event: {
      eventType: `approval-workflow.${outcome}`,
      workflowType: "approval-workflow",
      workflowId,
      runId,
      timestamp: finalAt,
      payload: { outcome, durationMs, approvalCount: approvals.length },
    },
  });

  return {
    outcome,
    approvals,
    completedAt: finalAt,
    durationMs,
    evidenceLedgerId: outcomeEvidenceResult.evidenceId,
  };
}
