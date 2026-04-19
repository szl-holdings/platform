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
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { adminGuard } from "../middlewares/admin-guard";
import {
  listAlerts,
  dismissAlert,
  getMonitorStatus,
  pollAllFeeds,
  CHAMPION_FEEDS,
  listFeeds,
  addFeed,
  updateFeed,
  removeFeed,
  type FeedInput,
  type FeedUpdate,
} from "../jobs/competitive-intel-monitor";

const router: IRouter = Router();

function actorFromReq(req: Request): string {
  const user = (req as Request & { user?: { id?: string | number; email?: string } }).user;
  return user?.email ?? String(user?.id ?? "anonymous");
}

router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const laneId = typeof req.query.laneId === "string" ? req.query.laneId : undefined;
    const includeDismissed = req.query.includeDismissed === "true";
    const alerts = await listAlerts({ laneId, includeDismissed });
    sendSuccess(res, {
      alerts,
      count: alerts.length,
      trackedChampions: CHAMPION_FEEDS.length,
    });
  } catch (err) {
    handleRouteError(res, err, "competitive-intel:list-alerts");
  }
});

router.get("/status", async (_req: Request, res: Response) => {
  try {
    const status = await getMonitorStatus();
    sendSuccess(res, status);
  } catch (err) {
    handleRouteError(res, err, "competitive-intel:status");
  }
});

router.post("/alerts/:id/dismiss", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const alert = await dismissAlert(id, actorFromReq(req));
    if (!alert) {
      sendError(res, "Alert not found", 404, "ALERT_NOT_FOUND");
      return;
    }
    sendSuccess(res, alert);
  } catch (err) {
    handleRouteError(res, err, "competitive-intel:dismiss");
  }
});

router.post("/refresh", async (_req: Request, res: Response) => {
  try {
    const result = await pollAllFeeds();
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "competitive-intel:refresh");
  }
});

// ─── Feed management (admin) ────────────────────────────────────────────────

router.get("/feeds", adminGuard, async (_req: Request, res: Response) => {
  try {
    const feeds = await listFeeds();
    sendSuccess(res, { feeds, count: feeds.length });
  } catch (err) {
    handleRouteError(res, err, "competitive-intel:list-feeds");
  }
});

router.post("/feeds", adminGuard, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Partial<FeedInput>;
    const feed = await addFeed({
      champion: String(body.champion ?? ""),
      laneId: String(body.laneId ?? ""),
      feedUrl: String(body.feedUrl ?? ""),
      homeUrl: body.homeUrl ? String(body.homeUrl) : undefined,
      paused: body.paused === true,
      recommendationHint: body.recommendationHint ?? undefined,
    }, actorFromReq(req));
    sendSuccess(res, feed, 201);
  } catch (err) {
    if (err instanceof Error && /required|valid|already|must be/.test(err.message)) {
      sendError(res, err.message, 400, "INVALID_FEED");
      return;
    }
    handleRouteError(res, err, "competitive-intel:add-feed");
  }
});

router.patch("/feeds/:id", adminGuard, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as FeedUpdate;
    const feed = await updateFeed(String(req.params.id), body, actorFromReq(req));
    if (!feed) {
      sendError(res, "Feed not found", 404, "FEED_NOT_FOUND");
      return;
    }
    sendSuccess(res, feed);
  } catch (err) {
    if (err instanceof Error && /required|valid|empty|must be/.test(err.message)) {
      sendError(res, err.message, 400, "INVALID_FEED");
      return;
    }
    handleRouteError(res, err, "competitive-intel:update-feed");
  }
});

router.delete("/feeds/:id", adminGuard, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const ok = await removeFeed(id, actorFromReq(req));
    if (!ok) {
      sendError(res, "Feed not found", 404, "FEED_NOT_FOUND");
      return;
    }
    sendSuccess(res, { id, removed: true });
  } catch (err) {
    handleRouteError(res, err, "competitive-intel:remove-feed");
  }
});

export default router;
