import { Router, type IRouter } from "express";
import { db, featureFlagsTable, featureFlagOverridesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError } from "../lib/api-response";
import { logActivity } from "../lib/activity-logger";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/feature-flags", authMiddleware(), async (_req, res) => {
  try {
    const flags = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.key);
    sendSuccess(res, flags);
  } catch (err) {
    handleRouteError(res, err, "Failed to list feature flags");
  }
});

router.post("/feature-flags", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const { key, name, description, isEnabled, rolloutPercentage, conditions } = req.body;
    if (!key || typeof key !== "string" || key.trim().length === 0) {
      sendBadRequest(res, "key is required and must be a non-empty string");
      return;
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      sendBadRequest(res, "name is required and must be a non-empty string");
      return;
    }
    if (isEnabled !== undefined && typeof isEnabled !== "boolean") {
      sendBadRequest(res, "isEnabled must be a boolean");
      return;
    }
    if (rolloutPercentage !== undefined && (typeof rolloutPercentage !== "number" || rolloutPercentage < 0 || rolloutPercentage > 100)) {
      sendBadRequest(res, "rolloutPercentage must be a number between 0 and 100");
      return;
    }
    const [flag] = await db.insert(featureFlagsTable).values({
      key: key.trim(),
      name: name.trim(),
      description: description ?? null,
      isEnabled: isEnabled ?? false,
      rolloutPercentage: rolloutPercentage ?? 0,
      conditions: conditions ?? null,
    }).returning();
    await logActivity(req, "create", "feature_flag", String(flag.id));
    sendCreated(res, flag);
  } catch (err) {
    req.log?.error({ err }, "Failed to create feature flag");
    handleRouteError(res, err, "Failed to create feature flag");
  }
});

router.patch("/feature-flags/:id", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { name, description, isEnabled, rolloutPercentage, conditions } = req.body;
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      sendBadRequest(res, "name must be a non-empty string");
      return;
    }
    if (isEnabled !== undefined && typeof isEnabled !== "boolean") {
      sendBadRequest(res, "isEnabled must be a boolean");
      return;
    }
    if (rolloutPercentage !== undefined && (typeof rolloutPercentage !== "number" || rolloutPercentage < 0 || rolloutPercentage > 100)) {
      sendBadRequest(res, "rolloutPercentage must be a number between 0 and 100");
      return;
    }
    if (description !== undefined && typeof description !== "string") {
      sendBadRequest(res, "description must be a string");
      return;
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (rolloutPercentage !== undefined) updateData.rolloutPercentage = rolloutPercentage;
    if (conditions !== undefined) updateData.conditions = conditions;

    const [flag] = await db.update(featureFlagsTable).set(updateData).where(eq(featureFlagsTable.id, id)).returning();
    if (!flag) {
      sendNotFound(res, "Feature flag");
      return;
    }
    await logActivity(req, "update", "feature_flag", String(flag.id));
    sendSuccess(res, flag);
  } catch (err) {
    req.log?.error({ err }, "Failed to update feature flag");
    handleRouteError(res, err, "Failed to update feature flag");
  }
});

router.delete("/feature-flags/:id", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [flag] = await db.delete(featureFlagsTable).where(eq(featureFlagsTable.id, id)).returning();
    if (!flag) {
      sendNotFound(res, "Feature flag");
      return;
    }
    await logActivity(req, "delete", "feature_flag", String(flag.id));
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete feature flag");
  }
});

router.get("/feature-flags/check/:key", async (req, res) => {
  try {
    const { key } = req.params;
    if (!key || typeof key !== "string") {
      sendBadRequest(res, "key is required");
      return;
    }
    const [flag] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, key))
      .limit(1);

    if (!flag) {
      sendSuccess(res, { key, isEnabled: false, exists: false });
      return;
    }

    let isEnabled = flag.isEnabled;
    if (isEnabled && flag.rolloutPercentage < 100) {
      const hash = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      isEnabled = (hash % 100) < flag.rolloutPercentage;
    }

    sendSuccess(res, { key, isEnabled, rolloutPercentage: flag.rolloutPercentage, exists: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to check feature flag");
  }
});

export default router;
