import { Router, type IRouter } from "express";
import { db, activityLogTable, auditEventsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/audit/activity", authMiddleware(), requireRole("ops", "analyst"), async (_req, res) => {
  try {
    const logs = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.createdAt)).limit(100);
    sendSuccess(res, logs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list activity logs");
  }
});

router.get("/audit/events", authMiddleware(), requireRole("ops", "analyst"), async (_req, res) => {
  try {
    const events = await db.select().from(auditEventsTable).orderBy(desc(auditEventsTable.createdAt)).limit(100);
    sendSuccess(res, events);
  } catch (err) {
    handleRouteError(res, err, "Failed to list audit events");
  }
});

export default router;
