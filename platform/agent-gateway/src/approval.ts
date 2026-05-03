/**
 * SZL Holdings — Agent Gateway: Approval Routing
 * Phase 11 — Agent Gateway
 *
 * When the OPA decision requires human approval, this module initiates a
 * Temporal approval workflow (from platform/temporal/workflows/approval-workflow.ts)
 * and returns the approval outcome.
 *
 * In local/test mode (TEMPORAL_ENDPOINT=local) the approval is auto-approved
 * immediately to allow integration tests to complete without a live Temporal cluster.
 */

import { randomUUID } from 'crypto';
import type { ApprovalRequest, ApprovalOutcome, EvidenceRecord, OpaDecision } from './types.js';

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
// Remote Temporal approval request
// ---------------------------------------------------------------------------

async function requestTemporalApproval(
  temporalEndpoint: string,
  req: ApprovalRequest,
  evidence: EvidenceRecord,
): Promise<ApprovalOutcome> {
  const startUrl = `${temporalEndpoint}/api/v1/namespaces/default/workflows`;

  const workflowInput = {
    operationType: `agent_${evidence.capability}`,
    targetService: evidence.target,
    targetEnvironment: 'development',
    targetVersion: 'agent-gateway',
    policyId: evidence.policyDecision.policyId,
    initiatedBy: evidence.actor,
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

  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowId: `agent-approval-${req.approvalId}`,
      workflowType: { name: 'approvalWorkflow' },
      taskQueue: { name: 'approval-task-queue' },
      input: { payloads: [{ data: Buffer.from(JSON.stringify(workflowInput)).toString('base64') }] },
    }),
  });

  if (!startRes.ok) {
    throw new ApprovalError(
      `Failed to start Temporal approval workflow: HTTP ${startRes.status}`,
      req.approvalId,
    );
  }

  // Poll for completion (simplified — production would use a Temporal SDK client)
  const pollUrl = `${temporalEndpoint}/api/v1/namespaces/default/workflows/agent-approval-${req.approvalId}/runs/-/result`;
  const deadline = Date.now() + req.timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2_000));
    const pollRes = await fetch(pollUrl);

    if (pollRes.status === 200) {
      const data = (await pollRes.json()) as { result?: { payloads?: Array<{ data: string }> } };
      const payload = data.result?.payloads?.[0]?.data;
      if (payload) {
        const outcome = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as {
          outcome: string;
          approvals?: Array<{ approver: string; decidedAt: string }>;
        };

        if (outcome.outcome === 'approved') {
          return {
            approvalId: req.approvalId,
            outcome: 'approved',
            approvedBy: outcome.approvals?.[0]?.approver,
            approvedAt: outcome.approvals?.[0]?.decidedAt ?? new Date().toISOString(),
          };
        } else {
          return {
            approvalId: req.approvalId,
            outcome: 'rejected',
            rejectedBy: outcome.approvals?.[0]?.approver,
            rejectedReason: 'Rejected via Temporal approval workflow',
          };
        }
      }
    }
  }

  return { approvalId: req.approvalId, outcome: 'expired' };
}

// ---------------------------------------------------------------------------
// Public approval entry point
// ---------------------------------------------------------------------------

export async function routeApproval(
  decision: OpaDecision,
  evidence: EvidenceRecord,
  temporalEndpoint: string,
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
    return approveLocal(req);
  }

  return requestTemporalApproval(temporalEndpoint, req, evidence);
}
