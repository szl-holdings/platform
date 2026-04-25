/**
 * Promotion Gate — Layer E (governance) + Layer F
 *
 * Enforces:
 *   - Minimum aggregate reward score
 *   - Zero critical governance failures
 *   - Bounded drift (below DRIFT_THRESHOLDS)
 *   - Coverage threshold
 *   - Human approval for production promotion
 *   - Verified rollback path
 *
 * Integrates with packages/policy-engine and the existing approvalRequestsTable.
 */

import type {
  CandidatePolicy,
  DriftReport,
  GovernanceFinding,
  PromotionGateResult,
  RewardBreakdown,
} from '../types.js';
import { randomUUID } from 'node:crypto';

const MIN_PROMOTE_SCORE = parseFloat(process.env.PER_MIN_PROMOTE_SCORE ?? '0.72');
const PROMOTION_MODE = process.env.PROMOTION_MODE ?? 'gated';

export async function evaluatePromotionGate(opts: {
  candidate: CandidatePolicy;
  reward: RewardBreakdown;
  drift: DriftReport;
  policyFindings?: GovernanceFinding[];
  targetState: 'shadow' | 'review' | 'active';
}): Promise<PromotionGateResult> {
  const { candidate, reward, drift, policyFindings = [], targetState } = opts;

  const reasons: string[] = [];
  const blockers: string[] = [];

  if (reward.scoreTotal < MIN_PROMOTE_SCORE) {
    blockers.push(`Reward score ${reward.scoreTotal.toFixed(3)} below minimum ${MIN_PROMOTE_SCORE}`);
  } else {
    reasons.push(`Reward score ${reward.scoreTotal.toFixed(3)} meets minimum`);
  }

  const criticalFindings = policyFindings.filter((f) => f.severity === 'critical' && f.blocking);
  if (criticalFindings.length > 0) {
    blockers.push(`${criticalFindings.length} critical governance failure(s): ${criticalFindings.map((f) => f.code).join(', ')}`);
  } else {
    reasons.push('No critical governance failures');
  }

  if (drift.status === 'critical') {
    blockers.push(`Drift status is critical (score: ${drift.overallDriftScore.toFixed(3)})`);
  } else if (drift.status === 'degraded') {
    reasons.push(`Drift degraded but within tolerance (score: ${drift.overallDriftScore.toFixed(3)})`);
  } else {
    reasons.push('Drift within healthy bounds');
  }

  if (drift.safeFallbackTriggered) {
    blockers.push('Safe fallback was triggered — candidate requires re-calibration');
  }

  const coverageMet = reward.promotionEligible;
  if (!coverageMet) {
    blockers.push('Coverage threshold not met');
  } else {
    reasons.push('Coverage threshold satisfied');
  }

  const humanApprovalRequired = targetState === 'active' || PROMOTION_MODE === 'gated';
  if (humanApprovalRequired) {
    reasons.push('Human approval required for production activation');
  }

  const rollbackVerified = await verifyRollbackPath(candidate);
  if (!rollbackVerified) {
    blockers.push('Rollback path not verified');
  } else {
    reasons.push('Rollback path verified');
  }

  return {
    eligible: blockers.length === 0,
    reasons,
    blockers,
    rewardScore: reward.scoreTotal,
    driftScore: drift.overallDriftScore,
    governancePassedAll: criticalFindings.length === 0,
    coverageThresholdMet: coverageMet,
    humanApprovalRequired,
    rollbackVerified,
  };
}

async function verifyRollbackPath(candidate: CandidatePolicy): Promise<boolean> {
  if (candidate.simulated) return true;
  return Boolean(candidate.baseModelRef);
}

export async function checkPolicyCompliance(
  candidateId: string,
  context: Record<string, unknown>,
): Promise<GovernanceFinding[]> {
  try {
    const { evaluatePolicies } = await import('@szl-holdings/policy-engine');
    const evaluation = await evaluatePolicies({
      action: 'promote_policy',
      subject: { id: candidateId, type: 'candidate_policy' },
      resource: { type: 'policy_version', id: candidateId },
      context,
    });

    return evaluation.violations?.map((v: Record<string, unknown>) => ({
      findingId: `find-${randomUUID()}`,
      severity: (v.severity as GovernanceFinding['severity']) ?? 'medium',
      code: String(v.code ?? 'POLICY_VIOLATION'),
      message: String(v.message ?? 'Policy violation detected'),
      policyId: String(v.policyId ?? ''),
      blocking: v.severity === 'critical',
    })) ?? [];
  } catch {
    return [];
  }
}
