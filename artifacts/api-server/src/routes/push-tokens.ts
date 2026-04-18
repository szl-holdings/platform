import { Router, type IRouter } from "express";
import { db, pushTokensTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendBadRequest, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { Expo } from "expo-server-sdk";
import { jsonObjectBodySchema, pushTokenRegisterSchema, validateBody } from "../lib/validation";

const router: IRouter = Router();

// POST /push-tokens
// Auth is optional — allows apps without user sessions (e.g. public portfolio
// apps) to register device tokens with an appId. When authenticated the token
// is linked to the user; otherwise userId is stored as null.
//
// AppId taxonomy (used by expo-push.ts sendPushToApp / sendPushToUser):
//   "cortex-mobile"    — fallback for the CORTEX unified app when no workspace is specified
//   "cortex-advisory"  — advisory / Carlota Jo workspace within CORTEX
//   "aegis-mobile"     — defense / Aegis workspace within CORTEX
//   "lyte-mobile"      — operations / Lyte workspace within CORTEX
//   "terra-mobile"     — properties / Terra workspace within CORTEX
//   "stephen-mobile"   — founder workspace within CORTEX
// Workspaces that have not yet configured their own push hook (fleet, portfolio,
// intelligence) also fall back to "cortex-mobile" until their hooks are set up.
// Push fanout via sendPushToApp(appId, ...) targets tokens with the matching appId;
// cross-workspace broadcasts use sendPushBroadcast or target "cortex-mobile".
router.post("/push-tokens", authMiddleware({ required: false }), validateBody(pushTokenRegisterSchema), async (req, res) => {
  try {
    const { token, platform, appId } = req.body;
    const userId = req.user?.id ?? null;

    if (!Expo.isExpoPushToken(token)) {
      sendBadRequest(res, "Invalid Expo push token format");
      return;
    }

    const validPlatforms = ["ios", "android", "web"] as const;
    const resolvedPlatform: (typeof validPlatforms)[number] = validPlatforms.includes(platform as string) ? platform as (typeof validPlatforms)[number] : "ios";

    const existing = await db
      .select()
      .from(pushTokensTable)
      .where(eq(pushTokensTable.token, token));

    if (existing.length > 0) {
      // Preserve existing authenticated userId — don't allow an unauthenticated
      // (anonymous) request to take over a token that's already owned by a user.
      const resolvedUserId = userId !== null ? userId : existing[0].userId;
      const [updated] = await db
        .update(pushTokensTable)
        .set({
          userId: resolvedUserId,
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
        appId: appId ?? "cortex-mobile",
        isActive: true,
      })
      .returning();

    sendCreated(res, created);
  } catch (err) {
    handleRouteError(res, err, "Failed to register push token");
  }
});

router.delete("/push-tokens/:token", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
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
