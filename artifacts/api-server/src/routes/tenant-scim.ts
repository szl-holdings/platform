import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { db } from "@szl-holdings/db";
import { azureTenantsTable, scimTokensTable, scimProvisionedUsersTable, scimSyncLogsTable, usersTable } from "@szl-holdings/db";
import { eq, desc, and } from "drizzle-orm";
import { tenantRateLimit } from "./tenant-core";

const router: IRouter = Router();

router.post("/admin/tenants/:id/scim/tokens", tenantRateLimit, authMiddleware(), requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }
    const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    const label = String(req.body?.label ?? "default").trim().slice(0, 64);
    const expiresInDays = req.body?.expiresInDays ? parseInt(req.body.expiresInDays, 10) : null;
    const expiresAt = expiresInDays && expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86400 * 1000) : null;
    const rawToken = `scim_${crypto.randomBytes(32).toString("hex")}`;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenPrefix = rawToken.slice(0, 12);
    const [token] = await db.insert(scimTokensTable).values({ tenantId: id, tokenHash, tokenPrefix, label, isActive: true, expiresAt, createdByUserId: req.user?.id ?? null }).returning();
    sendSuccess(res, { message: "SCIM bearer token created. Store the token securely — it will not be shown again.", token: { id: token!.id, label: token!.label, tokenPrefix, expiresAt: token!.expiresAt, createdAt: token!.createdAt }, rawToken, usage: { header: `Authorization: Bearer ${rawToken}`, baseUrl: `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}/api/scim/v2` } });
  } catch (err) { handleRouteError(res, err, "Failed to create SCIM token"); }
});

router.get("/admin/tenants/:id/scim/tokens", tenantRateLimit, authMiddleware(), requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }
    const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    const tokens = await db.select({ id: scimTokensTable.id, label: scimTokensTable.label, tokenPrefix: scimTokensTable.tokenPrefix, isActive: scimTokensTable.isActive, lastUsedAt: scimTokensTable.lastUsedAt, expiresAt: scimTokensTable.expiresAt, createdAt: scimTokensTable.createdAt }).from(scimTokensTable).where(eq(scimTokensTable.tenantId, id)).orderBy(desc(scimTokensTable.createdAt));
    sendSuccess(res, { tenantId: tenant.azureTenantId, tenantName: tenant.displayName, count: tokens.length, tokens });
  } catch (err) { handleRouteError(res, err, "Failed to list SCIM tokens"); }
});

router.delete("/admin/tenants/:id/scim/tokens/:tokenId", tenantRateLimit, authMiddleware(), requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const tokenId = parseInt(String(req.params.tokenId), 10);
    if (isNaN(id) || isNaN(tokenId)) { sendBadRequest(res, "Invalid ID"); return; }
    const [token] = await db.select().from(scimTokensTable).where(and(eq(scimTokensTable.id, tokenId), eq(scimTokensTable.tenantId, id))).limit(1);
    if (!token) { res.status(404).json({ error: "Token not found" }); return; }
    await db.update(scimTokensTable).set({ isActive: false, updatedAt: new Date() }).where(eq(scimTokensTable.id, tokenId));
    sendSuccess(res, { message: "SCIM token revoked", tokenId, label: token.label });
  } catch (err) { handleRouteError(res, err, "Failed to revoke SCIM token"); }
});

router.get("/admin/tenants/:id/scim/provisioned-users", tenantRateLimit, authMiddleware(), requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }
    const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    const provisionedUsers = await db.select({ id: scimProvisionedUsersTable.id, userId: scimProvisionedUsersTable.userId, externalId: scimProvisionedUsersTable.externalId, scimUserName: scimProvisionedUsersTable.scimUserName, active: scimProvisionedUsersTable.active, provisionedRole: scimProvisionedUsersTable.provisionedRole, lastSyncAt: scimProvisionedUsersTable.lastSyncAt, createdAt: scimProvisionedUsersTable.createdAt, updatedAt: scimProvisionedUsersTable.updatedAt, displayName: usersTable.displayName, email: usersTable.email, isActive: usersTable.isActive }).from(scimProvisionedUsersTable).innerJoin(usersTable, eq(scimProvisionedUsersTable.userId, usersTable.id)).where(eq(scimProvisionedUsersTable.tenantId, id)).orderBy(desc(scimProvisionedUsersTable.createdAt));
    const latestTokenRow = await db.select({ lastUsedAt: scimTokensTable.lastUsedAt }).from(scimTokensTable).where(and(eq(scimTokensTable.tenantId, id), eq(scimTokensTable.isActive, true))).orderBy(desc(scimTokensTable.lastUsedAt)).limit(1);
    const recentErrors = await db.select().from(scimSyncLogsTable).where(and(eq(scimSyncLogsTable.tenantId, id), eq(scimSyncLogsTable.status, "error"))).orderBy(desc(scimSyncLogsTable.createdAt)).limit(20);
    const recentActivity = await db.select().from(scimSyncLogsTable).where(eq(scimSyncLogsTable.tenantId, id)).orderBy(desc(scimSyncLogsTable.createdAt)).limit(50);
    const lastSyncAt = provisionedUsers.reduce<Date | null>((latest, u) => { if (!u.lastSyncAt) return latest; if (!latest || u.lastSyncAt > latest) return u.lastSyncAt; return latest; }, null);
    sendSuccess(res, { tenantId: tenant.azureTenantId, tenantName: tenant.displayName, scim: { enabled: true, lastSyncAt: lastSyncAt?.toISOString() ?? null, lastTokenUsedAt: latestTokenRow[0]?.lastUsedAt?.toISOString() ?? null, provisionedUsersCount: provisionedUsers.length, activeUsersCount: provisionedUsers.filter((u) => u.active).length, inactiveUsersCount: provisionedUsers.filter((u) => !u.active).length, errorCount: recentErrors.length }, provisionedUsers: provisionedUsers.map((u) => ({ id: u.id, userId: u.userId, displayName: u.displayName, email: u.email, scimUserName: u.scimUserName, externalId: u.externalId, active: u.active, provisionedRole: u.provisionedRole, lastSyncAt: u.lastSyncAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })), errorLog: recentErrors.map((e) => ({ id: e.id, operation: e.operation, resourceType: e.resourceType, errorMessage: e.errorMessage, externalId: e.externalId, createdAt: e.createdAt.toISOString() })), recentActivity: recentActivity.map((a) => ({ id: a.id, operation: a.operation, resourceType: a.resourceType, status: a.status, externalId: a.externalId, errorMessage: a.errorMessage, createdAt: a.createdAt.toISOString() })) });
  } catch (err) { handleRouteError(res, err, "Failed to get SCIM provisioned users"); }
});

router.post("/admin/tenants/:id/scim/sync", tenantRateLimit, authMiddleware(), requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }
    const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    const provisionedUsers = await db.select({ id: scimProvisionedUsersTable.id, userId: scimProvisionedUsersTable.userId, active: scimProvisionedUsersTable.active, isActive: usersTable.isActive }).from(scimProvisionedUsersTable).innerJoin(usersTable, eq(scimProvisionedUsersTable.userId, usersTable.id)).where(eq(scimProvisionedUsersTable.tenantId, id));
    let synced = 0;
    for (const u of provisionedUsers) {
      const inSync = u.active === u.isActive;
      if (!inSync) { await db.update(scimProvisionedUsersTable).set({ active: u.isActive, lastSyncAt: new Date(), updatedAt: new Date() }).where(eq(scimProvisionedUsersTable.id, u.id)); synced++; }
      else { await db.update(scimProvisionedUsersTable).set({ lastSyncAt: new Date(), updatedAt: new Date() }).where(eq(scimProvisionedUsersTable.id, u.id)); }
    }
    sendSuccess(res, { message: "Manual SCIM sync completed", tenantId: tenant.azureTenantId, tenantName: tenant.displayName, totalUsers: provisionedUsers.length, syncedUsers: synced, syncedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to run manual SCIM sync"); }
});

export default router;
