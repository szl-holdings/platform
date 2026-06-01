import { type SelfModelStore, defaultSelfModelStore } from './store.js';
import type {
  EscalationThreshold,
  HelpRequest,
  PerformanceRecord,
  RunOutcome,
  UpdateAfterRunResult,
} from './types.js';

const CONFIDENCE_SUCCESS_BOOST = 0.02;
const CONFIDENCE_PARTIAL_PENALTY = 0.01;
const CONFIDENCE_FAILURE_PENALTY = 0.05;
const CONFIDENCE_MIN = 0.0;
const CONFIDENCE_MAX = 1.0;

const DRIFT_FAILURE_INCREMENT = 0.1;
const DRIFT_SUCCESS_DECAY = 0.05;
const DRIFT_MAX = 1.0;
const DRIFT_MIN = 0.0;

const CONSECUTIVE_FAILURE_RESET_ON_SUCCESS = true;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function detectTrend(before: number, after: number): 'rising' | 'stable' | 'declining' {
  const delta = after - before;
  if (delta > 0.01) return 'rising';
  if (delta < -0.01) return 'declining';
  return 'stable';
}

function checkThresholds(
  state: {
    confidenceProfile: { overall: number };
    driftScore: number;
    consecutiveFailures: number;
    failurePatternCount: number;
  },
  thresholds: EscalationThreshold[],
  agentId: string,
): HelpRequest | null {
  const metrics: Record<string, number> = {
    confidence: state.confidenceProfile.overall,
    drift: state.driftScore,
    consecutiveFailures: state.consecutiveFailures,
    failurePatternCount: state.failurePatternCount,
  };

  for (const threshold of thresholds) {
    const current = metrics[threshold.metric];
    if (current === undefined) continue;

    const breached =
      threshold.metric === 'confidence'
        ? current < threshold.threshold
        : current > threshold.threshold;

    if (breached && threshold.action === 'request-help') {
      return {
        runtimeId: agentId,
        reason: `Metric "${threshold.metric}" breached threshold: current=${current.toFixed(3)}, threshold=${threshold.threshold}`,
        metric: threshold.metric,
        currentValue: current,
        threshold: threshold.threshold,
        action: threshold.action,
        notifyRecipients: threshold.notifyRecipients ?? [],
        requestedAt: new Date().toISOString(),
      };
    }
  }
  return null;
}

export function updateAfterRun(
  agentId: string,
  outcome: RunOutcome,
  store: SelfModelStore = defaultSelfModelStore,
): UpdateAfterRunResult {
  const state = store.get(agentId);
  if (!state) {
    throw new Error(`No self-model found for agent: ${agentId}`);
  }

  const now = new Date().toISOString();
  const prevConfidence = state.confidenceProfile.overall;

  let confidenceDelta: number;
  switch (outcome.status) {
    case 'success':
      confidenceDelta = outcome.confidenceDelta ?? CONFIDENCE_SUCCESS_BOOST;
      break;
    case 'partial':
      confidenceDelta = outcome.confidenceDelta ?? -CONFIDENCE_PARTIAL_PENALTY;
      break;
    case 'failure':
      confidenceDelta = outcome.confidenceDelta ?? -CONFIDENCE_FAILURE_PENALTY;
      break;
  }

  const newConfidence = clamp(prevConfidence + confidenceDelta, CONFIDENCE_MIN, CONFIDENCE_MAX);

  const newDrift =
    outcome.status === 'failure'
      ? clamp(state.driftScore + DRIFT_FAILURE_INCREMENT, DRIFT_MIN, DRIFT_MAX)
      : clamp(state.driftScore - DRIFT_SUCCESS_DECAY, DRIFT_MIN, DRIFT_MAX);

  const newConsecutiveFailures =
    outcome.status === 'failure'
      ? state.consecutiveFailures + 1
      : CONSECUTIVE_FAILURE_RESET_ON_SUCCESS
        ? 0
        : state.consecutiveFailures;

  const newFailurePatternCount =
    outcome.status === 'failure' ? state.failurePatternCount + 1 : state.failurePatternCount;

  const performanceRecord: PerformanceRecord = {
    runId: outcome.runId,
    agentId: outcome.agentId,
    domain: outcome.domain,
    outcome: outcome.status,
    summary: outcome.summary,
    durationMs: outcome.durationMs,
    confidenceBefore: prevConfidence,
    confidenceAfter: newConfidence,
    drift: newDrift - state.driftScore,
    errorCode: outcome.errorCode,
    occurredAt: now,
  };

  if (outcome.status === 'failure') {
    store.recordFailure(agentId, performanceRecord);
  } else {
    store.recordWin(agentId, performanceRecord);
  }

  const updatedConfidenceProfile = {
    ...state.confidenceProfile,
    overall: newConfidence,
    trend: detectTrend(prevConfidence, newConfidence),
    lastAdjustedAt: now,
  };

  const updatedUncertaintyProfile = {
    ...state.uncertaintyProfile,
    overall: clamp(1 - newConfidence, 0, 1),
    lastReviewedAt: now,
  };

  const updated = store.update(
    agentId,
    {
      confidenceProfile: updatedConfidenceProfile,
      uncertaintyProfile: updatedUncertaintyProfile,
      driftScore: newDrift,
      consecutiveFailures: newConsecutiveFailures,
      failurePatternCount: newFailurePatternCount,
    },
    `run:${outcome.runId}:${outcome.status}`,
    'run-outcome',
  );

  const helpRequest = checkThresholds(updated, updated.escalationThresholds, agentId);

  return {
    updated: true,
    newVersion: updated.version,
    confidenceAfter: newConfidence,
    driftScore: newDrift,
    consecutiveFailures: newConsecutiveFailures,
    helpRequested: helpRequest,
    snapshotCreated: true,
  };
}

export function requestHelpIfBelowThreshold(
  agentId: string,
  metric: string,
  store: SelfModelStore = defaultSelfModelStore,
): HelpRequest | null {
  const state = store.get(agentId);
  if (!state) return null;

  const metrics: Record<string, number> = {
    confidence: state.confidenceProfile.overall,
    drift: state.driftScore,
    consecutiveFailures: state.consecutiveFailures,
    failurePatternCount: state.failurePatternCount,
    uncertainty: state.uncertaintyProfile.overall,
  };

  const current = metrics[metric];
  if (current === undefined) return null;

  for (const threshold of state.escalationThresholds) {
    if (threshold.metric !== metric) continue;

    const breached =
      metric === 'confidence' || metric === 'uncertainty'
        ? current <= threshold.threshold
        : current >= threshold.threshold;

    if (breached) {
      return {
        runtimeId: agentId,
        reason: `Metric "${metric}" is at ${current.toFixed(3)}, at or beyond threshold ${threshold.threshold}`,
        metric,
        currentValue: current,
        threshold: threshold.threshold,
        action: threshold.action,
        notifyRecipients: threshold.notifyRecipients ?? [],
        requestedAt: new Date().toISOString(),
      };
    }
  }
  return null;
}
