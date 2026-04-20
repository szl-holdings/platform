import {
  auditLogsTable,
  azureTenantsTable,
  dataverseConnectionsTable,
  db,
  type InsertAzureTenant,
  type InsertDataverseConnection,
  type InsertTenantBranding,
  orgMembersTable,
  scimProvisionedUsersTable,
  scimSyncLogsTable,
  scimTokensTable,
  tenantBrandingTable,
  usersTable,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import crypto from 'crypto';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { logActivity } from '../../lib/activity-logger';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { decryptSecret, encryptSecret } from '../../lib/crypto';
import {
  powerBiConfigSchema,
  powerBiEmbedTokenSchema,
  powerBiTestConnectionSchema,
  tenantCreateSchema,
  tenantStatusSchema,
  validateBody,
} from '../../lib/validation';
import { authMiddleware, requireRole } from '../../middlewares/auth';
import { PBI_SETTINGS_KEY, tenantRateLimit } from './shared';

const router: IRouter = Router();

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
      displayName: '__pbi_global_config__',
      status: 'suspended',
      adminConsentGranted: 'revoked',
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

async function saveTenantPbiConfig(
  azureTenantDbId: number,
  cfg: PbiWorkspaceConfig,
): Promise<void> {
  const cacheKey = `tenant:${azureTenantDbId}`;
  const encrypted = encryptSecret(JSON.stringify(cfg));
  const [existing] = await db
    .select({ config: azureTenantsTable.config })
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.id, azureTenantDbId));
  const mergedConfig = {
    ...((existing?.config as Record<string, unknown>) ?? {}),
    pbi_encrypted: encrypted,
  };
  await db
    .update(azureTenantsTable)
    .set({ config: mergedConfig, updatedAt: new Date() })
    .where(eq(azureTenantsTable.id, azureTenantDbId));
  pbiConfigCache.set(cacheKey, cfg);
}

router.get(
  '/admin/tenants/:id/powerbi-config',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid tenant ID');
        return;
      }
      const cfg = await loadTenantPbiConfig(id);
      if (!cfg) {
        sendSuccess(res, { configured: false, config: null });
        return;
      }
      sendSuccess(res, {
        configured: true,
        config: {
          tenantId: cfg.tenantId,
          clientId: cfg.clientId,
          clientSecret: cfg.clientSecret ? '***' : '',
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? '',
          reportIds: cfg.reportIds ?? {},
          datasetIds: cfg.datasetIds ?? {},
          rlsEnabled: cfg.rlsEnabled ?? false,
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load tenant Power BI configuration');
    }
  },
);

router.put(
  '/admin/tenants/:id/powerbi-config',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  validateBody(powerBiConfigSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid tenant ID');
        return;
      }
      const body = req.body ?? {};
      if (!body.tenantId || !body.clientId || !body.groupId) {
        sendBadRequest(res, 'tenantId, clientId, and groupId are required');
        return;
      }
      const existing = await loadTenantPbiConfig(id);
      const clientSecret =
        body.clientSecret && body.clientSecret !== '***'
          ? body.clientSecret
          : (existing?.clientSecret ?? '');
      const cfg: PbiWorkspaceConfig = {
        tenantId: String(body.tenantId).trim(),
        clientId: String(body.clientId).trim(),
        clientSecret,
        groupId: String(body.groupId).trim(),
        serviceAccount: body.serviceAccount ? String(body.serviceAccount).trim() : undefined,
        reportIds:
          body.reportIds && typeof body.reportIds === 'object'
            ? body.reportIds
            : (existing?.reportIds ?? {}),
        datasetIds:
          body.datasetIds && typeof body.datasetIds === 'object'
            ? body.datasetIds
            : (existing?.datasetIds ?? {}),
        rlsEnabled:
          typeof body.rlsEnabled === 'boolean' ? body.rlsEnabled : (existing?.rlsEnabled ?? false),
        updatedAt: new Date().toISOString(),
      };
      await saveTenantPbiConfig(id, cfg);
      sendSuccess(res, {
        message: 'Tenant Power BI configuration saved',
        config: {
          tenantId: cfg.tenantId,
          clientId: cfg.clientId,
          clientSecret: '***',
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? '',
          reportIds: cfg.reportIds,
          datasetIds: cfg.datasetIds,
          rlsEnabled: cfg.rlsEnabled,
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to save tenant Power BI configuration');
    }
  },
);

router.get(
  '/admin/powerbi-config',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
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
          clientSecret: cfg.clientSecret ? '***' : '',
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? '',
          reportIds: cfg.reportIds ?? {},
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load Power BI configuration');
    }
  },
);

router.put(
  '/admin/powerbi-config',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  validateBody(powerBiConfigSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.tenantId || !body.clientId || !body.groupId) {
        sendBadRequest(res, 'tenantId, clientId, and groupId are required');
        return;
      }

      const existing = await loadPbiConfig();
      const clientSecret =
        body.clientSecret && body.clientSecret !== '***'
          ? body.clientSecret
          : (existing?.clientSecret ?? '');

      const cfg: PbiWorkspaceConfig = {
        tenantId: String(body.tenantId).trim(),
        clientId: String(body.clientId).trim(),
        clientSecret,
        groupId: String(body.groupId).trim(),
        serviceAccount: body.serviceAccount ? String(body.serviceAccount).trim() : undefined,
        reportIds:
          body.reportIds && typeof body.reportIds === 'object'
            ? body.reportIds
            : (existing?.reportIds ?? {}),
        updatedAt: new Date().toISOString(),
      };

      await savePbiConfig(cfg);

      sendSuccess(res, {
        message: 'Power BI configuration saved',
        config: {
          tenantId: cfg.tenantId,
          clientId: cfg.clientId,
          clientSecret: '***',
          groupId: cfg.groupId,
          serviceAccount: cfg.serviceAccount ?? '',
          reportIds: cfg.reportIds,
          updatedAt: cfg.updatedAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to save Power BI configuration');
    }
  },
);

router.post(
  '/admin/powerbi-config/test',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  validateBody(powerBiTestConnectionSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const tenantId = body.tenantId ?? (await loadPbiConfig())?.tenantId;
      const clientId = body.clientId ?? (await loadPbiConfig())?.clientId;
      const clientSecret =
        body.clientSecret && body.clientSecret !== '***'
          ? body.clientSecret
          : (await loadPbiConfig())?.clientSecret;

      if (!tenantId || !clientId || !clientSecret) {
        res.json({
          ok: false,
          message: 'tenantId, clientId, and clientSecret are required to test the connection.',
        });
        return;
      }

      try {
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://analysis.windows.net/powerbi/api/.default',
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const tokenRes = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!tokenRes.ok) {
          const errJson = await tokenRes.json().catch(() => ({}));
          const errMsg =
            (errJson as { error_description?: string }).error_description ??
            `HTTP ${tokenRes.status}`;
          res.json({ ok: false, message: `Azure AD token request failed: ${errMsg}` });
          return;
        }

        const tokenData = (await tokenRes.json()) as { access_token?: string };
        if (!tokenData.access_token) {
          res.json({ ok: false, message: 'Azure AD returned no access token.' });
          return;
        }

        const groupId = body.groupId ?? (await loadPbiConfig())?.groupId;
        if (groupId) {
          const pbiRes = await fetch(`https://api.powerbi.com/v1.0/myorg/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (!pbiRes.ok) {
            res.json({
              ok: false,
              message: `Token acquired but Power BI workspace not found (HTTP ${pbiRes.status}). Check groupId.`,
            });
            return;
          }
        }

        res.json({
          ok: true,
          message: `Connection verified. Azure AD token acquired${groupId ? ' and workspace validated' : ''}.`,
        });
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          res.json({
            ok: false,
            message: 'Connection timed out. Check firewall or network access.',
          });
        } else {
          res.json({
            ok: false,
            message: `Network error: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
          });
        }
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to test Power BI connection');
    }
  },
);

router.post(
  '/admin/powerbi-config/embed-token',
  tenantRateLimit,
  authMiddleware(),
  requireRole('viewer'),
  validateBody(powerBiEmbedTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const reportKey = String(req.body?.reportKey ?? '').trim();
      if (!reportKey) {
        sendBadRequest(res, 'reportKey is required. Raw reportId values are not accepted.');
        return;
      }

      const actorUserId: number | null = req.user?.id ? Number(req.user.id) : null;
      const isAdminOrSuperAdmin = req.user?.roles?.some(
        (r) => r === 'admin' || r === 'super_admin',
      );

      let resolvedTenantDbId: number | null = null;
      let resolvedAzureTenantId: string | null = null;

      if (actorUserId) {
        const memberRows = await db
          .select({ orgId: orgMembersTable.orgId })
          .from(orgMembersTable)
          .where(eq(orgMembersTable.userId, actorUserId));
        const orgIds = memberRows.map((r) => r.orgId).filter((id): id is number => id !== null);
        if (orgIds.length > 0) {
          const activeTenant = await db
            .select({ id: azureTenantsTable.id, azureTenantId: azureTenantsTable.azureTenantId })
            .from(azureTenantsTable)
            .where(
              and(
                inArray(azureTenantsTable.organizationId, orgIds),
                eq(azureTenantsTable.status, 'active'),
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
        await db
          .insert(auditLogsTable)
          .values({
            actorUserId,
            actionType: 'powerbi_embed_token_denied',
            entityType: 'powerbi_report',
            entityId: reportKey,
            payloadJson: { reportKey, reason: 'no_active_tenant_for_user' },
          })
          .catch(() => {});
        sendForbidden(res, 'No active Azure tenant associated with your account.');
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
        sendBadRequest(
          res,
          'Power BI is not configured for this tenant. Contact your administrator.',
        );
        return;
      }

      const reportId: string | undefined = cfg.reportIds[reportKey];
      if (!reportId) {
        await db
          .insert(auditLogsTable)
          .values({
            actorUserId,
            actionType: 'powerbi_embed_token_denied',
            entityType: 'powerbi_report',
            entityId: reportKey,
            payloadJson: {
              reportKey,
              azureTenantId: resolvedAzureTenantId,
              reason: 'unknown_report_key',
            },
          })
          .catch(() => {});
        sendBadRequest(res, `Unknown reportKey '${reportKey}'. Configure it in Admin → Power BI.`);
        return;
      }

      const datasetId: string | undefined = cfg.datasetIds?.[reportKey];
      const callerUsername =
        req.user?.email ?? req.user?.displayName ?? String(actorUserId ?? 'anonymous');

      const tokenUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        scope: 'https://analysis.windows.net/powerbi/api/.default',
      });

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({}));
        await db
          .insert(auditLogsTable)
          .values({
            actorUserId,
            actionType: 'powerbi_embed_token_denied',
            entityType: 'powerbi_report',
            entityId: reportKey,
            payloadJson: {
              reportKey,
              azureTenantId: resolvedAzureTenantId,
              reason: 'azure_token_failure',
            },
          })
          .catch(() => {});
        sendError(
          res,
          `Failed to acquire Azure AD token: ${(errJson as { error_description?: string }).error_description ?? tokenRes.status}`,
          502,
          'UPSTREAM_ERROR',
        );
        return;
      }

      const tokenData = (await tokenRes.json()) as { access_token: string };
      const aadToken = tokenData.access_token;

      interface GenerateTokenBody {
        accessLevel: string;
        identities?: Array<{ username: string; roles: string[]; datasets: string[] }>;
      }
      const generateTokenBody: GenerateTokenBody = { accessLevel: 'view' };
      if (cfg.rlsEnabled && datasetId) {
        generateTokenBody.identities = [
          {
            username: callerUsername,
            roles: req.user?.roles ?? ['viewer'],
            datasets: [datasetId],
          },
        ];
      }

      const embedRes = await fetch(
        `https://api.powerbi.com/v1.0/myorg/groups/${cfg.groupId}/reports/${reportId}/GenerateToken`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${aadToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(generateTokenBody),
        },
      );

      if (!embedRes.ok) {
        const errJson = await embedRes.json().catch(() => ({}));
        await db
          .insert(auditLogsTable)
          .values({
            actorUserId,
            actionType: 'powerbi_embed_token_denied',
            entityType: 'powerbi_report',
            entityId: reportKey,
            payloadJson: {
              reportKey,
              azureTenantId: resolvedAzureTenantId,
              reason: 'embed_token_failure',
              detail: JSON.stringify(errJson),
            },
          })
          .catch(() => {});
        sendError(
          res,
          `Failed to generate embed token: ${JSON.stringify(errJson)}`,
          502,
          'UPSTREAM_ERROR',
        );
        return;
      }

      const embedData = (await embedRes.json()) as {
        token: string;
        tokenId: string;
        expiration: string;
      };

      await db
        .insert(auditLogsTable)
        .values({
          actorUserId,
          actionType: 'powerbi_embed_token_issued',
          entityType: 'powerbi_report',
          entityId: reportKey,
          payloadJson: {
            reportKey,
            tokenId: embedData.tokenId,
            expiration: embedData.expiration,
            azureTenantId: resolvedAzureTenantId,
            rlsApplied: !!generateTokenBody.identities,
          },
        })
        .catch(() => {});

      sendSuccess(res, {
        embedToken: embedData.token,
        tokenId: embedData.tokenId,
        expiration: embedData.expiration,
        embedUrl: `https://embedded.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${cfg.groupId}`,
        reportId,
        groupId: cfg.groupId,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate Power BI embed token');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
