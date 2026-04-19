/**
 * /admin/apps — Manage the apps registry, including the owning team mapping
 * shown in the deployments panel. Replaces the static APP_OWNER_TEAMS map
 * that used to live in routes/deployments.ts so platform admins can change
 * ownership from the UI without a code change and redeploy.
 *
 * Also supports adding new apps to the registry and removing/deprecating
 * obsolete ones, so launching or sunsetting a product no longer requires a
 * code change and redeploy.
 */

import type { IRouter } from "express";
import { db, appsRegistryTable } from "@szl-holdings/db";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "../../lib/activity-logger.js";
import { validateBody } from "../../lib/validation.js";
import {
  sendBadRequest,
  sendConflict,
  sendCreated,
  sendError,
  sendNotFound,
} from "../../lib/api-response.js";

const APP_STATUSES = ["active", "coming_soon", "maintenance", "deprecated"] as const;
type AppStatus = (typeof APP_STATUSES)[number];

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Slug must be lowercase letters, numbers, and dashes");

const ownerTeamSchema = z.object({
  ownerTeam: z
    .string()
    .trim()
    .min(0)
    .max(120)
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

const createAppSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  status: z.enum(APP_STATUSES).default("coming_soon"),
  ownerTeam: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

const updateStatusSchema = z.object({
  status: z.enum(APP_STATUSES),
});

function serialize(row: {
  slug: string;
  name: string;
  status: string;
  ownerTeam: string | null;
  updatedAt: Date;
}) {
  return {
    slug: row.slug,
    name: row.name,
    status: row.status,
    ownerTeam: row.ownerTeam,
    updatedAt: row.updatedAt.toISOString(),
  };
}

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
      res.json({ apps: rows.map(serialize) });
    } catch {
      sendError(res, "Failed to fetch apps registry", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/apps", validateBody(createAppSchema), async (req, res) => {
    const body = req.body as {
      slug: string;
      name: string;
      status: AppStatus;
      ownerTeam: string | null;
    };
    try {
      const existing = await db
        .select({ slug: appsRegistryTable.slug })
        .from(appsRegistryTable)
        .where(eq(appsRegistryTable.slug, body.slug))
        .limit(1);
      if (existing.length > 0) {
        sendConflict(res, `App "${body.slug}" already exists`);
        return;
      }
      const [created] = await db
        .insert(appsRegistryTable)
        .values({
          slug: body.slug,
          name: body.name,
          status: body.status,
          ownerTeam: body.ownerTeam,
        })
        .returning();
      if (!created) {
        sendError(res, "Failed to create app", 500, "INTERNAL_ERROR");
        return;
      }
      await logActivity(
        req,
        "create",
        "app_registry",
        created.slug,
        `Added ${created.slug} (${created.name}) to the apps registry`,
      ).catch(() => {});
      sendCreated(res, serialize(created));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        sendConflict(res, `App "${body.slug}" already exists`);
        return;
      }
      sendError(res, "Failed to create app", 500, "INTERNAL_ERROR");
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
        res.json(serialize(updated));
      } catch {
        sendError(res, "Failed to update app owner team", 500, "INTERNAL_ERROR");
      }
    },
  );

  router.put(
    "/admin/apps/:slug/status",
    validateBody(updateStatusSchema),
    async (req, res) => {
      try {
        const slug = req.params["slug"] as string;
        const { status } = req.body as { status: AppStatus };
        const [updated] = await db
          .update(appsRegistryTable)
          .set({ status, updatedAt: new Date() })
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
          `Set status for ${slug} to ${status}`,
        ).catch(() => {});
        res.json(serialize(updated));
      } catch {
        sendError(res, "Failed to update app status", 500, "INTERNAL_ERROR");
      }
    },
  );

  router.delete("/admin/apps/:slug", async (req, res) => {
    try {
      const slug = req.params["slug"] as string;
      if (!slug) {
        sendBadRequest(res, "Missing slug");
        return;
      }
      const [deleted] = await db
        .delete(appsRegistryTable)
        .where(eq(appsRegistryTable.slug, slug))
        .returning();
      if (!deleted) {
        sendNotFound(res, "App");
        return;
      }
      await logActivity(
        req,
        "delete",
        "app_registry",
        deleted.slug,
        `Removed ${deleted.slug} (${deleted.name}) from the apps registry`,
      ).catch(() => {});
      res.json({ ok: true, slug: deleted.slug });
    } catch {
      sendError(res, "Failed to delete app", 500, "INTERNAL_ERROR");
    }
  });
}
