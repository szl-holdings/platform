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
import {
  listAlerts,
  dismissAlert,
  getMonitorStatus,
  pollAllFeeds,
  CHAMPION_FEEDS,
} from "../jobs/competitive-intel-monitor";

const router: IRouter = Router();

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
    const id = req.params.id;
    const actor = (req as Request & { user?: { id?: string | number; email?: string } }).user?.email
      ?? String((req as Request & { user?: { id?: string | number } }).user?.id ?? "anonymous");
    const alert = await dismissAlert(id, actor);
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

export default router;
