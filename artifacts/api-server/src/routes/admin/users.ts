import type { IRouter } from "express";
import { db, usersTable, rolesTable, userRolesTable, auditEventsTable, exportJobsTable } from "@szl-holdings/db";
import { desc, sql, ilike, or, eq, and, inArray, gte, lte } from "drizzle-orm";
import { requireRole } from "../../middlewares/auth.js";
import { isFlagEnabled } from "../../lib/platform-flags.js";
import { z } from "zod";
import { validateBody } from "../../lib/validation.js";
import { sendError, sendNotFound, sendForbidden, sendBadRequest } from "../../lib/api-response.js";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.string().min(1),
});
const reasonSchema = z.object({ reason: z.string().max(2000).optional() });
const impersonateEndSchema = z.object({ impersonationToken: z.string().min(1) });

export function register(router: IRouter): void {
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

  router.get("/admin/audit-log", async (req, res) => {
    const enabled = await isFlagEnabled("internal_audit_console_enabled");
    if (!enabled) { sendForbidden(res, "Feature not available: internal_audit_console_enabled"); return; }
    try {
      const action = req.query["action"] as string | undefined;
      const search = req.query["search"] as string | undefined;
      const dateFrom = req.query["dateFrom"] as string | undefined;
      const dateTo = req.query["dateTo"] as string | undefined;
      const userFilter = req.query["user"] as string | undefined;
      const limitParam = parseInt(req.query["limit"] as string ?? "50", 10);
      const limit = Math.min(isNaN(limitParam) ? 50 : limitParam, 200);
      const conditions = [];
      if (dateFrom) conditions.push(gte(auditEventsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(auditEventsTable.createdAt, new Date(dateTo)));
      if (action) {
        conditions.push(ilike(auditEventsTable.action, `%${action}%`));
      } else if (search) {
        conditions.push(or(ilike(auditEventsTable.action, `%${search}%`), ilike(auditEventsTable.entityType, `%${search}%`), ilike(usersTable.email, `%${search}%`), ilike(usersTable.displayName, `%${search}%`))!);
      }
      if (userFilter) conditions.push(or(ilike(usersTable.email, `%${userFilter}%`), ilike(usersTable.displayName, `%${userFilter}%`))!);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select({ id: auditEventsTable.id, action: auditEventsTable.action, entityType: auditEventsTable.entityType, entityId: auditEventsTable.entityId, userId: auditEventsTable.userId, userName: usersTable.displayName, userEmail: usersTable.email, oldValues: auditEventsTable.oldValues, newValues: auditEventsTable.newValues, ipAddress: auditEventsTable.ipAddress, createdAt: auditEventsTable.createdAt }).from(auditEventsTable).leftJoin(usersTable, eq(auditEventsTable.userId, usersTable.id)).where(whereClause).orderBy(desc(auditEventsTable.createdAt)).limit(limit);
      const logs = rows.map((r) => ({ id: `log_${r.id}`, action: r.action, actor: r.userEmail ?? r.userName ?? `user_${r.userId}`, target: r.entityType + (r.entityId ? `/${r.entityId}` : ""), result: "success", timestamp: r.createdAt.toISOString(), details: r.newValues ? JSON.stringify(r.newValues).slice(0, 120) : null, ipAddress: r.ipAddress }));
      res.json({ logs, total: logs.length });
    } catch {
      sendError(res, "Failed to fetch audit log", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/export-history", async (req, res) => {
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
}
