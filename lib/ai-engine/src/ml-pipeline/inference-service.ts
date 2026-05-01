import { computeShapExplanation } from './explainability.js';
import { getFeatureVector } from './feature-store.js';
import { logger } from './logger.js';
import { mlModelRegistry } from './ml-model-registry.js';

export interface PredictionRequest {
  domain: string;
  modelType: string;
  entityId: string;
  entityType: string;
  inputFeatures?: Record<string, unknown>;
  includeExplanation?: boolean;
  forceRefresh?: boolean;
}

export interface PredictionResult {
  predictionId: string;
  modelVersionId: string;
  domain: string;
  entityId: string;
  entityType: string;
  prediction: unknown;
  confidence: number;
  explanation: ReturnType<typeof computeShapExplanation> | null;
  latencyMs: number;
  cacheHit: boolean;
  modelVersion: string;
  predictedAt: Date;
}

export interface BatchPredictionRequest {
  domain: string;
  modelType: string;
  entities: Array<{
    entityId: string;
    entityType: string;
    inputFeatures?: Record<string, unknown>;
  }>;
  includeExplanation?: boolean;
}

export interface BatchPredictionResult {
  batchId: string;
  domain: string;
  modelType: string;
  totalRequested: number;
  totalCompleted: number;
  totalFailed: number;
  predictions: Array<PredictionResult | { entityId: string; error: string }>;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Prediction cache: key = `${modelVersionId}:${entityType}:${entityId}`
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: PredictionResult;
  expiresAt: number;
}

const predictionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(modelVersionId: string, entityType: string, entityId: string): string {
  return `${modelVersionId}:${entityType}:${entityId}`;
}

// ---------------------------------------------------------------------------
// Simulated model inference
// ---------------------------------------------------------------------------

function runModelInference(
  domain: string,
  modelType: string,
  features: Record<string, unknown>,
): { prediction: unknown; confidence: number } {
  const featureValues = Object.values(features).map((v) => (typeof v === 'number' ? v : 0));
  const avg =
    featureValues.length > 0
      ? featureValues.reduce((s, v) => s + v, 0) / featureValues.length
      : 0.5;

  // Domain-specific output shapes
  if (domain === 'terra' && modelType === 'property_valuation') {
    return {
      prediction: Math.round(250000 + avg * 1500000),
      confidence: 0.72 + Math.random() * 0.18,
    };
  }
  if (domain === 'terra' && modelType === 'distress_classifier') {
    const prob = Math.min(1, Math.max(0, 0.1 + avg * 0.6));
    return {
      prediction: { distressed: prob > 0.5, probability: parseFloat(prob.toFixed(4)) },
      confidence: 1 - Math.abs(prob - 0.5),
    };
  }
  if (domain === 'aegis' && modelType === 'threat_severity_scorer') {
    return {
      prediction: Math.round(Math.min(100, avg * 150)),
      confidence: 0.78 + Math.random() * 0.15,
    };
  }
  if (domain === 'aegis' && modelType === 'threat_anomaly_detector') {
    const score = Math.min(1, Math.max(0, avg));
    return {
      prediction: { isAnomaly: score > 0.7, anomalyScore: parseFloat(score.toFixed(4)) },
      confidence: 0.75 + Math.random() * 0.2,
    };
  }
  if (
    domain === 'szl' &&
    (modelType === 'deal_quality_scorer' || modelType === 'portfolio_health_scorer')
  ) {
    return {
      prediction: Math.round(Math.min(100, Math.max(0, 40 + avg * 70))),
      confidence: 0.7 + Math.random() * 0.2,
    };
  }
  if (domain === 'szl' && modelType === 'lp_reup_classifier') {
    const prob = Math.min(1, Math.max(0, 0.3 + avg * 0.5));
    return {
      prediction: { reup: prob > 0.5, probability: parseFloat(prob.toFixed(4)) },
      confidence: 0.68 + Math.random() * 0.22,
    };
  }
  if (domain === 'prism' && modelType === 'case_outcome_classifier') {
    const _outcomes = ['win', 'settle', 'lose'] as const;
    const probs = [0.3 + avg * 0.2, 0.4, 0.3 - avg * 0.1].map((p) => Math.min(1, Math.max(0, p)));
    const total = probs.reduce((s, v) => s + v, 0);
    const [win, settle, lose] = probs.map((p) => parseFloat((p / total).toFixed(4)));
    const predicted =
      probs[0]! > probs[1]! && probs[0]! > probs[2]!
        ? 'win'
        : probs[1]! > probs[2]!
          ? 'settle'
          : 'lose';
    return {
      prediction: { outcome: predicted, probabilities: { win, settle, lose } },
      confidence: Math.max(...probs),
    };
  }
  if (domain === 'lyte' && modelType === 'sla_breach_classifier') {
    const prob = Math.min(1, Math.max(0, avg * 0.4));
    return {
      prediction: { breach: prob > 0.6, probability: parseFloat(prob.toFixed(4)) },
      confidence: 0.8 + Math.random() * 0.15,
    };
  }
  if (domain === 'vessels' && modelType === 'maintenance_failure_classifier') {
    const prob = Math.min(1, Math.max(0, avg * 0.35));
    return {
      prediction: { failure: prob > 0.5, probability: parseFloat(prob.toFixed(4)) },
      confidence: 0.73 + Math.random() * 0.18,
    };
  }
  if (domain === 'vessels' && modelType === 'route-anomaly') {
    // GBT route anomaly — dominant features: ais_gap_hours, speed_deviation, heading_variance
    const aisGapWeight = 0.38;
    const speedDevWeight = 0.27;
    const headingVarWeight = 0.18;
    const feats = features as Record<string, number>;
    const driven =
      (feats['ais_gap_hours'] ?? avg) * aisGapWeight +
      (feats['speed_deviation'] ?? avg) * speedDevWeight +
      (feats['heading_variance'] ?? avg) * headingVarWeight +
      avg * (1 - aisGapWeight - speedDevWeight - headingVarWeight);
    const prob = Math.min(0.99, Math.max(0.01, driven * 0.7 + 0.04));
    const confidence = parseFloat((0.82 + (1 - Math.abs(prob - 0.5)) * 0.08).toFixed(4));
    return {
      prediction: { probability: parseFloat(prob.toFixed(4)), anomaly: prob > 0.65 },
      confidence,
    };
  }
  if (domain === 'vessels' && modelType === 'dark-activity') {
    // Random Forest dark-activity — dominant features: ais_blackout_duration, region_risk_tier, flag_state_opacity
    const feats = features as Record<string, number>;
    const blackoutWeight = 0.41;
    const regionWeight = 0.24;
    const flagWeight = 0.19;
    const driven =
      (feats['ais_blackout_duration'] ?? avg) * blackoutWeight +
      (feats['region_risk_tier'] ?? avg) * regionWeight +
      (feats['flag_state_opacity'] ?? avg) * flagWeight +
      avg * (1 - blackoutWeight - regionWeight - flagWeight);
    const prob = Math.min(0.99, Math.max(0.01, driven * 0.75 + 0.06));
    const confidence = parseFloat((0.85 + (1 - Math.abs(prob - 0.5)) * 0.06).toFixed(4));
    return {
      prediction: { probability: parseFloat(prob.toFixed(4)), dark: prob > 0.55 },
      confidence,
    };
  }
  if (domain === 'vessels' && modelType === 'voyage-pnl') {
    // Monte Carlo ensemble TCE output — base prediction, intervals computed at API layer
    const feats = features as Record<string, number>;
    const bunkerWeight = 0.34;
    const congestionWeight = 0.22;
    const weatherWeight = 0.18;
    const counterpartyWeight = 0.15;
    const routeWeight = 0.11;
    // bunker_price is 0-1 normalized; high bunker = lower TCE
    const bunkerFactor = 1 - (feats['bunker_price'] ?? 0.5) * 0.4;
    const congestionFactor = 1 - (feats['port_congestion_index'] ?? 0.3) * 0.25;
    const weatherFactor = 1 - (feats['weather_routing_penalty'] ?? 0.15) * 0.2;
    const counterpartyFactor = (feats['counterparty_credit_score'] ?? 0.7) * 0.15 + 0.85;
    const routeFactor = 1 - (feats['route_distance_nm'] ?? 0.5) * 0.1;
    const weightedAdj =
      bunkerFactor * bunkerWeight +
      congestionFactor * congestionWeight +
      weatherFactor * weatherWeight +
      counterpartyFactor * counterpartyWeight +
      routeFactor * routeWeight;
    const normalizedAdj = weightedAdj / (bunkerWeight + congestionWeight + weatherWeight + counterpartyWeight + routeWeight);
    const baseTce = Math.round(12000 + normalizedAdj * 14000);
    const confidence = parseFloat((0.79 + normalizedAdj * 0.12).toFixed(4));
    return {
      prediction: { tce_usd_per_day: baseTce, profitable: baseTce > 14500 },
      confidence,
    };
  }
  if (modelType.includes('forecast')) {
    const horizon = 7;
    const values = Array.from({ length: horizon }, (_, i) =>
      parseFloat((avg * 100 + i * 2 + (Math.random() - 0.5) * 10).toFixed(2)),
    );
    return {
      prediction: { horizon_days: horizon, values, trend: avg > 0.5 ? 'increasing' : 'stable' },
      confidence: 0.65 + Math.random() * 0.25,
    };
  }

  // Fallback generic scorer
  return {
    prediction: parseFloat((avg * 100).toFixed(2)),
    confidence: 0.65 + Math.random() * 0.25,
  };
}

// ---------------------------------------------------------------------------
// Inference API
// ---------------------------------------------------------------------------

export async function predict(request: PredictionRequest): Promise<PredictionResult> {
  const t0 = Date.now();

  const model = mlModelRegistry.getProductionModelForDomain(request.domain, request.modelType);
  if (!model) {
    throw new Error(`No production model found for ${request.domain}/${request.modelType}`);
  }

  const ck = cacheKey(model.modelVersionId, request.entityType, request.entityId);
  if (!request.forceRefresh) {
    const cached = predictionCache.get(ck);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cacheHit: true, latencyMs: Date.now() - t0 };
    }
  }

  const featureVector = request.inputFeatures
    ? {
        entityId: request.entityId,
        entityType: request.entityType,
        features: request.inputFeatures,
        computedAt: new Date(),
        staleFeatures: [],
      }
    : getFeatureVector(request.entityId, request.entityType, model.featureIds);

  const { prediction, confidence } = runModelInference(
    request.domain,
    request.modelType,
    featureVector.features,
  );

  const explanation = request.includeExplanation
    ? computeShapExplanation(model.featureImportance ?? {}, featureVector.features, prediction)
    : null;

  const result: PredictionResult = {
    predictionId: `pred-${crypto.randomUUID()}`,
    modelVersionId: model.modelVersionId,
    domain: request.domain,
    entityId: request.entityId,
    entityType: request.entityType,
    prediction,
    confidence,
    explanation,
    latencyMs: Date.now() - t0,
    cacheHit: false,
    modelVersion: model.version,
    predictedAt: new Date(),
  };

  predictionCache.set(ck, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  logger.debug(
    {
      predictionId: result.predictionId,
      domain: request.domain,
      modelType: request.modelType,
      latencyMs: result.latencyMs,
    },
    'Prediction generated',
  );
  return result;
}

export async function batchPredict(
  request: BatchPredictionRequest,
): Promise<BatchPredictionResult> {
  const batchId = `batch-${crypto.randomUUID()}`;
  const t0 = Date.now();
  const results: Array<PredictionResult | { entityId: string; error: string }> = [];
  let failed = 0;

  for (const entity of request.entities) {
    try {
      const result = await predict({
        domain: request.domain,
        modelType: request.modelType,
        entityId: entity.entityId,
        entityType: entity.entityType,
        ...(entity.inputFeatures !== undefined ? { inputFeatures: entity.inputFeatures } : {}),
        ...(request.includeExplanation !== undefined ? { includeExplanation: request.includeExplanation } : {}),
      });
      results.push(result);
    } catch (err) {
      failed++;
      results.push({
        entityId: entity.entityId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info(
    { batchId, total: request.entities.length, failed, durationMs: Date.now() - t0 },
    'Batch prediction completed',
  );
  return {
    batchId,
    domain: request.domain,
    modelType: request.modelType,
    totalRequested: request.entities.length,
    totalCompleted: request.entities.length - failed,
    totalFailed: failed,
    predictions: results,
    durationMs: Date.now() - t0,
  };
}

export function getInferenceStats() {
  const cached = predictionCache.size;
  const expired = Array.from(predictionCache.values()).filter(
    (e) => e.expiresAt <= Date.now(),
  ).length;
  return { cachedPredictions: cached, expiredEntries: expired, cacheSizeBytes: cached * 512 };
}

export function clearPredictionCache(modelVersionId?: string): number {
  if (!modelVersionId) {
    const size = predictionCache.size;
    predictionCache.clear();
    return size;
  }
  let cleared = 0;
  for (const [key] of predictionCache) {
    if (key.startsWith(modelVersionId)) {
      predictionCache.delete(key);
      cleared++;
    }
  }
  return cleared;
}
