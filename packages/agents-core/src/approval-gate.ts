import {
  type ApprovalAction,
  type ApprovalVerdict,
  getApprovalForRecommendation,
  markPendingApprovalTimedOut,
  submitApprovalAction,
  submitPendingApprovalRequest,
} from '@workspace/approvals-inbox';
import { AgentRunError } from './errors.js';

export type { ApprovalVerdict };

export interface ApprovalGateRequest {
  runId: string;
  stepId: string;
  stepName: string;
  toolId?: string;
  action: string;
  justification: string;
  projectedImpact: string;
  projectedRisk: string;
  requestedBy?: string;
  domain?: string;
  surface?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface ApprovalGateResult {
  approved: boolean;
  verdict: ApprovalVerdict;
  approvalId: string;
  actor: string;
  note?: string;
  decisionLatencyMs: number;
}

const DEFAULT_TIMEOUT_MS = 5 * 60_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makePendingId(runId: string, stepId: string): string {
  return `${runId}::${stepId}`;
}

function resolveVerdict(
  runId: string,
  stepId: string,
  stepName: string,
  approval: ApprovalAction,
  decisionLatencyMs: number,
): ApprovalGateResult {
  if (approval.verdict === 'rejected') {
    throw new AgentRunError({
      message: `Approval rejected for step '${stepName}' — ${approval.note ?? 'no reason given'}`,
      category: 'approval_rejected',
      runId,
      stepId,
      retryable: false,
    });
  }

  return {
    approved: approval.verdict === 'approved',
    verdict: approval.verdict,
    approvalId: approval.id,
    actor: approval.actor,
    note: approval.note,
    decisionLatencyMs,
  };
}

export async function requestApproval(req: ApprovalGateRequest): Promise<ApprovalGateResult> {
  const {
    runId,
    stepId,
    stepName,
    toolId,
    action,
    justification,
    projectedImpact,
    projectedRisk,
    requestedBy = 'agents-core',
    domain = 'agents-core',
    surface = 'run-console',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  } = req;

  const pendingId = makePendingId(runId, stepId);
  const startedAt = Date.now();

  const existingApproval = getApprovalForRecommendation(pendingId);
  if (existingApproval) {
    return resolveVerdict(runId, stepId, stepName, existingApproval, 0);
  }

  submitPendingApprovalRequest({
    runId,
    stepId,
    stepName,
    toolId,
    action,
    justification,
    projectedImpact,
    projectedRisk,
    requestedBy,
    domain,
    surface,
    timeoutMs,
  });

  const expiresAt = startedAt + timeoutMs;

  try {
    while (Date.now() < expiresAt) {
      await delay(pollIntervalMs);

      const approval = getApprovalForRecommendation(pendingId);
      if (approval) {
        return resolveVerdict(runId, stepId, stepName, approval, Date.now() - startedAt);
      }
    }

    const elapsedMs = Date.now() - startedAt;
    markPendingApprovalTimedOut(runId, stepId);

    submitApprovalAction(pendingId, 'rejected', {
      actor: 'system:timeout',
      note: `Approval timed out after ${elapsedMs}ms — auto-rejected by agents-core`,
      domain,
      surface,
    });

    throw new AgentRunError({
      message: `Approval gate timed out after ${elapsedMs}ms for step '${stepName}'`,
      category: 'approval_timeout',
      runId,
      stepId,
      retryable: false,
    });
  } finally {
    // pending request remains in approvals-inbox for audit; auto-resolved on verdict or timeout
  }
}

export function preloadApproval(
  runId: string,
  stepId: string,
  verdict: ApprovalVerdict,
  options?: { actor?: string; note?: string },
): void {
  const pendingId = makePendingId(runId, stepId);
  submitApprovalAction(pendingId, verdict, {
    actor: options?.actor ?? 'preloaded-approval',
    note: options?.note,
  });
}
