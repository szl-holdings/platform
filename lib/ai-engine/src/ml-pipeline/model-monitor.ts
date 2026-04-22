import { logger } from './logger.js';
import { mlModelRegistry } from './ml-model-registry.js';
import { triggerDomainTraining } from './training-pipeline.js';

export type DriftStatus = 'none' | 'minor' | 'major';
export type PerformanceStatus = 'healthy' | 'degraded' | 'critical';

export interface FeatureDriftScore {
  featureId: string;
  ksDriftScore: number;
  psiScore: number;
  status: DriftStatus;
}

export interface AccuracyMetrics {
  sampleCount: number;
  accuracy?: number;
  f1?: number;
  mse?: number;
  r2?: number;
  mape?: number;
}

export interface MonitoringSnapshot {
  snapshotId: string;
  modelVersionId: string;
  domain: string;
  windowStart: Date;
  windowEnd: Date;
  predictionCount: number;
  accuracyMetrics: AccuracyMetrics | null;
  dataDriftScores: FeatureDriftScore[];
  predictionDistribution: {
    mean: number;
    std: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
  } | null;
  driftDetected: boolean;
  performanceDegraded: boolean;
  retrainingTriggered: boolean;
  createdAt: Date;
}

export interface RetrainingTrigger {
  triggerId: string;
  domain: string;
  modelVersionId: string;
  reason: string;
  triggeredAt: Date;
  runIds: string[];
}

// ---------------------------------------------------------------------------
// In-memory snapshot store
// ---------------------------------------------------------------------------

const snapshotStore = new Map<string, MonitoringSnapshot>();
const retrainingLog: RetrainingTrigger[] = [];

// ---------------------------------------------------------------------------
// Drift detection helpers
// ---------------------------------------------------------------------------

function simulateKsDrift(featureId: string): FeatureDriftScore {
  const seed = featureId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const ks = (seed % 100) / 300 + Math.random() * 0.2;
  const psi = ks * 0.7 + Math.random() * 0.05;
  const status: DriftStatus = ks > 0.3 ? 'major' : ks > 0.15 ? 'minor' : 'none';
  return {
    featureId,
    ksDriftScore: parseFloat(ks.toFixed(4)),
    psiScore: parseFloat(psi.toFixed(4)),
    status,
  };
}

function simulateAccuracyMetrics(
  model: ReturnType<typeof mlModelRegistry.getModel>,
  predictionCount: number,
): AccuracyMetrics | null {
  if (!model || predictionCount === 0) return null;

  const baseMetrics = model.testMetrics;
  const degradation = (Math.random() - 0.3) * 0.1; // slight random walk

  return {
    sampleCount: predictionCount,
    ...(baseMetrics.accuracy !== undefined ? { accuracy: Math.max(0, Math.min(1, baseMetrics.accuracy + degradation)) } : {}),
    ...(baseMetrics.f1 !== undefined ? { f1: Math.max(0, Math.min(1, baseMetrics.f1 + degradation)) } : {}),
    ...(baseMetrics.mse !== undefined ? { mse: Math.max(0, baseMetrics.mse + Math.abs(degradation) * 0.5) } : {}),
    ...(baseMetrics.r2 !== undefined ? { r2: Math.max(-1, Math.min(1, baseMetrics.r2 + degradation)) } : {}),
    ...(baseMetrics.mape !== undefined ? { mape: Math.max(0, baseMetrics.mape + Math.abs(degradation)) } : {}),
  };
}

function isPerformanceDegraded(
  baseMetrics: Record<string, number | undefined>,
  currentMetrics: AccuracyMetrics,
  threshold = 0.1,
): boolean {
  if (baseMetrics.accuracy && currentMetrics.accuracy) {
    return baseMetrics.accuracy - currentMetrics.accuracy > threshold;
  }
  if (baseMetrics.f1 && currentMetrics.f1) {
    return baseMetrics.f1 - currentMetrics.f1 > threshold;
  }
  if (baseMetrics.r2 && currentMetrics.r2) {
    return baseMetrics.r2 - currentMetrics.r2 > threshold;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Monitoring API
// ---------------------------------------------------------------------------

export async function runMonitoringCycle(
  modelVersionId: string,
  windowHours = 24,
): Promise<MonitoringSnapshot> {
  const model = mlModelRegistry.getModel(modelVersionId);
  if (!model) throw new Error(`Model version ${modelVersionId} not found`);

  const now = new Date();
  const windowEnd = now;
  const windowStart = new Date(now.getTime() - windowHours * 3600 * 1000);

  const predictionCount = Math.floor(Math.random() * 500) + 50;
  const accuracyMetrics = simulateAccuracyMetrics(model, predictionCount);
  const dataDriftScores = model.featureIds.map((fid) => simulateKsDrift(fid));
  const driftDetected = dataDriftScores.some((d) => d.status !== 'none');
  const performanceDegraded = accuracyMetrics
    ? isPerformanceDegraded(
        model.testMetrics as Record<string, number | undefined>,
        accuracyMetrics,
      )
    : false;

  const numericPredictions = Array.from({ length: predictionCount }, () => Math.random() * 100);
  const sorted = [...numericPredictions].sort((a, b) => a - b);
  const mean = numericPredictions.reduce((s, v) => s + v, 0) / predictionCount;
  const std = Math.sqrt(
    numericPredictions.reduce((s, v) => s + (v - mean) ** 2, 0) / predictionCount,
  );

  let retrainingTriggered = false;
  const runIds: string[] = [];

  if (driftDetected || performanceDegraded) {
    const reason =
      driftDetected && performanceDegraded
        ? 'Data drift and performance degradation detected'
        : driftDetected
          ? 'Significant data drift detected'
          : 'Model performance degradation detected';

    logger.warn(
      { modelVersionId, domain: model.domain, reason },
      'Automatic retraining triggered by monitoring',
    );
    retrainingTriggered = true;

    const runs = await triggerDomainTraining(model.domain, 'auto-monitor');
    runIds.push(...runs.map((r) => r.runId));

    retrainingLog.push({
      triggerId: `trigger-${crypto.randomUUID()}`,
      domain: model.domain,
      modelVersionId,
      reason,
      triggeredAt: now,
      runIds,
    });
  }

  const snapshot: MonitoringSnapshot = {
    snapshotId: `snap-${crypto.randomUUID()}`,
    modelVersionId,
    domain: model.domain,
    windowStart,
    windowEnd,
    predictionCount,
    accuracyMetrics,
    dataDriftScores,
    predictionDistribution: {
      mean: parseFloat(mean.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      min: parseFloat(sorted[0]?.toFixed(2)),
      max: parseFloat(sorted[sorted.length - 1]?.toFixed(2)),
      p50: parseFloat(sorted[Math.floor(sorted.length * 0.5)]?.toFixed(2)),
      p95: parseFloat(sorted[Math.floor(sorted.length * 0.95)]?.toFixed(2)),
    },
    driftDetected,
    performanceDegraded,
    retrainingTriggered,
    createdAt: now,
  };

  snapshotStore.set(snapshot.snapshotId, snapshot);
  logger.info(
    {
      snapshotId: snapshot.snapshotId,
      domain: model.domain,
      driftDetected,
      performanceDegraded,
      retrainingTriggered,
    },
    'Monitoring snapshot recorded',
  );
  return snapshot;
}

export async function runMonitoringForAllProductionModels(): Promise<MonitoringSnapshot[]> {
  const summary = mlModelRegistry.getRegistrySummary();
  const snapshots: MonitoringSnapshot[] = [];

  for (const prod of summary.productionModels) {
    try {
      const snap = await runMonitoringCycle(prod.modelVersionId);
      snapshots.push(snap);
    } catch (err) {
      logger.error(
        { modelVersionId: prod.modelVersionId, error: String(err) },
        'Monitoring cycle failed',
      );
    }
  }

  return snapshots;
}

export function getMonitoringSnapshots(modelVersionId?: string): MonitoringSnapshot[] {
  const all = Array.from(snapshotStore.values());
  return modelVersionId ? all.filter((s) => s.modelVersionId === modelVersionId) : all;
}

export function getRetrainingLog(): RetrainingTrigger[] {
  return [...retrainingLog];
}

export function getMonitoringSummary() {
  const snapshots = Array.from(snapshotStore.values());
  return {
    totalSnapshots: snapshots.length,
    driftAlerts: snapshots.filter((s) => s.driftDetected).length,
    performanceAlerts: snapshots.filter((s) => s.performanceDegraded).length,
    retrainingsTrigger: snapshots.filter((s) => s.retrainingTriggered).length,
    retrainingLog: retrainingLog.length,
  };
}
