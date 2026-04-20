import type { BusinessImpact, RankingWeights, Signal } from './types.js';

const URGENCY_SCORES: Record<string, number> = {
  routine: 0.2,
  moderate: 0.45,
  urgent: 0.75,
  critical: 1.0,
};

export function scoreBusinessImpact(impact: BusinessImpact): number {
  let score = 0;

  if (impact.financialExposureUsd !== undefined) {
    if (impact.financialExposureUsd > 10_000_000) score += 1.0;
    else if (impact.financialExposureUsd > 1_000_000) score += 0.75;
    else if (impact.financialExposureUsd > 100_000) score += 0.5;
    else if (impact.financialExposureUsd > 10_000) score += 0.25;
    else score += 0.1;
  }

  const reputationalMap: Record<string, number> = {
    none: 0,
    low: 0.1,
    medium: 0.3,
    high: 0.6,
    critical: 1.0,
  };
  if (impact.reputationalRisk) {
    score += reputationalMap[impact.reputationalRisk] ?? 0;
  }

  if (impact.regulatoryExposure) score += 0.4;

  const blastRadius = impact.crossDomainBlastRadius?.length ?? 0;
  score += Math.min(blastRadius * 0.15, 0.6);

  if (impact.affectedEntities !== undefined) {
    if (impact.affectedEntities > 1000) score += 0.5;
    else if (impact.affectedEntities > 100) score += 0.3;
    else if (impact.affectedEntities > 10) score += 0.15;
    else score += 0.05;
  }

  return Math.min(score / 3.5, 1.0);
}

export function scoreUrgency(urgency: string): number {
  return URGENCY_SCORES[urgency] ?? 0.2;
}

export function scoreConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence));
}

export function scoreSlaProximity(signal: Signal): number {
  const meta = signal.metadata ?? {};
  const slaDeadlineMs = meta.slaDeadlineMs as number | undefined;
  if (!slaDeadlineMs) return 0.1;
  const remaining = slaDeadlineMs - Date.now();
  const totalMs = (meta.slaTotalMs as number | undefined) ?? 24 * 60 * 60 * 1000;
  const pctRemaining = remaining / totalMs;
  if (pctRemaining <= 0) return 1.0;
  if (pctRemaining <= 0.1) return 0.9;
  if (pctRemaining <= 0.25) return 0.7;
  if (pctRemaining <= 0.5) return 0.4;
  return 0.2;
}

export function scoreCrossDomainRisk(impact: BusinessImpact, allSignalDomains: string[]): number {
  const blastRadius = impact.crossDomainBlastRadius ?? [];
  const uniqueDomains = new Set([...blastRadius, ...allSignalDomains]);
  if (uniqueDomains.size >= 4) return 1.0;
  if (uniqueDomains.size === 3) return 0.7;
  if (uniqueDomains.size === 2) return 0.4;
  return 0.1;
}

export function computePriorityScore(params: {
  businessImpact: BusinessImpact;
  urgency: string;
  confidence: number;
  signals: Signal[];
  weights: RankingWeights;
}): number {
  const { businessImpact, urgency, confidence, signals, weights } = params;

  const impactScore = scoreBusinessImpact(businessImpact);
  const urgencyScore = scoreUrgency(urgency);
  const confidenceScore = scoreConfidence(confidence);
  const slaScore = signals.length > 0 ? scoreSlaProximity(signals[0]) : 0.1;
  const crossDomainScore = scoreCrossDomainRisk(
    businessImpact,
    signals.map((s) => s.domain),
  );

  const raw =
    impactScore * weights.businessImpact +
    urgencyScore * weights.urgency +
    confidenceScore * weights.confidence +
    slaScore * weights.slaProximity +
    crossDomainScore * weights.crossDomainRisk;

  return Math.round(Math.min(raw, 1.0) * 100);
}
