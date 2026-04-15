import { Router, type IRouter } from "express";
import { db, pushNotificationPreferencesTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendBadRequest, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

const VALID_APP_IDS = [
  "aegis-mobile",
  "carlota-jo-mobile",
  "lyte-mobile",
  "stephen-mobile",
  "szl-holdings-mobile",
  "terra-mobile",
  "vessels-mobile",
];

const CATEGORIES_BY_APP: Record<string, string[]> = {
  "aegis-mobile": ["threats", "incidents", "health", "all"],
  "carlota-jo-mobile": ["sessions", "documents", "messages", "all"],
  "lyte-mobile": ["kpi_alerts", "escalations", "milestones", "all"],
  "stephen-mobile": ["content_published", "venture_updates", "all"],
  "szl-holdings-mobile": ["portfolio_alerts", "investor_updates", "all"],
  "terra-mobile": ["deal_updates", "listing_changes", "distress_signals", "all"],
  "vessels-mobile": ["vessel_alerts", "compliance", "port_arrivals", "all"],
};

router.get("/push-preferences", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = await db
      .select()
      .from(pushNotificationPreferencesTable)
      .where(eq(pushNotificationPreferencesTable.userId, userId));
    sendSuccess(res, preferences);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch push preferences");
  }
});

router.get("/push-preferences/:appId", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { appId } = req.params as { appId: string };

    if (!VALID_APP_IDS.includes(appId)) {
      sendBadRequest(res, `Unknown appId. Valid values: ${VALID_APP_IDS.join(", ")}`);
      return;
    }

    const preferences = await db
      .select()
      .from(pushNotificationPreferencesTable)
      .where(
        and(
          eq(pushNotificationPreferencesTable.userId, userId),
          eq(pushNotificationPreferencesTable.appId, appId)
        )
      );
    sendSuccess(res, preferences);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch push preferences for app");
  }
});

router.put("/push-preferences/:appId/:category", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { appId, category } = req.params as { appId: string; category: string };
    const { enabled } = req.body;

    if (!VALID_APP_IDS.includes(appId)) {
      sendBadRequest(res, `Unknown appId. Valid values: ${VALID_APP_IDS.join(", ")}`);
      return;
    }

    const validCategories = CATEGORIES_BY_APP[appId] ?? [];
    if (!validCategories.includes(category)) {
      sendBadRequest(res, `Unknown category for ${appId}. Valid values: ${validCategories.join(", ")}`);
      return;
    }

    if (typeof enabled !== "boolean") {
      sendBadRequest(res, "enabled must be a boolean");
      return;
    }

    const existing = await db
      .select()
      .from(pushNotificationPreferencesTable)
      .where(
        and(
          eq(pushNotificationPreferencesTable.userId, userId),
          eq(pushNotificationPreferencesTable.appId, appId),
          eq(pushNotificationPreferencesTable.category, category)
        )
      );

    let result;
    if (existing.length > 0) {
      [result] = await db
        .update(pushNotificationPreferencesTable)
        .set({ enabled, updatedAt: new Date() })
        .where(
          and(
            eq(pushNotificationPreferencesTable.userId, userId),
            eq(pushNotificationPreferencesTable.appId, appId),
            eq(pushNotificationPreferencesTable.category, category)
          )
        )
        .returning();
    } else {
      [result] = await db
        .insert(pushNotificationPreferencesTable)
        .values({ userId, appId, category, enabled })
        .returning();
    }

    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to update push preference");
  }
});

router.delete("/push-preferences/:appId", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { appId } = req.params as { appId: string };

    await db
      .delete(pushNotificationPreferencesTable)
      .where(
        and(
          eq(pushNotificationPreferencesTable.userId, userId),
          eq(pushNotificationPreferencesTable.appId, appId)
        )
      );

    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete push preferences for app");
  }
});

router.get("/push-preferences/categories/:appId", authMiddleware(), async (req, res) => {
  try {
    const { appId } = req.params as { appId: string };

    if (!VALID_APP_IDS.includes(appId)) {
      sendBadRequest(res, `Unknown appId. Valid values: ${VALID_APP_IDS.join(", ")}`);
      return;
    }

    sendSuccess(res, {
      appId,
      categories: CATEGORIES_BY_APP[appId] ?? [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list push categories");
  }
});

export default router;
