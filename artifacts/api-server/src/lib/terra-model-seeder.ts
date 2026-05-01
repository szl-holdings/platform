import { mlModelRegistry } from '@szl-holdings/ai-engine';
import { logger } from './logger';

const TERRA_MODEL_DEFS = [
  {
    modelName: 'terra-distress_propagation',
    domain: 'terra',
    algorithmFamily: 'gradient_boosting',
    runId: 'terra-seed-run-distress-v1',
    datasetId: 'terra-sunbelt-portfolio-2026',
    datasetVersion: '1.0',
    featureIds: [
      'triggerDistressScore', 'ownerLlcConcentration', 'crossCollateralLoanCount',
      'lenderConcentrationScore', 'dscr', 'marketLiquidityIndex',
    ],
    hyperparameters: {
      n_estimators: 400, max_depth: 6, learning_rate: 0.08,
      subsample: 0.85, min_child_weight: 5, objective: 'binary:logistic',
    },
    trainMetrics: { auc: 0.891, f1: 0.847, precision: 0.862, recall: 0.833, accuracy: 0.884 },
    testMetrics: { auc: 0.843, f1: 0.798, precision: 0.821, recall: 0.776, accuracy: 0.839 },
    featureImportance: {
      triggerDistressScore: 0.32, lenderConcentrationScore: 0.21,
      dscr: 0.18, crossCollateralLoanCount: 0.14,
      ownerLlcConcentration: 0.11, marketLiquidityIndex: 0.04,
    },
    tags: ['terra', 'distress', 'cascade', 'sunbelt'],
    notes: 'Seeded production model for Sunbelt multifamily distress propagation cascade risk head.',
  },
  {
    modelName: 'terra-climate_adjusted_cap_rate',
    domain: 'terra',
    algorithmFamily: 'ridge_regression',
    runId: 'terra-seed-run-climate-v1',
    datasetId: 'terra-climate-noaa-fema-2026',
    datasetVersion: '1.0',
    featureIds: [
      'baseCapRate', 'femaNriScore', 'noaaTempDrift5yr',
      'noaaPrecipDrift5yr', 'insuranceLossRatioEscalation', 'floodZoneFlag',
    ],
    hyperparameters: { alpha: 1.2, fit_intercept: true, solver: 'lsqr', max_iter: 1000 },
    trainMetrics: { rmse: 0.0021, mae: 0.0016, r2: 0.877 },
    testMetrics: { rmse: 0.0028, mae: 0.0022, r2: 0.841 },
    featureImportance: {
      femaNriScore: 0.38, insuranceLossRatioEscalation: 0.27,
      noaaTempDrift5yr: 0.18, baseCapRate: 0.09,
      noaaPrecipDrift5yr: 0.06, floodZoneFlag: 0.02,
    },
    tags: ['terra', 'climate', 'cap-rate', 'noaa', 'fema'],
    notes: 'Seeded production model for NOAA+FEMA climate-adjusted 5-year cap rate forecast head.',
  },
  {
    modelName: 'terra-owner_intent',
    domain: 'terra',
    algorithmFamily: 'logistic_regression',
    runId: 'terra-seed-run-intent-v1',
    datasetId: 'terra-ownership-deed-nod-2026',
    datasetVersion: '1.0',
    featureIds: [
      'nodFilingCount12m', 'deedTransferCount36m', 'ownerEntityAgeMonths',
      'vacancyRateSubmarket', 'loanMaturityMonths', 'daysSinceLastSale', 'dscrBelow1',
    ],
    hyperparameters: { C: 0.75, solver: 'lbfgs', max_iter: 300, class_weight: 'balanced' },
    trainMetrics: { auc: 0.834, f1: 0.791, precision: 0.808, recall: 0.774, accuracy: 0.821 },
    testMetrics: { auc: 0.796, f1: 0.748, precision: 0.771, recall: 0.726, accuracy: 0.783 },
    featureImportance: {
      nodFilingCount12m: 0.29, loanMaturityMonths: 0.24,
      dscrBelow1: 0.18, vacancyRateSubmarket: 0.14,
      daysSinceLastSale: 0.08, deedTransferCount36m: 0.05,
      ownerEntityAgeMonths: 0.02,
    },
    tags: ['terra', 'owner', 'intent', 'distress', 'disposition'],
    notes: 'Seeded production model for 12-month owner sale/refi intent classification head.',
  },
];

let seeded = false;

export async function ensureTerraModelsRegistered(): Promise<{ seeded: string[]; skipped: string[]; failed: string[] }> {
  const result = { seeded: [] as string[], skipped: [] as string[], failed: [] as string[] };

  for (const def of TERRA_MODEL_DEFS) {
    try {
      const existing = mlModelRegistry.getProductionModel(def.modelName);
      if (existing) {
        result.skipped.push(def.modelName);
        continue;
      }
      const registered = await mlModelRegistry.registerModel(def);
      await mlModelRegistry.promoteModel(registered.modelVersionId, 'staging', 'terra-model-seeder');
      await mlModelRegistry.promoteModel(registered.modelVersionId, 'production', 'terra-model-seeder');
      logger.info({ modelName: def.modelName, modelVersionId: registered.modelVersionId }, '[terra-seeder] Registered and promoted Terra model (experimental→staging→production)');
      result.seeded.push(def.modelName);
    } catch (err) {
      logger.warn({ err, modelName: def.modelName }, '[terra-seeder] Could not seed Terra model');
      result.failed.push(def.modelName);
    }
  }

  if (!seeded) seeded = result.failed.length === 0;
  return result;
}

export function getTerraModelVersionId(modelName: string): string | null {
  const model = mlModelRegistry.getProductionModel(modelName);
  return model?.modelVersionId ?? null;
}
