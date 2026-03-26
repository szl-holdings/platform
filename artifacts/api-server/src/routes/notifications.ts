import { Router, type IRouter } from "express";
import { db, notificationsTable, notificationPreferencesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

const validTypes = ["info", "warning", "error", "success", "action_required"] as const;
const validChannels = ["in_app", "email", "sms", "slack"] as const;

router.get("/notifications", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt));
    sendSuccess(res, notifications);
  } catch (err) {
    handleRouteError(res, err, "Failed to list notifications");
  }
});

router.post("/notifications", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const { userId, type, channel, title, message, actionUrl } = req.body;
    if (!userId || typeof userId !== "number") {
      sendBadRequest(res, "userId is required and must be a number");
      return;
    }
    if (!type || !validTypes.includes(type)) {
      sendBadRequest(res, `type must be one of: ${validTypes.join(", ")}`);
      return;
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      sendBadRequest(res, "title is required and must be a non-empty string");
      return;
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      sendBadRequest(res, "message is required and must be a non-empty string");
      return;
    }
    if (channel && !validChannels.includes(channel)) {
      sendBadRequest(res, `channel must be one of: ${validChannels.join(", ")}`);
      return;
    }
    const channelValue = channel && validChannels.includes(channel) ? (channel as (typeof validChannels)[number]) : "in_app" as const;
    const [notification] = await db.insert(notificationsTable).values({
      userId,
      type: type as (typeof validTypes)[number],
      channel: channelValue,
      title: title.trim(),
      message: message.trim(),
      actionUrl: actionUrl ?? null,
    }).returning();
    sendCreated(res, notification);
  } catch (err) {
    req.log?.error({ err }, "Failed to create notification");
    handleRouteError(res, err, "Failed to create notification");
  }
});

router.patch("/notifications/:id/read", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(notificationsTable).where(
      and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.id))
    );
    if (!existing) {
      sendNotFound(res, "Notification");
      return;
    }
    const [notification] = await db.update(notificationsTable).set({
      isRead: true,
      readAt: new Date(),
    }).where(eq(notificationsTable.id, id)).returning();
    sendSuccess(res, notification);
  } catch (err) {
    req.log?.error({ err }, "Failed to mark notification as read");
    handleRouteError(res, err, "Failed to mark notification as read");
  }
});

router.delete("/notifications/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(notificationsTable).where(
      and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.id))
    );
    if (!existing) {
      sendNotFound(res, "Notification");
      return;
    }
    await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete notification");
  }
});

export default router;
