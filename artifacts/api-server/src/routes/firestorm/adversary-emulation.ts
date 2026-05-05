import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess, sendCreated, sendError } from '../../lib/api-response.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.js';
import { validateQuery, validateBody, listQuerySchema } from '../../lib/validation.js';
import {
  runAdversaryEmulationLoop,
  getEmulationRunHistory,
  getLatestScorecardsPerPayload,
  generateQuarterlyTrustReport,
  checkPayloadMaturityGate,
  TECHNIQUE_REGISTRY,
  CPS_PAYLOAD_REGISTRY,
  type EmulationRunSummary,
} from '../../jobs/adversary-emulation-loop.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// ─── GET /firestorm/emulation/runs ────────────────────────────────────────────

router.get('/firestorm/emulation/runs', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 24), 52);
    const runs = await getEmulationRunHistory(limit);
    sendSuccess(res, { runs, total: runs.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list emulation runs');
  }
});

// ─── GET /firestorm/emulation/scorecards ─────────────────────────────────────

router.get('/firestorm/emulation/scorecards', authMiddleware(), async (_req, res) => {
  try {
    const [latest, history] = await Promise.all([
      getLatestScorecardsPerPayload(),
      getEmulationRunHistory(8),
    ]);

    const payloadTimelines: Record<string, Array<{ ranAt: string; compositeConfidence: number; mttdSeconds: number; mttcSeconds: number; blastRadiusPrevented: number; analystHoursSaved: number; status: string }>> = {};

    for (const payload of CPS_PAYLOAD_REGISTRY) {
      payloadTimelines[payload.id] = history
        .flatMap(run =>
          run.scorecards
            .filter(sc => sc.payloadId === payload.id)
            .map(sc => ({
              ranAt: sc.ranAt,
              compositeConfidence: sc.compositeConfidence,
              mttdSeconds: sc.mttdSeconds,
              mttcSeconds: sc.mttcSeconds,
              blastRadiusPrevented: sc.blastRadiusPrevented,
              analystHoursSaved: sc.analystHoursSaved,
              status: sc.status,
            })),
        )
        .slice(0, 8);
    }

    sendSuccess(res, {
      payloads: CPS_PAYLOAD_REGISTRY,
      latestScorecards: latest,
      timelines: payloadTimelines,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load emulation scorecards');
  }
});

// ─── GET /firestorm/emulation/techniques ─────────────────────────────────────

router.get('/firestorm/emulation/techniques', authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, { techniques: TECHNIQUE_REGISTRY, total: TECHNIQUE_REGISTRY.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list technique registry');
  }
});

// ─── GET /firestorm/emulation/report/quarterly ────────────────────────────────

router.get('/firestorm/emulation/report/quarterly', authMiddleware(), async (_req, res) => {
  try {
    const report = await generateQuarterlyTrustReport();
    sendSuccess(res, report);
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate quarterly Trust & Response report');
  }
});

// ─── GET /firestorm/emulation/maturity-gate/:payloadId ───────────────────────

router.get('/firestorm/emulation/maturity-gate/:payloadId', authMiddleware(), async (req, res) => {
  try {
    const { payloadId } = req.params;
    if (!payloadId) {
      sendError(res, 'payloadId is required', 400, 'BAD_REQUEST');
      return;
    }
    const gate = await checkPayloadMaturityGate(payloadId);
    sendSuccess(res, gate);
  } catch (err) {
    handleRouteError(res, err, 'Failed to evaluate maturity gate');
  }
});

// ─── POST /firestorm/emulation/trigger ───────────────────────────────────────

const triggerSchema = z.object({
  reason: z.string().max(256).optional(),
});

router.post(
  '/firestorm/emulation/trigger',
  authMiddleware({ required: true }),
  requireRole('operator', 'ops', 'supervisor', 'ciso', 'admin', 'super_admin'),
  validateBody(triggerSchema),
  async (req, res) => {
    try {
      const reason = (req.body as { reason?: string }).reason ?? 'manual trigger';
      logger.info({ reason, userId: req.user?.id }, '[emulation] Manual trigger received');

      const resultPromise = runAdversaryEmulationLoop();

      sendCreated(res, {
        message: 'Adversary emulation loop started',
        note: 'Run is executing asynchronously. Poll /firestorm/emulation/runs for results.',
      });

      resultPromise.catch(err => {
        logger.error({ err }, '[emulation] Triggered run failed');
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to trigger emulation loop');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}

export default router;
