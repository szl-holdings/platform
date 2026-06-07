/**
 * Reward Composer — Layer E (partial)
 *
 * Produces total score, component scores, recommendation, governance findings,
 * and promotion eligibility per evaluation run.
 *
 * Weights are defined in types.ts as REWARD_WEIGHTS.
 * Components are platform-native; none copied from third-party RLHF implementations.
 */

import {
  type EvaluationCaseResult,
  type EvaluationRunSummary,
  type GovernanceFinding,
  type PromotionRecommendation,
  type RewardBreakdown,
  type RewardComponents,
  REWARD_WEIGHTS,
} from '../types.js';
import { randomUUID } from 'node:crypto';

const MIN_PROMOTE_SCORE = parseFloat(process.env.PER_MIN_PROMOTE_SCORE ?? '0.72');

/**
 * Compose weighted reward score from evaluation run summary and per-case results.
 */
export function composeReward(
  runSummary: EvaluationRunSummary,
  caseResults: EvaluationCaseResult[],
  policyFindings?: GovernanceFinding[],
): RewardBreakdown {
  const components = computeComponents(runSummary, caseResults);
  const scoreTotal = computeTotal(components);
  const findings = policyFindings ?? [];
  const criticalBlocking = findings.filter((f) => f.severity === 'critical' && f.blocking);
  const recommendation = deriveRecommendation(scoreTotal, criticalBlocking.length > 0, runSummary);
  const promotionEligible = recommendation === 'promote' && criticalBlocking.length === 0;

  return {
    runId: runSummary.runId,
    candidateId: runSummary.candidateId,
    scoreTotal: Math.round(scoreTotal * 10000) / 10000,
    components,
    governanceFindings: findings,
    recommendation,
    promotionEligible,
    simulated: runSummary.simulated,
  };
}

function computeComponents(
  run: EvaluationRunSummary,
  cases: EvaluationCaseResult[],
): RewardComponents {
  const passRate = run.passRate ?? 0;
  const avgScore = run.avgScoreTotal ?? passRate;

  const avgLatencyMs = run.avgLatencyMs ?? 200;
  const latencyScore = Math.max(0, 1 - (avgLatencyMs - 100) / 2000);

  const hallucinationRate = computeHallucinationRate(cases);
  const failureRate = run.failed / Math.max(run.totalCases, 1);

  return {
    correctness: passRate,
    citationFidelity: avgScore * 0.9 + 0.05,
    policyCompliance: Math.min(1, avgScore * 1.05),
    structuredOutputValidity: computeStructuredOutputRate(cases),
    latencyScore: Math.min(1, latencyScore),
    costScore: 0.85,
    userUtility: avgScore * 0.95,
    refusalQuality: 0.8,
    auditCompleteness: 0.9,
    hallucinationPenalty: hallucinationRate,
    failurePenalty: failureRate,
  };
}

function computeTotal(c: RewardComponents): number {
  const positive =
    c.correctness * REWARD_WEIGHTS.correctness +
    c.citationFidelity * REWARD_WEIGHTS.citationFidelity +
    c.policyCompliance * REWARD_WEIGHTS.policyCompliance +
    c.structuredOutputValidity * REWARD_WEIGHTS.structuredOutputValidity +
    c.latencyScore * REWARD_WEIGHTS.latencyScore +
    c.costScore * REWARD_WEIGHTS.costScore +
    c.userUtility * REWARD_WEIGHTS.userUtility +
    c.refusalQuality * REWARD_WEIGHTS.refusalQuality +
    c.auditCompleteness * REWARD_WEIGHTS.auditCompleteness;

  const penalties =
    c.hallucinationPenalty * Math.abs(REWARD_WEIGHTS.hallucinationPenalty) +
    c.failurePenalty * Math.abs(REWARD_WEIGHTS.failurePenalty);

  return Math.max(0, Math.min(1, positive - penalties));
}

function deriveRecommendation(
  score: number,
  hasCriticalBlocking: boolean,
  run: EvaluationRunSummary,
): PromotionRecommendation {
  if (hasCriticalBlocking) return 'reject';
  if (run.regressionSeverity === 'critical') return 'reject';
  if (run.regressionSeverity === 'major') return 'hold';
  if (score >= MIN_PROMOTE_SCORE && run.coverageThresholdMet) return 'promote';
  if (score >= MIN_PROMOTE_SCORE * 0.9) return 'review';
  return 'reject';
}

function computeHallucinationRate(cases: EvaluationCaseResult[]): number {
  if (cases.length === 0) return 0.05;
  const hallucinated = cases.filter(
    (c) => c.failureReason?.toLowerCase().includes('hallucin') ?? false,
  ).length;
  return hallucinated / cases.length;
}

function computeStructuredOutputRate(cases: EvaluationCaseResult[]): number {
  if (cases.length === 0) return 0.8;
  const valid = cases.filter((c) => c.passed || !c.failureReason?.includes('schema')).length;
  return valid / cases.length;
}

export function buildSimulatedRewardBreakdown(candidateId: string): RewardBreakdown {
  const passRate = 0.74 + Math.random() * 0.22;
  const scoreTotal = passRate * 0.92 + Math.random() * 0.05;
  const runId = `sim-run-${randomUUID()}`;

  const components: RewardComponents = {
    correctness: passRate,
    citationFidelity: 0.78 + Math.random() * 0.15,
    policyCompliance: 0.82 + Math.random() * 0.15,
    structuredOutputValidity: 0.8 + Math.random() * 0.18,
    latencyScore: 0.7 + Math.random() * 0.25,
    costScore: 0.88 + Math.random() * 0.1,
    userUtility: 0.75 + Math.random() * 0.2,
    refusalQuality: 0.8 + Math.random() * 0.15,
    auditCompleteness: 0.85 + Math.random() * 0.13,
    hallucinationPenalty: Math.random() * 0.08,
    failurePenalty: Math.random() * 0.12,
  };

  const eligible = scoreTotal >= MIN_PROMOTE_SCORE;

  return {
    runId,
    candidateId,
    scoreTotal: Math.round(scoreTotal * 10000) / 10000,
    components,
    governanceFindings: [],
    recommendation: eligible ? 'promote' : 'review',
    promotionEligible: eligible,
    simulated: true,
  };
}
