/**
 * /admin/apps — Manage the apps registry, including the owning team mapping
 * shown in the deployments panel. Replaces the static APP_OWNER_TEAMS map
 * that used to live in routes/deployments.ts so platform admins can change
 * ownership from the UI without a code change and redeploy.
 */

import type { IRouter } from "express";
import { db, appsRegistryTable } from "@szl-holdings/db";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "../../lib/activity-logger.js";
import { validateBody } from "../../lib/validation.js";
import { sendError, sendNotFound } from "../../lib/api-response.js";

const ownerTeamSchema = z.object({
  ownerTeam: z
    .string()
    .trim()
    .min(0)
    .max(120)
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export function register(router: IRouter): void {
  router.get("/admin/apps", async (_req, res) => {
    try {
      const rows = await db
        .select({
          slug: appsRegistryTable.slug,
          name: appsRegistryTable.name,
          status: appsRegistryTable.status,
          ownerTeam: appsRegistryTable.ownerTeam,
          updatedAt: appsRegistryTable.updatedAt,
        })
        .from(appsRegistryTable)
        .orderBy(asc(appsRegistryTable.name));
      res.json({
        apps: rows.map((r) => ({
          slug: r.slug,
          name: r.name,
          status: r.status,
          ownerTeam: r.ownerTeam,
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    } catch {
      sendError(res, "Failed to fetch apps registry", 500, "INTERNAL_ERROR");
    }
  });

  router.put(
    "/admin/apps/:slug/owner-team",
    validateBody(ownerTeamSchema),
    async (req, res) => {
      try {
        const slug = req.params["slug"] as string;
        const { ownerTeam } = req.body as { ownerTeam: string | null };
        const [updated] = await db
          .update(appsRegistryTable)
          .set({ ownerTeam, updatedAt: new Date() })
          .where(eq(appsRegistryTable.slug, slug))
          .returning();
        if (!updated) {
          sendNotFound(res, "App");
          return;
        }
        await logActivity(
          req,
          "update",
          "app_registry",
          updated.slug,
          `Set owning team for ${slug} to ${ownerTeam ?? "(unassigned)"}`,
        ).catch(() => {});
        res.json({
          slug: updated.slug,
          name: updated.name,
          status: updated.status,
          ownerTeam: updated.ownerTeam,
          updatedAt: updated.updatedAt.toISOString(),
        });
      } catch {
        sendError(res, "Failed to update app owner team", 500, "INTERNAL_ERROR");
      }
    },
  );
}
