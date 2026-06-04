/**
 * Meta-Learning Fabric
 *
 * Extends the flywheel trajectory store so it tracks not just what happened,
 * but which routing strategy, reasoning depth, and agent combination produced
 * the best outcomes.
 *
 * Implements a periodic "meta-review" that analyzes trajectory patterns and
 * adjusts routing priors, coalition preferences, and reasoning budgets
 * automatically. The system measurably improves its own decision-making over time.
 */

import type { RoutingLane } from './model-registry.js';
import type { OrchestrateTrajectory } from './flywheel/trajectory-store.js';

export type ReasoningDepth = 'shallow' | 'standard' | 'deep' | 'extended';
export type CoalitionPreference = 'none' | 'optional' | 'preferred' | 'required';

export interface StrategyRecord {
  recordId: string;
  trajectoryId: string;
  domain: string;
  routingLane: RoutingLane;
  primaryModel: string;
  reasoningDepth: ReasoningDepth;
  usedCoalition: boolean;
  coalitionSize: number;
  usedSpeculative: boolean;
  usedShadowCouncil: boolean;
  qualityScore: number;
  userFeedbackScore: number | null;
  latencyMs: number;
  costUsd: number;
  timestamp: string;
}

export interface RoutingPriorAdjustment {
  domain: string;
  preferredLane: RoutingLane;
  preferredModel: string;
  reasoningDepthPreference: ReasoningDepth;
  coalitionPreference: CoalitionPreference;
  speculativeThreshold: number;
  averageQuality: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface MetaReviewReport {
  reportId: string;
  reviewedTrajectories: number;
  strategiesAnalyzed: number;
  priorAdjustments: RoutingPriorAdjustment[];
  keyFindings: string[];
  improvedDomains: string[];
  degradedDomains: string[];
  timestamp: string;
}

const STRATEGY_STORE: StrategyRecord[] = [];
const MAX_STRATEGY_RECORDS = 10_000;

const PRIOR_ADJUSTMENTS: Map<string, RoutingPriorAdjustment> = new Map();

let lastMetaReviewAt = 0;
const META_REVIEW_INTERVAL_MS = 5 * 60 * 1000;

export function recordStrategyOutcome(
  trajectory: OrchestrateTrajectory,
  strategy: {
    routingLane: RoutingLane;
    primaryModel: string;
    reasoningDepth: ReasoningDepth;
    usedCoalition: boolean;
    coalitionSize: number;
    usedSpeculative: boolean;
    usedShadowCouncil: boolean;
    costUsd: number;
  },
): StrategyRecord {
  const primaryDomain = trajectory.agentRouting[0]?.domain ?? 'general';
  const record: StrategyRecord = {
    recordId: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    trajectoryId: trajectory.trajectoryId,
    domain: primaryDomain,
    routingLane: strategy.routingLane,
    primaryModel: strategy.primaryModel,
    reasoningDepth: strategy.reasoningDepth,
    usedCoalition: strategy.usedCoalition,
    coalitionSize: strategy.coalitionSize,
    usedSpeculative: strategy.usedSpeculative,
    usedShadowCouncil: strategy.usedShadowCouncil,
    qualityScore: trajectory.qualityScore ?? 0,
    userFeedbackScore: trajectory.userFeedbackScore,
    latencyMs: trajectory.totalLatencyMs,
    costUsd: strategy.costUsd,
    timestamp: new Date().toISOString(),
  };

  STRATEGY_STORE.push(record);
  if (STRATEGY_STORE.length > MAX_STRATEGY_RECORDS) {
    STRATEGY_STORE.splice(0, STRATEGY_STORE.length - MAX_STRATEGY_RECORDS);
  }

  if (Date.now() - lastMetaReviewAt > META_REVIEW_INTERVAL_MS) {
    setImmediate(() => runMetaReview());
  }

  return record;
}

function computeEffectiveQuality(record: StrategyRecord): number {
  let score = record.qualityScore;
  if (record.userFeedbackScore !== null) {
    score = score * 0.7 + (record.userFeedbackScore + 1) / 2 * 0.3;
  }
  return Math.max(0, Math.min(1, score));
}

function inferCoalitionPreference(avgQuality: number, coalitionRecords: StrategyRecord[], nonCoalitionRecords: StrategyRecord[]): CoalitionPreference {
  if (coalitionRecords.length < 3 && nonCoalitionRecords.length < 3) return 'optional';

  const coalitionAvg = coalitionRecords.length > 0
    ? coalitionRecords.reduce((s, r) => s + computeEffectiveQuality(r), 0) / coalitionRecords.length
    : 0;
  const nonCoalitionAvg = nonCoalitionRecords.length > 0
    ? nonCoalitionRecords.reduce((s, r) => s + computeEffectiveQuality(r), 0) / nonCoalitionRecords.length
    : 0;

  if (coalitionRecords.length === 0) return 'none';
  if (coalitionAvg > nonCoalitionAvg + 0.1) return 'preferred';
  if (nonCoalitionAvg > coalitionAvg + 0.1) return 'none';
  return 'optional';
}

function inferReasoningDepth(records: StrategyRecord[]): ReasoningDepth {
  const byDepth: Record<ReasoningDepth, number[]> = {
    shallow: [],
    standard: [],
    deep: [],
    extended: [],
  };

  for (const r of records) {
    byDepth[r.reasoningDepth].push(computeEffectiveQuality(r));
  }

  let bestDepth: ReasoningDepth = 'standard';
  let bestAvg = 0;

  for (const [depth, scores] of Object.entries(byDepth) as [ReasoningDepth, number[]][]) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDepth = depth;
    }
  }

  return bestDepth;
}

function inferPreferredModel(records: StrategyRecord[]): string {
  const modelScores: Record<string, number[]> = {};
  for (const r of records) {
    if (!modelScores[r.primaryModel]) modelScores[r.primaryModel] = [];
    modelScores[r.primaryModel]!.push(computeEffectiveQuality(r));
  }

  let bestModel = records[0]?.primaryModel ?? 'gpt-5.2';
  let bestAvg = 0;

  for (const [model, scores] of Object.entries(modelScores)) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestModel = model;
    }
  }

  return bestModel;
}

function inferPreferredLane(records: StrategyRecord[]): RoutingLane {
  const laneScores: Record<string, number[]> = {};
  for (const r of records) {
    if (!laneScores[r.routingLane]) laneScores[r.routingLane] = [];
    laneScores[r.routingLane]!.push(computeEffectiveQuality(r));
  }

  let bestLane: RoutingLane = 'general';
  let bestAvg = 0;

  for (const [lane, scores] of Object.entries(laneScores)) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestLane = lane as RoutingLane;
    }
  }

  return bestLane;
}

export function runMetaReview(): MetaReviewReport {
  lastMetaReviewAt = Date.now();
  const reportId = `mr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const domainGroups: Record<string, StrategyRecord[]> = {};
  for (const record of STRATEGY_STORE) {
    if (!domainGroups[record.domain]) domainGroups[record.domain] = [];
    domainGroups[record.domain]!.push(record);
  }

  const priorAdjustments: RoutingPriorAdjustment[] = [];
  const improvedDomains: string[] = [];
  const degradedDomains: string[] = [];
  const keyFindings: string[] = [];

  for (const [domain, records] of Object.entries(domainGroups)) {
    if (records.length < 5) continue;

    const avgQuality = records.reduce((s, r) => s + computeEffectiveQuality(r), 0) / records.length;
    const coalitionRecords = records.filter((r) => r.usedCoalition);
    const nonCoalitionRecords = records.filter((r) => !r.usedCoalition);
    const speculativeRecords = records.filter((r) => r.usedSpeculative);

    const coalitionPreference = inferCoalitionPreference(avgQuality, coalitionRecords, nonCoalitionRecords);
    const reasoningDepth = inferReasoningDepth(records);
    const preferredModel = inferPreferredModel(records);
    const preferredLane = inferPreferredLane(records);

    const speculativeAvgQuality = speculativeRecords.length > 0
      ? speculativeRecords.reduce((s, r) => s + computeEffectiveQuality(r), 0) / speculativeRecords.length
      : 0;
    const speculativeThreshold = speculativeAvgQuality > 0.75 ? 0.5 : 0.7;

    const existingPrior = PRIOR_ADJUSTMENTS.get(domain);
    if (existingPrior) {
      if (avgQuality > existingPrior.averageQuality + 0.05) {
        improvedDomains.push(domain);
      } else if (avgQuality < existingPrior.averageQuality - 0.05) {
        degradedDomains.push(domain);
      }
    }

    const adjustment: RoutingPriorAdjustment = {
      domain,
      preferredLane,
      preferredModel,
      reasoningDepthPreference: reasoningDepth,
      coalitionPreference,
      speculativeThreshold,
      averageQuality: avgQuality,
      sampleSize: records.length,
      lastUpdated: new Date().toISOString(),
    };

    PRIOR_ADJUSTMENTS.set(domain, adjustment);
    priorAdjustments.push(adjustment);

    if (coalitionPreference === 'preferred' && (!existingPrior || existingPrior.coalitionPreference !== 'preferred')) {
      keyFindings.push(`${domain}: Coalition formation now preferred (${coalitionRecords.length} samples show quality improvement)`);
    }
    if (reasoningDepth === 'extended' && (!existingPrior || existingPrior.reasoningDepthPreference !== 'extended')) {
      keyFindings.push(`${domain}: Extended thinking budget recommended (avg quality ${(avgQuality * 100).toFixed(0)}%)`);
    }
    if (existingPrior && preferredModel !== existingPrior.preferredModel) {
      keyFindings.push(`${domain}: Model preference shifted from ${existingPrior.preferredModel} → ${preferredModel}`);
    }
  }

  return {
    reportId,
    reviewedTrajectories: STRATEGY_STORE.length,
    strategiesAnalyzed: Object.keys(domainGroups).length,
    priorAdjustments,
    keyFindings,
    improvedDomains,
    degradedDomains,
    timestamp: new Date().toISOString(),
  };
}

export function getPriorAdjustment(domain: string): RoutingPriorAdjustment | null {
  return PRIOR_ADJUSTMENTS.get(domain) ?? null;
}

export function getAllPriorAdjustments(): RoutingPriorAdjustment[] {
  return Array.from(PRIOR_ADJUSTMENTS.values());
}

export function getMetaLearningStats(): {
  totalStrategyRecords: number;
  domainsWithPriors: number;
  avgQualityByDomain: Record<string, number>;
  lastReviewedAt: string | null;
} {
  const avgByDomain: Record<string, number> = {};
  for (const [domain, prior] of PRIOR_ADJUSTMENTS.entries()) {
    avgByDomain[domain] = prior.averageQuality;
  }

  return {
    totalStrategyRecords: STRATEGY_STORE.length,
    domainsWithPriors: PRIOR_ADJUSTMENTS.size,
    avgQualityByDomain: avgByDomain,
    lastReviewedAt: lastMetaReviewAt > 0 ? new Date(lastMetaReviewAt).toISOString() : null,
  };
}

export function applyMetaLearningToRouting(
  domain: string,
  currentModel: string,
  currentLane: RoutingLane,
): {
  suggestedModel: string;
  suggestedLane: RoutingLane;
  suggestedReasoningDepth: ReasoningDepth;
  coalitionPreference: CoalitionPreference;
  rationale: string;
} {
  const prior = PRIOR_ADJUSTMENTS.get(domain);
  if (!prior || prior.sampleSize < 10) {
    return {
      suggestedModel: currentModel,
      suggestedLane: currentLane,
      suggestedReasoningDepth: 'standard',
      coalitionPreference: 'optional',
      rationale: 'Insufficient meta-learning data — using defaults',
    };
  }

  return {
    suggestedModel: prior.preferredModel,
    suggestedLane: prior.preferredLane,
    suggestedReasoningDepth: prior.reasoningDepthPreference,
    coalitionPreference: prior.coalitionPreference,
    rationale: `Meta-learning (n=${prior.sampleSize}, avg quality ${(prior.averageQuality * 100).toFixed(0)}%): ${prior.preferredModel} on ${prior.preferredLane} lane with ${prior.reasoningDepthPreference} reasoning`,
  };
}
