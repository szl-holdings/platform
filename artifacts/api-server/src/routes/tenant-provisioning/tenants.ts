import { z } from "zod";
import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { sendSuccess, sendBadRequest, sendNotFound, sendForbidden, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { logActivity } from "../../lib/activity-logger";
import { validateBody, tenantCreateSchema, tenantStatusSchema, jsonObjectBodySchema} from "../../lib/validation";
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
import { tenantRateLimit, updateProvisioningConfigSchema, createDataverseConnectionSchema, linkOrganizationSchema, buildAdminConsentUrl, buildMultiTenantLoginUrl, PBI_SETTINGS_KEY } from "./shared";

const router: IRouter = Router();

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
  validateBody(tenantCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const { azureTenantId: rawAzureTenantId, displayName, domain, organizationId, config } = req.body;

      const azureTenantId = rawAzureTenantId.trim().toLowerCase();

      const existing = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.azureTenantId, azureTenantId))
        .limit(1);

      if (existing.length > 0) {
        sendError(res, "Tenant already provisioned", 409, "CONFLICT");
        return;
      }

      const newTenant: InsertAzureTenant = {
        azureTenantId,
        displayName: displayName.trim(),
        domain: domain ? String(domain).trim() : null,
        status: "pending",
        adminConsentGranted: "pending",
        organizationId: organizationId ? Number(organizationId) : null,
        config: config ?? {},
        provisionedByUserId: req.user?.id ? String(req.user.id) : null,
      };

      const [created] = await db
        .insert(azureTenantsTable)
        .values(newTenant)
        .returning();

      await logActivity(req, "create", "tenant", String(created.id), `Tenant provisioned: ${displayName} (${azureTenantId})`).catch(() => {});

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
      const id = parseInt(String(req.params.id), 10);
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
        sendNotFound(res, "Tenant");
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
  validateBody(tenantStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
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
        sendNotFound(res, "Tenant");
        return;
      }

      await logActivity(req, "update", "tenant", String(updated.id),
        `Tenant status updated: ${updated.displayName} → status=${updated.status ?? "unchanged"}, consent=${updated.adminConsentGranted ?? "unchanged"}`
      ).catch(() => {});

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
  validateBody(updateProvisioningConfigSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
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
      if (!existing) { sendNotFound(res, "Tenant"); return; }

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
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        sendBadRequest(res, "Invalid tenant ID");
        return;
      }

      const [deleted] = await db
        .delete(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .returning();

      if (!deleted) {
        sendNotFound(res, "Tenant");
        return;
      }

      await logActivity(req, "delete", "tenant", String(id), `Tenant deleted: ${deleted.displayName} (${deleted.azureTenantId})`).catch(() => {});

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
      const id = parseInt(String(req.params.id), 10);
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
        sendNotFound(res, "Tenant");
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
  validateBody(createDataverseConnectionSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
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
        sendNotFound(res, "Tenant");
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
      const id = parseInt(String(req.params.id), 10);
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
        sendNotFound(res, "Tenant");
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
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(String(req.params.id), 10);
      const connectionId = parseInt(String(req.params.connectionId), 10);

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
        sendNotFound(res, "Tenant");
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
        sendNotFound(res, "Connection");
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
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(String(req.params.id), 10);
      const connectionId = parseInt(String(req.params.connectionId), 10);

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
        sendNotFound(res, "Tenant");
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
        sendNotFound(res, "Connection");
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
      const tenantId = parseInt(String(req.params.id), 10);
      const connectionId = parseInt(String(req.params.connectionId), 10);

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
        sendNotFound(res, "Tenant");
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
        sendNotFound(res, "Connection");
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



export function register(r: IRouter): void { r.use(router); }
