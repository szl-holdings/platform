/**
 * SZL Holdings — Agent Gateway: Approval Routing
 * Phase 11 — Agent Gateway
 *
 * When the OPA decision requires human approval, this module starts the
 * Temporal `approvalWorkflow` and waits for the `approvalDecisionSignal`
 * round trip to resolve the workflow. This repository does not ship that
 * worker; live startup therefore requires an authenticated deployed
 * workflow/task-queue round-trip proof.
 *
 * Two modes:
 *   - temporalEndpoint === 'local'  → auto-approves immediately (used by
 *     unit/integration tests that do not have a Temporal cluster).
 *   - temporalEndpoint is a host:port → uses the @temporalio/client SDK to
 *     start the workflow against a live Temporal Frontend service. The caller
 *     awaits the workflow result, which resolves once the
 *     `approvalDecisionSignal` is received and counted by the workflow.
 */

import { randomUUID } from 'node:crypto';
import { enforceApprovalGroupCount } from './approval-readiness.js';
import { agentOperationType } from './operation-type.js';
import { isProductionRuntime } from './runtime-environment.js';
import type {
  AgentActionRequest,
  ApprovalOutcome,
  ApprovalRequest,
  ApprovalWorkflowProbeConfig,
  CallerIdentity,
  EvidenceRecord,
  OpaDecision,
} from './types.js';

export class ApprovalError extends Error {
  constructor(
    message: string,
    public readonly approvalId: string,
  ) {
    super(message);
    this.name = 'ApprovalError';
  }
}

// ---------------------------------------------------------------------------
// Local (test) approval — auto-approves for dev integration tests
// ---------------------------------------------------------------------------

function approveLocal(req: ApprovalRequest): ApprovalOutcome {
  return {
    approvalId: req.approvalId,
    outcome: 'approved',
    approvedBy: 'platform-bot (local-auto-approve)',
    approvedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Remote Temporal approval — uses @temporalio/client SDK
// ---------------------------------------------------------------------------

/**
 * Lazily import the Temporal client so that:
 *   - The agent-gateway has zero hard runtime dependency on @temporalio/client
 *     when running in local/test mode.
 *   - Tests that never touch the live path can run without the native bridge.
 */
async function loadTemporalClient(): Promise<typeof import('@temporalio/client')> {
  try {
    return await import('@temporalio/client');
  } catch (err) {
    throw new ApprovalError(
      `Temporal client SDK is not installed. Install @temporalio/client to use a live TEMPORAL_ENDPOINT. (${err instanceof Error ? err.message : String(err)})`,
      'unknown',
    );
  }
}

/**
 * Build the workflow input expected by `approvalWorkflow`. The shape mirrors
 * `ApprovalWorkflowInput` from platform/temporal/types/workflow-types.ts.
 *
 * Both `targetEnvironment` and `operationType` are sourced from the same
 * places the OPA evaluation used:
 *   - `targetEnvironment` comes straight from the inbound `AgentActionRequest`
 *     (NOT inferred from the policyId, which is brittle).
 *   - `operationType` is built with the same `agentOperationType` helper
 *     that authz.ts used for the OPA input, guaranteeing the workflow
 *     records the same operation type that policy actually evaluated.
 */
function buildWorkflowInput(
  req: ApprovalRequest,
  evidence: EvidenceRecord,
  request: AgentActionRequest,
  caller: CallerIdentity,
) {
  return {
    operationType: agentOperationType(request.capability),
    targetService: request.target,
    targetEnvironment: request.targetEnvironment,
    targetVersion: 'agent-gateway',
    policyId: evidence.policyDecision.policyId,
    initiatedBy: evidence.actor,
    orgId: caller.orgId,
    requestedApproverGroups: req.requiredGroups,
    requiredApprovalCount: req.requiredApprovals,
    timeoutMs: req.timeoutMs,
    context: {
      correlationId: req.correlationId,
      evidenceId: req.evidenceId,
      capability: evidence.capability,
      model: evidence.model,
      promptHash: evidence.promptHash,
    },
  };
}

async function requestTemporalApproval(
  temporalEndpoint: string,
  req: ApprovalRequest,
  evidence: EvidenceRecord,
  request: AgentActionRequest,
  caller: CallerIdentity,
  workflowConfig: ApprovalWorkflowProbeConfig,
): Promise<ApprovalOutcome> {
  const { Connection, Client } = await loadTemporalClient();

  let connection: Awaited<ReturnType<typeof Connection.connect>>;
  try {
    connection = await Connection.connect({ address: temporalEndpoint });
  } catch (err) {
    throw new ApprovalError(
      `Failed to connect to Temporal at ${temporalEndpoint}: ${err instanceof Error ? err.message : String(err)}`,
      req.approvalId,
    );
  }

  try {
    const client = new Client({ connection, namespace: workflowConfig.namespace });
    const workflowId = `agent-approval-${req.approvalId}`;

    const handle = await client.workflow.start('approvalWorkflow', {
      taskQueue: workflowConfig.taskQueue,
      workflowId,
      args: [buildWorkflowInput(req, evidence, request, caller)],
      workflowExecutionTimeout: req.timeoutMs + 60_000,
    });

    // Wait for the workflow to resolve. The workflow blocks on the
    // `approvalDecisionSignal` (or its internal timeout), so awaiting the
    // result is what makes this an end-to-end signal round trip.
    const result = (await handle.result()) as {
      outcome?: unknown;
      approvals?: unknown;
    };

    if (
      result === null ||
      typeof result !== 'object' ||
      (result.outcome !== 'approved' &&
        result.outcome !== 'rejected' &&
        result.outcome !== 'expired') ||
      !Array.isArray(result.approvals)
    ) {
      throw new ApprovalError(
        'Temporal approvalWorkflow returned an invalid result',
        req.approvalId,
      );
    }

    const approvals = result.approvals.map((approval) => {
      if (approval === null || typeof approval !== 'object' || Array.isArray(approval)) {
        throw new ApprovalError(
          'Temporal approvalWorkflow returned a malformed approval record',
          req.approvalId,
        );
      }
      const record = approval as Record<string, unknown>;
      if (
        typeof record.approverUserId !== 'string' ||
        !Array.isArray(record.approverGroups) ||
        typeof record.decidedAt !== 'string' ||
        !Number.isFinite(Date.parse(record.decidedAt)) ||
        (record.notes !== null && typeof record.notes !== 'string')
      ) {
        throw new ApprovalError(
          'Temporal approvalWorkflow returned a malformed approval record',
          req.approvalId,
        );
      }
      return {
        approverUserId: record.approverUserId,
        approverGroups: record.approverGroups as string[],
        decidedAt: record.decidedAt,
        notes: record.notes as string | null,
      };
    });

    if (result.outcome === 'approved') {
      const enforced = enforceApprovalGroupCount(
        req.requiredApprovals,
        req.requiredGroups,
        approvals,
      );
      if (enforced.outcome !== 'approved') {
        throw new ApprovalError(
          'Temporal approvalWorkflow claimed approval without the required unique group-bound count',
          req.approvalId,
        );
      }
      const first = approvals[0];
      return {
        approvalId: req.approvalId,
        outcome: 'approved',
        approvedBy: first?.approverUserId,
        approvedAt: first?.decidedAt ?? new Date().toISOString(),
      };
    }

    if (result.outcome === 'rejected') {
      const first = approvals[0];
      return {
        approvalId: req.approvalId,
        outcome: 'rejected',
        rejectedBy: first?.approverUserId,
        rejectedReason: first?.notes ?? 'Rejected via Temporal approval workflow',
      };
    }

    return { approvalId: req.approvalId, outcome: 'expired' };
  } finally {
    await connection.close().catch(() => {
      /* best-effort cleanup */
    });
  }
}

// ---------------------------------------------------------------------------
// Public approval entry point
// ---------------------------------------------------------------------------

export async function routeApproval(
  decision: OpaDecision,
  evidence: EvidenceRecord,
  request: AgentActionRequest,
  caller: CallerIdentity,
  temporalEndpoint: string,
  workflowConfig: ApprovalWorkflowProbeConfig | null,
  approvalTimeoutMs: number,
): Promise<ApprovalOutcome> {
  if (decision.requiredApprovals === 0) {
    return {
      approvalId: randomUUID(),
      outcome: 'not_required',
    };
  }

  const req: ApprovalRequest = {
    approvalId: randomUUID(),
    correlationId: evidence.correlationId,
    evidenceId: evidence.evidenceId,
    requiredApprovals: decision.requiredApprovals,
    requiredGroups: decision.requiredGroups,
    timeoutMs: approvalTimeoutMs,
  };

  if (temporalEndpoint === 'local') {
    if (isProductionRuntime()) {
      throw new ApprovalError(
        'Local auto-approval is forbidden in production; configure live Temporal',
        req.approvalId,
      );
    }
    return approveLocal(req);
  }

  if (!workflowConfig) {
    throw new ApprovalError(
      'Live Temporal approval is on HOLD until the workflow proof configuration is present',
      req.approvalId,
    );
  }

  return requestTemporalApproval(temporalEndpoint, req, evidence, request, caller, workflowConfig);
}
