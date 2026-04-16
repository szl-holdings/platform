import type { IRouter } from "express";
import { db, featureFlagsTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";
import { logActivity } from "../../lib/activity-logger.js";
import { z } from "zod";
import { validateBody } from "../../lib/validation.js";
import { sendError, sendNotFound } from "../../lib/api-response.js";

const enabledSchema = z.object({ enabled: z.boolean() });

export function register(router: IRouter): void {
  router.get("/admin/feature-flags", async (_req, res) => {
    try {
      const rows = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.key);
      const flags = rows.map((r) => ({ key: r.key, name: r.name, enabled: r.isEnabled, description: r.description ?? "", rolloutPercentage: r.rolloutPercentage, updatedAt: r.updatedAt.toISOString() }));
      res.json({ flags });
    } catch {
      sendError(res, "Failed to fetch feature flags", 500, "INTERNAL_ERROR");
    }
  });

  router.put("/admin/feature-flags/:key", validateBody(enabledSchema), async (req, res) => {
    try {
      const key = req.params["key"]!;
      const { enabled } = req.body as z.infer<typeof enabledSchema>;
      const [updated] = await db.update(featureFlagsTable).set({ isEnabled: enabled, updatedAt: new Date() }).where(eq(featureFlagsTable.key, key)).returning();
      if (!updated) { sendNotFound(res, "Feature flag"); return; }
      await logActivity(req, "update", "feature_flag", String(updated.id), `Admin toggled flag: ${key}=${enabled}`).catch(() => {});
      res.json({ key: updated.key, name: updated.name, enabled: updated.isEnabled, updatedAt: updated.updatedAt.toISOString() });
    } catch {
      sendError(res, "Failed to update feature flag", 500, "INTERNAL_ERROR");
    }
  });
}
