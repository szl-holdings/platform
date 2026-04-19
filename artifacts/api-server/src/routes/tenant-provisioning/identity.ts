import { z } from "zod";
import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { sendSuccess, sendBadRequest, sendNotFound, sendForbidden, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { logActivity } from "../../lib/activity-logger";
import { scimSyncSchema, scimTokenCreateSchema, scimTokenRevokeSchema, tenantBrandingResetSchema, tenantBrandingUpdateSchema, tenantCreateSchema, tenantStatusSchema, validateBody } from "../../lib/validation";
import { db } from "@szl-holdings/db";
import {
  azureTenantsTable,
  auditLogsTable,
  dataverseConnectionsTable,
  orgMembersTable,
  usersTable,
  scimTokensTable,
  scimProvisionedUsersTable,
  scimSyncLogsTable,
  tenantBrandingTable,
  type InsertAzureTenant,
  type InsertDataverseConnection,
  type InsertTenantBranding,
} from "@szl-holdings/db";
import { eq, desc, and, count, sql, inArray } from "drizzle-orm";
import { services } from "@szl-holdings/services";
import { encryptSecret, decryptSecret } from "../../lib/crypto";
import { tenantRateLimit } from "./shared";

const router: IRouter = Router();

// ─── SCIM Token Management ────────────────────────────────────────────────────

router.post(
  "/admin/tenants/:id/scim/tokens",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  validateBody(scimTokenCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { sendNotFound(res, "Tenant"); return; }

      const label = String(req.body?.label ?? "default").trim().slice(0, 64);
      const expiresInDays = req.body?.expiresInDays ? parseInt(req.body.expiresInDays, 10) : null;
      const expiresAt = expiresInDays && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 86400 * 1000)
        : null;

      const rawToken = `scim_${crypto.randomBytes(32).toString("hex")}`;
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const tokenPrefix = rawToken.slice(0, 12);

      const [token] = await db.insert(scimTokensTable).values({
        tenantId: id,
        tokenHash,
        tokenPrefix,
        label,
        isActive: true,
        expiresAt,
        createdByUserId: req.user?.id ?? null,
      }).returning();

      sendSuccess(res, {
        message: "SCIM bearer token created. Store the token securely — it will not be shown again.",
        token: {
          id: token!.id,
          label: token!.label,
          tokenPrefix,
          expiresAt: token!.expiresAt,
          createdAt: token!.createdAt,
        },
        rawToken,
        usage: {
          header: `Authorization: Bearer ${rawToken}`,
          baseUrl: `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}/api/scim/v2`,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create SCIM token");
    }
  },
);

router.get(
  "/admin/tenants/:id/scim/tokens",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { sendNotFound(res, "Tenant"); return; }

      const tokens = await db
        .select({
          id: scimTokensTable.id,
          label: scimTokensTable.label,
          tokenPrefix: scimTokensTable.tokenPrefix,
          isActive: scimTokensTable.isActive,
          lastUsedAt: scimTokensTable.lastUsedAt,
          expiresAt: scimTokensTable.expiresAt,
          createdAt: scimTokensTable.createdAt,
        })
        .from(scimTokensTable)
        .where(eq(scimTokensTable.tenantId, id))
        .orderBy(desc(scimTokensTable.createdAt));

      sendSuccess(res, {
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        count: tokens.length,
        tokens,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list SCIM tokens");
    }
  },
);

router.delete(
  "/admin/tenants/:id/scim/tokens/:tokenId", validateBody(scimTokenRevokeSchema),
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const tokenId = parseInt(String(req.params.tokenId), 10);
      if (isNaN(id) || isNaN(tokenId)) { sendBadRequest(res, "Invalid ID"); return; }

      const [token] = await db
        .select()
        .from(scimTokensTable)
        .where(and(eq(scimTokensTable.id, tokenId), eq(scimTokensTable.tenantId, id)))
        .limit(1);

      if (!token) { sendNotFound(res, "Token"); return; }

      await db.update(scimTokensTable).set({ isActive: false, updatedAt: new Date() }).where(eq(scimTokensTable.id, tokenId));

      sendSuccess(res, { message: "SCIM token revoked", tokenId, label: token.label });
    } catch (err) {
      handleRouteError(res, err, "Failed to revoke SCIM token");
    }
  },
);

// ─── SCIM Admin Dashboard Data ────────────────────────────────────────────────

router.get(
  "/admin/tenants/:id/scim/provisioned-users",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { sendNotFound(res, "Tenant"); return; }

      const provisionedUsers = await db
        .select({
          id: scimProvisionedUsersTable.id,
          userId: scimProvisionedUsersTable.userId,
          externalId: scimProvisionedUsersTable.externalId,
          scimUserName: scimProvisionedUsersTable.scimUserName,
          active: scimProvisionedUsersTable.active,
          provisionedRole: scimProvisionedUsersTable.provisionedRole,
          lastSyncAt: scimProvisionedUsersTable.lastSyncAt,
          createdAt: scimProvisionedUsersTable.createdAt,
          updatedAt: scimProvisionedUsersTable.updatedAt,
          displayName: usersTable.displayName,
          email: usersTable.email,
          isActive: usersTable.isActive,
        })
        .from(scimProvisionedUsersTable)
        .innerJoin(usersTable, eq(scimProvisionedUsersTable.userId, usersTable.id))
        .where(eq(scimProvisionedUsersTable.tenantId, id))
        .orderBy(desc(scimProvisionedUsersTable.createdAt));

      const latestTokenRow = await db
        .select({ lastUsedAt: scimTokensTable.lastUsedAt })
        .from(scimTokensTable)
        .where(and(eq(scimTokensTable.tenantId, id), eq(scimTokensTable.isActive, true)))
        .orderBy(desc(scimTokensTable.lastUsedAt))
        .limit(1);

      const recentErrors = await db
        .select()
        .from(scimSyncLogsTable)
        .where(and(eq(scimSyncLogsTable.tenantId, id), eq(scimSyncLogsTable.status, "error")))
        .orderBy(desc(scimSyncLogsTable.createdAt))
        .limit(20);

      const recentActivity = await db
        .select()
        .from(scimSyncLogsTable)
        .where(eq(scimSyncLogsTable.tenantId, id))
        .orderBy(desc(scimSyncLogsTable.createdAt))
        .limit(50);

      const lastSyncAt = provisionedUsers.reduce<Date | null>((latest, u) => {
        if (!u.lastSyncAt) return latest;
        if (!latest || u.lastSyncAt > latest) return u.lastSyncAt;
        return latest;
      }, null);

      sendSuccess(res, {
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        scim: {
          enabled: true,
          lastSyncAt: lastSyncAt?.toISOString() ?? null,
          lastTokenUsedAt: latestTokenRow[0]?.lastUsedAt?.toISOString() ?? null,
          provisionedUsersCount: provisionedUsers.length,
          activeUsersCount: provisionedUsers.filter((u) => u.active).length,
          inactiveUsersCount: provisionedUsers.filter((u) => !u.active).length,
          errorCount: recentErrors.length,
        },
        provisionedUsers: provisionedUsers.map((u) => ({
          id: u.id,
          userId: u.userId,
          displayName: u.displayName,
          email: u.email,
          scimUserName: u.scimUserName,
          externalId: u.externalId,
          active: u.active,
          provisionedRole: u.provisionedRole,
          lastSyncAt: u.lastSyncAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        errorLog: recentErrors.map((e) => ({
          id: e.id,
          operation: e.operation,
          resourceType: e.resourceType,
          errorMessage: e.errorMessage,
          externalId: e.externalId,
          createdAt: e.createdAt.toISOString(),
        })),
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          operation: a.operation,
          resourceType: a.resourceType,
          status: a.status,
          externalId: a.externalId,
          errorMessage: a.errorMessage,
          createdAt: a.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get SCIM provisioned users");
    }
  },
);

router.post(
  "/admin/tenants/:id/scim/sync",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  validateBody(scimSyncSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { sendNotFound(res, "Tenant"); return; }

      const provisionedUsers = await db
        .select({
          id: scimProvisionedUsersTable.id,
          userId: scimProvisionedUsersTable.userId,
          active: scimProvisionedUsersTable.active,
          isActive: usersTable.isActive,
        })
        .from(scimProvisionedUsersTable)
        .innerJoin(usersTable, eq(scimProvisionedUsersTable.userId, usersTable.id))
        .where(eq(scimProvisionedUsersTable.tenantId, id));

      let synced = 0;
      for (const u of provisionedUsers) {
        const inSync = u.active === u.isActive;
        if (!inSync) {
          await db.update(scimProvisionedUsersTable)
            .set({ active: u.isActive, lastSyncAt: new Date(), updatedAt: new Date() })
            .where(eq(scimProvisionedUsersTable.id, u.id));
          synced++;
        } else {
          await db.update(scimProvisionedUsersTable)
            .set({ lastSyncAt: new Date(), updatedAt: new Date() })
            .where(eq(scimProvisionedUsersTable.id, u.id));
        }
      }

      sendSuccess(res, {
        message: "Manual SCIM sync completed",
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        totalUsers: provisionedUsers.length,
        syncedUsers: synced,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to run manual SCIM sync");
    }
  },
);

// ─── Tenant Branding Routes ───────────────────────────────────────────────────

router.get(
  "/admin/tenants/:id/branding",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { sendNotFound(res, "Tenant"); return; }

      const [branding] = await db.select().from(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, id)).limit(1);

      sendSuccess(res, { branding: branding ?? null });
    } catch (err) {
      handleRouteError(res, err, "Failed to get tenant branding");
    }
  },
);

router.put(
  "/admin/tenants/:id/branding",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  validateBody(tenantBrandingUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { sendNotFound(res, "Tenant"); return; }

      const body = req.body ?? {};

      const brandingData: Partial<InsertTenantBranding> = {
        tenantId: id,
        companyName: body.companyName !== undefined ? String(body.companyName || "").trim() || null : undefined,
        tagline: body.tagline !== undefined ? String(body.tagline || "").trim() || null : undefined,
        logoUrl: body.logoUrl !== undefined ? String(body.logoUrl || "").trim() || null : undefined,
        faviconUrl: body.faviconUrl !== undefined ? String(body.faviconUrl || "").trim() || null : undefined,
        primaryColor: body.primaryColor !== undefined ? String(body.primaryColor || "").trim() || null : undefined,
        accentColor: body.accentColor !== undefined ? String(body.accentColor || "").trim() || null : undefined,
        sidebarHeaderText: body.sidebarHeaderText !== undefined ? String(body.sidebarHeaderText || "").trim() || null : undefined,
        customDomainLabel: body.customDomainLabel !== undefined ? String(body.customDomainLabel || "").trim() || null : undefined,
        emailFromName: body.emailFromName !== undefined ? String(body.emailFromName || "").trim() || null : undefined,
        emailFooterText: body.emailFooterText !== undefined ? String(body.emailFooterText || "").trim() || null : undefined,
      };

      Object.keys(brandingData).forEach((k) => {
        const key = k as keyof typeof brandingData;
        if (brandingData[key] === undefined) delete brandingData[key];
      });

      const [existing] = await db.select({ id: tenantBrandingTable.id }).from(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, id)).limit(1);

      let branding;
      if (existing) {
        [branding] = await db
          .update(tenantBrandingTable)
          .set({ ...brandingData, updatedAt: new Date() })
          .where(eq(tenantBrandingTable.tenantId, id))
          .returning();
      } else {
        [branding] = await db
          .insert(tenantBrandingTable)
          .values({ tenantId: id, ...brandingData })
          .returning();
      }

      sendSuccess(res, { branding, message: "Tenant branding saved" });
    } catch (err) {
      handleRouteError(res, err, "Failed to save tenant branding");
    }
  },
);

router.delete(
  "/admin/tenants/:id/branding", validateBody(tenantBrandingResetSchema),
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      await db.delete(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, id));

      sendSuccess(res, { message: "Tenant branding reset to defaults" });
    } catch (err) {
      handleRouteError(res, err, "Failed to reset tenant branding");
    }
  },
);

router.get(
  "/tenant-branding/:azureTenantId",
  tenantRateLimit,
  async (req: Request, res: Response) => {
    try {
      const azureTenantId = String(req.params.azureTenantId);
      if (!azureTenantId) { sendBadRequest(res, "azureTenantId is required"); return; }

      const [tenant] = await db
        .select({ id: azureTenantsTable.id, displayName: azureTenantsTable.displayName, status: azureTenantsTable.status })
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.azureTenantId, azureTenantId))
        .limit(1);

      if (!tenant || tenant.status !== "active") {
        sendSuccess(res, { branding: null });
        return;
      }

      const [branding] = await db
        .select()
        .from(tenantBrandingTable)
        .where(eq(tenantBrandingTable.tenantId, tenant.id))
        .limit(1);

      sendSuccess(res, { branding: branding ?? null });
    } catch (err) {
      handleRouteError(res, err, "Failed to get tenant branding");
    }
  },
);



export function register(r: IRouter): void { r.use(router); }
