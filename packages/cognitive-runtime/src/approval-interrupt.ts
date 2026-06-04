/**
 * Approval interrupt support for the cognitive runtime.
 *
 * A workflow node that requires human approval returns an ApprovalInterruptSpec
 * from its step executor (via the special `__approvalInterrupt` key in the
 * output). The orchestrator detects this, persists the checkpoint, writes an
 * ApprovalRequest to the governed approvals inbox, sets the run status to
 * `pending_approval`, and yields control. Later, an operator calls the decide
 * API; the run is resumed from the checkpoint with the decision injected.
 *
 * Resumption is idempotent: repeated calls with the same decisionId are no-ops.
 */

import type {
  ApprovalDecision,
  ApprovalInterruptSpec,
  ApprovalRequest,
} from '@szl-holdings/contracts/governance';
import {
  type CreateApprovalRequestOptions,
  createApprovalRequest,
  type DecideApprovalOptions,
  type DecideApprovalResult,
  decideApproval,
} from '@workspace/approvals-inbox';

export type { ApprovalDecision, ApprovalInterruptSpec, ApprovalRequest };

// ─── Detection ───────────────────────────────────────────────────────────────

/**
 * Return the ApprovalInterruptSpec if the step output signals an approval
 * interrupt, or undefined otherwise.
 *
 * A step executor signals an interrupt by returning an object with the
 * `__approvalInterrupt` key:
 *   return { __approvalInterrupt: { actionLabel, payload, policyReason, ... } }
 */
export function extractApprovalInterrupt(stepOutput: unknown): ApprovalInterruptSpec | undefined {
  if (!stepOutput || typeof stepOutput !== 'object') return undefined;
  const out = stepOutput as Record<string, unknown>;
  const spec = out.__approvalInterrupt;
  if (!spec || typeof spec !== 'object') return undefined;
  const s = spec as Record<string, unknown>;
  if (typeof s.actionLabel !== 'string') return undefined;
  return {
    actionLabel: s.actionLabel as string,
    payload: (s.payload as Record<string, unknown>) ?? {},
    policyReason: (s.policyReason as string) ?? 'approval required by policy',
    evidenceSummary: (s.evidenceSummary as string) ?? '',
    suggestedDecision: (s.suggestedDecision as 'approve' | 'deny' | 'escalate') ?? 'approve',
    expiresAt: typeof s.expiresAt === 'number' ? s.expiresAt : Date.now() + 24 * 60 * 60 * 1000,
  };
}

// ─── Request creation ─────────────────────────────────────────────────────────

export interface RaiseApprovalInterruptOptions {
  runId: string;
  traceId?: string;
  tenantId?: string;
  profileId?: string;
  stepId: string;
  stepName: string;
  checkpointRef?: string;
  interrupt: ApprovalInterruptSpec;
}

/**
 * Create and persist an ApprovalRequest for a workflow step that requires
 * human approval. Returns the created request.
 */
export function raiseApprovalInterrupt(opts: RaiseApprovalInterruptOptions): ApprovalRequest {
  const createOpts: CreateApprovalRequestOptions = {
    runId: opts.runId,
    stepId: opts.stepId,
    stepName: opts.stepName,
    interrupt: opts.interrupt,
  };
  if (opts.traceId !== undefined) createOpts.traceId = opts.traceId;
  if (opts.tenantId !== undefined) createOpts.tenantId = opts.tenantId;
  if (opts.profileId !== undefined) createOpts.profileId = opts.profileId;
  if (opts.checkpointRef !== undefined) createOpts.checkpointRef = opts.checkpointRef;
  return createApprovalRequest(createOpts);
}

// ─── Decision ─────────────────────────────────────────────────────────────────

export interface ResolveApprovalInterruptOptions extends DecideApprovalOptions {}

/**
 * Record an operator decision for a pending ApprovalRequest. Returns the
 * decision, the updated request, and optionally a governance memory record.
 * Idempotent on repeated calls with the same requestId + verdict.
 */
export function resolveApprovalInterrupt(
  opts: ResolveApprovalInterruptOptions,
): DecideApprovalResult {
  return decideApproval(opts);
}

// ─── Context injection ────────────────────────────────────────────────────────

/**
 * Produce the CognitiveContext patch that should be merged when resuming a
 * run after an approval decision. The approval decision is injected into
 * the run's metadata so downstream phases can read it.
 */
export function buildResumeContext(
  checkpointRef: string,
  decision: ApprovalDecision,
): {
  resumeFromCheckpoint: string;
  metadata: Record<string, unknown>;
} {
  return {
    resumeFromCheckpoint: checkpointRef,
    metadata: {
      approvalDecision: {
        requestId: decision.requestId,
        verdict: decision.verdict,
        actor: decision.actor,
        reason: decision.reason,
        decidedAt: decision.decidedAt,
      },
    },
  };
}
