import { serverTelemetry } from '@szl-holdings/observability';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

router.get('/apm/latency', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const windowMs = req.query.windowMs ? parseInt(req.query.windowMs as string) : 300_000;
    if (windowMs < 0 || windowMs > 86_400_000) {
      sendBadRequest(res, 'windowMs must be between 0 and 86400000');
      return;
    }
    const breakdown = serverTelemetry.getApmLatencyBreakdown(windowMs);
    sendSuccess(res, breakdown);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get APM latency breakdown');
  }
});

router.get('/apm/spans', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const windowMs = req.query.windowMs ? parseInt(req.query.windowMs as string) : 300_000;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 500) : 100;
    if (windowMs < 0 || windowMs > 86_400_000) {
      sendBadRequest(res, 'windowMs must be between 0 and 86400000');
      return;
    }
    const spans = serverTelemetry.getApmSpans(windowMs).slice(-limit);
    sendSuccess(res, { spans, count: spans.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get APM spans');
  }
});

router.get(
  '/apm/external-calls',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const windowMs = req.query.windowMs ? parseInt(req.query.windowMs as string) : 300_000;
      const stats = serverTelemetry.getExternalCallStats(windowMs);
      sendSuccess(res, stats);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get external call stats');
    }
  },
);

router.get('/apm/snapshot', authMiddleware(), async (req, res) => {
  try {
    const snapshot = serverTelemetry.getSnapshot();
    const apmBreakdown = serverTelemetry.getApmLatencyBreakdown();
    const externalStats = serverTelemetry.getExternalCallStats();
    sendSuccess(res, {
      ...snapshot,
      apm: {
        latencyBreakdown: apmBreakdown,
        externalCalls: externalStats,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get APM snapshot');
  }
});

export default router;
