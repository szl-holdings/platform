/**
 * Governed approval-interrupt store.
 *
 * This is the typed, append-only store for ApprovalRequest / ApprovalDecision
 * pairs created by the cognitive-runtime approval-interrupt mechanism. It lives
 * alongside (but is separate from) the existing PendingApprovalRequest API
 * which the KORA Decision Center uses.
 *
 * Decisions are append-only and signed with actor + timestamp. Denials and
 * escalations write a governance_memory stub that callers may forward to
 * memory-fabric.
 */

import {
  type ApprovalDecision,
  ApprovalDecisionSchema,
  type ApprovalInterruptSpec,
  type ApprovalRequest,
  ApprovalRequestSchema,
} from '@szl-holdings/contracts/governance';
import { signApprovalDecision } from '@workspace/guardian/crypto';
import { recordDecision as recordCalibrationDecision } from '@workspace/agents-evals/operator-calibration';
import { randomUUID } from 'node:crypto';

// ─── Store ───────────────────────────────────────────────────────────────────

export interface GovernedApprovalStoreBackend {
  saveRequest(req: ApprovalRequest): void;
  getRequest(id: string): ApprovalRequest | undefined;
  listRequests(filter?: {
    status?: ApprovalRequest['status'];
    tenantId?: string;
    profileId?: string;
    limit?: number;
    offset?: number;
  }): ApprovalRequest[];
  saveDecision(decision: ApprovalDecision): void;
  getDecision(requestId: string): ApprovalDecision | undefined;
  listDecisions(requestId: string): ApprovalDecision[];
}

export class InMemoryGovernedApprovalStore implements GovernedApprovalStoreBackend {
  private readonly requests = new Map<string, ApprovalRequest>();
  private readonly decisions = new Map<string, ApprovalDecision[]>();

  saveRequest(req: ApprovalRequest): void {
    this.requests.set(req.id, req);
  }

  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  listRequests(filter?: {
    status?: ApprovalRequest['status'];
    tenantId?: string;
    profileId?: string;
    limit?: number;
    offset?: number;
  }): ApprovalRequest[] {
    let all = Array.from(this.requests.values()).sort((a, b) => b.requestedAt - a.requestedAt);
    if (filter?.status) all = all.filter((r) => r.status === filter.status);
    if (filter?.tenantId) all = all.filter((r) => r.tenantId === filter.tenantId);
    if (filter?.profileId) all = all.filter((r) => r.profileId === filter.profileId);
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    return all.slice(offset, offset + limit);
  }

  saveDecision(decision: ApprovalDecision): void {
    const list = this.decisions.get(decision.requestId) ?? [];
    list.push(decision);
    this.decisions.set(decision.requestId, list);
  }

  getDecision(requestId: string): ApprovalDecision | undefined {
    return (this.decisions.get(requestId) ?? []).at(-1);
  }

  listDecisions(requestId: string): ApprovalDecision[] {
    return [...(this.decisions.get(requestId) ?? [])];
  }
}

// ─── Mutable singleton ────────────────────────────────────────────────────────

export class MutableGovernedApprovalStore implements GovernedApprovalStoreBackend {
  private backend: GovernedApprovalStoreBackend;

  constructor(initial: GovernedApprovalStoreBackend = new InMemoryGovernedApprovalStore()) {
    this.backend = initial;
  }

  setBackend(store: GovernedApprovalStoreBackend): void {
    this.backend = store;
  }

  getBackend(): GovernedApprovalStoreBackend {
    return this.backend;
  }

  saveRequest(req: ApprovalRequest): void {
    this.backend.saveRequest(req);
  }
  getRequest(id: string): ApprovalRequest | undefined {
    return this.backend.getRequest(id);
  }
  listRequests(f?: Parameters<GovernedApprovalStoreBackend['listRequests']>[0]): ApprovalRequest[] {
    return this.backend.listRequests(f);
  }
  saveDecision(d: ApprovalDecision): void {
    this.backend.saveDecision(d);
  }
  getDecision(requestId: string): ApprovalDecision | undefined {
    return this.backend.getDecision(requestId);
  }
  listDecisions(requestId: string): ApprovalDecision[] {
    return this.backend.listDecisions(requestId);
  }
}

export const defaultGovernedApprovalStore = new MutableGovernedApprovalStore();

// ─── Service API ─────────────────────────────────────────────────────────────

export interface CreateApprovalRequestOptions {
  runId: string;
  traceId?: string;
  tenantId?: string;
  profileId?: string;
  stepId: string;
  stepName: string;
  checkpointRef?: string;
  interrupt: ApprovalInterruptSpec;
}

export function createApprovalRequest(
  opts: CreateApprovalRequestOptions,
  store: GovernedApprovalStoreBackend = defaultGovernedApprovalStore,
): ApprovalRequest {
  const now = Date.now();
  const req = ApprovalRequestSchema.parse({
    id: randomUUID(),
    runId: opts.runId,
    traceId: opts.traceId,
    tenantId: opts.tenantId,
    profileId: opts.profileId,
    stepId: opts.stepId,
    stepName: opts.stepName,
    checkpointRef: opts.checkpointRef,
    interrupt: opts.interrupt,
    status: 'pending',
    requestedAt: now,
    expiresAt: opts.interrupt.expiresAt,
  });
  store.saveRequest(req);
  return req;
}

export interface DecideApprovalOptions {
  requestId: string;
  verdict: 'approve' | 'deny' | 'escalate';
  actor: string;
  reason: string;
  /** Caller-supplied idempotency key. When provided, subsequent calls with the
   *  same decisionId are no-ops and return the original decision without
   *  creating duplicates. When absent, idempotency falls back to (requestId). */
  decisionId?: string;
}

export interface GovernanceMemoryRecord {
  kind: 'governance_memory';
  requestId: string;
  runId: string;
  verdict: 'deny' | 'escalate';
  actor: string;
  reason: string;
  decidedAt: number;
}

export interface DecideApprovalResult {
  decision: ApprovalDecision;
  updatedRequest: ApprovalRequest;
  governanceMemory?: GovernanceMemoryRecord;
}

/**
 * Record an operator decision for an approval request. Decisions are
 * append-only and signed. Denials and escalations return a governance_memory
 * record that callers should forward to memory-fabric.
 *
 * Resumption is idempotent: repeated calls with the same requestId and verdict
 * return the same decision without creating duplicates.
 */
export function decideApproval(
  opts: DecideApprovalOptions,
  store: GovernedApprovalStoreBackend = defaultGovernedApprovalStore,
): DecideApprovalResult {
  const req = store.getRequest(opts.requestId);
  if (!req) throw new Error(`ApprovalRequest not found: ${opts.requestId}`);

  // Idempotency and finality enforcement:
  // - Once a request has been resolved (approved/denied/escalated) its decision
  //   is immutable. ANY subsequent call is rejected with an error unless the
  //   caller supplies the exact same decisionId that was originally recorded
  //   (repeat delivery of the same event → idempotent return).
  // - This prevents verdict overwriting (e.g., deny→approve) regardless of
  //   whether a decisionId is supplied.
  const existing = store.getDecision(opts.requestId);
  if (existing) {
    // Exact same decisionId: idempotent repeat — return unchanged
    if (opts.decisionId !== undefined && existing.decisionId === opts.decisionId) {
      const updatedReq = store.getRequest(opts.requestId)!;
      return { decision: existing, updatedRequest: updatedReq };
    }
    // Omitted decisionId from a new caller: treat as idempotent (original behaviour)
    if (opts.decisionId === undefined) {
      const updatedReq = store.getRequest(opts.requestId)!;
      return { decision: existing, updatedRequest: updatedReq };
    }
    // Different decisionId: the request is already resolved — reject
    throw new Error(
      `ApprovalRequest ${opts.requestId} already has a recorded decision (verdict: ${existing.verdict}). ` +
        `Provide the original decisionId to retrieve the existing decision.`,
    );
  }

  const now = Date.now();
  const resolvedDecisionId = opts.decisionId ?? randomUUID();
  const { signature, publicKeyHex } = signApprovalDecision({
    requestId: opts.requestId,
    verdict: opts.verdict,
    actor: opts.actor,
    decidedAt: now,
    tenantId: req.tenantId,
  });
  const decision = ApprovalDecisionSchema.parse({
    decisionId: resolvedDecisionId,
    requestId: opts.requestId,
    verdict: opts.verdict,
    actor: opts.actor,
    reason: opts.reason,
    decidedAt: now,
    signature,
    publicKeyHex,
  });

  store.saveDecision(decision);

  const newStatus: ApprovalRequest['status'] =
    opts.verdict === 'approve' ? 'approved' : opts.verdict === 'deny' ? 'denied' : 'escalated';

  const updatedReq: ApprovalRequest = {
    ...req,
    status: newStatus,
    resolvedAt: now,
    resolvedBy: opts.actor,
  };
  store.saveRequest(updatedReq);

  // Sotopia-RL calibration: every operator decision nudges the per-(operator, domain)
  // Λ-Resonance weight that UniRec consults when ranking briefings. We use the
  // request's `kind` as the domain proxy (e.g. 'maritime.standby') — this stays
  // safe because the calibration band is clamped to [0.80, 1.20] inside the
  // calibration module itself.
  recordCalibrationDecision({
    operatorId: opts.actor,
    domain: req.kind,
    verdict: opts.verdict,
  });

  let governanceMemory: GovernanceMemoryRecord | undefined;
  if (opts.verdict === 'deny' || opts.verdict === 'escalate') {
    governanceMemory = {
      kind: 'governance_memory',
      requestId: opts.requestId,
      runId: req.runId,
      verdict: opts.verdict,
      actor: opts.actor,
      reason: opts.reason,
      decidedAt: now,
    };
  }

  if (governanceMemory !== undefined) {
    return { decision, updatedRequest: updatedReq, governanceMemory };
  }
  return { decision, updatedRequest: updatedReq };
}

export function getApprovalRequestById(
  id: string,
  store: GovernedApprovalStoreBackend = defaultGovernedApprovalStore,
): ApprovalRequest | undefined {
  return store.getRequest(id);
}

export function listApprovalRequests(
  filter?: Parameters<GovernedApprovalStoreBackend['listRequests']>[0],
  store: GovernedApprovalStoreBackend = defaultGovernedApprovalStore,
): ApprovalRequest[] {
  return store.listRequests(filter);
}
