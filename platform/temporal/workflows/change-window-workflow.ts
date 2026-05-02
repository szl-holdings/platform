/**
 * Change window workflow — approval-gated time windows for platform operations.
 *
 * States: pending → approved → executing → executed | rejected | expired | cancelled
 * Signals: approvalDecision, cancelChangeWindow, markExecuted
 */

import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  sleep,
  workflowInfo,
} from "@temporalio/workflow";
import type * as approvalActivities from "../activities/approval-activities.js";
import type {
  ChangeWindowWorkflowInput,
  ChangeWindowWorkflowResult,
} from "../types/workflow-types.js";

const {
  evaluatePolicyActivity,
  requestApprovalActivity,
  recordEvidenceActivity,
  emitLyteVisibilityActivity,
} = proxyActivities<typeof approvalActivities>({
  startToCloseTimeout: "5m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "5s",
    backoffCoefficient: 2,
    maximumInterval: "60s",
  },
});

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const changeWindowApprovalSignal = defineSignal<[{
  approverUserId: string;
  approverGroups: string[];
  decision: "approved" | "rejected";
  notes: string | null;
}]>("changeWindowApproval");

export const cancelChangeWindowSignal = defineSignal<[{ reason: string }]>(
  "cancelChangeWindow"
);

export const markChangeWindowExecutedSignal = defineSignal<[{
  executedBy: string;
  operationsSummary: string;
}]>("markChangeWindowExecuted");

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export async function changeWindowWorkflow(
  input: ChangeWindowWorkflowInput
): Promise<ChangeWindowWorkflowResult> {
  const { workflowId, runId } = workflowInfo();

  // Multi-approver accumulation state.
  // Every changeWindowApprovalSignal adds to collectedApprovals (approved signals)
  // or sets rejectedBy (any rejection immediately blocks the window).
  const collectedApprovals: Array<{
    approverUserId: string;
    approverGroups: string[];
    decision: "approved" | "rejected";
    notes: string | null;
    receivedAt: string;
  }> = [];
  let rejectedBy: { approverUserId: string; notes: string | null } | null = null;
  let cancelRequest: { reason: string } | null = null;
  let executionMark: { executedBy: string; operationsSummary: string } | null = null;

  // Helper: check whether all required approver groups have at least one approval.
  const allGroupsApproved = (): boolean => {
    if (input.requiredApprovers.length === 0) return true;
    const coveredGroups = new Set<string>();
    for (const approval of collectedApprovals) {
      if (approval.decision === "approved") {
        for (const grp of approval.approverGroups) {
          coveredGroups.add(grp);
        }
      }
    }
    return input.requiredApprovers.every((g) => coveredGroups.has(g));
  };

  setHandler(changeWindowApprovalSignal, (payload) => {
    if (payload.decision === "rejected") {
      // First rejection wins — record and stop accumulating
      if (rejectedBy === null) {
        rejectedBy = { approverUserId: payload.approverUserId, notes: payload.notes };
      }
    } else {
      collectedApprovals.push({ ...payload, receivedAt: new Date().toISOString() });
    }
  });
  setHandler(cancelChangeWindowSignal, (payload) => { cancelRequest = payload; });
  setHandler(markChangeWindowExecutedSignal, (payload) => { executionMark = payload; });

  // Step 1: Policy evaluation
  const policyResult = await evaluatePolicyActivity({
    policyPackage: "szl.environment",
    inputData: {
      operation_type: "change-window",
      environment: input.environment,
      services: input.targetServices,
      requestor_groups: input.requiredApprovers,
      risk_level: input.riskLevel,
    },
  });

  if (!policyResult.allowed) {
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: input.requestedBy,
      actorType: "user",
      action: "change-window-blocked-by-policy",
      outcome: "failure",
      service: input.targetServices.join(","),
      environment: input.environment,
      details: { workflowId, denials: policyResult.denialMessages, changeWindowId: input.changeWindowId },
    });
    await emitLyteVisibilityActivity({
      event: {
        eventType: "change-window-workflow.policy-blocked",
        workflowType: "change-window-workflow",
        workflowId, runId,
        timestamp: new Date().toISOString(),
        payload: { changeWindowId: input.changeWindowId, denials: policyResult.denialMessages },
      },
    });
    return {
      changeWindowId: input.changeWindowId,
      status: "rejected",
      approvedBy: [],
      approvedAt: null,
      executedAt: null,
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Step 2: Request approval from required approvers
  await requestApprovalActivity({
    approvalRequestId: `cw-${input.changeWindowId}`,
    operationType: "change-window",
    targetService: input.targetServices.join(","),
    targetEnvironment: input.environment,
    targetVersion: "N/A",
    requestedApproverGroups: input.requiredApprovers,
    requiredCount: input.requiredApprovers.length,
    context: {
      changeWindowId: input.changeWindowId,
      title: input.title,
      proposedStart: input.proposedStart,
      proposedEnd: input.proposedEnd,
      riskLevel: input.riskLevel,
    },
    notificationChannels: [],
  });

  await emitLyteVisibilityActivity({
    event: {
      eventType: "change-window-workflow.pending-approval",
      workflowType: "change-window-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: { changeWindowId: input.changeWindowId, proposedStart: input.proposedStart, proposedEnd: input.proposedEnd },
    },
  });

  // Step 3: Wait for all required approver groups — or cancellation/rejection/timeout.
  // Approval is only satisfied when every group in `requiredApprovers` has sent at
  // least one "approved" signal.  A single "rejected" signal immediately blocks.
  const APPROVAL_TIMEOUT_MS = 172_800_000; // 48h

  const approvalResolved = await condition(
    () => allGroupsApproved() || rejectedBy !== null || cancelRequest !== null,
    APPROVAL_TIMEOUT_MS
  );

  // Handle cancellation (checked before rejection — cancel takes precedence if simultaneous)
  if (cancelRequest !== null) {
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: input.requestedBy,
      actorType: "user",
      action: "change-window-cancelled",
      outcome: "failure",
      service: input.targetServices.join(","),
      environment: input.environment,
      details: { workflowId, reason: cancelRequest.reason, changeWindowId: input.changeWindowId },
    });
    await emitLyteVisibilityActivity({
      event: {
        eventType: "change-window-workflow.cancelled",
        workflowType: "change-window-workflow",
        workflowId, runId,
        timestamp: new Date().toISOString(),
        payload: { changeWindowId: input.changeWindowId },
      },
    });
    return {
      changeWindowId: input.changeWindowId,
      status: "cancelled",
      approvedBy: [],
      approvedAt: null,
      executedAt: null,
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Handle rejection
  if (rejectedBy !== null) {
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: rejectedBy.approverUserId,
      actorType: "user",
      action: "change-window-rejected",
      outcome: "failure",
      service: input.targetServices.join(","),
      environment: input.environment,
      details: { workflowId, notes: rejectedBy.notes, changeWindowId: input.changeWindowId },
    });
    await emitLyteVisibilityActivity({
      event: {
        eventType: "change-window-workflow.rejected",
        workflowType: "change-window-workflow",
        workflowId, runId,
        timestamp: new Date().toISOString(),
        payload: { changeWindowId: input.changeWindowId, approverUserId: rejectedBy.approverUserId },
      },
    });
    return {
      changeWindowId: input.changeWindowId,
      status: "rejected",
      approvedBy: [],
      approvedAt: null,
      executedAt: null,
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Handle timeout — not all required groups approved within SLA
  if (!approvalResolved || !allGroupsApproved()) {
    const coveredGroups = new Set(collectedApprovals.flatMap((a) => a.approverGroups));
    const missingGroups = input.requiredApprovers.filter((g) => !coveredGroups.has(g));
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: "temporal-change-window-workflow",
      actorType: "temporal-workflow",
      action: "change-window-approval-expired",
      outcome: "failure",
      service: input.targetServices.join(","),
      environment: input.environment,
      details: { workflowId, changeWindowId: input.changeWindowId, missingApproverGroups: missingGroups },
    });
    await emitLyteVisibilityActivity({
      event: {
        eventType: "change-window-workflow.expired",
        workflowType: "change-window-workflow",
        workflowId, runId,
        timestamp: new Date().toISOString(),
        payload: { changeWindowId: input.changeWindowId, missingGroups },
      },
    });
    return {
      changeWindowId: input.changeWindowId,
      status: "expired",
      approvedBy: [],
      approvedAt: null,
      executedAt: null,
      evidenceLedgerId: evidenceResult.evidenceId,
    };
  }

  // Step 4: All required groups approved — record approval and wait for execution
  const approvedAt = new Date().toISOString();
  const approvedByUserIds = collectedApprovals.map((a) => a.approverUserId);

  const approvalEvidenceResult = await recordEvidenceActivity({
    category: "approval",
    actorId: approvedByUserIds.join(","),
    actorType: "user",
    action: "change-window-approved",
    outcome: "success",
    service: input.targetServices.join(","),
    environment: input.environment,
    details: {
      workflowId,
      changeWindowId: input.changeWindowId,
      approvedByUserIds,
      approvalNotes: collectedApprovals.map((a) => ({ approver: a.approverUserId, notes: a.notes })),
      proposedStart: input.proposedStart,
      proposedEnd: input.proposedEnd,
    },
  });

  await emitLyteVisibilityActivity({
    event: {
      eventType: "change-window-workflow.approved",
      workflowType: "change-window-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: {
        changeWindowId: input.changeWindowId,
        approvedAt,
        proposedStart: input.proposedStart,
        proposedEnd: input.proposedEnd,
      },
    },
  });

  // Step 5: Wait for execution mark or window expiry
  const windowEndTime = new Date(input.proposedEnd).getTime() - Date.now();
  const windowTimeoutMs = Math.max(windowEndTime, 0);

  const executed = await condition(
    () => executionMark !== null,
    windowTimeoutMs
  );

  // Handle window expiry without execution
  if (!executed || executionMark === null) {
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: "temporal-change-window-workflow",
      actorType: "temporal-workflow",
      action: "change-window-window-elapsed",
      outcome: "failure",
      service: input.targetServices.join(","),
      environment: input.environment,
      details: { workflowId, changeWindowId: input.changeWindowId, proposedEnd: input.proposedEnd },
    });
    await emitLyteVisibilityActivity({
      event: {
        eventType: "change-window-workflow.window-elapsed",
        workflowType: "change-window-workflow",
        workflowId, runId,
        timestamp: new Date().toISOString(),
        payload: { changeWindowId: input.changeWindowId },
      },
    });
    return {
      changeWindowId: input.changeWindowId,
      status: "expired",
      approvedBy: approvedByUserIds,
      approvedAt,
      executedAt: null,
      evidenceLedgerId: approvalEvidenceResult.evidenceId,
    };
  }

  // Step 6: Record successful execution
  const executedAt = new Date().toISOString();

  const executionEvidenceResult = await recordEvidenceActivity({
    category: "deployment",
    actorId: executionMark.executedBy,
    actorType: "user",
    action: "change-window-executed",
    outcome: "success",
    service: input.targetServices.join(","),
    environment: input.environment,
    details: {
      workflowId,
      changeWindowId: input.changeWindowId,
      executedBy: executionMark.executedBy,
      operationsSummary: executionMark.operationsSummary,
      approvedAt,
      executedAt,
    },
  });

  await emitLyteVisibilityActivity({
    event: {
      eventType: "change-window-workflow.executed",
      workflowType: "change-window-workflow",
      workflowId, runId,
      timestamp: executedAt,
      payload: {
        changeWindowId: input.changeWindowId,
        executedBy: executionMark.executedBy,
        operationsSummary: executionMark.operationsSummary,
      },
    },
  });

  return {
    changeWindowId: input.changeWindowId,
    status: "executed",
    approvedBy: approvedByUserIds,
    approvedAt,
    executedAt,
    evidenceLedgerId: executionEvidenceResult.evidenceId,
  };
}
