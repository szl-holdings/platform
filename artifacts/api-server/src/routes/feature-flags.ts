import { Router, type IRouter } from "express";
import { db, featureFlagsTable, featureFlagOverridesTable, orgMembersTable } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError } from "../lib/api-response";
import { logActivity } from "../lib/activity-logger";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { evaluateFlag, evaluateFlags, isFlagEnabled, PLATFORM_FLAGS, type PlatformFlagKey, type FlagEvaluationContext } from "../lib/platform-flags";

const router: IRouter = Router();

router.get("/feature-flags", authMiddleware(), async (_req, res) => {
  try {
    const flags = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.key);
    sendSuccess(res, flags);
  } catch (err) {
    handleRouteError(res, err, "Failed to list feature flags");
  }
});

router.get("/feature-flags/platform", authMiddleware(), requireRole("ops", "admin"), async (_req, res) => {
  try {
    const dbFlags = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.key);
    const dbFlagMap = new Map(dbFlags.map(f => [f.key, f]));

    const platformFlagStatuses = PLATFORM_FLAGS.map(pf => {
      const dbFlag = dbFlagMap.get(pf.key);
      return {
        key: pf.key,
        name: pf.name,
        description: pf.description,
        isEnabled: dbFlag?.isEnabled ?? pf.isEnabled,
        rolloutPercentage: dbFlag?.rolloutPercentage ?? pf.rolloutPercentage,
        inDb: !!dbFlag,
        updatedAt: dbFlag?.updatedAt?.toISOString() ?? null,
      };
    });

    sendSuccess(res, { flags: platformFlagStatuses, total: platformFlagStatuses.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list platform feature flags");
  }
});

router.post("/feature-flags/evaluate", authMiddleware(), async (req, res) => {
  try {
    const { key, keys } = req.body as {
      key?: string;
      keys?: string[];
    };

    const userId = req.user!.id;
    let orgId: number | undefined;

    try {
      const [membership] = await db.select({ orgId: orgMembersTable.orgId })
        .from(orgMembersTable)
        .where(eq(orgMembersTable.userId, userId))
        .limit(1);
      orgId = membership?.orgId ?? undefined;
    } catch {
      // org table may not exist in all environments — not fatal for evaluation
    }

    const ctx: FlagEvaluationContext = {
      userId,
      roles: req.user!.roles,
      orgId,
    };

    if (key) {
      const result = await evaluateFlag(key, ctx);
      sendSuccess(res, result);
    } else if (keys && Array.isArray(keys) && keys.length > 0) {
      const flagKeys = keys.filter(k => typeof k === "string").slice(0, 50);
      const results = await evaluateFlags(flagKeys, ctx);
      sendSuccess(res, { results });
    } else {
      sendBadRequest(res, "Either 'key' (string) or 'keys' (string[]) is required");
    }
  } catch (err) {
    handleRouteError(res, err, "Feature flag evaluation failed");
  }
});

router.post("/feature-flags", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
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
    await logActivity(req, "create", "feature_flag", String(flag.id), `Created flag: ${flag.key}`);
    sendCreated(res, flag);
  } catch (err) {
    req.log?.error({ err }, "Failed to create feature flag");
    handleRouteError(res, err, "Failed to create feature flag");
  }
});

router.patch("/feature-flags/:id", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
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
    await logActivity(req, "update", "feature_flag", String(flag.id), `Updated flag: ${flag.key} (enabled=${flag.isEnabled})`);
    sendSuccess(res, flag);
  } catch (err) {
    req.log?.error({ err }, "Failed to update feature flag");
    handleRouteError(res, err, "Failed to update feature flag");
  }
});

router.delete("/feature-flags/:id", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [flag] = await db.delete(featureFlagsTable).where(eq(featureFlagsTable.id, id)).returning();
    if (!flag) {
      sendNotFound(res, "Feature flag");
      return;
    }
    await logActivity(req, "delete", "feature_flag", String(flag.id), `Deleted flag: ${flag.key}`);
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete feature flag");
  }
});

router.get("/feature-flags/:id/overrides", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const overrides = await db
      .select()
      .from(featureFlagOverridesTable)
      .where(eq(featureFlagOverridesTable.flagId, id))
      .orderBy(featureFlagOverridesTable.entityType);
    sendSuccess(res, overrides);
  } catch (err) {
    handleRouteError(res, err, "Failed to list flag overrides");
  }
});

router.post("/feature-flags/:id/overrides", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
  try {
    const flagId = parseIdParam(req.params.id);
    const { entityType, entityId, isEnabled } = req.body;

    if (!entityType || !["user", "org", "role"].includes(entityType)) {
      sendBadRequest(res, "entityType must be one of: user, org, role");
      return;
    }
    if (!entityId || typeof entityId !== "string") {
      sendBadRequest(res, "entityId is required");
      return;
    }
    if (typeof isEnabled !== "boolean") {
      sendBadRequest(res, "isEnabled must be a boolean");
      return;
    }

    const [override] = await db
      .insert(featureFlagOverridesTable)
      .values({ flagId, entityType, entityId: String(entityId), isEnabled })
      .returning();

    await logActivity(req, "create", "feature_flag_override", String(override.id),
      `Created ${entityType} override for flag ${flagId}: ${entityId}=${isEnabled}`);
    sendCreated(res, override);
  } catch (err) {
    handleRouteError(res, err, "Failed to create flag override");
  }
});

router.delete("/feature-flags/:id/overrides/:overrideId", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
  try {
    const flagId = parseIdParam(req.params.id);
    const overrideId = parseIdParam(req.params.overrideId);
    const [deleted] = await db
      .delete(featureFlagOverridesTable)
      .where(eq(featureFlagOverridesTable.id, overrideId))
      .returning();
    if (!deleted) {
      sendNotFound(res, "Override");
      return;
    }
    await logActivity(req, "delete", "feature_flag_override", String(overrideId),
      `Deleted override ${overrideId} for flag ${flagId}`);
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete flag override");
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
