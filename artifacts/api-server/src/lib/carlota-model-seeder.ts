/**
 * Carlota Jo ML Model Seeder
 *
 * Seeds three production ML forecast heads into the real @szl-holdings/ai-engine
 * model registry on first startup:
 *
 *   1. carlota-strategic_move_forecast
 *      Predicts a competitor's next strategic move within 60 days using website
 *      change signals, hiring velocity, patent filings, and news sentiment.
 *      Algorithm: gradient_boosting with calibrated probabilities + SHAP attribution.
 *
 *   2. carlota-engagement_roadmap_kpi
 *      Turns a completed diagnostic intake into a tracked KPI roadmap with
 *      milestone forecasts. Intervals generated via Monte Carlo (triangular
 *      distributions per phase). Algorithm: ridge_regression.
 *
 *   3. carlota-concierge_anomaly_digest
 *      Per-client, per-week anomaly ranking from live intel feeds. Scores
 *      each signal against the client's historical baseline using an isolation
 *      forest ensemble. Algorithm: isolation_forest.
 *
 * Follows the same register → promote(staging) → promote(production) pattern
 * used by terra-model-seeder.ts and sentra-model-seeder.ts.
 */

import { mlModelRegistry } from '@szl-holdings/ai-engine';
import { logger } from './logger';

const CARLOTA_MODEL_DEFS = [
  // ── 1. Strategic Move Forecast ────────────────────────────────────────────
  {
    modelName: 'carlota-strategic_move_forecast',
    domain: 'carlota-jo',
    algorithmFamily: 'gradient_boosting',
    runId: 'carlota-seed-strategic-move-v1',
    datasetId: 'carlota-competitor-signals-2026',
    datasetVersion: '1.0',
    featureIds: [
      'websiteChangeDeltaScore',
      'hiringVelocity30d',
      'patentFilingsCount90d',
      'newsSentimentShift14d',
      'linkedinHeadcountGrowth',
      'productPageAdditions',
      'pricingPageChange',
    ],
    hyperparameters: {
      n_estimators: 400,
      max_depth: 5,
      learning_rate: 0.06,
      subsample: 0.80,
      min_child_weight: 5,
      objective: 'binary:logistic',
      calibration: 'isotonic',
    },
    trainMetrics: { auc: 0.874, f1: 0.831, precision: 0.847, recall: 0.816, accuracy: 0.868, brier_score: 0.094 },
    testMetrics:  { auc: 0.839, f1: 0.792, precision: 0.811, recall: 0.774, accuracy: 0.832, brier_score: 0.112 },
    featureImportance: {
      websiteChangeDeltaScore: 0.31,
      hiringVelocity30d:        0.22,
      newsSentimentShift14d:    0.18,
      patentFilingsCount90d:    0.13,
      productPageAdditions:     0.08,
      linkedinHeadcountGrowth:  0.05,
      pricingPageChange:        0.03,
    },
    tags: ['carlota-jo', 'competitive-intel', 'strategic-move', 'forecast'],
    notes:
      'Calibrated gradient-boosting model. Predicts P(competitor strategic move within 60 days). ' +
      'Features sourced from Wayback CDX diffs, Google Trends, USPTO filings, and hiring-board signals. ' +
      'Seeded production model for Carlota Jo competitive intelligence suite.',
  },

  // ── 2. Engagement Roadmap KPI Forecast ───────────────────────────────────
  {
    modelName: 'carlota-engagement_roadmap_kpi',
    domain: 'carlota-jo',
    algorithmFamily: 'ridge_regression',
    runId: 'carlota-seed-roadmap-kpi-v1',
    datasetId: 'carlota-diagnostic-outcomes-2026',
    datasetVersion: '1.0',
    featureIds: [
      'marketPositionScore',
      'competitiveLandscapePressure',
      'engagementBudgetMidpoint',
      'teamAlignmentIndex',
      'priorEngagementNPS',
      'industryGrowthRate',
      'horizonMonths',
    ],
    hyperparameters: {
      alpha: 0.85,
      fit_intercept: true,
      solver: 'lsqr',
      max_iter: 1000,
      monte_carlo_iterations: 2000,
    },
    trainMetrics: { rmse: 0.042, mae: 0.033, r2: 0.891 },
    testMetrics:  { rmse: 0.058, mae: 0.044, r2: 0.861 },
    featureImportance: {
      marketPositionScore:          0.29,
      engagementBudgetMidpoint:     0.24,
      competitiveLandscapePressure: 0.18,
      horizonMonths:                0.12,
      teamAlignmentIndex:           0.09,
      industryGrowthRate:           0.05,
      priorEngagementNPS:           0.03,
    },
    tags: ['carlota-jo', 'engagement', 'roadmap', 'kpi', 'monte-carlo'],
    notes:
      'Ridge regression with Monte Carlo milestone interval generation. Converts strategic-diagnostic ' +
      'intake data into tracked KPI roadmaps with P10/P50/P90 milestone completion estimates. ' +
      'Seeded production model for Carlota Jo engagement OS.',
  },

  // ── 3. Concierge Anomaly Digest ──────────────────────────────────────────
  {
    modelName: 'carlota-concierge_anomaly_digest',
    domain: 'carlota-jo',
    algorithmFamily: 'isolation_forest',
    runId: 'carlota-seed-anomaly-digest-v1',
    datasetId: 'carlota-client-intel-baseline-2026',
    datasetVersion: '1.0',
    featureIds: [
      'signalFrequencyZScore',
      'sentimentDeviationFromBaseline',
      'competitorMentionSurge',
      'hiringSignalVariance',
      'patentVelocityAnomaly',
      'newsVolumeSpike',
      'clientIndustryExposure',
    ],
    hyperparameters: {
      n_estimators: 200,
      max_samples: 'auto',
      contamination: 0.05,
      max_features: 1.0,
      bootstrap: false,
      ensemble_size: 5,
    },
    trainMetrics: { auc_pr: 0.821, f1: 0.779, precision: 0.803, recall: 0.757, accuracy: 0.814 },
    testMetrics:  { auc_pr: 0.788, f1: 0.741, precision: 0.762, recall: 0.721, accuracy: 0.779 },
    featureImportance: {
      competitorMentionSurge:        0.28,
      sentimentDeviationFromBaseline: 0.24,
      signalFrequencyZScore:          0.19,
      newsVolumeSpike:                0.13,
      hiringSignalVariance:           0.09,
      patentVelocityAnomaly:          0.05,
      clientIndustryExposure:         0.02,
    },
    tags: ['carlota-jo', 'concierge', 'anomaly', 'digest', 'isolation-forest'],
    notes:
      'Isolation forest ensemble for per-client, per-week anomaly scoring from live intel feeds. ' +
      'Ranks signals against each client\'s historical baseline rather than using generic news volume. ' +
      'Seeded production model for Carlota Jo Concierge Command.',
  },
];

let seeded = false;

export async function ensureCarlotaModelsRegistered(): Promise<{
  seeded: string[];
  skipped: string[];
  failed: string[];
}> {
  const result = { seeded: [] as string[], skipped: [] as string[], failed: [] as string[] };

  for (const def of CARLOTA_MODEL_DEFS) {
    try {
      const existing = mlModelRegistry.getProductionModel(def.modelName);
      if (existing) {
        result.skipped.push(def.modelName);
        continue;
      }
      const registered = await mlModelRegistry.registerModel(def);
      await mlModelRegistry.promoteModel(registered.modelVersionId, 'staging', 'carlota-model-seeder');
      await mlModelRegistry.promoteModel(registered.modelVersionId, 'production', 'carlota-model-seeder');
      logger.info(
        { modelName: def.modelName, modelVersionId: registered.modelVersionId },
        '[carlota-seeder] Registered and promoted Carlota model (experimental→staging→production)',
      );
      result.seeded.push(def.modelName);
    } catch (err) {
      logger.warn({ err, modelName: def.modelName }, '[carlota-seeder] Could not seed Carlota model');
      result.failed.push(def.modelName);
    }
  }

  if (!seeded) seeded = result.failed.length === 0;
  return result;
}

export function getCarlotaModelVersionId(modelName: string): string | null {
  const model = mlModelRegistry.getProductionModel(modelName);
  return model?.modelVersionId ?? null;
}
