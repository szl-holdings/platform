/**
 * Unified Settings API — Hierarchical Config Store
 *
 * Three-tier inheritance:
 *   user setting → tenant/org setting → platform default
 *
 * Tiers:
 *   GET  /settings/resolve          — resolve effective value(s) for the requester
 *   GET  /settings/platform         — list platform defaults (super_admin)
 *   POST /settings/platform         — create/upsert platform default (super_admin)
 *   GET  /settings/tenant/:orgId    — list tenant overrides
 *   POST /settings/tenant/:orgId    — create/upsert tenant override
 *   GET  /settings/user             — list user preferences
 *   POST /settings/user             — create/upsert user preference
 *   DELETE /settings/:tier/:id      — remove a setting entry
 *   GET  /settings/audit            — settings change audit log
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db, platformSettingsTable, tenantSettingsTable, userSettingsTable, settingsAuditLogTable, usersTable } from "@szl-holdings/db";
import { hashIp } from "@szl-holdings/audit";
import { eq, and, desc, asc, like, gte, lte } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNoContent, sendNotFound, sendBadRequest, sendForbidden, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { assertTenantAccess } from "../middlewares/tenant-scope";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";

import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
const router: IRouter = Router();

const SUPER_ADMIN_ROLES = ["super_admin"] as const;
const ADMIN_ROLES = ["admin", "super_admin"] as const;

const ORG_ADMIN_ROLES = new Set(["owner", "admin"]);

function assertTenantAdminAccess(req: Request, res: Response, orgId: number): boolean {
  const user = req.user!;
  if (user.roles.includes("super_admin") || user.roles.includes("admin")) return true;
  const membership = user.orgs.find((o) => o.orgId === orgId);
  if (!membership) {
    sendForbidden(res, "Cross-tenant access denied");
    return false;
  }
  if (!ORG_ADMIN_ROLES.has(membership.role)) {
    sendForbidden(res, "Org admin role required to modify tenant settings");
    return false;
  }
  return true;
}

type Tier = "platform" | "tenant" | "user";

async function writeAudit(params: {
  tier: Tier;
  settingId: number;
  namespace: string;
  key: string;
  orgId?: number | null;
  userId?: number | null;
  actorId?: number | null;
  action: "create" | "update" | "delete";
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(settingsAuditLogTable).values({
      tier: params.tier,
      settingId: params.settingId,
      namespace: params.namespace,
      key: params.key,
      orgId: params.orgId ?? null,
      userId: params.userId ?? null,
      actorId: params.actorId ?? null,
      action: params.action,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      ipAddress: hashIp(params.ipAddress ?? null),
      userAgent: params.userAgent ?? null,
    });
  } catch {
    // audit failure is non-fatal
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE: Return effective settings for the current session
// Inheritance: user → tenant → platform
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/settings/resolve",
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const namespace = req.query.namespace as string | undefined;
      const keys = req.query.keys ? String(req.query.keys).split(",").map(k => k.trim()) : undefined;

      // Explicit orgId overrides the default primary org — validate access
      let orgId: number | null = null;
      if (req.query.orgId) {
        const requestedOrgId = parseInt(req.query.orgId as string, 10);
        if (isNaN(requestedOrgId)) {
          sendBadRequest(res, "Invalid orgId");
          return;
        }
        if (!assertTenantAccess(req, res, requestedOrgId)) return;
        orgId = requestedOrgId;
      } else {
        orgId = user.orgs[0]?.orgId ?? null;
      }

      const [platformRows, tenantRows, userRows] = await Promise.all([
        db.select().from(platformSettingsTable)
          .where(namespace ? eq(platformSettingsTable.namespace, namespace) : undefined)
          .orderBy(asc(platformSettingsTable.namespace), asc(platformSettingsTable.key)),
        orgId
          ? db.select().from(tenantSettingsTable)
            .where(and(
              eq(tenantSettingsTable.orgId, orgId),
              namespace ? eq(tenantSettingsTable.namespace, namespace) : undefined,
            ))
            .orderBy(asc(tenantSettingsTable.namespace), asc(tenantSettingsTable.key))
          : Promise.resolve([]),
        db.select().from(userSettingsTable)
          .where(and(
            eq(userSettingsTable.userId, user.id),
            orgId ? eq(userSettingsTable.orgId, orgId) : undefined,
            namespace ? eq(userSettingsTable.namespace, namespace) : undefined,
          ))
          .orderBy(asc(userSettingsTable.namespace), asc(userSettingsTable.key)),
      ]);

      const resolved: Record<string, { value: unknown; tier: Tier; namespace: string; key: string }> = {};

      for (const row of platformRows) {
        const k = `${row.namespace}:${row.key}`;
        resolved[k] = { value: row.value, tier: "platform", namespace: row.namespace, key: row.key };
      }
      for (const row of tenantRows) {
        const k = `${row.namespace}:${row.key}`;
        resolved[k] = { value: row.value, tier: "tenant", namespace: row.namespace, key: row.key };
      }
      for (const row of userRows) {
        const k = `${row.namespace}:${row.key}`;
        resolved[k] = { value: row.value, tier: "user", namespace: row.namespace, key: row.key };
      }

      let result = Object.values(resolved);
      if (keys) {
        result = result.filter(r => keys.includes(r.key));
      }

      sendSuccess(res, { settings: result, resolvedFor: { userId: user.id, orgId } });
    } catch (err) {
      handleRouteError(res, err, "Failed to resolve settings");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SETTINGS (tier 1) — super_admin only
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/settings/platform",
  authMiddleware(),
  requireRole(...SUPER_ADMIN_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const namespace = req.query.namespace as string | undefined;
      const category = req.query.category as string | undefined;

      const rows = await db.select().from(platformSettingsTable)
        .where(and(
          namespace ? eq(platformSettingsTable.namespace, namespace) : undefined,
          category ? eq(platformSettingsTable.category, category) : undefined,
        ))
        .orderBy(asc(platformSettingsTable.namespace), asc(platformSettingsTable.key));

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, "Failed to list platform settings");
    }
  },
);

router.post(
  "/settings/platform",
  authMiddleware(),
  requireRole(...SUPER_ADMIN_ROLES),
  validateBody(bodyShape({
      "category": z.unknown().optional(),
      "description": z.unknown().optional(),
      "isPublic": z.unknown().optional(),
      "key": z.unknown().optional(),
      "label": z.unknown().optional(),
      "namespace": z.unknown().optional(),
      "value": z.unknown().optional(),
      "valueType": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
    try {
      const { namespace, key, value, valueType, label, description, category, isPublic } = req.body as {
        namespace: string;
        key: string;
        value: unknown;
        valueType?: string;
        label?: string;
        description?: string;
        category?: string;
        isPublic?: boolean;
      };

      if (!namespace || !key) {
        sendBadRequest(res, "namespace and key are required");
        return;
      }

      const actorId = req.user!.id;

      const [existing] = await db.select().from(platformSettingsTable)
        .where(and(
          eq(platformSettingsTable.namespace, namespace),
          eq(platformSettingsTable.key, key),
        ))
        .limit(1);

      if (existing) {
        const [updated] = await db.update(platformSettingsTable)
          .set({
            value: value as never,
            valueType: (valueType ?? existing.valueType) as "string" | "number" | "boolean" | "json",
            label: label ?? existing.label,
            description: description ?? existing.description,
            category: category ?? existing.category,
            isPublic: isPublic ?? existing.isPublic,
            updatedBy: actorId,
            updatedAt: new Date(),
          })
          .where(eq(platformSettingsTable.id, existing.id))
          .returning();

        await writeAudit({
          tier: "platform", settingId: existing.id, namespace, key,
          actorId, action: "update", oldValue: existing.value, newValue: value,
          ipAddress: req.ip, userAgent: req.headers["user-agent"],
        });

        sendSuccess(res, updated);
      } else {
        const [created] = await db.insert(platformSettingsTable)
          .values({
            namespace, key, value: value as never,
            valueType: (valueType ?? "string") as "string" | "number" | "boolean" | "json",
            label, description,
            category: category ?? "general",
            isPublic: isPublic ?? false,
            createdBy: actorId, updatedBy: actorId,
          })
          .returning();

        await writeAudit({
          tier: "platform", settingId: created!.id, namespace, key,
          actorId, action: "create", newValue: value,
          ipAddress: req.ip, userAgent: req.headers["user-agent"],
        });

        sendCreated(res, created);
      }
    } catch (err) {
      handleRouteError(res, err, "Failed to upsert platform setting");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// TENANT SETTINGS (tier 2) — org admin or super_admin
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/settings/tenant/:orgId",
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAccess(req, res, orgId)) return;

      const namespace = req.query.namespace as string | undefined;
      const category = req.query.category as string | undefined;

      const rows = await db.select().from(tenantSettingsTable)
        .where(and(
          eq(tenantSettingsTable.orgId, orgId),
          namespace ? eq(tenantSettingsTable.namespace, namespace) : undefined,
          category ? eq(tenantSettingsTable.category, category) : undefined,
        ))
        .orderBy(asc(tenantSettingsTable.namespace), asc(tenantSettingsTable.key));

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, "Failed to list tenant settings");
    }
  },
);

router.post(
  "/settings/tenant/:orgId",
  authMiddleware(),
  validateBody(bodyShape({
      "category": z.unknown().optional(),
      "key": z.unknown().optional(),
      "label": z.unknown().optional(),
      "namespace": z.unknown().optional(),
      "value": z.unknown().optional(),
      "valueType": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (!assertTenantAdminAccess(req, res, orgId)) return;

      const { namespace, key, value, valueType, label, category } = req.body as {
        namespace: string;
        key: string;
        value: unknown;
        valueType?: string;
        label?: string;
        category?: string;
      };

      if (!namespace || !key) {
        sendBadRequest(res, "namespace and key are required");
        return;
      }

      const actorId = req.user!.id;

      const [existing] = await db.select().from(tenantSettingsTable)
        .where(and(
          eq(tenantSettingsTable.orgId, orgId),
          eq(tenantSettingsTable.namespace, namespace),
          eq(tenantSettingsTable.key, key),
        ))
        .limit(1);

      if (existing) {
        const [updated] = await db.update(tenantSettingsTable)
          .set({
            value: value as never,
            valueType: (valueType ?? existing.valueType) as "string" | "number" | "boolean" | "json",
            label: label ?? existing.label,
            category: category ?? existing.category,
            updatedBy: actorId,
            updatedAt: new Date(),
          })
          .where(eq(tenantSettingsTable.id, existing.id))
          .returning();

        await writeAudit({
          tier: "tenant", settingId: existing.id, namespace, key, orgId,
          actorId, action: "update", oldValue: existing.value, newValue: value,
          ipAddress: req.ip, userAgent: req.headers["user-agent"],
        });

        sendSuccess(res, updated);
      } else {
        const [created] = await db.insert(tenantSettingsTable)
          .values({
            orgId, namespace, key, value: value as never,
            valueType: (valueType ?? "string") as "string" | "number" | "boolean" | "json",
            label, category: category ?? "general",
            createdBy: actorId, updatedBy: actorId,
          })
          .returning();

        await writeAudit({
          tier: "tenant", settingId: created!.id, namespace, key, orgId,
          actorId, action: "create", newValue: value,
          ipAddress: req.ip, userAgent: req.headers["user-agent"],
        });

        sendCreated(res, created);
      }
    } catch (err) {
      handleRouteError(res, err, "Failed to upsert tenant setting");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// USER SETTINGS (tier 3) — any authenticated user
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/settings/user",
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const namespace = req.query.namespace as string | undefined;
      let orgId: number | null = null;
      if (req.query.orgId) {
        const requestedOrgId = parseInt(req.query.orgId as string, 10);
        if (isNaN(requestedOrgId)) { sendBadRequest(res, "Invalid orgId"); return; }
        if (!assertTenantAccess(req, res, requestedOrgId)) return;
        orgId = requestedOrgId;
      } else {
        orgId = user.orgs[0]?.orgId ?? null;
      }

      const rows = await db.select().from(userSettingsTable)
        .where(and(
          eq(userSettingsTable.userId, user.id),
          orgId ? eq(userSettingsTable.orgId, orgId) : undefined,
          namespace ? eq(userSettingsTable.namespace, namespace) : undefined,
        ))
        .orderBy(asc(userSettingsTable.namespace), asc(userSettingsTable.key));

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, "Failed to list user settings");
    }
  },
);

router.post(
  "/settings/user",
  authMiddleware(),
  validateBody(bodyShape({
      "key": z.unknown().optional(),
      "namespace": z.unknown().optional(),
      "orgId": z.unknown().optional(),
      "value": z.unknown().optional(),
      "valueType": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { namespace, key, value, valueType, orgId: bodyOrgId } = req.body as {
        namespace: string;
        key: string;
        value: unknown;
        valueType?: string;
        orgId?: number;
      };

      if (!namespace || !key) {
        sendBadRequest(res, "namespace and key are required");
        return;
      }

      let orgId: number | null = null;
      if (bodyOrgId != null) {
        if (!assertTenantAccess(req, res, bodyOrgId)) return;
        orgId = bodyOrgId;
      } else {
        orgId = user.orgs[0]?.orgId ?? null;
      }

      const [existing] = await db.select().from(userSettingsTable)
        .where(and(
          eq(userSettingsTable.userId, user.id),
          orgId ? eq(userSettingsTable.orgId, orgId) : undefined,
          eq(userSettingsTable.namespace, namespace),
          eq(userSettingsTable.key, key),
        ))
        .limit(1);

      if (existing) {
        const [updated] = await db.update(userSettingsTable)
          .set({
            value: value as never,
            valueType: (valueType ?? existing.valueType) as "string" | "number" | "boolean" | "json",
            updatedAt: new Date(),
          })
          .where(eq(userSettingsTable.id, existing.id))
          .returning();

        await writeAudit({
          tier: "user", settingId: existing.id, namespace, key, orgId, userId: user.id,
          actorId: user.id, action: "update", oldValue: existing.value, newValue: value,
          ipAddress: req.ip, userAgent: req.headers["user-agent"],
        });

        sendSuccess(res, updated);
      } else {
        const [created] = await db.insert(userSettingsTable)
          .values({
            userId: user.id, orgId, namespace, key, value: value as never,
            valueType: (valueType ?? "string") as "string" | "number" | "boolean" | "json",
          })
          .returning();

        await writeAudit({
          tier: "user", settingId: created!.id, namespace, key, orgId, userId: user.id,
          actorId: user.id, action: "create", newValue: value,
          ipAddress: req.ip, userAgent: req.headers["user-agent"],
        });

        sendCreated(res, created);
      }
    } catch (err) {
      handleRouteError(res, err, "Failed to upsert user setting");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — remove a setting by tier + id
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
  "/settings/:tier/:id", validateBody(bodyShape({})),
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const tier = req.params.tier as Tier;
      const id = parseIdParam(req.params.id);
      const user = req.user!;
      const actorId = user.id;

      if (!["platform", "tenant", "user"].includes(tier)) {
        sendBadRequest(res, "Invalid tier");
        return;
      }

      if (tier === "platform") {
        if (!user.roles.includes("super_admin")) {
          sendForbidden(res, "super_admin required");
          return;
        }
        const [row] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.id, id)).limit(1);
        if (!row) { sendNotFound(res, "Setting"); return; }
        await db.delete(platformSettingsTable).where(eq(platformSettingsTable.id, id));
        await writeAudit({ tier, settingId: id, namespace: row.namespace, key: row.key, actorId, action: "delete", oldValue: row.value, ipAddress: req.ip });
      } else if (tier === "tenant") {
        const [row] = await db.select().from(tenantSettingsTable).where(eq(tenantSettingsTable.id, id)).limit(1);
        if (!row) { sendNotFound(res, "Setting"); return; }
        if (!assertTenantAdminAccess(req, res, row.orgId)) return;
        await db.delete(tenantSettingsTable).where(eq(tenantSettingsTable.id, id));
        await writeAudit({ tier, settingId: id, namespace: row.namespace, key: row.key, orgId: row.orgId, actorId, action: "delete", oldValue: row.value, ipAddress: req.ip });
      } else {
        const [row] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.id, id)).limit(1);
        if (!row) { sendNotFound(res, "Setting"); return; }
        if (row.userId !== user.id && !user.roles.includes("super_admin")) {
          sendForbidden(res, "Cannot delete another user's settings");
          return;
        }
        await db.delete(userSettingsTable).where(eq(userSettingsTable.id, id));
        await writeAudit({ tier, settingId: id, namespace: row.namespace, key: row.key, orgId: row.orgId, userId: row.userId, actorId, action: "delete", oldValue: row.value, ipAddress: req.ip });
      }

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, "Failed to delete setting");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/settings/audit",
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const isAdmin = user.roles.includes("super_admin") || user.roles.includes("admin");

      const tier = req.query.tier as string | undefined;
      const namespace = req.query.namespace as string | undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
      const after = req.query.after ? new Date(req.query.after as string) : undefined;
      // Make `before` inclusive of the full selected day (23:59:59.999 UTC)
      let before: Date | undefined;
      if (req.query.before) {
        before = new Date(req.query.before as string);
        if (!isNaN(before.getTime())) {
          before.setUTCHours(23, 59, 59, 999);
        }
      }

      // Admins: optional orgId filter; non-admins: must resolve to a valid org
      let orgId: number | undefined;
      if (req.query.orgId) {
        const requested = parseInt(req.query.orgId as string, 10);
        if (isNaN(requested)) {
          sendBadRequest(res, "Invalid orgId");
          return;
        }
        if (!isAdmin && !assertTenantAccess(req, res, requested)) return;
        orgId = requested;
      } else if (!isAdmin) {
        const primaryOrgId = user.orgs[0]?.orgId;
        if (!primaryOrgId) {
          // Non-admin with no org: return empty rather than all-tenant data
          sendSuccess(res, []);
          return;
        }
        orgId = primaryOrgId;
      }

      // Final safety guard: non-admins must always have an orgId at this point
      if (!isAdmin && !orgId) {
        sendSuccess(res, []);
        return;
      }

      const conditions = [];
      if (tier && ["platform", "tenant", "user"].includes(tier)) {
        conditions.push(eq(settingsAuditLogTable.tier, tier as "platform" | "tenant" | "user"));
      }
      // Org scoping
      if (!isAdmin) {
        // Non-admins are restricted to their own org AND only their own authored changes
        conditions.push(eq(settingsAuditLogTable.orgId, orgId!));
        conditions.push(eq(settingsAuditLogTable.actorId, user.id));
      } else if (orgId) {
        conditions.push(eq(settingsAuditLogTable.orgId, orgId));
      }
      // Namespace prefix match (e.g. "aegis" matches "aegis.notifications")
      if (namespace) {
        conditions.push(like(settingsAuditLogTable.namespace, `${namespace}%`));
      }
      if (after && !isNaN(after.getTime())) {
        conditions.push(gte(settingsAuditLogTable.createdAt, after));
      }
      if (before && !isNaN(before.getTime())) {
        conditions.push(lte(settingsAuditLogTable.createdAt, before));
      }

      // Admins get full fields including actorEmail and ipAddress.
      // Non-admins only see their own entries and never receive sensitive fields.
      const rows = await db
        .select({
          id: settingsAuditLogTable.id,
          tier: settingsAuditLogTable.tier,
          settingId: settingsAuditLogTable.settingId,
          namespace: settingsAuditLogTable.namespace,
          key: settingsAuditLogTable.key,
          orgId: settingsAuditLogTable.orgId,
          userId: settingsAuditLogTable.userId,
          actorId: settingsAuditLogTable.actorId,
          action: settingsAuditLogTable.action,
          oldValue: settingsAuditLogTable.oldValue,
          newValue: settingsAuditLogTable.newValue,
          // ipAddress only returned to admins
          ...(isAdmin ? { ipAddress: settingsAuditLogTable.ipAddress } : {}),
          createdAt: settingsAuditLogTable.createdAt,
          actorName: usersTable.displayName,
          // actorEmail only returned to admins
          ...(isAdmin ? { actorEmail: usersTable.email } : {}),
        })
        .from(settingsAuditLogTable)
        .leftJoin(usersTable, eq(settingsAuditLogTable.actorId, usersTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(settingsAuditLogTable.createdAt))
        .limit(limit);

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch settings audit log");
    }
  },
);

export default router;
