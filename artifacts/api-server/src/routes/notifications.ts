import { Router, type IRouter } from "express";
import { db, notificationsTable, notificationPreferencesTable } from "@szl-holdings/db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { publish, WS_CHANNELS } from "../lib/websocket";
import { validateBody, createNotificationSchema } from "../lib/validation";
import { z } from "zod";

const router: IRouter = Router();

const validTypes = ["info", "warning", "error", "success", "action_required"] as const;
const validChannels = ["in_app", "email", "sms", "slack"] as const;

router.get("/notifications", authMiddleware({ required: false }), async (req, res) => {
  try {
    if (!req.user) {
      sendSuccess(res, []);
      return;
    }
    const userId = req.user.id;
    const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset);
    sendSuccess(res, notifications, 200, { page, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list notifications");
  }
});

router.post("/notifications", authMiddleware(), requireRole("ops"), validateBody(createNotificationSchema), async (req, res) => {
  try {
    const { userId, type, channel, title, message, actionUrl } = req.body as z.infer<typeof createNotificationSchema>;
    const [notification] = await db.insert(notificationsTable).values({
      userId,
      type,
      channel,
      title,
      message,
      actionUrl: actionUrl ?? null,
    }).returning();

    publish(WS_CHANNELS.NOTIFICATIONS, "new_notification", notification);

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

router.patch("/notifications/read-all", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    await db.update(notificationsTable).set({
      isRead: true,
      readAt: new Date(),
    }).where(
      and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false))
    );
    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to mark all notifications as read");
    handleRouteError(res, err, "Failed to mark all notifications as read");
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

export { publishNotification };

async function publishNotification(params: {
  type: (typeof validTypes)[number];
  title: string;
  message: string;
  actionUrl?: string;
  appId?: string;
  severity?: "info" | "warning" | "critical";
}): Promise<void> {
  const notifData = {
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: params.type,
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl ?? null,
    appId: params.appId ?? "system",
    severity: params.severity ?? "info",
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  publish(WS_CHANNELS.NOTIFICATIONS, "new_notification", notifData);
}

export default router;
