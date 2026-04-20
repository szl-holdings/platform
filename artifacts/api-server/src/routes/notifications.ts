import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { db, notificationsTable, notificationPreferencesTable } from "@szl-holdings/db";
import { eq, desc, and, isNull, count as sqlCount } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { publish, WS_CHANNELS } from "../lib/websocket";
import { createNotificationSchema, listQuerySchema, validateBody, validateQuery } from "../lib/validation";
import { z } from "zod";
import { logger } from "../lib/logger";
import { durableJobQueue } from "@szl-holdings/forge-runtime";
import { PLATFORM_JOB_TYPES } from "../lib/platform-jobs";

const router: IRouter = Router();

const validTypes = ["info", "warning", "error", "success", "action_required"] as const;
const validChannels = ["in_app", "email", "sms", "slack"] as const;

export async function dispatchToExternalChannels(params: {
  notificationId: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
}): Promise<void> {
  const prefs = await db.select().from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, params.userId))
    .limit(1);

  const p = prefs[0];
  if (!p) return;

  const channels: string[] = [];
  if (p.emailEnabled) channels.push("email");
  if (p.smsEnabled) channels.push("sms");
  if (p.slackEnabled) channels.push("slack");

  if (channels.length === 0) return;

  logger.info(
    { notificationId: params.notificationId, userId: params.userId, channels },
    "[notifications] Enqueueing external channel dispatch jobs",
  );

  for (const channel of channels) {
    void durableJobQueue.enqueue(PLATFORM_JOB_TYPES.NOTIFICATION_DISPATCH, {
      channel,
      notificationId: params.notificationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
    }).catch((err: unknown) => {
      logger.error({ err, channel, notificationId: params.notificationId }, "[notifications] Failed to enqueue dispatch job");
    });
  }
}

router.get("/notifications", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
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

router.get("/notifications/count", authMiddleware({ required: false }), async (req, res) => {
  try {
    if (!req.user) {
      sendSuccess(res, { unreadCount: 0 });
      return;
    }
    const userId = req.user.id;
    const [row] = await db
      .select({ unreadCount: sqlCount() })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
    sendSuccess(res, { unreadCount: Number(row?.unreadCount ?? 0) });
  } catch (err) {
    handleRouteError(res, err, "Failed to get notification count");
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

    void dispatchToExternalChannels({
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });

    sendCreated(res, notification);
  } catch (err) {
    req.log?.error({ err }, "Failed to create notification");
    handleRouteError(res, err, "Failed to create notification");
  }
});

router.patch("/notifications/:id/read", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
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

router.patch("/notifications/read-all", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
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

router.delete("/notifications/:id", validateBody(bodyShape({})), authMiddleware(), async (req, res) => {
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
