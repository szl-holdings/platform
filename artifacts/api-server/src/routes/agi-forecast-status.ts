/**
 * AGI-forecast status surface.
 *
 * Exposes the snapshot produced by the scheduled `agi-forecast-ingest` job
 * (see `jobs/agi-forecast-ingest.ts`) so the gauge dashboard — and any
 * operator inspecting the platform from the shell — can see exactly when
 * each PUBLIC_ONLY variable was last fetched, whether the fetch succeeded,
 * and what the latest deterministic daily summary derived from the
 * snapshot looks like.
 *
 * No mutations are exposed here. The schedule itself is authoritative;
 * this route is read-only.
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import {
  getLatestAgiForecastSnapshot,
  runAgiForecastIngestOnce,
} from '../jobs/agi-forecast-ingest';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

/**
 * GET /api/agi-forecast/status
 *
 * Returns the last scheduled snapshot if one exists, with per-variable
 * status (id, label, source, ok, lastFetchedAt, value, error) and the
 * derived daily summary. Responds 204 with `present:false` when the
 * scheduler hasn't completed a run yet — the dashboard treats that as
 * "warming up" rather than as an error.
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    const snap = getLatestAgiForecastSnapshot();
    if (!snap) {
      return sendSuccess(res, {
        present: false,
        message: 'No scheduled AGI-forecast snapshot yet — scheduler is warming up.',
      });
    }
    return sendSuccess(res, {
      present: true,
      lastRunAt: snap.lastRunAt,
      date: snap.date,
      runCount: snap.runCount,
      statuses: snap.statuses,
      summary: snap.summary,
    });
  } catch (err) {
    return handleRouteError(res, err, 'agi-forecast.status');
  }
});

/**
 * POST /api/agi-forecast/refresh (admin)
 *
 * Manually triggers a scheduled-style run. Useful when an operator wants
 * fresh values without waiting for the next cadence window — e.g. right
 * after deploying a new ingestor. Auth-gated to prevent unauthenticated
 * users from spamming public APIs through this endpoint.
 */
router.post('/refresh', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const snap = await runAgiForecastIngestOnce();
    return sendSuccess(res, {
      lastRunAt: snap.lastRunAt,
      date: snap.date,
      runCount: snap.runCount,
      statuses: snap.statuses,
      summary: snap.summary,
    });
  } catch (err) {
    return sendError(res, 'Refresh run failed', 500, 'AGI_FORECAST_REFRESH_FAILED', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
