import { Router, type IRouter } from "express";
import { db, pushTokensTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendBadRequest, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { Expo } from "expo-server-sdk";

const router: IRouter = Router();

router.post("/push-tokens", authMiddleware(), async (req, res) => {
  try {
    const { token, platform, appId } = req.body;
    const userId = req.user!.id;

    if (!token || typeof token !== "string") {
      sendBadRequest(res, "token is required");
      return;
    }

    if (!Expo.isExpoPushToken(token)) {
      sendBadRequest(res, "Invalid Expo push token format");
      return;
    }

    const validPlatforms = ["ios", "android", "web"] as const;
    const resolvedPlatform: (typeof validPlatforms)[number] = validPlatforms.includes(platform) ? platform : "ios";

    const existing = await db
      .select()
      .from(pushTokensTable)
      .where(eq(pushTokensTable.token, token));

    if (existing.length > 0) {
      const [updated] = await db
        .update(pushTokensTable)
        .set({
          userId,
          isActive: true,
          platform: resolvedPlatform,
          appId: appId ?? existing[0].appId,
          updatedAt: new Date(),
        })
        .where(eq(pushTokensTable.token, token))
        .returning();
      sendSuccess(res, updated);
      return;
    }

    const [created] = await db
      .insert(pushTokensTable)
      .values({
        userId,
        token,
        platform: resolvedPlatform,
        appId: appId ?? "carlota-jo-mobile",
        isActive: true,
      })
      .returning();

    sendCreated(res, created);
  } catch (err) {
    handleRouteError(res, err, "Failed to register push token");
  }
});

router.delete("/push-tokens/:token", authMiddleware(), async (req, res) => {
  try {
    const { token } = req.params as Record<string, string>;
    const userId = req.user!.id;

    await db
      .update(pushTokensTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(pushTokensTable.token, token), eq(pushTokensTable.userId, userId)));

    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to deregister push token");
  }
});

router.get("/push-tokens/me", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const tokens = await db
      .select()
      .from(pushTokensTable)
      .where(and(eq(pushTokensTable.userId, userId), eq(pushTokensTable.isActive, true)));
    sendSuccess(res, tokens);
  } catch (err) {
    handleRouteError(res, err, "Failed to list push tokens");
  }
});

export default router;
