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

import { db } from '@szl-holdings/db';
import { desc } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { vesselsA11oyRiskSnapshotTable } from '../db/schema/vessels';
import {
  getLatestAgiForecastSnapshot,
  runAgiForecastIngestOnce,
} from '../jobs/agi-forecast-ingest';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

/**
 * Per-fleet Lutar Readiness, derived from the latest Vessels A11oy risk
 * snapshots (Task #5318). For each fleet, take the most recent
 * perturbation_bound and define lutarReadiness = 1 - bound, clamped to
 * [0,1]. Returns a stable, sorted list so the gauge dashboard can render
 * deterministically.
 */
async function computeVesselsLutarReadiness(): Promise<
  Array<{ fleetRef: string; lutarReadiness: number; perturbationBound: number; computedAt: string }>
> {
  try {
    const rows = await db
      .select()
      .from(vesselsA11oyRiskSnapshotTable)
      .orderBy(desc(vesselsA11oyRiskSnapshotTable.computedAt))
      .limit(2000);
    const latestByFleet = new Map<
      string,
      { perturbationBound: number; computedAt: Date }
    >();
    for (const r of rows) {
      if (!latestByFleet.has(r.fleetRef)) {
        latestByFleet.set(r.fleetRef, {
          perturbationBound: r.perturbationBound,
          computedAt: r.computedAt,
        });
      }
    }
    return [...latestByFleet.entries()]
      .map(([fleetRef, v]) => ({
        fleetRef,
        perturbationBound: v.perturbationBound,
        lutarReadiness: Math.min(1, Math.max(0, 1 - v.perturbationBound)),
        computedAt: v.computedAt.toISOString(),
      }))
      .sort((a, b) => (a.fleetRef < b.fleetRef ? -1 : a.fleetRef > b.fleetRef ? 1 : 0));
  } catch {
    // The vessels A11oy tables are migration-gated; if they don't exist yet
    // we surface an empty list rather than a 500 so the gauge dashboard
    // keeps working through the cold-start window.
    return [];
  }
}

/**
 * GET /api/agi-forecast/status
 *
 * Returns the last scheduled snapshot if one exists, with per-variable
 * status (id, label, source, ok, lastFetchedAt, value, error) and the
 * derived daily summary. Responds 204 with `present:false` when the
 * scheduler hasn't completed a run yet — the dashboard treats that as
 * "warming up" rather than as an error.
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const snap = getLatestAgiForecastSnapshot();
    const vesselsLutar = await computeVesselsLutarReadiness();
    if (!snap) {
      return sendSuccess(res, {
        present: false,
        message: 'No scheduled AGI-forecast snapshot yet — scheduler is warming up.',
        summary: { derived: { vesselsLutar } },
      });
    }
    // Overlay per-fleet Vessels Lutar Readiness onto summary.derived without
    // mutating the upstream snapshot (the snapshot's receiptHash binds the
    // canonical derived values; vesselsLutar is an additive operator view).
    const summary = {
      ...snap.summary,
      derived: {
        ...snap.summary.derived,
        vesselsLutar,
      },
    };
    return sendSuccess(res, {
      present: true,
      lastRunAt: snap.lastRunAt,
      date: snap.date,
      runCount: snap.runCount,
      statuses: snap.statuses,
      summary,
      history: snap.history,
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
