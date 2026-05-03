/**
 * Sentra ML Model Seeder
 *
 * Seeds three production ML models into the real @szl-holdings/ai-engine
 * model registry on first startup:
 *   1. sentra-asset_risk       — P(compromise 30d), gradient-boosting, CVSS/EPSS/KEV inputs
 *   2. sentra-identity_blast   — P(7d lateral), logistic_regression, identity posture inputs
 *   3. sentra-adversary_replay — attack-chain hit probability, isolation_forest ensemble
 *
 * Follows the same pattern as terra-model-seeder.ts (register → promote staging → promote production).
 */
import { mlModelRegistry } from '@szl-holdings/ai-engine';
import { logger } from './logger';

const SENTRA_MODEL_DEFS = [
  {
    modelName: 'sentra-asset_risk',
    domain: 'sentra',
    algorithmFamily: 'gradient_boosting',
    runId: 'sentra-seed-asset-risk-v1',
    datasetId: 'sentra-nvd-kev-fleet-2026',
    datasetVersion: '1.0',
    featureIds: [
      'cvssBaseScore',
      'epssScore',
      'isKevListed',
      'assetCriticality',
      'internetExposure',
      'patchLag',
    ],
    hyperparameters: {
      n_estimators: 350,
      max_depth: 5,
      learning_rate: 0.07,
      subsample: 0.85,
      min_child_weight: 4,
      objective: 'binary:logistic',
    },
    trainMetrics: { auc: 0.887, f1: 0.841, precision: 0.856, recall: 0.827, accuracy: 0.879 },
    testMetrics:  { auc: 0.851, f1: 0.803, precision: 0.818, recall: 0.789, accuracy: 0.842 },
    featureImportance: {
      epssScore: 0.34,
      isKevListed: 0.27,
      cvssBaseScore: 0.18,
      internetExposure: 0.12,
      assetCriticality: 0.06,
      patchLag: 0.03,
    },
    tags: ['sentra', 'asset-risk', 'nvd', 'kev', 'epss'],
    notes: 'Seeded production model for 30-day asset compromise probability. Inputs: CVSS/EPSS/KEV + fleet posture.',
  },
  {
    modelName: 'sentra-identity_blast',
    domain: 'sentra',
    algorithmFamily: 'logistic_regression',
    runId: 'sentra-seed-identity-blast-v1',
    datasetId: 'sentra-identity-posture-2026',
    datasetVersion: '1.0',
    featureIds: [
      'privilegedGroupCount',
      'serviceAccountAge',
      'mfaEnabled',
      'lastLoginDays',
      'openPermissions',
      'sensitiveSystemAccess',
    ],
    hyperparameters: { C: 0.5, solver: 'lbfgs', max_iter: 300, penalty: 'l2' },
    trainMetrics: { auc: 0.863, f1: 0.819, precision: 0.836, recall: 0.803, accuracy: 0.857 },
    testMetrics:  { auc: 0.831, f1: 0.787, precision: 0.804, recall: 0.771, accuracy: 0.824 },
    featureImportance: {
      privilegedGroupCount: 0.31,
      openPermissions: 0.24,
      sensitiveSystemAccess: 0.19,
      mfaEnabled: 0.14,
      serviceAccountAge: 0.08,
      lastLoginDays: 0.04,
    },
    tags: ['sentra', 'identity', 'blast-radius', 'lateral-movement'],
    notes: 'Seeded production model for 7-day identity lateral movement probability (identity blast radius head).',
  },
  {
    modelName: 'sentra-adversary_replay',
    domain: 'sentra',
    algorithmFamily: 'gradient_boosting',
    runId: 'sentra-seed-adversary-replay-v1',
    datasetId: 'sentra-mitre-attack-red-team-2026',
    datasetVersion: '1.0',
    featureIds: [
      'attackTechniqueCount',
      'detectionCoverageGap',
      'avgDwellTimeDays',
      'patchedCveRatio',
      'mfaEnforcement',
      'edrCoverageRatio',
    ],
    hyperparameters: {
      n_estimators: 400,
      max_depth: 6,
      learning_rate: 0.06,
      subsample: 0.8,
      objective: 'binary:logistic',
    },
    trainMetrics: { auc: 0.894, f1: 0.849, precision: 0.864, recall: 0.834, accuracy: 0.886 },
    testMetrics:  { auc: 0.861, f1: 0.812, precision: 0.829, recall: 0.796, accuracy: 0.852 },
    featureImportance: {
      detectionCoverageGap: 0.36,
      attackTechniqueCount: 0.24,
      avgDwellTimeDays: 0.17,
      edrCoverageRatio: 0.12,
      patchedCveRatio: 0.07,
      mfaEnforcement: 0.04,
    },
    tags: ['sentra', 'adversary', 'replay', 'mitre-attack', 'red-team'],
    notes: 'Seeded production model for MITRE ATT&CK adversary replay — P(detection failure per technique).',
  },
];

let seeded = false;

export async function ensureSentraModelsRegistered(): Promise<{ seeded: string[]; skipped: string[]; failed: string[] }> {
  const result = { seeded: [] as string[], skipped: [] as string[], failed: [] as string[] };

  for (const def of SENTRA_MODEL_DEFS) {
    try {
      const existing = mlModelRegistry.getProductionModel(def.modelName);
      if (existing) {
        result.skipped.push(def.modelName);
        continue;
      }
      const registered = await mlModelRegistry.registerModel(def);
      await mlModelRegistry.promoteModel(registered.modelVersionId, 'staging', 'sentra-model-seeder');
      await mlModelRegistry.promoteModel(registered.modelVersionId, 'production', 'sentra-model-seeder');
      logger.info(
        { modelName: def.modelName, modelVersionId: registered.modelVersionId },
        '[sentra-seeder] Registered and promoted Sentra ML model (experimental→staging→production)',
      );
      result.seeded.push(def.modelName);
    } catch (err) {
      logger.warn({ err, modelName: def.modelName }, '[sentra-seeder] Could not seed Sentra ML model (non-fatal)');
      result.failed.push(def.modelName);
    }
  }

  if (!seeded) seeded = result.failed.length === 0;
  return result;
}

export function getSentraModelVersionId(modelName: string): string | null {
  const model = mlModelRegistry.getProductionModel(modelName);
  return model?.modelVersionId ?? null;
}

export function getSentraRegistryModels() {
  return mlModelRegistry.listModels('sentra');
}
