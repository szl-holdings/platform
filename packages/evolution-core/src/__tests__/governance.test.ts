/**
 * Unit tests — Promotion Gate (Governance)
 *
 * Note: PROMOTION_MODE defaults to 'gated' in the implementation, so
 * humanApprovalRequired is always true unless PROMOTION_MODE is overridden.
 * Tests verify actual behavior of the gate rather than assumed behavior.
 */

import { evaluatePromotionGate } from '../governance/index.js';
import { buildSimulatedRewardBreakdown } from '../reward/index.js';
import { buildSimulatedDriftReport } from '../drift/index.js';
import type { CandidatePolicy, DriftReport, RewardBreakdown } from '../types.js';
import { randomUUID } from 'node:crypto';

function makeCandidate(overrides: Partial<CandidatePolicy> = {}): CandidatePolicy {
  const now = new Date().toISOString();
  return {
    candidateId: randomUUID(),
    displayName: 'Test Policy',
    policyVersion: '1.0.0',
    state: 'review',
    precisionProfile: 'cpu_safe',
    inferenceBackend: 'local_mock',
    trainingBackend: 'local_mock',
    evaluationBackend: 'local_mock',
    simulated: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeReward(scoreTotal: number, promotionEligible: boolean): RewardBreakdown {
  return {
    ...buildSimulatedRewardBreakdown('test'),
    scoreTotal,
    promotionEligible,
    recommendation: promotionEligible ? 'promote' : 'reject',
    simulated: true,
  };
}

function makeHealthyDrift(): DriftReport {
  return {
    ...buildSimulatedDriftReport('test'),
    overallDriftScore: 0.03,
    status: 'healthy',
    simulated: true,
  };
}

function makeCriticalDrift(): DriftReport {
  return {
    ...buildSimulatedDriftReport('test'),
    overallDriftScore: 0.45,
    status: 'critical',
    simulated: true,
  };
}

describe('evaluatePromotionGate', () => {
  test('passing candidate returns eligible=true with no blockers', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.85, true),
      drift: makeHealthyDrift(),
      targetState: 'review',
    });
    expect(result.eligible).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  test('low reward score produces a blocker and ineligible result', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.40, false),
      drift: makeHealthyDrift(),
      targetState: 'review',
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  test('critical drift produces a blocker', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.85, true),
      drift: makeCriticalDrift(),
      targetState: 'review',
    });
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  test('active-state promotion requires human approval', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.85, true),
      drift: makeHealthyDrift(),
      targetState: 'active',
    });
    expect(result.humanApprovalRequired).toBe(true);
  });

  test('critical governance finding blocks promotion', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.85, true),
      drift: makeHealthyDrift(),
      policyFindings: [{
        findingId: 'finding-001',
        code: 'SAFETY_THRESHOLD_BREACH',
        message: 'Safety threshold breached in test case 3',
        severity: 'critical',
        blocking: true,
      }],
      targetState: 'review',
    });
    expect(result.eligible).toBe(false);
    expect(result.governancePassedAll).toBe(false);
  });

  test('result has all required fields', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.82, true),
      drift: makeHealthyDrift(),
      targetState: 'review',
    });
    expect(result).toHaveProperty('eligible');
    expect(result).toHaveProperty('reasons');
    expect(result).toHaveProperty('blockers');
    expect(result).toHaveProperty('humanApprovalRequired');
    expect(result).toHaveProperty('rollbackVerified');
    expect(result).toHaveProperty('rewardScore');
    expect(result).toHaveProperty('driftScore');
    expect(result).toHaveProperty('governancePassedAll');
  });

  test('reasons is non-empty for passing candidate', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.85, true),
      drift: makeHealthyDrift(),
      targetState: 'review',
    });
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('multiple failures produce multiple blockers', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate(),
      reward: makeReward(0.30, false),
      drift: makeCriticalDrift(),
      policyFindings: [{
        findingId: 'finding-002',
        code: 'POLICY_VIOLATION',
        message: 'Policy violation detected',
        severity: 'critical',
        blocking: true,
      }],
      targetState: 'review',
    });
    expect(result.blockers.length).toBeGreaterThanOrEqual(2);
  });

  test('simulated candidate passes rollback verification', async () => {
    const result = await evaluatePromotionGate({
      candidate: makeCandidate({ simulated: true }),
      reward: makeReward(0.85, true),
      drift: makeHealthyDrift(),
      targetState: 'review',
    });
    expect(result.rollbackVerified).toBe(true);
  });
});
