import type {
  DriftResult,
  EvalRegistry,
  ModelSnapshot,
} from './types.js';
import { DriftResultSchema } from './types.js';

function generateId(): string {
  return `drift-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computePerformanceDrift(
  baseline: ModelSnapshot,
  current: ModelSnapshot,
): { score: number; affectedMetrics: string[] } {
  const deltas: { metric: string; delta: number }[] = [];

  const bm = baseline.metrics;
  const cm = current.metrics;

  if (bm.mae !== undefined && cm.mae !== undefined) {
    deltas.push({ metric: 'mae', delta: (cm.mae - bm.mae) / (bm.mae || 1) });
  }
  if (bm.mape !== undefined && cm.mape !== undefined) {
    deltas.push({ metric: 'mape', delta: (cm.mape - bm.mape) / (bm.mape || 1) });
  }
  if (bm.rmse !== undefined && cm.rmse !== undefined) {
    deltas.push({ metric: 'rmse', delta: (cm.rmse - bm.rmse) / (bm.rmse || 1) });
  }
  if (bm.calibrationScore !== undefined && cm.calibrationScore !== undefined) {
    deltas.push({ metric: 'calibrationScore', delta: (bm.calibrationScore - cm.calibrationScore) });
  }
  if (bm.coverageRate !== undefined && cm.coverageRate !== undefined) {
    deltas.push({ metric: 'coverageRate', delta: (bm.coverageRate - cm.coverageRate) });
  }

  const affectedMetrics = deltas
    .filter((d) => Math.abs(d.delta) > 0.05)
    .map((d) => d.metric);

  const score =
    deltas.length > 0
      ? Math.min(1, deltas.reduce((s, d) => s + Math.abs(d.delta), 0) / deltas.length)
      : 0;

  return { score, affectedMetrics };
}

export async function detectDrift(
  headName: string,
  registry: EvalRegistry,
): Promise<DriftResult | null> {
  const latest = await registry.latestSnapshot(headName);
  if (!latest) return null;

  const baseline = await registry.latestSnapshot(`${headName}::baseline`);
  if (!baseline) {
    await registry.saveSnapshot({ ...latest, headName: `${headName}::baseline` });
    return null;
  }

  const { score, affectedMetrics } = computePerformanceDrift(baseline, latest);

  if (score < 0.05) return null;

  const severity =
    score >= 0.5
      ? 'critical'
      : score >= 0.3
        ? 'high'
        : score >= 0.15
          ? 'medium'
          : 'low';

  const recommendation =
    score >= 0.5
      ? 'rollback'
      : score >= 0.3
        ? 'retrain'
        : score >= 0.15
          ? 'monitor'
          : 'monitor';

  const result = DriftResultSchema.parse({
    id: generateId(),
    headName,
    driftKind: 'performance',
    detectedAt: new Date().toISOString(),
    severity,
    baselineSnapshot: baseline,
    currentSnapshot: latest,
    driftScore: parseFloat(score.toFixed(4)),
    affectedMetrics,
    recommendation,
    notes: `Performance drift detected on ${affectedMetrics.join(', ')}`,
  });

  await registry.persist({ type: 'drift', payload: result });
  return result;
}
