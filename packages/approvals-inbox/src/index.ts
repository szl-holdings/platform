/**
 * @workspace/approvals-inbox
 *
 * Shared approvals inbox for the KORA platform.
 *
 * Receives approval actions from Decision Center and other governed surfaces.
 * Each action is stored with full provenance: verdict, proof ref, simulation ID,
 * actor, timestamp. Acts as the single source of truth for approval state
 * across surfaces (Decision Center, Run Console, Policy Center).
 *
 * Phase 4 extension: adds pending approval request lifecycle so agents-core
 * can write a PendingApprovalRequest on gate entry, and operators can see and
 * act on pending requests in the same inbox UI.
 *
 * Usage:
 *   import { submitApprovalAction, getApprovalForRecommendation } from "@workspace/approvals-inbox";
 *   import { submitPendingApprovalRequest, resolvePendingApprovalRequest } from "@workspace/approvals-inbox";
 */

export type ApprovalVerdict = 'approved' | 'rejected' | 'escalated';

export interface ApprovalAction {
  id: string;
  recommendationId: string;
  verdict: ApprovalVerdict;
  actor: string;
  timestamp: number;
  proofRef: string;
  simulationId: string | undefined;
  note: string | undefined;
  domain: string;
  surface: string;
}

export interface SubmitApprovalOptions {
  simulationId?: string;
  note?: string;
  actor?: string;
  domain?: string;
  surface?: string;
}

export type PendingApprovalStatus = 'pending' | 'approved' | 'rejected' | 'timed_out' | 'escalated';

export interface PendingApprovalRequest {
  id: string;
  runId: string;
  stepId: string;
  stepName: string;
  toolId?: string;
  action: string;
  justification: string;
  projectedImpact: string;
  projectedRisk: string;
  requestedBy: string;
  domain: string;
  surface: string;
  submittedAt: number;
  expiresAt: number;
  status: PendingApprovalStatus;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface SubmitPendingApprovalRequestOptions {
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
}

const _inbox: ApprovalAction[] = [];
let _seq = 1000;

const _pendingRequests = new Map<string, PendingApprovalRequest>();

function makeProofRef(verdict: ApprovalVerdict): string {
  const prefix = verdict === 'approved' ? 'APP' : verdict === 'rejected' ? 'REJ' : 'ESC';
  return `PROOF-${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function submitApprovalAction(
  recommendationId: string,
  verdict: ApprovalVerdict,
  options?: SubmitApprovalOptions,
): ApprovalAction {
  const action: ApprovalAction = {
    id: `approval-${++_seq}`,
    recommendationId,
    verdict,
    actor: options?.actor ?? 'Demo Mode — LYTE-SEED-v2',
    timestamp: Date.now(),
    proofRef: makeProofRef(verdict),
    simulationId: options?.simulationId,
    note: options?.note,
    domain: options?.domain ?? 'decision-center',
    surface: options?.surface ?? 'lyte',
  };
  _inbox.push(action);

  const pending = _pendingRequests.get(recommendationId);
  if (pending && pending.status === 'pending') {
    pending.status =
      verdict === 'approved' ? 'approved' : verdict === 'rejected' ? 'rejected' : 'escalated';
    pending.resolvedAt = Date.now();
    if (options?.actor !== undefined) pending.resolvedBy = options.actor;
    if (options?.note !== undefined) pending.resolutionNote = options.note;
  }

  return action;
}

export function submitPendingApprovalRequest(
  options: SubmitPendingApprovalRequestOptions,
): PendingApprovalRequest {
  const id = `${options.runId}::${options.stepId}`;
  const existing = _pendingRequests.get(id);
  if (existing && existing.status === 'pending') {
    return existing;
  }

  const now = Date.now();
  const timeoutMs = options.timeoutMs ?? 5 * 60_000;

  const request: PendingApprovalRequest = {
    id,
    runId: options.runId,
    stepId: options.stepId,
    stepName: options.stepName,
    action: options.action,
    justification: options.justification,
    projectedImpact: options.projectedImpact,
    projectedRisk: options.projectedRisk,
    requestedBy: options.requestedBy ?? 'agents-core',
    domain: options.domain ?? 'agents-core',
    surface: options.surface ?? 'run-console',
    submittedAt: now,
    expiresAt: now + timeoutMs,
    status: 'pending',
  };
  if (options.toolId !== undefined) request.toolId = options.toolId;

  _pendingRequests.set(id, request);
  return request;
}

export function resolvePendingApprovalRequest(
  runId: string,
  stepId: string,
  verdict: ApprovalVerdict,
  options?: { actor?: string; note?: string; simulationId?: string },
): ApprovalAction | undefined {
  const id = `${runId}::${stepId}`;
  const pending = _pendingRequests.get(id);
  if (!pending || pending.status !== 'pending') return undefined;

  const submitOpts: SubmitApprovalOptions = {
    domain: pending.domain,
    surface: pending.surface,
  };
  if (options?.actor !== undefined) submitOpts.actor = options.actor;
  if (options?.note !== undefined) submitOpts.note = options.note;
  if (options?.simulationId !== undefined) submitOpts.simulationId = options.simulationId;
  return submitApprovalAction(id, verdict, submitOpts);
}

export function getPendingApprovalRequests(filter?: {
  status?: PendingApprovalStatus;
  domain?: string;
  runId?: string;
}): readonly PendingApprovalRequest[] {
  let results = Array.from(_pendingRequests.values());
  if (filter?.status) results = results.filter((r) => r.status === filter.status);
  if (filter?.domain) results = results.filter((r) => r.domain === filter.domain);
  if (filter?.runId) results = results.filter((r) => r.runId === filter.runId);
  return results;
}

export function getPendingApprovalRequest(
  runId: string,
  stepId: string,
): PendingApprovalRequest | undefined {
  return _pendingRequests.get(`${runId}::${stepId}`);
}

export function markPendingApprovalTimedOut(runId: string, stepId: string): void {
  const id = `${runId}::${stepId}`;
  const pending = _pendingRequests.get(id);
  if (pending && pending.status === 'pending') {
    pending.status = 'timed_out';
    pending.resolvedAt = Date.now();
    pending.resolvedBy = 'system:timeout';
  }
}

export function getApprovalActions(): readonly ApprovalAction[] {
  return _inbox;
}

export function getApprovalForRecommendation(recommendationId: string): ApprovalAction | undefined {
  return [..._inbox].reverse().find((a) => a.recommendationId === recommendationId);
}

export function getInboxByVerdict(verdict: ApprovalVerdict): readonly ApprovalAction[] {
  return _inbox.filter((a) => a.verdict === verdict);
}

export function clearApprovalInbox(): void {
  _inbox.length = 0;
}

export function clearPendingApprovalRequests(): void {
  _pendingRequests.clear();
}

export function getInboxStats() {
  const pending = Array.from(_pendingRequests.values());
  return {
    total: _inbox.length,
    approved: _inbox.filter((a) => a.verdict === 'approved').length,
    rejected: _inbox.filter((a) => a.verdict === 'rejected').length,
    escalated: _inbox.filter((a) => a.verdict === 'escalated').length,
    pending: pending.filter((r) => r.status === 'pending').length,
    pendingTotal: pending.length,
  };
}

// ─── Governed approval-interrupt store (ACR) ──────────────────────────────────
// Re-exported for convenience so consumers can import from @workspace/approvals-inbox
// instead of @workspace/approvals-inbox/governed.
export {
  type CreateApprovalRequestOptions,
  createApprovalRequest,
  type DecideApprovalOptions,
  type DecideApprovalResult,
  decideApproval,
  defaultGovernedApprovalStore,
  type GovernanceMemoryRecord,
  type GovernedApprovalStoreBackend,
  getApprovalRequestById,
  InMemoryGovernedApprovalStore,
  listApprovalRequests,
  MutableGovernedApprovalStore,
} from './governed-store.js';
