/**
 * Competitive Intel REST API
 *
 * Surfaces "Intel Update" alerts from the competitive-intel-monitor job
 * to the Command Competitive Atlas page.
 *
 * Endpoints:
 *   GET  /api/competitive-intel/alerts        — active alerts (optional ?laneId=, ?includeDismissed=true)
 *   GET  /api/competitive-intel/status        — feed health + last poll metadata
 *   POST /api/competitive-intel/alerts/:id/dismiss
 *   POST /api/competitive-intel/refresh       — manual poll trigger
 *   GET  /api/competitive-intel/lanes         — lanes + mute state
 *   POST /api/competitive-intel/lanes/:laneId/mute   — body { muted: boolean }
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import {
  addFeed,
  CHAMPION_FEEDS,
  dismissAlert,
  type FeedInput,
  type FeedUpdate,
  getMonitorStatus,
  listAlerts,
  listFeeds,
  listLanes,
  pollAllFeeds,
  removeFeed,
  setLaneMute,
  updateFeed,
} from '../jobs/competitive-intel-monitor';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { adminGuard } from '../middlewares/admin-guard';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

function actorFromReq(req: Request): string {
  const user = (req as Request & { user?: { id?: string | number; email?: string } }).user;
  return user?.email ?? String(user?.id ?? 'anonymous');
}

router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const laneId = typeof req.query.laneId === 'string' ? req.query.laneId : undefined;
    const includeDismissed = req.query.includeDismissed === 'true';
    const alerts = await listAlerts({ laneId, includeDismissed });
    sendSuccess(res, {
      alerts,
      count: alerts.length,
      trackedChampions: CHAMPION_FEEDS.length,
    });
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:list-alerts');
  }
});

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await getMonitorStatus();
    sendSuccess(res, status);
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:status');
  }
});

router.post('/alerts/:id/dismiss', authMiddleware(), requireRole('admin', 'editor', 'analyst'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const alert = await dismissAlert(id, actorFromReq(req));
    if (!alert) {
      sendError(res, 'Alert not found', 404, 'ALERT_NOT_FOUND');
      return;
    }
    sendSuccess(res, alert);
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:dismiss');
  }
});

router.post('/refresh', authMiddleware(), requireRole('admin', 'editor'), async (_req: Request, res: Response) => {
  try {
    const result = await pollAllFeeds();
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:refresh');
  }
});

// ─── Feed management (admin) ────────────────────────────────────────────────

router.get('/feeds', adminGuard, async (_req: Request, res: Response) => {
  try {
    const feeds = await listFeeds();
    sendSuccess(res, { feeds, count: feeds.length });
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:list-feeds');
  }
});

router.post('/feeds', adminGuard, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Partial<FeedInput>;
    const feed = await addFeed(
      {
        champion: String(body.champion ?? ''),
        laneId: String(body.laneId ?? ''),
        feedUrl: String(body.feedUrl ?? ''),
        homeUrl: body.homeUrl ? String(body.homeUrl) : undefined,
        paused: body.paused === true,
        recommendationHint: body.recommendationHint ?? undefined,
      },
      actorFromReq(req),
    );
    sendSuccess(res, feed, 201);
  } catch (err) {
    if (err instanceof Error && /required|valid|already|must be/.test(err.message)) {
      sendError(res, err.message, 400, 'INVALID_FEED');
      return;
    }
    handleRouteError(res, err, 'competitive-intel:add-feed');
  }
});

router.patch('/feeds/:id', adminGuard, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as FeedUpdate;
    const feed = await updateFeed(String(req.params.id), body, actorFromReq(req));
    if (!feed) {
      sendError(res, 'Feed not found', 404, 'FEED_NOT_FOUND');
      return;
    }
    sendSuccess(res, feed);
  } catch (err) {
    if (err instanceof Error && /required|valid|empty|must be/.test(err.message)) {
      sendError(res, err.message, 400, 'INVALID_FEED');
      return;
    }
    handleRouteError(res, err, 'competitive-intel:update-feed');
  }
});

router.delete('/feeds/:id', adminGuard, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const ok = await removeFeed(id, actorFromReq(req));
    if (!ok) {
      sendError(res, 'Feed not found', 404, 'FEED_NOT_FOUND');
      return;
    }
    sendSuccess(res, { id, removed: true });
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:remove-feed');
  }
});

// ─── Lane mute controls ─────────────────────────────────────────────────────

router.get('/lanes', async (_req: Request, res: Response) => {
  try {
    const lanes = await listLanes();
    sendSuccess(res, { lanes, count: lanes.length });
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:list-lanes');
  }
});

router.post('/lanes/:laneId/mute', authMiddleware(), requireRole('admin', 'editor'), async (req: Request, res: Response) => {
  try {
    const laneId = req.params.laneId;
    const muted = (req.body as { muted?: unknown } | null)?.muted;
    if (typeof muted !== 'boolean') {
      sendError(res, 'Body must include { muted: boolean }', 400, 'INVALID_BODY');
      return;
    }
    const lane = await setLaneMute(laneId, muted);
    if (!lane) {
      sendError(res, 'Unknown lane', 404, 'LANE_NOT_FOUND');
      return;
    }
    sendSuccess(res, lane);
  } catch (err) {
    handleRouteError(res, err, 'competitive-intel:lane-mute');
  }
});

export default router;
