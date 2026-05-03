/**
 * Sentra ML Scoring Routes
 *
 * Three ML-backed scoring heads served via inference endpoints.
 * Models are seeded into the real @szl-holdings/ai-engine registry on first
 * request (lazy init) using ensureSentraModelsRegistered().
 *
 *  1. Asset risk score        — POST /sentra/ml/asset-risk
 *  2. Identity blast-radius   — POST /sentra/ml/blast-radius
 *  3. Adversary-replay sim    — POST /sentra/ml/adversary-replay
 *  4. Fleet aggregate         — POST /sentra/ml/asset-risk/fleet
 *  5. Live model registry     — GET  /sentra/ml/model-registry
 *  6. Drift status            — GET  /sentra/ml/drift-status
 */
import { type IRouter, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import {
  scoreAssetRisk,
  forecastIdentityBlastRadius,
  runAdversaryReplay,
  getSentraModelRegistry,
  getSentraModelDriftStatus,
  type AssetRiskInput,
  type IdentityBlastRadiusInput,
  type AdversaryReplayInput,
} from '../lib/sentra-ml-scoring';
import { ensureSentraModelsRegistered } from '../lib/sentra-model-seeder';
import {
  emitBlastRadiusSignal,
  emitAdversaryReplaySignal,
  emitKevFleetSignal,
} from '../lib/sentra-prism-signals';
import { validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

// ── Lazy model seeder ────────────────────────────────────────────────────────
let _seededPromise: Promise<void> | null = null;

function initModels(): Promise<void> {
  if (!_seededPromise) {
    _seededPromise = ensureSentraModelsRegistered().then(r => {
      logger.info(r, '[sentra/ml] model seeder complete');
    }).catch(err => {
      logger.warn({ err }, '[sentra/ml] model seeder failed (non-fatal)');
    });
  }
  return _seededPromise;
}

const mlRateLimit = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded', message: 'Too many ML scoring requests' },
});

const assetRiskSchema = z.object({
  assetId: z.string().min(1),
  cvssScore: z.number().min(0).max(10).optional(),
  epssScore: z.number().min(0).max(1).optional(),
  isKevListed: z.boolean().optional(),
  assetCriticality: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  internetExposure: z.boolean().default(false),
  patchAge: z.number().int().min(0).optional(),
  activeThreatActors: z.number().int().min(0).optional(),
});

const blastRadiusSchema = z.object({
  identityId: z.string().min(1),
  identityType: z.enum(['human', 'service-account', 'machine']).default('human'),
  currentPrivileges: z.array(z.string()).default([]),
  accessibleSystems: z.number().int().min(0).default(10),
  hasAdminRights: z.boolean().default(false),
  recentAnomalies: z.number().int().min(0).optional(),
  lateralMoveRisk: z.enum(['high', 'medium', 'low']).optional(),
  emitSignal: z.boolean().default(false),
});

const adversaryReplaySchema = z.object({
  scenarioId: z.string().optional(),
  cveIds: z.array(z.string()).max(50).optional(),
  epssScores: z.record(z.string(), z.number().min(0).max(1)).optional(),
  kevListedCves: z.array(z.string()).optional(),
  targetSurface: z.object({
    webApps: z.number().int().min(0).default(3),
    dbServers: z.number().int().min(0).default(2),
    endpoints: z.number().int().min(0).default(50),
    cloudAccounts: z.number().int().min(0).default(5),
  }).optional(),
  adversaryProfile: z.string().optional(),
  emitSignal: z.boolean().default(false),
});

router.post(
  '/sentra/ml/asset-risk',
  mlRateLimit,
  authMiddleware(),
  validateBody(assetRiskSchema),
  async (req, res) => {
    try {
      await initModels();
      const input = req.body as AssetRiskInput;
      const score = await scoreAssetRisk(input);
      logger.info({ assetId: input.assetId, p30d: score.p30dCompromise, modelVersionId: score.modelVersionId }, '[sentra/ml] asset risk scored');
      sendSuccess(res, { score });
    } catch (err) {
      handleRouteError(res, err, 'Sentra ML scoring operation failed');
    }
  },
);

router.post(
  '/sentra/ml/asset-risk/fleet',
  mlRateLimit,
  authMiddleware(),
  validateBody(z.object({ assets: z.array(assetRiskSchema).min(1).max(200) })),
  async (req, res) => {
    try {
      await initModels();
      const { assets } = req.body as { assets: AssetRiskInput[] };
      const scores = await Promise.all(assets.map(a => scoreAssetRisk(a)));
      const summary = {
        total: scores.length,
        critical: scores.filter(s => s.riskLabel === 'critical').length,
        high: scores.filter(s => s.riskLabel === 'high').length,
        medium: scores.filter(s => s.riskLabel === 'medium').length,
        low: scores.filter(s => s.riskLabel === 'low').length,
        avgP30d: Math.round((scores.reduce((s, a) => s + a.p30dCompromise, 0) / scores.length) * 1000) / 1000,
      };

      const criticalAssets = scores.filter(s => s.riskLabel === 'critical');
      if (criticalAssets.length > 0) {
        await emitKevFleetSignal({
          cveId: 'FLEET-RISK-ASSESSMENT',
          affectedAssets: criticalAssets.map(a => a.assetId),
          cvssScore: 9.5,
        }).catch(() => {});
      }

      sendSuccess(res, { scores, summary });
    } catch (err) {
      handleRouteError(res, err, 'Sentra ML scoring operation failed');
    }
  },
);

router.post(
  '/sentra/ml/blast-radius',
  mlRateLimit,
  authMiddleware(),
  validateBody(blastRadiusSchema),
  async (req, res) => {
    try {
      await initModels();
      const { emitSignal, ...input } = req.body as IdentityBlastRadiusInput & { emitSignal?: boolean };
      const forecast = await forecastIdentityBlastRadius(input);

      if (emitSignal) {
        await emitBlastRadiusSignal({
          identityId: forecast.identityId,
          p7dLateralPath: forecast.p7dLateralPath,
          estimatedBlastRadius: forecast.estimatedBlastRadius,
          highRiskTargets: forecast.highRiskTargets,
        }).catch(() => {});
      }

      logger.info({ identityId: input.identityId, p7d: forecast.p7dLateralPath, modelVersionId: forecast.modelVersionId }, '[sentra/ml] blast-radius forecast');
      sendSuccess(res, { forecast });
    } catch (err) {
      handleRouteError(res, err, 'Sentra ML scoring operation failed');
    }
  },
);

router.post(
  '/sentra/ml/adversary-replay',
  mlRateLimit,
  authMiddleware(),
  validateBody(adversaryReplaySchema),
  async (req, res) => {
    try {
      await initModels();
      const { emitSignal, ...input } = req.body as AdversaryReplayInput & { emitSignal?: boolean };
      const result = await runAdversaryReplay(input);

      if (emitSignal) {
        const missedDetections = result.attackChain.filter(s => s.outcome === 'succeeded').length;
        await emitAdversaryReplaySignal({
          scenarioId: result.scenarioId,
          overallSuccessRate: result.overallSuccessRate,
          chainLength: result.attackChain.length,
          missedDetections,
          topMitigation: result.recommendedMitigations[0] ?? 'Review detection coverage',
        }).catch(() => {});
      }

      logger.info({ scenarioId: result.scenarioId, successRate: result.overallSuccessRate, modelVersionId: result.modelVersionId }, '[sentra/ml] adversary replay complete');
      sendSuccess(res, { result });
    } catch (err) {
      handleRouteError(res, err, 'Sentra ML scoring operation failed');
    }
  },
);

/**
 * GET /sentra/ml/model-registry
 * Returns live model metadata from the real @szl-holdings/ai-engine mlModelRegistry.
 */
router.get(
  '/sentra/ml/model-registry',
  authMiddleware(),
  async (_req, res) => {
    try {
      await initModels();
      const models = getSentraModelRegistry();
      sendSuccess(res, { models, asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra ML scoring operation failed');
    }
  },
);

/**
 * GET /sentra/ml/drift-status
 * Returns live drift PSI scores from real monitoring cycle snapshots.
 */
router.get(
  '/sentra/ml/drift-status',
  authMiddleware(),
  async (_req, res) => {
    try {
      await initModels();
      const driftModels = await getSentraModelDriftStatus();
      sendSuccess(res, {
        models: driftModels.map(m => ({ ...m, alertThreshold: 0.2 })),
        asOf: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Sentra ML scoring operation failed');
    }
  },
);

export default router;
