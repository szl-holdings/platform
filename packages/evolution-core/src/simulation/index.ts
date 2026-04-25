/**
 * Replit-Safe Simulation Engine — Phase 4
 *
 * Produces realistic synthetic telemetry for the full PER walkthrough.
 * Every synthetic record carries simulated=true.
 * The UI labels all simulation data clearly — never presented as real execution.
 *
 * No GPU, no real model calls, no real training — honest throughout.
 */

import type {
  CalibrationRunSummary,
  CandidatePolicy,
  DriftReport,
  EvaluationRunSummary,
  PromotionGateResult,
  RewardBreakdown,
} from '../types.js';
import { buildSimulatedRewardBreakdown } from '../reward/index.js';
import { buildSimulatedDriftReport } from '../drift/index.js';
import { randomUUID } from 'node:crypto';

export interface SimulatedPERState {
  candidates: CandidatePolicy[];
  evaluationRuns: EvaluationRunSummary[];
  rewardBreakdowns: RewardBreakdown[];
  calibrationRuns: CalibrationRunSummary[];
  driftReports: DriftReport[];
  promotionQueue: PromotionGateResult[];
  runtimeDiagnostics: RuntimeDiagnostics;
  generatedAt: string;
}

export interface RuntimeDiagnostics {
  precisionProfile: string;
  environmentMode: string;
  inferenceBackend: string;
  trainingBackend: string;
  evaluationBackend: string;
  throughputTokensPerSec: number;
  avgLatencyMs: number;
  cacheStrategy: string;
  activeJobCount: number;
  queueDepth: number;
  remoteBackendHealthy: boolean;
  driftGuardActive: boolean;
  simulated: boolean;
  measuredAt: string;
}

const SIMULATED_CANDIDATES: Omit<CandidatePolicy, 'createdAt' | 'updatedAt'>[] = [
  {
    candidateId: 'cand-alpha-v2',
    displayName: 'Alpha Policy v2 — Risk Classification',
    description: 'Candidate update to risk classification policy with improved calibration',
    baseModelRef: 'gpt-4o-mini',
    candidateModelRef: 'gpt-4o-mini-ft-v2',
    policyVersion: '2.0.0',
    state: 'review',
    precisionProfile: 'cpu_safe',
    inferenceBackend: 'local_safe',
    trainingBackend: 'local_safe',
    evaluationBackend: 'local_safe',
    simulated: true,
    orgId: undefined,
  },
  {
    candidateId: 'cand-beta-v1',
    displayName: 'Beta Policy v1 — Compliance Reasoning',
    description: 'New compliance reasoning policy under evaluation',
    baseModelRef: 'gpt-4o-mini',
    candidateModelRef: 'gpt-4o-mini-compliance-v1',
    policyVersion: '1.0.0',
    state: 'shadow',
    precisionProfile: 'cpu_safe',
    inferenceBackend: 'local_safe',
    trainingBackend: 'local_safe',
    evaluationBackend: 'local_safe',
    simulated: true,
    orgId: undefined,
  },
  {
    candidateId: 'cand-gamma-active',
    displayName: 'Gamma Policy v3 — Active Baseline',
    description: 'Currently active production policy (baseline for comparison)',
    baseModelRef: 'gpt-4o-mini',
    candidateModelRef: 'gpt-4o-mini',
    policyVersion: '3.0.0',
    state: 'active',
    precisionProfile: 'cpu_safe',
    inferenceBackend: 'local_safe',
    trainingBackend: 'local_safe',
    evaluationBackend: 'local_safe',
    simulated: true,
    orgId: undefined,
  },
];

export function buildSimulatedState(): SimulatedPERState {
  const now = new Date();
  const candidates: CandidatePolicy[] = SIMULATED_CANDIDATES.map((c) => ({
    ...c,
    createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
  }));

  const evaluationRuns: EvaluationRunSummary[] = candidates.flatMap((c) =>
    buildSimulatedEvalRuns(c.candidateId),
  );

  const rewardBreakdowns: RewardBreakdown[] = evaluationRuns
    .filter((r) => r.status === 'completed')
    .map((r) => buildSimulatedRewardBreakdown(r.candidateId));

  const calibrationRuns: CalibrationRunSummary[] = candidates.flatMap((c) =>
    buildSimulatedCalibrationRuns(c.candidateId),
  );

  const driftReports: DriftReport[] = candidates
    .filter((c) => c.state !== 'active')
    .map((c) => buildSimulatedDriftReport(c.candidateId));

  const promotionQueue: PromotionGateResult[] = candidates
    .filter((c) => c.state === 'review')
    .map((c) => buildSimulatedPromotionGate(c, rewardBreakdowns, driftReports));

  return {
    candidates,
    evaluationRuns,
    rewardBreakdowns,
    calibrationRuns,
    driftReports,
    promotionQueue,
    runtimeDiagnostics: buildSimulatedDiagnostics(),
    generatedAt: now.toISOString(),
  };
}

function buildSimulatedEvalRuns(candidateId: string): EvaluationRunSummary[] {
  const count = 2 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, (_, i) => {
    const passRate = 0.72 + Math.random() * 0.24;
    const total = 30 + Math.floor(Math.random() * 20);
    const passed = Math.floor(total * passRate);
    return {
      runId: `sim-run-${candidateId}-${i}`,
      candidateId,
      status: i === 0 ? 'completed' : i === 1 ? 'running' : 'queued',
      passRate,
      avgScoreTotal: passRate * 0.94,
      avgLatencyMs: 100 + Math.random() * 200,
      totalCases: total,
      passed,
      failed: total - passed,
      hasRegression: Math.random() < 0.12,
      regressionSeverity: (Math.random() < 0.08 ? 'minor' : 'none') as 'none' | 'minor' | 'major' | 'critical',
      coverageThresholdMet: passRate > 0.70,
      simulated: true,
      completedAt: i === 0 ? new Date(Date.now() - 30 * 60 * 1000).toISOString() : undefined,
    } satisfies EvaluationRunSummary;
  });
}

function buildSimulatedCalibrationRuns(candidateId: string): CalibrationRunSummary[] {
  const types: CalibrationRunSummary['runType'][] = ['warmup', 'dataset', 'post_update'];
  return types.map((runType) => {
    const preBias = -0.08 + Math.random() * 0.18;
    const postBias = preBias * 0.45;
    return {
      runId: `sim-cal-${candidateId}-${runType}`,
      candidateId,
      runType,
      status: 'completed',
      preBias: Math.round(preBias * 1000) / 1000,
      postBias: Math.round(postBias * 1000) / 1000,
      biasReduction: Math.round((preBias - postBias) * 1000) / 1000,
      confidenceAlignment: 0.82 + Math.random() * 0.15,
      safeFallbackTriggered: false,
      simulated: true,
    } satisfies CalibrationRunSummary;
  });
}

function buildSimulatedPromotionGate(
  candidate: CandidatePolicy,
  rewards: RewardBreakdown[],
  drifts: DriftReport[],
): PromotionGateResult {
  const reward = rewards.find((r) => r.candidateId === candidate.candidateId);
  const drift = drifts.find((d) => d.candidateId === candidate.candidateId);
  const rewardScore = reward?.scoreTotal ?? 0.78;
  const driftScore = drift?.overallDriftScore ?? 0.08;

  return {
    candidateId: candidate.candidateId,
    eligible: rewardScore >= 0.72 && driftScore < 0.20,
    reasons: ['Reward score meets minimum', 'No critical governance failures', 'Drift within bounds', 'Rollback path verified'],
    blockers: rewardScore < 0.72 ? ['Score below minimum threshold'] : [],
    rewardScore,
    driftScore,
    governancePassedAll: true,
    coverageThresholdMet: true,
    humanApprovalRequired: true,
    rollbackVerified: true,
  };
}

function buildSimulatedDiagnostics(): RuntimeDiagnostics {
  return {
    precisionProfile: 'cpu_safe',
    environmentMode: 'simulation',
    inferenceBackend: 'local_safe',
    trainingBackend: 'local_safe',
    evaluationBackend: 'local_safe',
    throughputTokensPerSec: 420 + Math.random() * 80,
    avgLatencyMs: 145 + Math.random() * 60,
    cacheStrategy: 'lru_512mb',
    activeJobCount: Math.floor(Math.random() * 4),
    queueDepth: Math.floor(Math.random() * 12),
    remoteBackendHealthy: false,
    driftGuardActive: true,
    simulated: true,
    measuredAt: new Date().toISOString(),
  };
}
