import { pool } from '@szl-holdings/db';

export interface AgentPerformanceSnapshot {
  agentId: string;
  period: string;
  totalDecisions: number;
  acceptedDecisions: number;
  rejectedDecisions: number;
  overriddenDecisions: number;
  avgConfidence: number;
  calibrationBias: number;
  accuracyScore: number;
  confidenceTrend: 'improving' | 'stable' | 'declining';
  flaggedForReview: boolean;
  reviewReason: string | null;
  computedAt: string;
}

export interface SelfReflectionOutput {
  agentId: string;
  reflectionPeriod: string;
  keyObservations: string[];
  adjustmentRecommendations: string[];
  confidenceAdjustment: number;
  shouldRequestHumanReview: boolean;
  humanReviewReason: string | null;
  performanceScore: number;
  computedAt: string;
}

export async function computeAgentPerformanceSnapshot(
  agentId: string,
): Promise<AgentPerformanceSnapshot> {
  try {
    const period = new Date().toISOString().slice(0, 7);
    const result = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' OR status = 'approved' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'overridden' THEN 1 ELSE 0 END) as overridden,
        AVG(CASE WHEN confidence IS NOT NULL THEN confidence ELSE 0.5 END) as avg_conf
      FROM alloy_ai_decisions
      WHERE decision_id LIKE $1
         OR recommended_action IS NOT NULL
    `,
      [`%${agentId}%`],
    );

    const row = (result.rows[0] ?? {}) as Record<string, unknown>;
    const total = Number(row.total ?? 0);
    const accepted = Number(row.accepted ?? 0);
    const rejected = Number(row.rejected ?? 0);
    const overridden = Number(row.overridden ?? 0);
    const avgConf = Number(row.avg_conf ?? 0.5);

    const accuracyScore = total > 0 ? accepted / total : 0.75;
    const _expectedAccuracy = 0.8;
    const calibrationBias = avgConf - accuracyScore;

    const prevResult = await pool.query(
      `
      SELECT avg_confidence, accuracy_score FROM agent_performance_snapshots
      WHERE agent_id = $1 ORDER BY computed_at DESC LIMIT 1
    `,
      [agentId],
    );

    const prev = prevResult.rows[0] as Record<string, unknown> | undefined;
    let confidenceTrend: AgentPerformanceSnapshot['confidenceTrend'] = 'stable';
    if (prev) {
      const prevAccuracy = Number(prev.accuracy_score ?? 0.75);
      if (accuracyScore > prevAccuracy + 0.05) confidenceTrend = 'improving';
      else if (accuracyScore < prevAccuracy - 0.05) confidenceTrend = 'declining';
    }

    const flaggedForReview = accuracyScore < 0.5 || Math.abs(calibrationBias) > 0.3;
    const reviewReason = flaggedForReview
      ? accuracyScore < 0.5
        ? `Low accuracy score (${Math.round(accuracyScore * 100)}%) — human review recommended`
        : `High calibration bias (${calibrationBias > 0 ? '+' : ''}${Math.round(calibrationBias * 100)}%) — confidence is poorly calibrated`
      : null;

    const snapshot: AgentPerformanceSnapshot = {
      agentId,
      period,
      totalDecisions: total,
      acceptedDecisions: accepted,
      rejectedDecisions: rejected,
      overriddenDecisions: overridden,
      avgConfidence: Math.round(avgConf * 100) / 100,
      calibrationBias: Math.round(calibrationBias * 100) / 100,
      accuracyScore: Math.round(accuracyScore * 100) / 100,
      confidenceTrend,
      flaggedForReview,
      reviewReason,
      computedAt: new Date().toISOString(),
    };

    await pool.query(
      `
      INSERT INTO agent_performance_snapshots
        (agent_id, period, total_decisions, accepted_decisions, rejected_decisions, overridden_decisions,
         avg_confidence, calibration_bias, accuracy_score, confidence_trend, flagged_for_review, review_reason, computed_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
      ON CONFLICT DO NOTHING
    `,
      [
        agentId,
        period,
        total,
        accepted,
        rejected,
        overridden,
        avgConf,
        calibrationBias,
        accuracyScore,
        confidenceTrend,
        flaggedForReview,
        reviewReason,
      ],
    );

    return snapshot;
  } catch {
    return {
      agentId,
      period: new Date().toISOString().slice(0, 7),
      totalDecisions: 0,
      acceptedDecisions: 0,
      rejectedDecisions: 0,
      overriddenDecisions: 0,
      avgConfidence: 0.75,
      calibrationBias: 0,
      accuracyScore: 0.75,
      confidenceTrend: 'stable',
      flaggedForReview: false,
      reviewReason: null,
      computedAt: new Date().toISOString(),
    };
  }
}

export async function runSelfReflection(agentId: string): Promise<SelfReflectionOutput> {
  const snapshot = await computeAgentPerformanceSnapshot(agentId);

  const observations: string[] = [];
  const recommendations: string[] = [];
  let confidenceAdjustment = 0;

  if (snapshot.totalDecisions === 0) {
    observations.push('No decision history available yet — baseline performance unmeasured');
  } else {
    observations.push(
      `Processed ${snapshot.totalDecisions} decisions with ${Math.round(snapshot.accuracyScore * 100)}% acceptance rate`,
    );
    if (snapshot.confidenceTrend === 'improving')
      observations.push('Accuracy is trending upward — reasoning strategies are effective');
    if (snapshot.confidenceTrend === 'declining')
      observations.push('Accuracy is declining — current reasoning approach may need adjustment');
    if (Math.abs(snapshot.calibrationBias) > 0.15) {
      observations.push(
        `Confidence calibration is off by ${Math.round(snapshot.calibrationBias * 100)}% — overconfident in assessments`,
      );
    }
  }

  if (snapshot.calibrationBias > 0.15) {
    confidenceAdjustment = -Math.round(snapshot.calibrationBias * 50);
    recommendations.push(
      `Reduce reported confidence scores by approximately ${Math.abs(confidenceAdjustment)}% to improve calibration`,
    );
  } else if (snapshot.calibrationBias < -0.15) {
    confidenceAdjustment = Math.round(Math.abs(snapshot.calibrationBias) * 50);
    recommendations.push(
      `Increase confidence scores by approximately ${confidenceAdjustment}% — you are consistently underconfident`,
    );
  }

  if (snapshot.rejectedDecisions > snapshot.acceptedDecisions * 0.3) {
    recommendations.push(
      'High rejection rate — gather more evidence before making recommendations',
    );
    recommendations.push('Consider requesting maker-checker validation for borderline cases');
  }

  if (snapshot.overriddenDecisions > 5) {
    recommendations.push(
      'Significant number of overrides detected — review edge cases where reasoning diverges from operator judgment',
    );
  }

  const performanceScore =
    Math.round(
      (snapshot.accuracyScore * 0.6 + (1 - Math.abs(snapshot.calibrationBias)) * 0.4) * 100,
    ) / 100;

  const output: SelfReflectionOutput = {
    agentId,
    reflectionPeriod: snapshot.period,
    keyObservations: observations,
    adjustmentRecommendations: recommendations,
    confidenceAdjustment,
    shouldRequestHumanReview: snapshot.flaggedForReview,
    humanReviewReason: snapshot.reviewReason,
    performanceScore,
    computedAt: new Date().toISOString(),
  };

  try {
    await pool.query(
      `
      INSERT INTO agent_self_reflections
        (agent_id, reflection_period, key_observations, adjustment_recommendations,
         confidence_adjustment, should_request_human_review, human_review_reason, performance_score, computed_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
    `,
      [
        agentId,
        snapshot.period,
        JSON.stringify(observations),
        JSON.stringify(recommendations),
        confidenceAdjustment,
        snapshot.flaggedForReview,
        snapshot.reviewReason,
        performanceScore,
      ],
    );
  } catch {}

  return output;
}

export async function getAgentSelfReflectionHistory(
  agentId: string,
  limit = 10,
): Promise<SelfReflectionOutput[]> {
  try {
    const result = await pool.query(
      `
      SELECT * FROM agent_self_reflections WHERE agent_id = $1 ORDER BY computed_at DESC LIMIT $2
    `,
      [agentId, limit],
    );

    return result.rows.map((r: Record<string, unknown>) => ({
      agentId: r.agent_id as string,
      reflectionPeriod: r.reflection_period as string,
      keyObservations: (r.key_observations as string[]) ?? [],
      adjustmentRecommendations: (r.adjustment_recommendations as string[]) ?? [],
      confidenceAdjustment: Number(r.confidence_adjustment ?? 0),
      shouldRequestHumanReview: Boolean(r.should_request_human_review),
      humanReviewReason: (r.human_review_reason as string | null) ?? null,
      performanceScore: Number(r.performance_score ?? 0.5),
      computedAt: (r.computed_at as Date).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getAllAgentPerformanceSnapshots(): Promise<AgentPerformanceSnapshot[]> {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (agent_id) * FROM agent_performance_snapshots ORDER BY agent_id, computed_at DESC
    `);
    return result.rows.map((r: Record<string, unknown>) => ({
      agentId: r.agent_id as string,
      period: r.period as string,
      totalDecisions: Number(r.total_decisions ?? 0),
      acceptedDecisions: Number(r.accepted_decisions ?? 0),
      rejectedDecisions: Number(r.rejected_decisions ?? 0),
      overriddenDecisions: Number(r.overridden_decisions ?? 0),
      avgConfidence: Number(r.avg_confidence ?? 0.75),
      calibrationBias: Number(r.calibration_bias ?? 0),
      accuracyScore: Number(r.accuracy_score ?? 0.75),
      confidenceTrend:
        (r.confidence_trend as AgentPerformanceSnapshot['confidenceTrend']) ?? 'stable',
      flaggedForReview: Boolean(r.flagged_for_review),
      reviewReason: (r.review_reason as string | null) ?? null,
      computedAt: (r.computed_at as Date).toISOString(),
    }));
  } catch {
    return [];
  }
}
