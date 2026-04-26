import { bodyShape } from '@szl-holdings/contracts/common';
import { pool } from '@szl-holdings/db';
import {
  CreateSelfModelSchema,
  defaultSelfModelStore,
  RunOutcomeSchema,
  requestHelpIfBelowThreshold,
  SELF_MODEL_VERSION,
  updateAfterRun,
  analyseCalibrationDrift,
  extractDriftFromSelfModel,
  shouldSurfaceDrift,
} from '@workspace/self-model';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { PoolSelfModelAdapter } from '../lib/self-model-db-adapter';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

/**
 * Wire the DB adapter into the store on first module import.
 * The NoOpPersistenceAdapter is replaced with the real pool-backed adapter
 * so that store.create / store.update automatically persist to self_models
 * and self_model_snapshots without any route-level DB logic.
 */
const dbAdapter = new PoolSelfModelAdapter(pool);
defaultSelfModelStore.setPersistenceAdapter(dbAdapter);

const router: IRouter = Router();

router.get('/self-model', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { agentId } = req.query;
    if (agentId) {
      const id = String(agentId);
      let model = defaultSelfModelStore.get(id);
      if (!model) {
        model = (await defaultSelfModelStore.loadFromPersistence(id)) ?? undefined;
      }
      if (!model) {
        sendNotFound(res, `No self-model found for agent: ${id}`);
        return;
      }
      sendSuccess(res, { model });
      return;
    }
    const inMemoryList = defaultSelfModelStore.list();
    if (inMemoryList.length > 0) {
      sendSuccess(res, { models: inMemoryList, total: inMemoryList.length });
      return;
    }
    const count = await defaultSelfModelStore.hydrateAll();
    const models = defaultSelfModelStore.list();
    sendSuccess(res, { models, total: count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch self-model');
  }
});

router.get(
  '/self-model/history',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { limit: parsedLimit, offset: parsedOffset } = parsePagination(req.query);
      const effectiveLimit = Math.min(parsedLimit, 200);
      const { agentId } = req.query;

      if (!agentId) {
        sendBadRequest(res, 'agentId query parameter is required');
        return;
      }
      const id = String(agentId);

      const inMemoryHistory = defaultSelfModelStore.getHistory(id);
      if (inMemoryHistory.length > 0) {
        const page = inMemoryHistory.slice(parsedOffset, parsedOffset + effectiveLimit);
        sendSuccess(res, {
          snapshots: page,
          total: inMemoryHistory.length,
          limit: effectiveLimit,
          offset: parsedOffset,
        });
        return;
      }

      const snapshots = await dbAdapter.loadHistory(id, effectiveLimit, parsedOffset);
      sendSuccess(res, {
        snapshots,
        total: snapshots.length,
        limit: effectiveLimit,
        offset: parsedOffset,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch self-model history');
    }
  },
);

router.post(
  '/self-model',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const parsed = CreateSelfModelSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.message);
        return;
      }
      const { agentId, ...rest } = parsed.data;

      if (defaultSelfModelStore.get(agentId)) {
        sendBadRequest(
          res,
          `A self-model already exists for agent: ${agentId}. Use PUT to update.`,
        );
        return;
      }

      const model = defaultSelfModelStore.create({ agentId, ...rest });
      sendCreated(res, { model, agentId });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create self-model');
    }
  },
);

router.post(
  '/self-model/run-outcome',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const parsed = RunOutcomeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.message);
        return;
      }
      const { agentId } = parsed.data;

      if (!defaultSelfModelStore.get(agentId)) {
        const restored = await defaultSelfModelStore.loadFromPersistence(agentId);
        if (!restored) {
          const identity = {
            runtimeId: agentId,
            name: `Auto-created for ${agentId}`,
            version: '0.0.0',
            environment: 'production' as const,
            launchedAt: new Date().toISOString(),
          };
          defaultSelfModelStore.create({ agentId, identityProfile: identity });
        }
      }

      const result = updateAfterRun(agentId, parsed.data);
      sendSuccess(res, { result, agentId });
    } catch (err) {
      handleRouteError(res, err, 'Failed to process run outcome');
    }
  },
);

router.post(
  '/self-model/check-threshold',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(
    bodyShape({
      agentId: z.unknown().optional(),
      metric: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { agentId, metric } = req.body;
      if (!agentId || !metric) {
        sendBadRequest(res, 'agentId and metric are required');
        return;
      }
      const helpRequest = requestHelpIfBelowThreshold(String(agentId), String(metric));
      sendSuccess(res, {
        helpRequest,
        thresholdBreached: helpRequest !== null,
        agentId,
        metric,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to check threshold');
    }
  },
);

router.get('/self-model/stats', authMiddleware(), (_req, res) => {
  try {
    const stats = defaultSelfModelStore.getStats();
    sendSuccess(res, {
      ...stats,
      packageVersion: SELF_MODEL_VERSION,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch self-model stats');
  }
});

// ─── Calibration Drift ────────────────────────────────────────────────────────
//
// GET  /self-model/calibration-drift?agentId=...&alertThreshold=minor
//
// Analyses the stored performance history for a given agentId and returns a
// CalibrationReport that includes the Expected Calibration Error (ECE),
// confidence bias (over- or under-confidence), and any active drift alert.
//
// Designed to surface calibration drift to the operator dashboard so engineers
// can trigger recalibration or retraining before production quality degrades.

router.get(
  '/self-model/calibration-drift',
  authMiddleware(),
  validateQuery(
    z.object({
      agentId: z.string().min(1).max(200).optional(),
      domain: z.string().max(100).optional(),
      alertThreshold: z.enum(['none', 'minor', 'moderate', 'severe']).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        agentId,
        domain,
        alertThreshold = 'minor',
      } = req.query as {
        agentId?: string;
        domain?: string;
        alertThreshold?: 'none' | 'minor' | 'moderate' | 'severe';
      };

      if (agentId) {
        // Single-agent drift report
        const state = defaultSelfModelStore.get(agentId);
        if (!state) {
          sendNotFound(res, `Agent '${agentId}'`);
          return;
        }

        const report = extractDriftFromSelfModel(agentId, state, {
          domain,
          alertThreshold,
        });

        sendSuccess(res, {
          report,
          surfaceOnDashboard: shouldSurfaceDrift(report, alertThreshold),
        });
        return;
      }

      // All agents — return a summary of drift status across the fleet
      const allAgents = defaultSelfModelStore.list();
      const reports = allAgents.map((state) => {
        const report = extractDriftFromSelfModel(state.runtimeId, state, { domain, alertThreshold });
        return {
          agentId: state.runtimeId,
          driftSeverity: report.driftSeverity,
          driftScore: report.driftScore,
          confidenceBias: report.confidenceBias,
          successRate: report.successRate,
          windowSizeRuns: report.windowSizeRuns,
          alert: report.alert,
          surfaceOnDashboard: shouldSurfaceDrift(report, alertThreshold),
        };
      });

      const alertCount = reports.filter((r) => r.surfaceOnDashboard).length;

      sendSuccess(res, {
        totalAgents: reports.length,
        alertingAgents: alertCount,
        alertThreshold,
        reports,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute calibration drift');
    }
  },
);

export default router;
