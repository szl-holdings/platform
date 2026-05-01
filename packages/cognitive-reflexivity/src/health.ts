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
import type { StrategyRegistry } from './strategies';
import { defaultStrategyRegistry } from './strategies';

export interface HealthInputs {
  windowMinutes?: number;
  // raw counters from the engine
  signalsObserved: number;
  signalsActedOn: number;
  dialecticInvocations: number;
  // optional consolidation telemetry
  consolidationCycles?: { ok: number; fail: number };
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

  const score = Math.round(
    (Object.values(components).reduce((a, b) => a + b, 0) /
      Object.keys(components).length) *
      100,
  );

  const tier: CognitiveHealthScore['tier'] =
    score >= 85 ? 'flourishing' : score >= 65 ? 'healthy' : score >= 40 ? 'at_risk' : 'critical';

  return {
    score,
    tier,
    components,
    computedAt: new Date().toISOString(),
    windowMinutes,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
