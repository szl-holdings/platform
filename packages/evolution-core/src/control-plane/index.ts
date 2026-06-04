/**
 * Evolution Control Plane — Layer A
 *
 * Policy registry, state machine, experiment registry, promotion service,
 * rollback service, candidate comparator, and audit event emission.
 *
 * Wires to: validation-gate.ts, reflection-engine, policy-engine, proof-chain,
 * and the PER DB tables.
 */

import type {
  CandidatePolicy,
  PEREventType,
  PolicyState,
  PolicyStateTransition,
} from '../types.js';
import { randomUUID } from 'node:crypto';

const VALID_TRANSITIONS: Partial<Record<PolicyState, PolicyState[]>> = {
  draft: ['shadow', 'archived'],
  shadow: ['review', 'archived', 'rolled_back'],
  review: ['active', 'rolled_back', 'archived'],
  active: ['rolled_back', 'archived'],
  rolled_back: ['archived', 'draft'],
  archived: [],
};

export function isValidTransition(from: PolicyState, to: PolicyState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateStateTransition(
  from: PolicyState,
  to: PolicyState,
): { valid: boolean; reason?: string } {
  if (!isValidTransition(from, to)) {
    return {
      valid: false,
      reason: `Invalid state transition: ${from} → ${to}. Allowed: ${VALID_TRANSITIONS[from]?.join(', ') ?? 'none'}`,
    };
  }
  return { valid: true };
}

export function buildAuditEvent(
  type: PEREventType['type'],
  opts: {
    candidateId?: string;
    runId?: string;
    actorId?: string | number;
    metadata?: Record<string, unknown>;
  },
): PEREventType {
  return {
    type,
    candidateId: opts.candidateId,
    runId: opts.runId,
    actorId: opts.actorId,
    metadata: opts.metadata,
    timestamp: new Date().toISOString(),
  };
}

export async function emitAuditChainEvent(
  event: PEREventType,
  orgId?: number,
): Promise<void> {
  try {
    const { logActivity } = await import('@szl-holdings/audit');
    await logActivity({
      action: event.type as string,
      entityType: 'policy_evolution',
      entityId: event.candidateId ?? 'per-system',
      actorLabel: event.actorId ? String(event.actorId) : 'per-system',
      metadata: {
        domain: 'precision_evolution_runtime',
        ...event.metadata,
      },
    } as Parameters<typeof logActivity>[0]);
  } catch {
  }
}

export interface PolicyComparison {
  candidateId: string;
  baselineId: string;
  scoreDelta: number;
  driftDelta: number;
  latencyDelta: number;
  regression: boolean;
  recommendation: 'promote_candidate' | 'keep_baseline' | 'needs_review';
}

export function compareCandidateToBaseline(opts: {
  candidateScore: number;
  baselineScore: number;
  candidateDrift: number;
  candidateLatencyMs: number;
  baselineLatencyMs: number;
  candidateId: string;
  baselineId: string;
}): PolicyComparison {
  const scoreDelta = opts.candidateScore - opts.baselineScore;
  const latencyDelta = opts.candidateLatencyMs - opts.baselineLatencyMs;
  const regression = scoreDelta < -0.05;

  let recommendation: PolicyComparison['recommendation'] = 'needs_review';
  if (scoreDelta >= 0.02 && opts.candidateDrift < 0.15) recommendation = 'promote_candidate';
  else if (regression || opts.candidateDrift >= 0.20) recommendation = 'keep_baseline';

  return {
    candidateId: opts.candidateId,
    baselineId: opts.baselineId,
    scoreDelta,
    driftDelta: opts.candidateDrift,
    latencyDelta,
    regression,
    recommendation,
  };
}

export function buildPromotionEventId(): string {
  return `promo-${randomUUID()}`;
}

export function buildCandidateId(): string {
  return `cand-${randomUUID()}`;
}
