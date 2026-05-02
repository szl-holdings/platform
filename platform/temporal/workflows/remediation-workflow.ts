/**
 * Remediation workflow — automated/semi-automated remediation for policy drift,
 * health degradation, and security incidents.
 *
 * Strategies: rollback | patch | scale-down | circuit-break | manual
 * Signal: humanDecisionSignal (used when autoRemediate=false or maxAttempts exhausted)
 */

import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  workflowInfo,
} from "@temporalio/workflow";
import type * as approvalActivities from "../activities/approval-activities.js";
import type {
  RemediationWorkflowInput,
  RemediationWorkflowResult,
  RemediationTimelineEvent,
} from "../types/workflow-types.js";

const {
  evaluatePolicyActivity,
  recordEvidenceActivity,
  emitLyteVisibilityActivity,
  checkServiceHealthActivity,
  deployServiceActivity,
  scaleServiceActivity,
  toggleCircuitBreakerActivity,
} = proxyActivities<typeof approvalActivities>({
  startToCloseTimeout: "2m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "5s",
    backoffCoefficient: 2,
    maximumInterval: "60s",
  },
});

export const humanDecisionSignal = defineSignal<[{ decision: "proceed" | "abort"; notes: string }]>(
  "humanDecision"
);

export async function remediationWorkflow(
  input: RemediationWorkflowInput
): Promise<RemediationWorkflowResult> {
  const { workflowId, runId } = workflowInfo();
  const timeline: RemediationTimelineEvent[] = [];
  let humanDecision: { decision: "proceed" | "abort"; notes: string } | null = null;

  setHandler(humanDecisionSignal, (payload) => {
    humanDecision = payload;
  });

  const addTimeline = (step: string, outcome: "success" | "failure" | "skipped", details: string) => {
    timeline.push({ timestamp: new Date().toISOString(), step, outcome, details });
  };

  // Step 1: Policy check
  const policyResult = await evaluatePolicyActivity({
    policyPackage: "szl.environment",
    inputData: {
      operation_type: "remediation",
      environment: input.environment,
      service: input.affectedService,
      strategy: input.strategy,
    },
  });

  if (!policyResult.allowed) {
    addTimeline("policy-check", "failure", policyResult.denialMessages.join("; "));
    const evidenceResult = await recordEvidenceActivity({
      category: "approval",
      actorId: "temporal-remediation-workflow",
      actorType: "temporal-workflow",
      action: "remediation-blocked-by-policy",
      outcome: "failure",
      service: input.affectedService,
      environment: input.environment,
      details: { workflowId, policyDenials: policyResult.denialMessages },
    });
    return {
      status: "failed",
      strategy: input.strategy,
      attemptsCount: 0,
      resolvedAt: null,
      escalatedTo: null,
      evidenceLedgerId: evidenceResult.evidenceId,
      timeline,
    };
  }
  addTimeline("policy-check", "success", "Remediation is policy-compliant");

  // Step 2: Record initiation
  const initEvidenceResult = await recordEvidenceActivity({
    category: "approval",
    actorId: input.initiatedBy,
    actorType: "user",
    action: "remediation-initiated",
    outcome: "pending",
    service: input.affectedService,
    environment: input.environment,
    details: {
      workflowId, runId, strategy: input.strategy,
      incidentId: input.incidentId, autoRemediate: input.autoRemediate,
    },
  });

  // Step 3: Emit Lyte visibility
  await emitLyteVisibilityActivity({
    event: {
      eventType: "remediation-workflow.started",
      workflowType: "remediation-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: {
        incidentId: input.incidentId,
        affectedService: input.affectedService,
        strategy: input.strategy,
        autoRemediate: input.autoRemediate,
      },
    },
  });

  // Step 4: If manual approval required before each step, wait for human signal
  if (!input.autoRemediate) {
    addTimeline("await-human-approval", "skipped", "Waiting for human approval to proceed");
    const approved = await condition(() => humanDecision !== null, "30m");
    if (!approved || humanDecision?.decision === "abort") {
      addTimeline("human-decision", "failure", `Human aborted: ${humanDecision?.notes ?? "timeout"}`);
      const evidenceResult = await recordEvidenceActivity({
        category: "approval",
        actorId: humanDecision?.decision === "abort" ? input.initiatedBy : "system",
        actorType: "user",
        action: "remediation-aborted-by-human",
        outcome: "failure",
        service: input.affectedService,
        environment: input.environment,
        details: { workflowId, notes: humanDecision?.notes },
      });
      return {
        status: "escalated",
        strategy: input.strategy,
        attemptsCount: 0,
        resolvedAt: null,
        escalatedTo: input.initiatedBy,
        evidenceLedgerId: evidenceResult.evidenceId,
        timeline,
      };
    }
    addTimeline("human-decision", "success", `Human approved: ${humanDecision!.notes}`);
  }

  // Step 5: Execute strategy
  let attemptsCount = 0;
  let strategySuccess = false;

  for (let attempt = 1; attempt <= input.maxAttempts && !strategySuccess; attempt++) {
    attemptsCount = attempt;
    try {
      if (input.strategy === "rollback") {
        // Rollback to the last known-good image tag via Argo CD
        await deployServiceActivity({
          service: input.affectedService,
          environment: input.environment,
          imageTag: "previous",  // Argo CD resolves this from history
          gitCommitSha: "HEAD~1",
          approvalTraceId: workflowId,
        });
        addTimeline(`rollback-attempt-${attempt}`, "success", "Rollback deployment triggered");
      } else if (input.strategy === "scale-down") {
        // Scale to zero via Argo CD parameter override — isolates the degraded service
        await scaleServiceActivity({
          service: input.affectedService,
          environment: input.environment,
          targetReplicas: 0,
          reason: `Incident ${input.incidentId}: scale-down remediation`,
          approvalTraceId: workflowId,
        });
        addTimeline(`scale-down-attempt-${attempt}`, "success", "Service scaled to zero replicas via Argo CD");
      } else if (input.strategy === "circuit-break") {
        // Open the circuit breaker — excludes the service from upstream routing
        await toggleCircuitBreakerActivity({
          service: input.affectedService,
          environment: input.environment,
          action: "open",
          reason: `Incident ${input.incidentId}: circuit-break remediation`,
          approvalTraceId: workflowId,
        });
        addTimeline(`circuit-break-attempt-${attempt}`, "success", "Circuit breaker opened — service excluded from routing");
      } else if (input.strategy === "manual") {
        addTimeline("manual-escalation", "skipped", "Escalated to on-call team");
        break;
      }

      // Verify health after remediation
      const health = await checkServiceHealthActivity({
        service: input.affectedService,
        environment: input.environment,
        expectedMinutes: 2,
      });

      if (health.healthy) {
        strategySuccess = true;
        addTimeline("health-check", "success", `Service healthy after ${attempt} attempt(s)`);
      } else {
        addTimeline("health-check", "failure", `Service still unhealthy after attempt ${attempt}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addTimeline(`strategy-attempt-${attempt}`, "failure", `Attempt ${attempt} failed: ${message}`);
    }
  }

  const status = input.strategy === "manual"
    ? "escalated"
    : strategySuccess
      ? "resolved"
      : "failed";

  const outcomeEvidenceResult = await recordEvidenceActivity({
    category: "approval",
    actorId: "temporal-remediation-workflow",
    actorType: "temporal-workflow",
    action: `remediation-${status}`,
    outcome: strategySuccess ? "success" : "failure",
    service: input.affectedService,
    environment: input.environment,
    details: { workflowId, status, attemptsCount, strategy: input.strategy },
  });

  await emitLyteVisibilityActivity({
    event: {
      eventType: `remediation-workflow.${status}`,
      workflowType: "remediation-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: { status, attemptsCount, strategy: input.strategy },
    },
  });

  return {
    status,
    strategy: input.strategy,
    attemptsCount,
    resolvedAt: strategySuccess ? new Date().toISOString() : null,
    escalatedTo: status === "escalated" ? input.initiatedBy : null,
    evidenceLedgerId: outcomeEvidenceResult.evidenceId,
    timeline,
  };
}
