/**
 * Cognitive Health Score — a composite score 0..100 over the recent
 * window summarizing how well the reflexivity loop is functioning.
 *
 * Components (each 0..1, equally weighted):
 *
 *   monologueCadence          — how often the dialectic actually fires.
 *                               Too low → engine isn't reflecting. Too high → noise.
 *   strategyPromotionRate     — fraction of proposed strategies that
 *                               reach 'active' (promoted, not stuck).
 *   dialecticAgreement        — average synthesis confidence over recent
 *                               dialectical traces.
 *   memoryConsolidationHealth — fraction of consolidation cycles that
 *                               succeeded in the window.
 *   governanceGoodStanding    — fraction of approval requests that did
 *                               NOT get rejected (system trust).
 */

import type { CognitiveHealthScore } from './types';
import { type StrategyRegistry, defaultStrategyRegistry } from './strategies';

export interface HealthInputs {
  windowMinutes?: number;
  // raw counters from the engine
  signalsObserved: number;
  signalsActedOn: number;
  dialecticInvocations: number;
  // optional consolidation telemetry
  consolidationCycles?: { ok: number; fail: number };
  /**
   * Optional cognitive-quality telemetry over the window. When supplied,
   * computeHealthScore also derives the four "composite" dimensions
   * (hallucination trend, strategy effectiveness, confidence
   * calibration, memory retrieval precision) and blends them at 60%
   * weight against the loop-mechanics score (40%) when computing the
   * headline tier. When absent, only the loop-mechanics score is used.
   */
  telemetry?: HealthTelemetry;
}

export interface HealthTelemetry {
  /**
   * Hallucination rate samples ordered oldest → newest within the
   * window. Each sample is a fraction in [0,1]. Trend is computed as
   * a simple linear fit; falling = good.
   */
  hallucinationRateSeries?: number[];
  /**
   * Per-active-strategy outcome: `improved` if downstream metrics
   * improved after the strategy went active, else `regressed`. Used
   * for strategyEffectiveness.
   */
  strategyOutcomes?: Array<{ strategyId: string; improved: boolean }>;
  /**
   * Calibration samples — each pair is { confidence, correct }. Brier
   * score: mean squared error between confidence and outcome (1 if
   * correct, 0 otherwise). Lower = better; we map 1 - Brier.
   */
  calibrationSamples?: Array<{ confidence: number; correct: boolean }>;
  /**
   * Retrieval precision samples — { retrievedIds, usedIds }. Precision
   * is |retrieved ∩ used| / |retrieved|.
   */
  retrievalSamples?: Array<{ retrievedIds: string[]; usedIds: string[] }>;
}

export function computeHealthScore(
  inputs: HealthInputs,
  registry: StrategyRegistry = defaultStrategyRegistry,
): CognitiveHealthScore {
  const windowMinutes = inputs.windowMinutes ?? 60;

  // monologueCadence: 1.0 means the engine reflected on a healthy
  // fraction of acted-on signals. Penalize zero-reflection AND
  // hyper-reflection on noise.
  const monologueCadence = (() => {
    if (inputs.signalsActedOn === 0) return 0.5; // neutral when no signals
    const ratio = inputs.dialecticInvocations / inputs.signalsActedOn;
    // ideal ratio ~0.5; falls off either side
    return clamp01(1 - Math.abs(0.5 - ratio));
  })();

  // strategyPromotionRate: among recent proposals, how many got to 'active'
  const strategyPromotionRate = (() => {
    const all = registry.list();
    if (all.length === 0) return 0.5;
    const active = all.filter((s) => s.status === 'active').length;
    const considered = all.filter((s) => s.status !== 'rejected').length;
    return considered > 0 ? clamp01(active / considered) : 0.5;
  })();

  // dialecticAgreement: average of dialectical synthesis confidences
  const dialecticAgreement = (() => {
    const traces = registry
      .list()
      .map((s) => s.provenance.dialecticalTrace?.confidence)
      .filter((c): c is number => typeof c === 'number');
    if (traces.length === 0) return 0.5;
    const avg = traces.reduce((a, b) => a + b, 0) / traces.length;
    return clamp01(avg);
  })();

  const consolidation = inputs.consolidationCycles ?? { ok: 0, fail: 0 };
  const memoryConsolidationHealth = (() => {
    const total = consolidation.ok + consolidation.fail;
    if (total === 0) return 0.7; // no data yet → mildly optimistic
    return clamp01(consolidation.ok / total);
  })();

  const governanceGoodStanding = (() => {
    const all = registry.list();
    if (all.length === 0) return 1.0;
    const rejected = all.filter((s) => s.status === 'rejected').length;
    return clamp01(1 - rejected / all.length);
  })();

  const components = {
    monologueCadence,
    strategyPromotionRate,
    dialecticAgreement,
    memoryConsolidationHealth,
    governanceGoodStanding,
  };

  const loopMechanicsAvg =
    Object.values(components).reduce((a, b) => a + b, 0) / Object.keys(components).length;

  // Composite (cognitive-quality) dimensions are derived from telemetry
  // when present. Absent telemetry leaves `composite` undefined and the
  // headline score equals the loop-mechanics average (back-compat).
  const composite = inputs.telemetry ? computeComposite(inputs.telemetry) : undefined;

  const blendedAvg = composite
    ? // Loop mechanics matter (the engine has to actually function),
      // but cognitive-quality outcomes weigh more heavily because that
      // is the user-visible promise of the system.
      0.4 * loopMechanicsAvg +
      0.6 *
        ((composite.hallucinationTrend +
          composite.strategyEffectiveness +
          composite.confidenceCalibration +
          composite.memoryRetrievalPrecision) /
          4)
    : loopMechanicsAvg;

  const score = Math.round(blendedAvg * 100);

  const tier: CognitiveHealthScore['tier'] =
    score >= 85 ? 'flourishing' : score >= 65 ? 'healthy' : score >= 40 ? 'at_risk' : 'critical';

  return {
    score,
    tier,
    components,
    ...(composite ? { composite } : {}),
    computedAt: new Date().toISOString(),
    windowMinutes,
  };
}

function computeComposite(t: HealthTelemetry): {
  hallucinationTrend: number;
  strategyEffectiveness: number;
  confidenceCalibration: number;
  memoryRetrievalPrecision: number;
} {
  // Hallucination trend: 1 - normalized linear slope. Falling rate → 1.
  const hallucinationTrend = (() => {
    const s = t.hallucinationRateSeries ?? [];
    if (s.length < 2) {
      // Single sample = use level (1 - rate); empty = neutral.
      if (s.length === 1) return clamp01(1 - s[0]!);
      return 0.7;
    }
    // Average slope normalized by series length, clipped to ±1.
    let slope = 0;
    for (let i = 1; i < s.length; i++) slope += s[i]! - s[i - 1]!;
    slope /= s.length - 1;
    // slope > 0 means rate is climbing → bad. Map slope ∈ [-0.5, 0.5] → [1, 0].
    const trendScore = clamp01(0.5 - slope);
    // Blend with current level so a low-rate-but-flat series scores well.
    const level = clamp01(1 - s[s.length - 1]!);
    return clamp01(0.5 * trendScore + 0.5 * level);
  })();

  const strategyEffectiveness = (() => {
    const o = t.strategyOutcomes ?? [];
    if (o.length === 0) return 0.5;
    const improved = o.filter((x) => x.improved).length;
    return clamp01(improved / o.length);
  })();

  const confidenceCalibration = (() => {
    const c = t.calibrationSamples ?? [];
    if (c.length === 0) return 0.5;
    // Brier score = mean( (confidence - outcome)^2 ). Lower = better.
    const brier =
      c.reduce((acc, s) => {
        const outcome = s.correct ? 1 : 0;
        const diff = s.confidence - outcome;
        return acc + diff * diff;
      }, 0) / c.length;
    return clamp01(1 - brier);
  })();

  const memoryRetrievalPrecision = (() => {
    const r = t.retrievalSamples ?? [];
    if (r.length === 0) return 0.5;
    let total = 0;
    for (const sample of r) {
      const used = new Set(sample.usedIds);
      const retrieved = sample.retrievedIds;
      if (retrieved.length === 0) {
        total += 0;
        continue;
      }
      const hits = retrieved.filter((id) => used.has(id)).length;
      total += hits / retrieved.length;
    }
    return clamp01(total / r.length);
  })();

  return {
    hallucinationTrend,
    strategyEffectiveness,
    confidenceCalibration,
    memoryRetrievalPrecision,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
