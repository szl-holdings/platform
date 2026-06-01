/**
 * Scoring Engine
 *
 * Calculates per-agent accuracy, confidence calibration, and skill effectiveness
 * over configurable rolling windows. Feeds data back into self-reflection and
 * confidence degradation detection.
 */

export interface DecisionOutcomeRecord {
  decisionId: string;
  agentId: string;
  tenantId: string;
  skillId: string | null;
  capability: string | null;
  predictedConfidence: number;
  actualOutcome: 'accepted' | 'rejected' | 'overridden' | 'deferred' | 'pending';
  wasActedOn: boolean;
  wasOverridden: boolean;
  overrideReason: string | null;
  predictedImpactLevel: string;
  actualImpactLevel: string | null;
  recommendedAction: string;
  finalAction: string | null;
  executionResult: 'success' | 'partial' | 'failure' | 'not_executed' | null;
  humanReviewRequired: boolean;
  humanReviewRequested: boolean;
  decisionType: string;
  recordedAt: string;
  resolvedAt: string | null;
}

export interface AgentAccuracyScore {
  agentId: string;
  windowDays: number;
  totalDecisions: number;
  acceptedDecisions: number;
  rejectedDecisions: number;
  overriddenDecisions: number;
  deferredDecisions: number;
  pendingDecisions: number;
  acceptanceRate: number;
  overrideRate: number;
  rejectionRate: number;
  impactPredictionAccuracy: number;
  weightedAccuracyScore: number;
  calculatedAt: string;
}

export interface ConfidenceCalibrationScore {
  agentId: string;
  windowDays: number;
  sampleSize: number;
  meanPredictedConfidence: number;
  meanActualAcceptanceRate: number;
  calibrationBias: number;
  calibrationError: number;
  recommendedAdjustment: number;
  isOverconfident: boolean;
  isUnderconfident: boolean;
  calibrationVerdict: 'well_calibrated' | 'overconfident' | 'underconfident' | 'insufficient_data';
  bucketAnalysis: Array<{
    bucket: string;
    predictedRange: [number, number];
    actualAcceptanceRate: number;
    sampleCount: number;
    error: number;
  }>;
  calculatedAt: string;
}

export interface SkillEffectivenessScore {
  skillId: string;
  capability: string;
  windowDays: number;
  totalUsages: number;
  acceptanceRate: number;
  averageConfidence: number;
  averageLatencyMs: number | null;
  overrideRate: number;
  humanReviewTriggerRate: number;
  effectivenessScore: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  calculatedAt: string;
}

export interface AgentPerformanceProfile {
  agentId: string;
  accuracy: AgentAccuracyScore;
  calibration: ConfidenceCalibrationScore;
  skillEffectiveness: SkillEffectivenessScore[];
  overallHealthScore: number;
  healthLabel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  flags: string[];
  lastDecisionAt: string | null;
  calculatedAt: string;
}

export interface ScoringWindowConfig {
  shortWindowDays: number;
  longWindowDays: number;
  minSampleSize: number;
  calibrationBuckets: number;
  declineThreshold: number;
  overrideRateWarningThreshold: number;
  lowAcceptanceWarningThreshold: number;
}

const DEFAULT_CONFIG: ScoringWindowConfig = {
  shortWindowDays: 7,
  longWindowDays: 30,
  minSampleSize: 5,
  calibrationBuckets: 5,
  declineThreshold: 0.1,
  overrideRateWarningThreshold: 0.3,
  lowAcceptanceWarningThreshold: 0.5,
};

function filterByWindow(
  records: DecisionOutcomeRecord[],
  windowDays: number,
): DecisionOutcomeRecord[] {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  return records.filter((r) => r.recordedAt >= cutoff && r.actualOutcome !== 'pending');
}

function computeAccuracyScore(
  records: DecisionOutcomeRecord[],
  windowDays: number,
): AgentAccuracyScore {
  const agentId = records[0]?.agentId ?? 'unknown';
  const windowed = filterByWindow(records, windowDays);
  const total = windowed.length;

  if (total === 0) {
    return {
      agentId,
      windowDays,
      totalDecisions: 0,
      acceptedDecisions: 0,
      rejectedDecisions: 0,
      overriddenDecisions: 0,
      deferredDecisions: 0,
      pendingDecisions: records.filter((r) => r.actualOutcome === 'pending').length,
      acceptanceRate: 0,
      overrideRate: 0,
      rejectionRate: 0,
      impactPredictionAccuracy: 0,
      weightedAccuracyScore: 0,
      calculatedAt: new Date().toISOString(),
    };
  }

  const accepted = windowed.filter((r) => r.actualOutcome === 'accepted').length;
  const rejected = windowed.filter((r) => r.actualOutcome === 'rejected').length;
  const overridden = windowed.filter((r) => r.actualOutcome === 'overridden').length;
  const deferred = windowed.filter((r) => r.actualOutcome === 'deferred').length;
  const pending = records.filter((r) => r.actualOutcome === 'pending').length;

  const impactMatchCount = windowed.filter(
    (r) => r.actualImpactLevel !== null && r.predictedImpactLevel === r.actualImpactLevel,
  ).length;
  const impactResolved = windowed.filter((r) => r.actualImpactLevel !== null).length;
  const impactAccuracy = impactResolved > 0 ? impactMatchCount / impactResolved : 0;

  const acceptanceRate = accepted / total;
  const overrideRate = overridden / total;
  const rejectionRate = rejected / total;

  const weightedScore = acceptanceRate * 0.5 + (1 - overrideRate) * 0.3 + impactAccuracy * 0.2;

  return {
    agentId,
    windowDays,
    totalDecisions: total,
    acceptedDecisions: accepted,
    rejectedDecisions: rejected,
    overriddenDecisions: overridden,
    deferredDecisions: deferred,
    pendingDecisions: pending,
    acceptanceRate,
    overrideRate,
    rejectionRate,
    impactPredictionAccuracy: impactAccuracy,
    weightedAccuracyScore: weightedScore,
    calculatedAt: new Date().toISOString(),
  };
}

function computeCalibrationScore(
  records: DecisionOutcomeRecord[],
  windowDays: number,
  config: ScoringWindowConfig,
): ConfidenceCalibrationScore {
  const agentId = records[0]?.agentId ?? 'unknown';
  const windowed = filterByWindow(records, windowDays);

  if (windowed.length < config.minSampleSize) {
    return {
      agentId,
      windowDays,
      sampleSize: windowed.length,
      meanPredictedConfidence: 0,
      meanActualAcceptanceRate: 0,
      calibrationBias: 0,
      calibrationError: 0,
      recommendedAdjustment: 0,
      isOverconfident: false,
      isUnderconfident: false,
      calibrationVerdict: 'insufficient_data',
      bucketAnalysis: [],
      calculatedAt: new Date().toISOString(),
    };
  }

  const meanPredicted =
    windowed.reduce((sum, r) => sum + r.predictedConfidence, 0) / windowed.length;
  const meanActual =
    windowed.filter((r) => r.actualOutcome === 'accepted').length / windowed.length;
  const calibrationBias = meanPredicted - meanActual;
  const calibrationError = Math.abs(calibrationBias);

  const bucketSize = 1.0 / config.calibrationBuckets;
  const bucketAnalysis = Array.from({ length: config.calibrationBuckets }, (_, i) => {
    const low = i * bucketSize;
    const high = low + bucketSize;
    const bucketRecords = windowed.filter(
      (r) => r.predictedConfidence >= low && r.predictedConfidence < high,
    );
    const actualRate =
      bucketRecords.length > 0
        ? bucketRecords.filter((r) => r.actualOutcome === 'accepted').length / bucketRecords.length
        : 0;
    const midpoint = low + bucketSize / 2;
    return {
      bucket: `${Math.round(low * 100)}-${Math.round(high * 100)}%`,
      predictedRange: [low, high] as [number, number],
      actualAcceptanceRate: actualRate,
      sampleCount: bucketRecords.length,
      error: Math.abs(midpoint - actualRate),
    };
  });

  const isOverconfident = calibrationBias > 0.1;
  const isUnderconfident = calibrationBias < -0.1;
  let verdict: ConfidenceCalibrationScore['calibrationVerdict'] = 'well_calibrated';
  if (isOverconfident) verdict = 'overconfident';
  else if (isUnderconfident) verdict = 'underconfident';

  const recommendedAdjustment =
    calibrationBias > 0 ? -calibrationBias * 0.5 : Math.abs(calibrationBias) * 0.5;

  return {
    agentId,
    windowDays,
    sampleSize: windowed.length,
    meanPredictedConfidence: meanPredicted,
    meanActualAcceptanceRate: meanActual,
    calibrationBias,
    calibrationError,
    recommendedAdjustment,
    isOverconfident,
    isUnderconfident,
    calibrationVerdict: verdict,
    bucketAnalysis,
    calculatedAt: new Date().toISOString(),
  };
}

function computeSkillEffectiveness(
  records: DecisionOutcomeRecord[],
  skillId: string,
  capability: string,
  windowDays: number,
): SkillEffectivenessScore {
  const windowed = filterByWindow(
    records.filter((r) => r.skillId === skillId),
    windowDays,
  );
  const total = windowed.length;

  if (total === 0) {
    return {
      skillId,
      capability,
      windowDays,
      totalUsages: 0,
      acceptanceRate: 0,
      averageConfidence: 0,
      averageLatencyMs: null,
      overrideRate: 0,
      humanReviewTriggerRate: 0,
      effectivenessScore: 0,
      trend: 'insufficient_data',
      calculatedAt: new Date().toISOString(),
    };
  }

  const accepted = windowed.filter((r) => r.actualOutcome === 'accepted').length;
  const overridden = windowed.filter((r) => r.wasOverridden).length;
  const humanReview = windowed.filter((r) => r.humanReviewRequested).length;

  const acceptanceRate = accepted / total;
  const overrideRate = overridden / total;
  const humanReviewRate = humanReview / total;
  const avgConfidence = windowed.reduce((sum, r) => sum + r.predictedConfidence, 0) / total;

  const effectivenessScore =
    acceptanceRate * 0.5 + (1 - overrideRate) * 0.3 + (1 - humanReviewRate) * 0.2;

  const midpoint = Math.floor(total / 2);
  const firstHalf = windowed.slice(0, midpoint);
  const secondHalf = windowed.slice(midpoint);
  const firstAccept =
    firstHalf.length > 0
      ? firstHalf.filter((r) => r.actualOutcome === 'accepted').length / firstHalf.length
      : 0;
  const secondAccept =
    secondHalf.length > 0
      ? secondHalf.filter((r) => r.actualOutcome === 'accepted').length / secondHalf.length
      : 0;

  let trend: SkillEffectivenessScore['trend'] = 'stable';
  if (total < 5) trend = 'insufficient_data';
  else if (secondAccept - firstAccept > 0.1) trend = 'improving';
  else if (firstAccept - secondAccept > 0.1) trend = 'declining';

  return {
    skillId,
    capability,
    windowDays,
    totalUsages: total,
    acceptanceRate,
    averageConfidence: avgConfidence,
    averageLatencyMs: null,
    overrideRate,
    humanReviewTriggerRate: humanReviewRate,
    effectivenessScore,
    trend,
    calculatedAt: new Date().toISOString(),
  };
}

export class ScoringEngine {
  private config: ScoringWindowConfig;
  private outcomeStore = new Map<string, DecisionOutcomeRecord[]>();

  constructor(config: Partial<ScoringWindowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  recordOutcome(record: DecisionOutcomeRecord): void {
    const existing = this.outcomeStore.get(record.agentId) ?? [];
    const existingIdx = existing.findIndex((r) => r.decisionId === record.decisionId);
    if (existingIdx >= 0) {
      existing[existingIdx] = record;
    } else {
      existing.push(record);
      if (existing.length > 10000) existing.shift();
    }
    this.outcomeStore.set(record.agentId, existing);

    void this.persistOutcome(record);
  }

  private async persistOutcome(record: DecisionOutcomeRecord): Promise<void> {
    try {
      const { db } = await import('@szl-holdings/db');
      const { alloyDecisionOutcomes } = await import('@szl-holdings/db');
      await db
        .insert(alloyDecisionOutcomes)
        .values({
          decisionId: record.decisionId,
          agentId: record.agentId,
          tenantId: record.tenantId,
          skillId: record.skillId,
          capability: record.capability,
          predictedConfidence: record.predictedConfidence,
          actualOutcome: record.actualOutcome,
          wasActedOn: record.wasActedOn,
          wasOverridden: record.wasOverridden,
          overrideReason: record.overrideReason,
          predictedImpactLevel: record.predictedImpactLevel,
          actualImpactLevel: record.actualImpactLevel,
          recommendedAction: record.recommendedAction,
          finalAction: record.finalAction,
          executionResult: record.executionResult,
          humanReviewRequired: record.humanReviewRequired,
          humanReviewRequested: record.humanReviewRequested,
          decisionType: record.decisionType,
          resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : null,
        })
        .onConflictDoUpdate({
          target: alloyDecisionOutcomes.decisionId,
          set: {
            actualOutcome: record.actualOutcome,
            wasActedOn: record.wasActedOn,
            wasOverridden: record.wasOverridden,
            actualImpactLevel: record.actualImpactLevel,
            finalAction: record.finalAction,
            executionResult: record.executionResult,
            resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : null,
          },
        });
    } catch {}
  }

  async loadFromDb(agentId: string): Promise<void> {
    try {
      const { db, alloyDecisionOutcomes } = await import('@szl-holdings/db');
      const { eq, desc } = await import('drizzle-orm');
      const rows = await db
        .select()
        .from(alloyDecisionOutcomes)
        .where(eq(alloyDecisionOutcomes.agentId, agentId))
        .orderBy(desc(alloyDecisionOutcomes.recordedAt))
        .limit(1000);

      const records = rows.map((r) => ({
        decisionId: r.decisionId,
        agentId: r.agentId,
        tenantId: r.tenantId,
        skillId: r.skillId,
        capability: r.capability,
        predictedConfidence: r.predictedConfidence,
        actualOutcome: r.actualOutcome as DecisionOutcomeRecord['actualOutcome'],
        wasActedOn: r.wasActedOn,
        wasOverridden: r.wasOverridden,
        overrideReason: r.overrideReason,
        predictedImpactLevel: r.predictedImpactLevel,
        actualImpactLevel: r.actualImpactLevel,
        recommendedAction: r.recommendedAction,
        finalAction: r.finalAction,
        executionResult: r.executionResult as DecisionOutcomeRecord['executionResult'],
        humanReviewRequired: r.humanReviewRequired,
        humanReviewRequested: r.humanReviewRequested,
        decisionType: r.decisionType,
        recordedAt: r.recordedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
      }));

      this.outcomeStore.set(agentId, records);
    } catch {}
  }

  getAgentAccuracy(agentId: string, windowDays?: number): AgentAccuracyScore {
    const records = this.outcomeStore.get(agentId) ?? [];
    return computeAccuracyScore(records, windowDays ?? this.config.longWindowDays);
  }

  getAgentCalibration(agentId: string, windowDays?: number): ConfidenceCalibrationScore {
    const records = this.outcomeStore.get(agentId) ?? [];
    return computeCalibrationScore(records, windowDays ?? this.config.longWindowDays, this.config);
  }

  getSkillEffectiveness(
    agentId: string,
    skillId: string,
    capability: string,
    windowDays?: number,
  ): SkillEffectivenessScore {
    const records = this.outcomeStore.get(agentId) ?? [];
    return computeSkillEffectiveness(
      records,
      skillId,
      capability,
      windowDays ?? this.config.longWindowDays,
    );
  }

  getAllSkillEffectiveness(agentId: string, windowDays?: number): SkillEffectivenessScore[] {
    const records = this.outcomeStore.get(agentId) ?? [];
    const skillGroups = new Map<string, { skillId: string; capability: string }>();
    for (const r of records) {
      if (r.skillId && r.capability) {
        skillGroups.set(r.skillId, { skillId: r.skillId, capability: r.capability });
      }
    }
    return [...skillGroups.values()].map(({ skillId, capability }) =>
      computeSkillEffectiveness(
        records,
        skillId,
        capability,
        windowDays ?? this.config.longWindowDays,
      ),
    );
  }

  computeAgentProfile(agentId: string, windowDays?: number): AgentPerformanceProfile {
    const records = this.outcomeStore.get(agentId) ?? [];
    const window = windowDays ?? this.config.longWindowDays;
    const accuracy = computeAccuracyScore(records, window);
    const calibration = computeCalibrationScore(records, window, this.config);
    const skillEffectiveness = this.getAllSkillEffectiveness(agentId, window);

    const flags: string[] = [];
    if (accuracy.overrideRate > this.config.overrideRateWarningThreshold) {
      flags.push(
        `High override rate: ${Math.round(accuracy.overrideRate * 100)}% (threshold: ${Math.round(this.config.overrideRateWarningThreshold * 100)}%)`,
      );
    }
    if (
      accuracy.acceptanceRate < this.config.lowAcceptanceWarningThreshold &&
      accuracy.totalDecisions >= this.config.minSampleSize
    ) {
      flags.push(
        `Low acceptance rate: ${Math.round(accuracy.acceptanceRate * 100)}% (threshold: ${Math.round(this.config.lowAcceptanceWarningThreshold * 100)}%)`,
      );
    }
    if (calibration.calibrationVerdict === 'overconfident') {
      flags.push(
        `Overconfident: predicting ${Math.round(calibration.meanPredictedConfidence * 100)}% but actual acceptance is ${Math.round(calibration.meanActualAcceptanceRate * 100)}%`,
      );
    }
    if (calibration.calibrationVerdict === 'underconfident') {
      flags.push(
        `Underconfident: apply +${Math.round(Math.abs(calibration.recommendedAdjustment) * 100)}% confidence adjustment`,
      );
    }
    skillEffectiveness
      .filter((s) => s.trend === 'declining' && s.totalUsages >= this.config.minSampleSize)
      .forEach((s) => {
        flags.push(`Skill '${s.capability}' is declining in effectiveness`);
      });

    const overallScore =
      accuracy.weightedAccuracyScore * 0.6 +
      (calibration.calibrationVerdict === 'well_calibrated' ? 1 : 0.5) * 0.4;

    let healthLabel: AgentPerformanceProfile['healthLabel'] = 'good';
    if (overallScore >= 0.85) healthLabel = 'excellent';
    else if (overallScore >= 0.7) healthLabel = 'good';
    else if (overallScore >= 0.5) healthLabel = 'fair';
    else if (overallScore >= 0.35) healthLabel = 'poor';
    else healthLabel = 'critical';

    const lastDecision = records.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];

    return {
      agentId,
      accuracy,
      calibration,
      skillEffectiveness,
      overallHealthScore: overallScore,
      healthLabel,
      flags,
      lastDecisionAt: lastDecision?.recordedAt ?? null,
      calculatedAt: new Date().toISOString(),
    };
  }

  detectTrend(
    agentId: string,
    shortWindow?: number,
    longWindow?: number,
  ): {
    isDeclinig: boolean;
    shortTermScore: number;
    longTermScore: number;
    delta: number;
    trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  } {
    const records = this.outcomeStore.get(agentId) ?? [];
    const shortW = shortWindow ?? this.config.shortWindowDays;
    const longW = longWindow ?? this.config.longWindowDays;

    const shortScore = computeAccuracyScore(records, shortW).weightedAccuracyScore;
    const longScore = computeAccuracyScore(records, longW).weightedAccuracyScore;

    const shortRecords = filterByWindow(records, shortW);
    if (shortRecords.length < this.config.minSampleSize) {
      return {
        isDeclinig: false,
        shortTermScore: shortScore,
        longTermScore: longScore,
        delta: 0,
        trend: 'insufficient_data',
      };
    }

    const delta = shortScore - longScore;
    const isDeclinig = delta < -this.config.declineThreshold;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (delta > this.config.declineThreshold) trend = 'improving';
    else if (isDeclinig) trend = 'declining';

    return { isDeclinig, shortTermScore: shortScore, longTermScore: longScore, delta, trend };
  }

  getConfig(): ScoringWindowConfig {
    return { ...this.config };
  }

  updateConfig(patch: Partial<ScoringWindowConfig>): void {
    this.config = { ...this.config, ...patch };
  }
}

export const scoringEngine = new ScoringEngine();
