import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { db } from "@workspace/db";
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
} from "@workspace/db";
import { eq, desc, and, count, sql, inArray } from "drizzle-orm";
import { services } from "@workspace/services";
import { encryptSecret, decryptSecret } from "../lib/crypto";

const router: IRouter = Router();

const PBI_SETTINGS_KEY = "powerbi-global-config";

const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded for tenant provisioning." },
  validate: { xForwardedForHeader: false, ip: false },
});

function buildAdminConsentUrl(azureTenantId: string, clientId: string, redirectUri: string): string {
  const appClientId = clientId || process.env["AZURE_AD_CLIENT_ID"] || "";
  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://login.microsoftonline.com/${azureTenantId}/adminconsent?client_id=${appClientId}&redirect_uri=${encodedRedirect}&state=tenant-${azureTenantId}`;
}

function buildMultiTenantLoginUrl(azureTenantId: string, redirectUri: string): string {
  const appClientId = process.env["AZURE_AD_CLIENT_ID"] || "";
  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/authorize?client_id=${appClientId}&response_type=code&redirect_uri=${encodedRedirect}&scope=openid+email+profile+offline_access+User.Read`;
}

router.get(
  "/admin/tenants",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (_req: Request, res: Response) => {
    try {
      const tenants = await db
        .select()
        .from(azureTenantsTable)
        .orderBy(desc(azureTenantsTable.createdAt));

      const realTenants = tenants.filter(t => t.azureTenantId !== PBI_SETTINGS_KEY);

      const userCountRows = await db
        .select({
          orgId: orgMembersTable.orgId,
          userCount: count(orgMembersTable.userId),
        })
        .from(orgMembersTable)
        .groupBy(orgMembersTable.orgId);
      const userCountByOrg = new Map(userCountRows.map(r => [r.orgId, Number(r.userCount)]));

      sendSuccess(res, {
        count: realTenants.length,
        tenants: realTenants.map((t) => ({
          id: t.id,
          azureTenantId: t.azureTenantId,
          displayName: t.displayName,
          domain: t.domain,
          status: t.status,
          adminConsentGranted: t.adminConsentGranted,
          organizationId: t.organizationId,
          userCount: t.organizationId ? (userCountByOrg.get(t.organizationId) ?? 0) : 0,
          provisionedAt: t.provisionedAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list tenants");
    }
  },
);

router.post(
  "/admin/tenants",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.azureTenantId || typeof body.azureTenantId !== "string") {
        sendBadRequest(res, "azureTenantId is required");
        return;
      }
      if (!body.displayName || typeof body.displayName !== "string") {
        sendBadRequest(res, "displayName is required");
        return;
      }

      const azureTenantId = body.azureTenantId.trim().toLowerCase();

      const existing = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.azureTenantId, azureTenantId))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "Tenant already provisioned", tenant: existing[0] });
        return;
      }

      const newTenant: InsertAzureTenant = {
        azureTenantId,
        displayName: body.displayName.trim(),
        domain: body.domain ? String(body.domain).trim() : null,
        status: "pending",
        adminConsentGranted: "pending",
        organizationId: body.organizationId ? Number(body.organizationId) : null,
        config: body.config ?? {},
        provisionedByUserId: req.user?.id ? String(req.user.id) : null,
      };

      const [created] = await db
        .insert(azureTenantsTable)
        .values(newTenant)
        .returning();

      const origin = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}`;
      const redirectUri = `${origin}/api/azure-ad/callback`;
      const adminConsentUrl = buildAdminConsentUrl(azureTenantId, process.env["AZURE_AD_CLIENT_ID"] ?? "", redirectUri);

      sendSuccess(res, {
        message: "Tenant provisioned successfully. Share the admin consent URL with the customer's Azure AD administrator.",
        tenant: created,
        adminConsentUrl,
        nextSteps: [
          "Share the adminConsentUrl with the customer's Azure AD global administrator.",
          "The admin must visit the URL and grant consent for the SZL application in their tenant.",
          "Once consent is granted, update the tenant status to 'active'.",
          "Users from this tenant can then sign in via Azure AD SSO.",
        ],
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to provision tenant");
    }
  },
);

router.get(
  "/admin/tenants/:id",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const connections = await db
        .select()
        .from(dataverseConnectionsTable)
        .where(eq(dataverseConnectionsTable.azureTenantId, tenant.azureTenantId))
        .orderBy(desc(dataverseConnectionsTable.createdAt));

      const origin = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}`;
      const redirectUri = `${origin}/api/azure-ad/callback`;
      const adminConsentUrl = buildAdminConsentUrl(tenant.azureTenantId, process.env["AZURE_AD_CLIENT_ID"] ?? "", redirectUri);
      const loginUrl = buildMultiTenantLoginUrl(tenant.azureTenantId, redirectUri);

      sendSuccess(res, {
        tenant,
        dataverseConnections: connections.map((c) => ({
          id: c.id,
          orgUrl: c.orgUrl,
          orgName: c.orgName,
          authMethod: c.authMethod,
          status: c.status,
          lastSyncAt: c.lastSyncAt,
          lastSyncStatus: c.lastSyncStatus,
          entitySyncCounts: c.entitySyncCounts,
        })),
        adminConsentUrl,
        loginUrl,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get tenant");
    }
  },
);

router.patch(
  "/admin/tenants/:id/status",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const { status, adminConsentGranted } = req.body ?? {};
      if (!status && !adminConsentGranted) {
        sendBadRequest(res, "status or adminConsentGranted is required");
        return;
      }

      const validStatuses = ["pending", "active", "suspended"];
      const validConsentStatuses = ["pending", "granted", "revoked"];

      if (status && !validStatuses.includes(status)) {
        sendBadRequest(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        return;
      }

      if (adminConsentGranted && !validConsentStatuses.includes(adminConsentGranted)) {
        sendBadRequest(res, `Invalid adminConsentGranted. Must be one of: ${validConsentStatuses.join(", ")}`);
        return;
      }

      const updates: Partial<typeof azureTenantsTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (status) updates.status = status;
      if (adminConsentGranted) updates.adminConsentGranted = adminConsentGranted;
      if (status === "active") updates.provisionedAt = new Date();

      const [updated] = await db
        .update(azureTenantsTable)
        .set(updates)
        .where(eq(azureTenantsTable.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      sendSuccess(res, { tenant: updated, message: "Tenant status updated" });
    } catch (err) {
      handleRouteError(res, err, "Failed to update tenant status");
    }
  },
);

router.patch(
  "/admin/tenants/:id/provisioning-config",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const body = req.body ?? {};
      const provisioningConfig = {
        autoProvisionUsers: body.autoProvisionUsers ?? true,
        defaultRole: body.defaultRole ?? "viewer",
        syncGroupsEnabled: body.syncGroupsEnabled ?? false,
        scimEnabled: body.scimEnabled ?? false,
        sessionTimeoutHours: Number(body.sessionTimeoutHours ?? 8),
      };

      const [existing] = await db
        .select({ config: azureTenantsTable.config })
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id));
      if (!existing) { res.status(404).json({ error: "Tenant not found" }); return; }

      const mergedConfig = { ...(existing.config as Record<string, unknown> ?? {}), provisioning: provisioningConfig };
      const [updated] = await db
        .update(azureTenantsTable)
        .set({ config: mergedConfig, status: "active", provisionedAt: new Date(), updatedAt: new Date() })
        .where(eq(azureTenantsTable.id, id))
        .returning();

      sendSuccess(res, { tenant: updated, message: "Provisioning configuration saved" });
    } catch (err) {
      handleRouteError(res, err, "Failed to save provisioning config");
    }
  },
);

router.delete(
  "/admin/tenants/:id",
  tenantRateLimit,
  authMiddleware(),
  requireRole("super_admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [deleted] = await db
        .delete(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      sendSuccess(res, { message: "Tenant deleted", deleted });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete tenant");
    }
  },
);

router.get(
  "/admin/tenants/:id/admin-consent-url",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const origin = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}`;
      const redirectUri = `${origin}/api/azure-ad/callback`;
      const clientId = process.env["AZURE_AD_CLIENT_ID"] ?? "";

      const adminConsentUrl = buildAdminConsentUrl(tenant.azureTenantId, clientId, redirectUri);

      sendSuccess(res, {
        tenant: { id: tenant.id, azureTenantId: tenant.azureTenantId, displayName: tenant.displayName },
        adminConsentUrl,
        clientId,
        instructions: `Share this URL with the Azure AD Global Administrator of '${tenant.displayName}'. They must visit this URL and click 'Accept' to grant the SZL platform access to their Azure AD tenant.`,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to generate admin consent URL");
    }
  },
);

router.post(
  "/admin/tenants/:id/dataverse/connections",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const body = req.body ?? {};
      if (!body.orgUrl || typeof body.orgUrl !== "string") {
        sendBadRequest(res, "orgUrl is required (e.g. https://yourorg.api.crm.dynamics.com)");
        return;
      }

      const orgUrl = body.orgUrl.trim().replace(/\/$/, "");
      const authMethod = body.authMethod ?? "client_credentials";

      if (!["client_credentials", "delegated"].includes(authMethod)) {
        sendBadRequest(res, "authMethod must be 'client_credentials' or 'delegated'");
        return;
      }

      const newConnection: InsertDataverseConnection = {
        azureTenantId: tenant.azureTenantId,
        orgUrl,
        orgName: body.orgName ? String(body.orgName) : null,
        authMethod,
        clientId: body.clientId ? String(body.clientId) : null,
        clientSecret: body.clientSecret ? encryptSecret(String(body.clientSecret)) : null,
        status: "pending",
        syncConfig: body.syncConfig ?? {
          entities: ["accounts", "contacts", "leads", "opportunities", "activities"],
          syncIntervalMinutes: 60,
        },
      };

      const [created] = await db
        .insert(dataverseConnectionsTable)
        .values(newConnection)
        .returning();

      const dataverse = services.dataverse;
      let testResult: { connected: boolean; error?: string } = { connected: false };

      try {
        testResult = await dataverse.testConnection(
          orgUrl,
          tenant.azureTenantId,
          body.clientId,
          body.clientSecret,
        );

        await db
          .update(dataverseConnectionsTable)
          .set({
            status: testResult.connected ? "active" : "error",
            lastSyncStatus: testResult.connected ? "connection_test_passed" : "connection_test_failed",
            lastSyncError: testResult.connected ? null : (testResult.error ?? "Unknown error"),
            updatedAt: new Date(),
          })
          .where(eq(dataverseConnectionsTable.id, created.id));

      } catch {
        await db
          .update(dataverseConnectionsTable)
          .set({ status: "error", lastSyncStatus: "connection_test_failed", updatedAt: new Date() })
          .where(eq(dataverseConnectionsTable.id, created.id));
      }

      const [finalConnection] = await db
        .select()
        .from(dataverseConnectionsTable)
        .where(eq(dataverseConnectionsTable.id, created.id))
        .limit(1);

      sendSuccess(res, {
        message: testResult.connected
          ? "Dataverse connection established and verified"
          : "Dataverse connection created but connection test failed. Check credentials and org URL.",
        connection: {
          id: finalConnection?.id,
          orgUrl: finalConnection?.orgUrl,
          orgName: finalConnection?.orgName,
          status: finalConnection?.status,
          authMethod: finalConnection?.authMethod,
        },
        testResult,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create Dataverse connection");
    }
  },
);

router.get(
  "/admin/tenants/:id/dataverse/connections",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const connections = await db
        .select()
        .from(dataverseConnectionsTable)
        .where(eq(dataverseConnectionsTable.azureTenantId, tenant.azureTenantId))
        .orderBy(desc(dataverseConnectionsTable.createdAt));

      sendSuccess(res, {
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        count: connections.length,
        connections: connections.map((c) => ({
          id: c.id,
          orgUrl: c.orgUrl,
          orgName: c.orgName,
          authMethod: c.authMethod,
          status: c.status,
          syncConfig: c.syncConfig,
          lastSyncAt: c.lastSyncAt,
          lastSyncStatus: c.lastSyncStatus,
          lastSyncError: c.lastSyncError,
          entitySyncCounts: c.entitySyncCounts,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list Dataverse connections");
    }
  },
);

router.post(
  "/admin/tenants/:id/dataverse/connections/:connectionId/test",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(req.params.id!, 10);
      const connectionId = parseInt(req.params.connectionId!, 10);

      if (isNaN(tenantId) || isNaN(connectionId)) {
        sendBadRequest(res, "Invalid ID parameters");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, tenantId))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const [connection] = await db
        .select()
        .from(dataverseConnectionsTable)
        .where(
          and(
            eq(dataverseConnectionsTable.id, connectionId),
            eq(dataverseConnectionsTable.azureTenantId, tenant.azureTenantId),
          ),
        )
        .limit(1);

      if (!connection) {
        res.status(404).json({ error: "Connection not found for this tenant" });
        return;
      }

      const dataverse = services.dataverse;
      const testResult = await dataverse.testConnection(
        connection.orgUrl,
        tenant.azureTenantId,
        connection.clientId ?? undefined,
        connection.clientSecret ? decryptSecret(connection.clientSecret) : undefined,
      );

      await db
        .update(dataverseConnectionsTable)
        .set({
          status: testResult.connected ? "active" : "error",
          lastSyncStatus: testResult.connected ? "connection_test_passed" : "connection_test_failed",
          lastSyncError: testResult.connected ? null : (testResult.error ?? "Connection test failed"),
          updatedAt: new Date(),
        })
        .where(eq(dataverseConnectionsTable.id, connectionId));

      sendSuccess(res, {
        ...testResult,
        testedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to test Dataverse connection");
    }
  },
);

router.post(
  "/admin/tenants/:id/dataverse/connections/:connectionId/sync",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(req.params.id!, 10);
      const connectionId = parseInt(req.params.connectionId!, 10);

      if (isNaN(tenantId) || isNaN(connectionId)) {
        sendBadRequest(res, "Invalid ID parameters");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, tenantId))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const [connection] = await db
        .select()
        .from(dataverseConnectionsTable)
        .where(
          and(
            eq(dataverseConnectionsTable.id, connectionId),
            eq(dataverseConnectionsTable.azureTenantId, tenant.azureTenantId),
          ),
        )
        .limit(1);

      if (!connection) {
        res.status(404).json({ error: "Connection not found for this tenant" });
        return;
      }

      const dataverse = services.dataverse;
      const syncResults = await dataverse.sync(
        connection.orgUrl,
        tenant.azureTenantId,
        connection.clientId ?? undefined,
        connection.clientSecret ? decryptSecret(connection.clientSecret) : undefined,
      );

      const entityCounts: Record<string, number> = {};
      for (const r of syncResults) {
        entityCounts[r.entity] = r.count;
      }

      await db
        .update(dataverseConnectionsTable)
        .set({
          status: "active",
          lastSyncAt: new Date(),
          lastSyncStatus: "success",
          lastSyncError: null,
          entitySyncCounts: entityCounts,
          updatedAt: new Date(),
        })
        .where(eq(dataverseConnectionsTable.id, connectionId));

      sendSuccess(res, {
        message: "Sync completed",
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        orgUrl: connection.orgUrl,
        results: syncResults,
        totalSynced: syncResults.reduce((sum, r) => sum + r.count, 0),
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to sync Dataverse connection");
    }
  },
);

router.get(
  "/admin/tenants/:id/dataverse/connections/:connectionId/signals",
  tenantRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(req.params.id!, 10);
      const connectionId = parseInt(req.params.connectionId!, 10);

      if (isNaN(tenantId) || isNaN(connectionId)) {
        sendBadRequest(res, "Invalid ID parameters");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, tenantId))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const [connection] = await db
        .select()
        .from(dataverseConnectionsTable)
        .where(
          and(
            eq(dataverseConnectionsTable.id, connectionId),
            eq(dataverseConnectionsTable.azureTenantId, tenant.azureTenantId),
          ),
        )
        .limit(1);

      if (!connection) {
        res.status(404).json({ error: "Connection not found for this tenant" });
        return;
      }

      const dataverse = services.dataverse;
      const signals = await dataverse.generateLyteSignals(
        connection.orgUrl,
        tenant.azureTenantId,
        connection.clientId ?? undefined,
        connection.clientSecret ? decryptSecret(connection.clientSecret) : undefined,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — CRM Signal Analysis",
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        orgUrl: connection.orgUrl,
        count: signals.length,
        signals,
        detectedAt: new Date().toISOString(),
        signalBreakdown: {
          staleOpportunities: signals.filter(s => s.type === "stale_opportunity").length,
          pipelineAnomalies: signals.filter(s => s.type === "pipeline_anomaly").length,
          dealStageConflicts: signals.filter(s => s.type === "deal_stage_conflict").length,
          highValueLeads: signals.filter(s => s.type === "high_value_lead").length,
          overdueActivities: signals.filter(s => s.type === "overdue_activity").length,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to generate Lyte signals from Dataverse");
    }
  },
);

router.post(
  "/admin/tenants/:id/scim/deprovision-user",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const { userId, reason } = req.body ?? {};
      if (!userId) {
        sendBadRequest(res, "userId is required");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant || !tenant.organizationId) {
        res.status(404).json({ error: "Tenant not found or not linked to an organization" });
        return;
      }

      const [member] = await db
        .select()
        .from(orgMembersTable)
        .where(
          and(
            eq(orgMembersTable.orgId, tenant.organizationId),
            eq(orgMembersTable.userId, Number(userId)),
          ),
        )
        .limit(1);

      if (!member) {
        res.status(404).json({ error: "User is not a member of this tenant's organization" });
        return;
      }

      await db
        .delete(orgMembersTable)
        .where(
          and(
            eq(orgMembersTable.orgId, tenant.organizationId),
            eq(orgMembersTable.userId, Number(userId)),
          ),
        );

      sendSuccess(res, {
        message: "User deprovisioned from tenant organization",
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        userId: Number(userId),
        reason: reason ?? "Manual deprovision via SCIM",
        deprovisionedAt: new Date().toISOString(),
        nextSteps: [
          "Revoke the user's Azure AD session tokens if applicable.",
          "Remove any application roles assigned to the user in Azure AD.",
        ],
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to deprovision user from tenant");
    }
  },
);

router.post(
  "/admin/tenants/:id/scim/sync-users",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant || !tenant.organizationId) {
        res.status(404).json({ error: "Tenant not found or not linked to an organization" });
        return;
      }

      const members = await db
        .select({
          id: orgMembersTable.id,
          userId: orgMembersTable.userId,
          role: orgMembersTable.role,
          joinedAt: orgMembersTable.joinedAt,
          displayName: usersTable.displayName,
          email: usersTable.email,
          isActive: usersTable.isActive,
        })
        .from(orgMembersTable)
        .innerJoin(usersTable, eq(orgMembersTable.userId, usersTable.id))
        .where(eq(orgMembersTable.orgId, tenant.organizationId));

      const activeMembers = members.filter(m => m.isActive);
      const inactiveMembers = members.filter(m => !m.isActive);

      sendSuccess(res, {
        source: "SCIM-style User Sync — Azure AD Tenant Membership",
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        organizationId: tenant.organizationId,
        summary: {
          totalMembers: members.length,
          activeMembers: activeMembers.length,
          inactiveMembers: inactiveMembers.length,
        },
        members: activeMembers.map(m => ({
          userId: m.userId,
          displayName: m.displayName,
          email: m.email,
          orgRole: m.role,
          joinedAt: m.joinedAt,
        })),
        inactiveUsers: inactiveMembers.map(m => ({
          userId: m.userId,
          displayName: m.displayName,
          email: m.email,
          orgRole: m.role,
        })),
        syncedAt: new Date().toISOString(),
        recommendation: inactiveMembers.length > 0
          ? `${inactiveMembers.length} inactive user(s) still have org membership. Consider deprovisioning them.`
          : "All org members are active.",
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to sync tenant users");
    }
  },
);

router.patch(
  "/admin/tenants/:id/organization",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const { organizationId } = req.body ?? {};
      if (organizationId === undefined) {
        sendBadRequest(res, "organizationId is required (set to null to unlink)");
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const [updated] = await db
        .update(azureTenantsTable)
        .set({
          organizationId: organizationId === null ? null : Number(organizationId),
          updatedAt: new Date(),
        })
        .where(eq(azureTenantsTable.id, id))
        .returning();

      sendSuccess(res, {
        message: organizationId
          ? `Tenant linked to organization ${organizationId}`
          : "Tenant unlinked from organization",
        tenant: updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update tenant organization link");
    }
  },
);

interface PbiWorkspaceConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  groupId: string;
  serviceAccount?: string;
  reportIds: Record<string, string>;
  datasetIds?: Record<string, string>;
  rlsEnabled?: boolean;
  updatedAt?: string;
}

const pbiConfigCache = new Map<string, PbiWorkspaceConfig>();

async function loadPbiConfig(): Promise<PbiWorkspaceConfig | null> {
  if (pbiConfigCache.has(PBI_SETTINGS_KEY)) {
    return pbiConfigCache.get(PBI_SETTINGS_KEY)!;
  }
  const row = await db
    .select()
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.azureTenantId, PBI_SETTINGS_KEY))
    .limit(1);

  if (!row[0]?.config) return null;
  const cfg = row[0].config as unknown as { encrypted?: string };
  if (!cfg?.encrypted) return null;
  try {
    const decrypted = JSON.parse(decryptSecret(cfg.encrypted)) as PbiWorkspaceConfig;
    pbiConfigCache.set(PBI_SETTINGS_KEY, decrypted);
    return decrypted;
  } catch {
    return null;
  }
}

async function savePbiConfig(cfg: PbiWorkspaceConfig): Promise<void> {
  const encrypted = encryptSecret(JSON.stringify(cfg));
  const existing = await db
    .select()
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.azureTenantId, PBI_SETTINGS_KEY))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(azureTenantsTable)
      .set({ config: { encrypted }, updatedAt: new Date() })
      .where(eq(azureTenantsTable.azureTenantId, PBI_SETTINGS_KEY));
  } else {
    await db.insert(azureTenantsTable).values({
      azureTenantId: PBI_SETTINGS_KEY,
      displayName: "__pbi_global_config__",
      status: "suspended",
      adminConsentGranted: "revoked",
      config: { encrypted },
    });
  }
  pbiConfigCache.set(PBI_SETTINGS_KEY, cfg);
}

async function loadTenantPbiConfig(azureTenantDbId: number): Promise<PbiWorkspaceConfig | null> {
  const cacheKey = `tenant:${azureTenantDbId}`;
  if (pbiConfigCache.has(cacheKey)) return pbiConfigCache.get(cacheKey)!;
  const [row] = await db
    .select({ config: azureTenantsTable.config })
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.id, azureTenantDbId));
  if (!row?.config) return null;
  const cfg = row.config as Record<string, unknown>;
  if (!cfg.pbi_encrypted) return null;
  try {
    const decrypted = JSON.parse(decryptSecret(String(cfg.pbi_encrypted))) as PbiWorkspaceConfig;
    pbiConfigCache.set(cacheKey, decrypted);
    return decrypted;
  } catch {
    return null;
  }
}

async function saveTenantPbiConfig(azureTenantDbId: number, cfg: PbiWorkspaceConfig): Promise<void> {
  const cacheKey = `tenant:${azureTenantDbId}`;
  const encrypted = encryptSecret(JSON.stringify(cfg));
  const [existing] = await db
    .select({ config: azureTenantsTable.config })
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.id, azureTenantDbId));
  const mergedConfig = { ...(existing?.config as Record<string, unknown> ?? {}), pbi_encrypted: encrypted };
  await db
    .update(azureTenantsTable)
    .set({ config: mergedConfig, updatedAt: new Date() })
    .where(eq(azureTenantsTable.id, azureTenantDbId));
  pbiConfigCache.set(cacheKey, cfg);
}

router.get(
  "/admin/tenants/:id/powerbi-config",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }
      const cfg = await loadTenantPbiConfig(id);
      if (!cfg) { sendSuccess(res, { configured: false, config: null }); return; }
      sendSuccess(res, {
        configured: true,
        config: {
          tenantId: cfg.tenantId,
          clientId: cfg.clientId,
          clientSecret: cfg.clientSecret ? "***" : "",
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? "",
          reportIds: cfg.reportIds ?? {},
          datasetIds: cfg.datasetIds ?? {},
          rlsEnabled: cfg.rlsEnabled ?? false,
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to load tenant Power BI configuration");
    }
  },
);

router.put(
  "/admin/tenants/:id/powerbi-config",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }
      const body = req.body ?? {};
      if (!body.tenantId || !body.clientId || !body.groupId) {
        sendBadRequest(res, "tenantId, clientId, and groupId are required");
        return;
      }
      const existing = await loadTenantPbiConfig(id);
      const clientSecret =
        body.clientSecret && body.clientSecret !== "***"
          ? body.clientSecret
          : (existing?.clientSecret ?? "");
      const cfg: PbiWorkspaceConfig = {
        tenantId: String(body.tenantId).trim(),
        clientId: String(body.clientId).trim(),
        clientSecret,
        groupId: String(body.groupId).trim(),
        serviceAccount: body.serviceAccount ? String(body.serviceAccount).trim() : undefined,
        reportIds: body.reportIds && typeof body.reportIds === "object" ? body.reportIds : (existing?.reportIds ?? {}),
        datasetIds: body.datasetIds && typeof body.datasetIds === "object" ? body.datasetIds : (existing?.datasetIds ?? {}),
        rlsEnabled: typeof body.rlsEnabled === "boolean" ? body.rlsEnabled : (existing?.rlsEnabled ?? false),
        updatedAt: new Date().toISOString(),
      };
      await saveTenantPbiConfig(id, cfg);
      sendSuccess(res, {
        message: "Tenant Power BI configuration saved",
        config: { tenantId: cfg.tenantId, clientId: cfg.clientId, clientSecret: "***", groupId: cfg.groupId, serviceAccount: cfg.serviceAccount ?? "", reportIds: cfg.reportIds, datasetIds: cfg.datasetIds, rlsEnabled: cfg.rlsEnabled, updatedAt: cfg.updatedAt },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to save tenant Power BI configuration");
    }
  },
);

router.get(
  "/admin/powerbi-config",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (_req: Request, res: Response) => {
    try {
      const cfg = await loadPbiConfig();
      if (!cfg) {
        sendSuccess(res, { configured: false, config: null });
        return;
      }
      sendSuccess(res, {
        configured: true,
        config: {
          tenantId: cfg.tenantId,
          clientId: cfg.clientId,
          clientSecret: cfg.clientSecret ? "***" : "",
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? "",
          reportIds: cfg.reportIds ?? {},
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to load Power BI configuration");
    }
  },
);

router.put(
  "/admin/powerbi-config",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.tenantId || !body.clientId || !body.groupId) {
        sendBadRequest(res, "tenantId, clientId, and groupId are required");
        return;
      }

      const existing = await loadPbiConfig();
      const clientSecret =
        body.clientSecret && body.clientSecret !== "***"
          ? body.clientSecret
          : (existing?.clientSecret ?? "");

      const cfg: PbiWorkspaceConfig = {
        tenantId: String(body.tenantId).trim(),
        clientId: String(body.clientId).trim(),
        clientSecret,
        groupId: String(body.groupId).trim(),
        serviceAccount: body.serviceAccount ? String(body.serviceAccount).trim() : undefined,
        reportIds: body.reportIds && typeof body.reportIds === "object" ? body.reportIds : (existing?.reportIds ?? {}),
        updatedAt: new Date().toISOString(),
      };

      await savePbiConfig(cfg);

      sendSuccess(res, {
        message: "Power BI configuration saved",
        config: {
          tenantId: cfg.tenantId,
          clientId: cfg.clientId,
          clientSecret: "***",
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? "",
          reportIds: cfg.reportIds,
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to save Power BI configuration");
    }
  },
);

router.post(
  "/admin/powerbi-config/test",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const tenantId = body.tenantId ?? (await loadPbiConfig())?.tenantId;
      const clientId = body.clientId ?? (await loadPbiConfig())?.clientId;
      const clientSecret =
        body.clientSecret && body.clientSecret !== "***"
          ? body.clientSecret
          : (await loadPbiConfig())?.clientSecret;

      if (!tenantId || !clientId || !clientSecret) {
        res.json({ ok: false, message: "tenantId, clientId, and clientSecret are required to test the connection." });
        return;
      }

      try {
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://analysis.windows.net/powerbi/api/.default",
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const tokenRes = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!tokenRes.ok) {
          const errJson = await tokenRes.json().catch(() => ({}));
          const errMsg = (errJson as { error_description?: string }).error_description ?? `HTTP ${tokenRes.status}`;
          res.json({ ok: false, message: `Azure AD token request failed: ${errMsg}` });
          return;
        }

        const tokenData = await tokenRes.json() as { access_token?: string };
        if (!tokenData.access_token) {
          res.json({ ok: false, message: "Azure AD returned no access token." });
          return;
        }

        const groupId = body.groupId ?? (await loadPbiConfig())?.groupId;
        if (groupId) {
          const pbiRes = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (!pbiRes.ok) {
            res.json({ ok: false, message: `Token acquired but Power BI workspace not found (HTTP ${pbiRes.status}). Check groupId.` });
            return;
          }
        }

        res.json({ ok: true, message: `Connection verified. Azure AD token acquired${groupId ? " and workspace validated" : ""}.` });
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          res.json({ ok: false, message: "Connection timed out. Check firewall or network access." });
        } else {
          res.json({ ok: false, message: `Network error: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}` });
        }
      }
    } catch (err) {
      handleRouteError(res, err, "Failed to test Power BI connection");
    }
  },
);

router.post(
  "/admin/powerbi-config/embed-token",
  tenantRateLimit,
  authMiddleware(),
  requireRole("viewer"),
  async (req: Request, res: Response) => {
    try {
      const reportKey = String(req.body?.reportKey ?? "").trim();
      if (!reportKey) {
        res.status(400).json({ error: "reportKey is required. Raw reportId values are not accepted." });
        return;
      }

      const actorUserId: number | null = req.user?.id ? Number(req.user.id) : null;
      const isAdminOrSuperAdmin = req.user?.roles?.some(r => r === "admin" || r === "super_admin");

      let resolvedTenantDbId: number | null = null;
      let resolvedAzureTenantId: string | null = null;

      if (actorUserId) {
        const memberRows = await db
          .select({ orgId: orgMembersTable.orgId })
          .from(orgMembersTable)
          .where(eq(orgMembersTable.userId, actorUserId));
        const orgIds = memberRows.map(r => r.orgId).filter((id): id is number => id !== null);
        if (orgIds.length > 0) {
          const activeTenant = await db
            .select({ id: azureTenantsTable.id, azureTenantId: azureTenantsTable.azureTenantId })
            .from(azureTenantsTable)
            .where(
              and(
                inArray(azureTenantsTable.organizationId, orgIds),
                eq(azureTenantsTable.status, "active"),
              ),
            )
            .limit(1);
          if (activeTenant.length > 0) {
            resolvedTenantDbId = activeTenant[0]!.id;
            resolvedAzureTenantId = activeTenant[0]!.azureTenantId;
          }
        }
      }

      if (!resolvedTenantDbId && !isAdminOrSuperAdmin) {
        await db.insert(auditLogsTable).values({
          actorUserId,
          actionType: "powerbi_embed_token_denied",
          entityType: "powerbi_report",
          entityId: reportKey,
          payloadJson: { reportKey, reason: "no_active_tenant_for_user" },
        }).catch(() => {});
        res.status(403).json({ error: "No active Azure tenant associated with your account. Access denied." });
        return;
      }

      let cfg: PbiWorkspaceConfig | null = null;
      if (resolvedTenantDbId) {
        cfg = await loadTenantPbiConfig(resolvedTenantDbId);
      }
      if (!cfg) {
        cfg = await loadPbiConfig();
      }
      if (!cfg?.tenantId || !cfg?.clientId || !cfg?.clientSecret) {
        res.status(400).json({ error: "Power BI is not configured for this tenant. Contact your administrator." });
        return;
      }

      const reportId: string | undefined = cfg.reportIds[reportKey];
      if (!reportId) {
        await db.insert(auditLogsTable).values({
          actorUserId,
          actionType: "powerbi_embed_token_denied",
          entityType: "powerbi_report",
          entityId: reportKey,
          payloadJson: { reportKey, azureTenantId: resolvedAzureTenantId, reason: "unknown_report_key" },
        }).catch(() => {});
        res.status(400).json({ error: `Unknown reportKey '${reportKey}'. Configure it in Admin → Power BI.` });
        return;
      }

      const datasetId: string | undefined = cfg.datasetIds?.[reportKey];
      const callerUsername = req.user?.email ?? req.user?.displayName ?? String(actorUserId ?? "anonymous");

      const tokenUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        scope: "https://analysis.windows.net/powerbi/api/.default",
      });

      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({}));
        await db.insert(auditLogsTable).values({
          actorUserId,
          actionType: "powerbi_embed_token_denied",
          entityType: "powerbi_report",
          entityId: reportKey,
          payloadJson: { reportKey, azureTenantId: resolvedAzureTenantId, reason: "azure_token_failure" },
        }).catch(() => {});
        res.status(502).json({ error: `Failed to acquire Azure AD token: ${(errJson as { error_description?: string }).error_description ?? tokenRes.status}` });
        return;
      }

      const tokenData = await tokenRes.json() as { access_token: string };
      const aadToken = tokenData.access_token;

      interface GenerateTokenBody {
        accessLevel: string;
        identities?: Array<{ username: string; roles: string[]; datasets: string[] }>;
      }
      const generateTokenBody: GenerateTokenBody = { accessLevel: "view" };
      if (cfg.rlsEnabled && datasetId) {
        generateTokenBody.identities = [{
          username: callerUsername,
          roles: req.user?.roles ?? ["viewer"],
          datasets: [datasetId],
        }];
      }

      const embedRes = await fetch(
        `https://api.powerbi.com/v1.0/myorg/groups/${cfg.groupId}/reports/${reportId}/GenerateToken`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${aadToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(generateTokenBody),
        },
      );

      if (!embedRes.ok) {
        const errJson = await embedRes.json().catch(() => ({}));
        await db.insert(auditLogsTable).values({
          actorUserId,
          actionType: "powerbi_embed_token_denied",
          entityType: "powerbi_report",
          entityId: reportKey,
          payloadJson: { reportKey, azureTenantId: resolvedAzureTenantId, reason: "embed_token_failure", detail: JSON.stringify(errJson) },
        }).catch(() => {});
        res.status(502).json({ error: `Failed to generate embed token: ${JSON.stringify(errJson)}` });
        return;
      }

      const embedData = await embedRes.json() as { token: string; tokenId: string; expiration: string };

      await db.insert(auditLogsTable).values({
        actorUserId,
        actionType: "powerbi_embed_token_issued",
        entityType: "powerbi_report",
        entityId: reportKey,
        payloadJson: { reportKey, tokenId: embedData.tokenId, expiration: embedData.expiration, azureTenantId: resolvedAzureTenantId, rlsApplied: !!generateTokenBody.identities },
      }).catch(() => {});

      sendSuccess(res, {
        embedToken: embedData.token,
        tokenId: embedData.tokenId,
        expiration: embedData.expiration,
        embedUrl: `https://embedded.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${cfg.groupId}`,
        reportId,
        groupId: cfg.groupId,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to generate Power BI embed token");
    }
  },
);

// ─── SCIM Token Management ────────────────────────────────────────────────────

router.post(
  "/admin/tenants/:id/scim/tokens",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

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
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

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
  "/admin/tenants/:id/scim/tokens/:tokenId",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      const tokenId = parseInt(req.params.tokenId!, 10);
      if (isNaN(id) || isNaN(tokenId)) { sendBadRequest(res, "Invalid ID"); return; }

      const [token] = await db
        .select()
        .from(scimTokensTable)
        .where(and(eq(scimTokensTable.id, tokenId), eq(scimTokensTable.tenantId, id)))
        .limit(1);

      if (!token) { res.status(404).json({ error: "Token not found" }); return; }

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
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

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
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

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
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

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
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

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
  "/admin/tenants/:id/branding",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);
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
      const { azureTenantId } = req.params;
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

export default router;
