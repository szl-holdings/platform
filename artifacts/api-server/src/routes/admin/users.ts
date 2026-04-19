import type { IRouter } from "express";
import { db, usersTable, rolesTable, userRolesTable, auditEventsTable, exportJobsTable, orgMembersTable, organizationsTable, type RoleName } from "@szl-holdings/db";
import { desc, sql, ilike, or, eq, and, inArray, gte, lte } from "drizzle-orm";
import { requireRole } from "../../middlewares/auth.js";
import { hashIp } from "@szl-holdings/audit";
import { isFlagEnabled } from "../../lib/platform-flags.js";
import { revokeUserSessionsOnRoleChange } from "../../middlewares/session-policy.js";
import { z } from "zod";
import { validateBody, validateQuery, listQuerySchema, jsonObjectBodySchema } from "../../lib/validation.js";
import { sendError, sendNotFound, sendForbidden, sendBadRequest } from "../../lib/api-response.js";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.string().min(1),
});
const reasonSchema = z.object({ reason: z.string().max(2000).optional() });
const impersonateEndSchema = z.object({ impersonationToken: z.string().min(1) });
const roleAssignSchema = z.object({
  roleId: z.number().int().positive(),
  action: z.enum(["add", "remove"]),
});
const deactivateSchema = z.object({
  active: z.boolean(),
});
const assignRolesSchema = z.object({
  roles: z.array(z.string().min(1)).min(1, "At least one role required"),
  reason: z.string().max(2000).optional(),
});

export function register(router: IRouter): void {
  router.get("/admin/roles", async (_req, res) => {
    try {
      const roles = await db.select({ id: rolesTable.id, name: rolesTable.name, description: rolesTable.description }).from(rolesTable).orderBy(rolesTable.name);
      res.json({ roles });
    } catch {
      sendError(res, "Failed to fetch roles", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/users/:id/detail", async (req, res) => {
    try {
      const userId = parseInt(req.params["id"] as string, 10);
      if (isNaN(userId) || userId < 1) { sendBadRequest(res, "Invalid user ID"); return; }
      const [user] = await db.select({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl, isActive: usersTable.isActive, lastLoginAt: usersTable.lastLoginAt, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, userId));
      if (!user) { sendNotFound(res, "User not found"); return; }
      const roleRows = await db.select({ id: rolesTable.id, name: rolesTable.name }).from(userRolesTable).innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id)).where(eq(userRolesTable.userId, userId));
      const orgRows = await db.select({ id: organizationsTable.id, name: organizationsTable.name, slug: organizationsTable.slug, role: orgMembersTable.role }).from(orgMembersTable).innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id)).where(eq(orgMembersTable.userId, userId));
      res.json({ ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() ?? null, roles: roleRows, organizations: orgRows });
    } catch {
      sendError(res, "Failed to fetch user detail", 500, "INTERNAL_ERROR");
    }
  });

  router.patch("/admin/users/:id/deactivate", validateBody(deactivateSchema), async (req, res) => {
    try {
      const userId = parseInt(req.params["id"] as string, 10);
      if (isNaN(userId) || userId < 1) { sendBadRequest(res, "Invalid user ID"); return; }
      const { active } = req.body as z.infer<typeof deactivateSchema>;
      const [updated] = await db.update(usersTable).set({ isActive: active, updatedAt: new Date() }).where(eq(usersTable.id, userId)).returning({ id: usersTable.id, isActive: usersTable.isActive });
      if (!updated) { sendNotFound(res, "User not found"); return; }
      await db.insert(auditEventsTable).values({ userId: req.user?.id ?? null, action: active ? "user.activated" : "user.deactivated", entityType: "user", entityId: String(userId), newValues: { active }, ipAddress: hashIp(req.ip ?? null), userAgent: req.headers["user-agent"] ?? null });
      res.json({ id: updated.id, isActive: updated.isActive });
    } catch {
      sendError(res, "Failed to update user status", 500, "INTERNAL_ERROR");
    }
  });

  router.patch("/admin/users/:id/role", validateBody(roleAssignSchema), async (req, res) => {
    try {
      const userId = parseInt(req.params["id"] as string, 10);
      if (isNaN(userId) || userId < 1) { sendBadRequest(res, "Invalid user ID"); return; }
      const { roleId, action } = req.body as z.infer<typeof roleAssignSchema>;
      const [role] = await db.select({ id: rolesTable.id, name: rolesTable.name }).from(rolesTable).where(eq(rolesTable.id, roleId));
      if (!role) { sendNotFound(res, "Role not found"); return; }
      const [targetUser] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
      if (!targetUser) { sendNotFound(res, "User not found"); return; }
      if (action === "add") {
        await db.insert(userRolesTable).values({ userId, roleId }).onConflictDoNothing();
      } else {
        await db.delete(userRolesTable).where(and(eq(userRolesTable.userId, userId), eq(userRolesTable.roleId, roleId)));
      }
      await db.insert(auditEventsTable).values({ userId: req.user?.id ?? null, action: action === "add" ? "user.role.assigned" : "user.role.removed", entityType: "user", entityId: String(userId), newValues: { roleName: role.name, roleId, targetUserEmail: targetUser.email, action }, ipAddress: hashIp(req.ip ?? null), userAgent: req.headers["user-agent"] ?? null });
      // Permission set changed — invalidate the target user's existing
      // sessions so the new role takes effect on the next request (≤30s).
      await revokeUserSessionsOnRoleChange({
        userId,
        changedByUserId: req.user?.id ?? null,
        reason: action === "add" ? "admin_role_added" : "admin_role_removed",
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      res.json({ ok: true, userId, roleId, roleName: role.name, action });
    } catch {
      sendError(res, "Failed to update user role", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/users", async (_req, res) => {
    try {
      const users = await db.select({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl, isActive: usersTable.isActive, lastLoginAt: usersTable.lastLoginAt, createdAt: usersTable.createdAt }).from(usersTable).orderBy(desc(usersTable.createdAt));
      const userIds = users.map((u) => u.id);
      const roleRows = userIds.length > 0
        ? await db.select({ userId: userRolesTable.userId, roleName: rolesTable.name }).from(userRolesTable).innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id)).where(inArray(userRolesTable.userId, userIds))
        : [];
      const roleMap = new Map<number, string[]>();
      for (const r of roleRows) {
        const existing = roleMap.get(r.userId) ?? [];
        existing.push(r.roleName);
        roleMap.set(r.userId, existing);
      }
      const enriched = users.map((u) => ({ id: `usr_${u.id}`, email: u.email, name: u.displayName, roles: roleMap.get(u.id) ?? [], role: (roleMap.get(u.id) ?? ["viewer"])[0] ?? "viewer", status: u.isActive ? "active" : "inactive", lastLogin: u.lastLoginAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString() }));
      res.json({ users: enriched, total: enriched.length });
    } catch {
      sendError(res, "Failed to fetch users", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/users", validateBody(createUserSchema), (req, res) => {
    const { email, name, role } = req.body as z.infer<typeof createUserSchema>;
    const newUser = { id: `usr_${Date.now()}`, email, name, role: role ?? "viewer", status: "active", lastLogin: null };
    res.status(201).json(newUser);
  });

  router.get("/admin/audit-log", validateQuery(listQuerySchema), async (req, res) => {
    const enabled = await isFlagEnabled("internal_audit_console_enabled");
    if (!enabled) { sendForbidden(res, "Feature not available: internal_audit_console_enabled"); return; }
    try {
      const action = req.query["action"] as string | undefined;
      const search = req.query["search"] as string | undefined;
      const dateFrom = req.query["dateFrom"] as string | undefined;
      const dateTo = req.query["dateTo"] as string | undefined;
      const userFilter = req.query["user"] as string | undefined;
      const orgIdParam = req.query["orgId"] as string | undefined;
      const format = req.query["format"] as string | undefined;
      const limitParam = parseInt(req.query["limit"] as string ?? "50", 10);
      const limit = format === "csv" ? 10000 : Math.min(isNaN(limitParam) ? 50 : limitParam, 200);

      // If filtering by tenant/org, resolve the set of member user IDs first
      let orgMemberUserIds: number[] | null = null;
      if (orgIdParam) {
        const orgId = parseInt(orgIdParam, 10);
        if (isNaN(orgId) || orgId < 1) {
          sendBadRequest(res, "Invalid orgId — must be a positive integer");
          return;
        }
        const members = await db
          .select({ userId: orgMembersTable.userId })
          .from(orgMembersTable)
          .where(eq(orgMembersTable.orgId, orgId));
        orgMemberUserIds = members.map((m) => m.userId);
      }

      const conditions = [];
      if (dateFrom) conditions.push(gte(auditEventsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(auditEventsTable.createdAt, new Date(dateTo)));
      if (action) {
        conditions.push(ilike(auditEventsTable.action, `%${action}%`));
      } else if (search) {
        conditions.push(or(ilike(auditEventsTable.action, `%${search}%`), ilike(auditEventsTable.entityType, `%${search}%`), ilike(usersTable.email, `%${search}%`), ilike(usersTable.displayName, `%${search}%`))!);
      }
      if (userFilter) conditions.push(or(ilike(usersTable.email, `%${userFilter}%`), ilike(usersTable.displayName, `%${userFilter}%`))!);
      // Filter to only events from members of the selected org
      if (orgMemberUserIds !== null) {
        if (orgMemberUserIds.length === 0) {
          // Org exists but has no members — return empty result
          if (format === "csv") {
            const toCsvCell = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", 'attachment; filename="audit-log.csv"');
            res.send(["ID", "Action", "Actor", "Target", "Result", "IP Address", "Timestamp", "Details"].map(toCsvCell).join(","));
            return;
          }
          res.json({ logs: [], total: 0 });
          return;
        }
        conditions.push(inArray(auditEventsTable.userId, orgMemberUserIds));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select({ id: auditEventsTable.id, action: auditEventsTable.action, entityType: auditEventsTable.entityType, entityId: auditEventsTable.entityId, userId: auditEventsTable.userId, userName: usersTable.displayName, userEmail: usersTable.email, oldValues: auditEventsTable.oldValues, newValues: auditEventsTable.newValues, ipAddress: auditEventsTable.ipAddress, createdAt: auditEventsTable.createdAt }).from(auditEventsTable).leftJoin(usersTable, eq(auditEventsTable.userId, usersTable.id)).where(whereClause).orderBy(desc(auditEventsTable.createdAt)).limit(limit);
      const logs = rows.map((r) => ({ id: `log_${r.id}`, action: r.action, actor: r.userEmail ?? r.userName ?? `user_${r.userId}`, target: r.entityType + (r.entityId ? `/${r.entityId}` : ""), result: "success", timestamp: r.createdAt.toISOString(), details: r.newValues ? JSON.stringify(r.newValues).slice(0, 500) : null, ipAddress: r.ipAddress }));
      if (format === "csv") {
        const toCsvCell = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const header = ["ID", "Action", "Actor", "Target", "Result", "IP Address", "Timestamp", "Details"].map(toCsvCell).join(",");
        const body = logs.map((l) => [l.id, l.action, l.actor, l.target, l.result, l.ipAddress ?? "", l.timestamp, l.details ?? ""].map(toCsvCell).join(","));
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="audit-log.csv"');
        res.send([header, ...body].join("\r\n"));
        return;
      }
      res.json({ logs, total: logs.length });
    } catch {
      sendError(res, "Failed to fetch audit log", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/export-history", validateQuery(listQuerySchema), async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query["page"] as string ?? "1", 10));
      const limit = Math.min(parseInt(req.query["limit"] as string ?? "50", 10), 200);
      const offset = (page - 1) * limit;
      const rows = await db.select({ id: exportJobsTable.id, exportId: exportJobsTable.exportId, name: exportJobsTable.name, dataSource: exportJobsTable.dataSource, format: exportJobsTable.format, status: exportJobsTable.status, rowCount: exportJobsTable.rowCount, fileSizeBytes: exportJobsTable.fileSizeBytes, downloadToken: exportJobsTable.downloadToken, expiresAt: exportJobsTable.expiresAt, errorMessage: exportJobsTable.errorMessage, scheduleFrequency: exportJobsTable.scheduleFrequency, filterParams: exportJobsTable.filterParams, triggeredByEmail: exportJobsTable.triggeredByEmail, triggeredByName: usersTable.displayName, completedAt: exportJobsTable.completedAt, createdAt: exportJobsTable.createdAt }).from(exportJobsTable).leftJoin(usersTable, eq(exportJobsTable.triggeredByUserId, usersTable.id)).orderBy(desc(exportJobsTable.createdAt)).limit(limit).offset(offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(exportJobsTable);
      res.json({ exports: rows, total: count, page, limit });
    } catch {
      sendError(res, "Failed to fetch export history", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/impersonate/:userId", requireRole("admin"), validateBody(reasonSchema), async (req, res) => {
    try {
      const { startImpersonation } = await import("../../middlewares/session-policy.js");
      const targetUserId = parseInt(req.params["userId"] as string, 10);
      if (isNaN(targetUserId) || targetUserId < 1) { sendBadRequest(res, "Invalid user ID"); return; }
      const { reason } = req.body as z.infer<typeof reasonSchema>;
      const result = await startImpersonation({ impersonatorId: req.user!.id, targetUserId, ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null, reason });
      res.status(200).json({ token: result.token, expiresAt: result.expiresAt, message: "Impersonation session started. Use the token as a Bearer token." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start impersonation";
      sendForbidden(res, message);
    }
  });

  router.post("/admin/impersonate/end", requireRole("admin"), validateBody(impersonateEndSchema), async (req, res) => {
    try {
      const { endImpersonation } = await import("../../middlewares/session-policy.js");
      const { impersonationToken } = req.body as z.infer<typeof impersonateEndSchema>;
      await endImpersonation({ impersonatorId: req.user!.id, impersonationToken, ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null });
      res.status(200).json({ message: "Impersonation session ended" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to end impersonation";
      if (message.includes("Not authorized")) { sendForbidden(res, message); } else { sendBadRequest(res, message); }
    }
  });

  router.post("/admin/users/:id/revoke-sessions", requireRole("admin"), validateBody(jsonObjectBodySchema), async (req, res) => {
    try {
      const targetUserId = parseInt(req.params["id"] as string, 10);
      if (isNaN(targetUserId) || targetUserId < 1) { sendBadRequest(res, "Invalid user ID"); return; }
      const [targetUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, targetUserId)).limit(1);
      if (!targetUser) { sendNotFound(res, "User not found"); return; }
      const { revokedCount } = await revokeUserSessionsOnRoleChange({
        userId: targetUserId,
        changedByUserId: req.user?.id ?? null,
        reason: "admin_force_logout",
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      res.status(200).json({ userId: targetUserId, revokedSessionCount: revokedCount, message: "Sessions revoked" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to revoke sessions";
      sendError(res, message, 500, "INTERNAL_ERROR");
    }
  });

  router.delete("/admin/sessions/:userId", requireRole("admin"), validateBody(reasonSchema), async (req, res) => {
    try {
      const { forceTerminateUserSessions } = await import("../../middlewares/session-policy.js");
      const targetUserId = parseInt(req.params["userId"] as string, 10);
      if (isNaN(targetUserId) || targetUserId < 1) { sendBadRequest(res, "Invalid user ID"); return; }
      const { reason } = req.body as z.infer<typeof reasonSchema>;
      const result = await forceTerminateUserSessions({ adminUserId: req.user!.id, targetUserId, ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null, reason });
      res.status(200).json({ deletedCount: result.deletedCount, message: "Sessions terminated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to terminate sessions";
      sendError(res, message, 500, "INTERNAL_ERROR");
    }
  });

  router.put("/admin/users/:userId/roles", requireRole("super_admin"), validateBody(assignRolesSchema), async (req, res) => {
    try {
      const targetUserId = parseInt(req.params["userId"] as string, 10);
      if (isNaN(targetUserId) || targetUserId < 1) { sendBadRequest(res, "Invalid user ID"); return; }

      if (targetUserId === req.user!.id) {
        sendForbidden(res, "Cannot modify your own roles");
        return;
      }

      const [targetUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, targetUserId)).limit(1);
      if (!targetUser) { sendNotFound(res, "User"); return; }

      const { roles, reason } = req.body as z.infer<typeof assignRolesSchema>;

      const roleRows = await db.select().from(rolesTable).where(inArray(rolesTable.name, roles as RoleName[]));
      if (roleRows.length !== roles.length) {
        const foundNames = roleRows.map((r) => r.name as string);
        const invalid = (roles as string[]).filter((r) => !foundNames.includes(r));
        sendBadRequest(res, `Unknown role(s): ${invalid.join(", ")}`);
        return;
      }

      await db.transaction(async (tx) => {
        await tx.delete(userRolesTable).where(eq(userRolesTable.userId, targetUserId));
        for (const role of roleRows) {
          await tx.insert(userRolesTable).values({ userId: targetUserId, roleId: role.id }).onConflictDoNothing();
        }
        await tx.insert(auditEventsTable).values({
          userId: req.user!.id,
          action: "admin_role_assignment",
          entityType: "user",
          entityId: String(targetUserId),
          ipAddress: hashIp(req.ip ?? null),
          userAgent: req.headers["user-agent"] ?? null,
          newValues: { targetUserId, roles, reason: reason ?? "admin_role_assignment", assignedBy: req.user!.id },
        });
      });

      const { revokedCount } = await revokeUserSessionsOnRoleChange({
        userId: targetUserId,
        changedByUserId: req.user!.id,
        reason: reason ?? "admin_role_assignment",
        ipAddress: req.ip ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });

      res.status(200).json({
        userId: targetUserId,
        roles,
        revokedSessionCount: revokedCount,
        message: "Roles updated and existing sessions revoked",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update roles";
      sendError(res, message, 500, "INTERNAL_ERROR");
    }
  });
}
