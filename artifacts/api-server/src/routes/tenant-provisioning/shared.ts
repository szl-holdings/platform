import { z } from "zod";
import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { sendSuccess, sendBadRequest, sendNotFound, sendForbidden, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { logActivity } from "../../lib/activity-logger";
import { validateBody, tenantCreateSchema, tenantStatusSchema } from "../../lib/validation";
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

const router: IRouter = Router();

export const PBI_SETTINGS_KEY = "powerbi-global-config";

export const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded for tenant provisioning." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

export function buildAdminConsentUrl(azureTenantId: string, clientId: string, redirectUri: string): string {
  const appClientId = clientId || process.env["AZURE_AD_CLIENT_ID"] || "";
  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://login.microsoftonline.com/${azureTenantId}/adminconsent?client_id=${appClientId}&redirect_uri=${encodedRedirect}&state=tenant-${azureTenantId}`;
}

export function buildMultiTenantLoginUrl(azureTenantId: string, redirectUri: string): string {
  const appClientId = process.env["AZURE_AD_CLIENT_ID"] || "";
  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/authorize?client_id=${appClientId}&response_type=code&redirect_uri=${encodedRedirect}&scope=openid+email+profile+offline_access+User.Read`;
}

export const updateProvisioningConfigSchema = z.object({
  autoProvisionUsers: z.boolean().optional(),
  defaultRole: z.string().max(50).optional(),
  syncGroupsEnabled: z.boolean().optional(),
  scimEnabled: z.boolean().optional(),
  sessionTimeoutHours: z.number().int().positive().max(720).optional(),
});

export const createDataverseConnectionSchema = z.object({
  orgUrl: z.string().url().max(500),
  orgName: z.string().max(200).optional(),
  authMethod: z.enum(["client_credentials", "delegated"]).default("client_credentials"),
  clientId: z.string().max(200).optional(),
  clientSecret: z.string().max(500).optional(),
  syncConfig: z.object({
    entities: z.array(z.string()).optional(),
    syncIntervalMinutes: z.number().int().positive().max(10080).optional(),
  }).optional(),
});

export const deprovisionUserSchema = z.object({
  userId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  reason: z.string().max(500).optional(),
});

export const linkOrganizationSchema = z.object({
  organizationId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
});

