import { Router, type IRouter } from "express";
import { db, webPushSubscriptionsTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNoContent,
  sendNotFound,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { getVapidPublicKey } from "../lib/web-push-sender";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";

const router: IRouter = Router();

router.get("/web-push/vapid-public-key", (_req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    sendBadRequest(res, "Web push not configured on this server");
    return;
  }
  sendSuccess(res, { publicKey });
});

router.post("/web-push/subscriptions", authMiddleware({ required: false }), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { endpoint, keys, appId } = req.body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      appId?: string;
    };

    if (!endpoint || typeof endpoint !== "string") {
      sendBadRequest(res, "endpoint is required");
      return;
    }
    if (!keys?.p256dh || !keys?.auth) {
      sendBadRequest(res, "keys.p256dh and keys.auth are required");
      return;
    }

    const userId = req.user?.id ?? null;
    const userAgent = req.headers["user-agent"] ?? null;
    const resolvedAppId = typeof appId === "string" && appId.trim() ? appId.trim() : "unknown";

    const existing = await db
      .select()
      .from(webPushSubscriptionsTable)
      .where(eq(webPushSubscriptionsTable.endpoint, endpoint));

    if (existing.length > 0) {
      const [updated] = await db
        .update(webPushSubscriptionsTable)
        .set({
          userId: userId !== null ? userId : existing[0]!.userId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          appId: resolvedAppId,
          userAgent,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(webPushSubscriptionsTable.endpoint, endpoint))
        .returning();
      sendSuccess(res, updated);
      return;
    }

    const [created] = await db
      .insert(webPushSubscriptionsTable)
      .values({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        appId: resolvedAppId,
        userAgent,
        isActive: true,
      })
      .returning();

    sendCreated(res, created);
  } catch (err) {
    handleRouteError(res, err, "Failed to register web push subscription");
  }
});

router.delete("/web-push/subscriptions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint || typeof endpoint !== "string") {
      sendBadRequest(res, "endpoint is required");
      return;
    }

    const existing = await db
      .select()
      .from(webPushSubscriptionsTable)
      .where(eq(webPushSubscriptionsTable.endpoint, endpoint));

    if (existing.length === 0) {
      sendNotFound(res, "Subscription");
      return;
    }

    await db
      .update(webPushSubscriptionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(webPushSubscriptionsTable.endpoint, endpoint));

    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to unsubscribe web push");
  }
});

router.get("/web-push/subscriptions/me", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const subs = await db
      .select()
      .from(webPushSubscriptionsTable)
      .where(and(
        eq(webPushSubscriptionsTable.userId, userId),
        eq(webPushSubscriptionsTable.isActive, true)
      ));
    sendSuccess(res, subs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list web push subscriptions");
  }
});

router.get("/web-push/subscriptions", authMiddleware(), async (req, res) => {
  try {
    const subs = await db
      .select()
      .from(webPushSubscriptionsTable)
      .where(eq(webPushSubscriptionsTable.isActive, true));
    sendSuccess(res, subs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list all web push subscriptions");
  }
});

export default router;
