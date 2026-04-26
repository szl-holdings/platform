/**
 * Enterprise MCP Authorization — Admin Routes
 *
 * Admin-facing CRUD for enterprise IdP registry, provisioned MCP user management,
 * and audit trail access for the ID-JAG enterprise authorization flow.
 *
 * All routes are scoped under `/admin/tenants/:id/enterprise-mcp/` and require
 * the `admin` role.
 *
 * Database-backed routes mirror the in-memory registry in the substrate-mcp-gateway
 * service, which is updated at runtime via the gateway's admin API.
 */

import {
  azureTenantsTable,
  db,
  enterpriseIdpRegistryTable,
  mcpEnterpriseAuditTable,
  mcpRevokedSubjectsTable,
  orgMembersTable,
  usersTable,
} from '@szl-holdings/db';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { logActivity } from '../../lib/activity-logger';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../../lib/api-response';
import { authMiddleware, requireRole } from '../../middlewares/auth';
import { tenantRateLimit } from './shared';

const router: IRouter = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createIdpSchema = z.object({
  name: z.string().min(1).max(120),
  issuerUrl: z.string().url(),
  jwksUri: z.string().url(),
  expectedAudience: z.string().min(1),
  claimsToRoleMapping: z
    .object({
      groups: z.record(z.string()).optional(),
      roles: z.record(z.string()).optional(),
      customClaims: z
        .array(z.object({ claim: z.string(), value: z.string(), role: z.string() }))
        .optional(),
    })
    .optional()
    .default({}),
  autoProvisionUsers: z.boolean().optional().default(false),
  defaultRole: z.string().optional().default('viewer'),
  enabled: z.boolean().optional().default(true),
  jwksCacheTtlSeconds: z.number().int().min(60).max(86400).optional().default(3600),
  requireEmailVerified: z.boolean().optional().default(true),
  notes: z.string().max(1000).optional().nullable(),
});

const updateIdpSchema = createIdpSchema.partial();

const revokeSubjectSchema = z.object({
  issuer: z.string().min(1),
  subject: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveTenant(id: number) {
  const [tenant] = await db
    .select()
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.id, id))
    .limit(1);
  return tenant ?? null;
}

async function pushIdpToGateway(idp: typeof enterpriseIdpRegistryTable.$inferSelect): Promise<void> {
  const gatewayBase = process.env.MCP_GATEWAY_BASE_URL;
  const gatewayKey = process.env.SUBSTRATE_GATEWAY_API_KEY;
  if (!gatewayBase || !gatewayKey) return;

  try {
    await fetch(`${gatewayBase}/mcp/enterprise/idps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify({
        id: String(idp.id),
        tenantId: String(idp.tenantId),
        name: idp.name,
        issuerUrl: idp.issuerUrl,
        jwksUri: idp.jwksUri,
        expectedAudience: idp.expectedAudience,
        claimsToRoleMapping: idp.claimsToRoleMapping ?? {},
        autoProvisionUsers: idp.autoProvisionUsers,
        defaultRole: idp.defaultRole,
        enabled: idp.enabled,
        jwksCacheTtlSeconds: idp.jwksCacheTtlSeconds,
        requireEmailVerified: idp.requireEmailVerified,
        notes: idp.notes,
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Gateway sync is best-effort; DB is the source of truth
  }
}

// Notify the gateway to unregister an IdP when it is deleted from DB.
// Prevents the gateway from continuing to trust a deleted IdP's tokens.
async function deleteIdpFromGateway(issuerUrl: string): Promise<void> {
  const gatewayBase = process.env.MCP_GATEWAY_BASE_URL;
  const gatewayKey = process.env.SUBSTRATE_GATEWAY_API_KEY;
  if (!gatewayBase || !gatewayKey) return;

  try {
    await fetch(`${gatewayBase}/mcp/enterprise/idps`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify({ issuerUrl }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Best-effort; gateway will still reject the IdP on next startup sync
  }
}

// ─── IdP Registry CRUD ────────────────────────────────────────────────────────

router.get(
  '/admin/tenants/:id/enterprise-mcp/idps',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) { sendBadRequest(res, 'Invalid tenant ID'); return; }

      const tenant = await resolveTenant(id);
      if (!tenant) { sendNotFound(res, 'Tenant'); return; }

      const idps = await db
        .select()
        .from(enterpriseIdpRegistryTable)
        .where(eq(enterpriseIdpRegistryTable.tenantId, id))
        .orderBy(desc(enterpriseIdpRegistryTable.createdAt));

      sendSuccess(res, {
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        count: idps.length,
        idps: idps.map((idp) => ({
          id: idp.id,
          name: idp.name,
          issuerUrl: idp.issuerUrl,
          jwksUri: idp.jwksUri,
          expectedAudience: idp.expectedAudience,
          claimsToRoleMapping: idp.claimsToRoleMapping,
          autoProvisionUsers: idp.autoProvisionUsers,
          defaultRole: idp.defaultRole,
          enabled: idp.enabled,
          jwksCacheTtlSeconds: idp.jwksCacheTtlSeconds,
          requireEmailVerified: idp.requireEmailVerified,
          notes: idp.notes,
          createdAt: idp.createdAt,
          updatedAt: idp.updatedAt,
        })),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list enterprise IdPs');
    }
  },
);

router.post(
  '/admin/tenants/:id/enterprise-mcp/idps',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) { sendBadRequest(res, 'Invalid tenant ID'); return; }

      const tenant = await resolveTenant(id);
      if (!tenant) { sendNotFound(res, 'Tenant'); return; }

      const parsed = createIdpSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; '));
        return;
      }

      const existing = await db
        .select({ id: enterpriseIdpRegistryTable.id })
        .from(enterpriseIdpRegistryTable)
        .where(
          and(
            eq(enterpriseIdpRegistryTable.tenantId, id),
            eq(enterpriseIdpRegistryTable.issuerUrl, parsed.data.issuerUrl),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        sendError(res, 'An IdP with this issuer URL is already registered for this tenant', 409, 'CONFLICT');
        return;
      }

      const [created] = await db
        .insert(enterpriseIdpRegistryTable)
        .values({
          tenantId: id,
          name: parsed.data.name,
          issuerUrl: parsed.data.issuerUrl,
          jwksUri: parsed.data.jwksUri,
          expectedAudience: parsed.data.expectedAudience,
          claimsToRoleMapping: parsed.data.claimsToRoleMapping,
          autoProvisionUsers: parsed.data.autoProvisionUsers,
          defaultRole: parsed.data.defaultRole,
          enabled: parsed.data.enabled,
          jwksCacheTtlSeconds: parsed.data.jwksCacheTtlSeconds,
          requireEmailVerified: parsed.data.requireEmailVerified,
          notes: parsed.data.notes ?? null,
          createdByUserId: req.user?.id ?? null,
        })
        .returning();

      if (created) {
        void pushIdpToGateway(created);
      }

      await logActivity(
        req,
        'create',
        'enterprise_idp',
        String(created!.id),
        `Enterprise IdP registered: ${parsed.data.name} (${parsed.data.issuerUrl}) for tenant ${tenant.displayName}`,
      ).catch(() => {});

      sendSuccess(res, {
        message: 'Enterprise IdP registered successfully',
        idp: created,
        nextSteps: [
          `Share the token endpoint URL with your IdP admin: POST /mcp/token`,
          `Set grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer and assertion=<ID-JAG JWT>`,
          `Configure the revocation webhook at POST /mcp/revoke with header x-revocation-secret`,
        ],
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to register enterprise IdP');
    }
  },
);

router.get(
  '/admin/tenants/:id/enterprise-mcp/idps/:idpId',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const idpId = parseInt(String(req.params.idpId), 10);
      if (Number.isNaN(id) || Number.isNaN(idpId)) { sendBadRequest(res, 'Invalid ID'); return; }

      const [idp] = await db
        .select()
        .from(enterpriseIdpRegistryTable)
        .where(
          and(
            eq(enterpriseIdpRegistryTable.id, idpId),
            eq(enterpriseIdpRegistryTable.tenantId, id),
          ),
        )
        .limit(1);

      if (!idp) { sendNotFound(res, 'Enterprise IdP'); return; }

      const recentAudit = await db
        .select()
        .from(mcpEnterpriseAuditTable)
        .where(eq(mcpEnterpriseAuditTable.idpId, idpId))
        .orderBy(desc(mcpEnterpriseAuditTable.createdAt))
        .limit(20);

      sendSuccess(res, { idp, recentAudit });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get enterprise IdP');
    }
  },
);

router.patch(
  '/admin/tenants/:id/enterprise-mcp/idps/:idpId',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const idpId = parseInt(String(req.params.idpId), 10);
      if (Number.isNaN(id) || Number.isNaN(idpId)) { sendBadRequest(res, 'Invalid ID'); return; }

      const [existing] = await db
        .select()
        .from(enterpriseIdpRegistryTable)
        .where(
          and(
            eq(enterpriseIdpRegistryTable.id, idpId),
            eq(enterpriseIdpRegistryTable.tenantId, id),
          ),
        )
        .limit(1);

      if (!existing) { sendNotFound(res, 'Enterprise IdP'); return; }

      const parsed = updateIdpSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; '));
        return;
      }

      const updates: Partial<typeof enterpriseIdpRegistryTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (parsed.data.name !== undefined) updates.name = parsed.data.name;
      if (parsed.data.jwksUri !== undefined) updates.jwksUri = parsed.data.jwksUri;
      if (parsed.data.expectedAudience !== undefined) updates.expectedAudience = parsed.data.expectedAudience;
      if (parsed.data.claimsToRoleMapping !== undefined) updates.claimsToRoleMapping = parsed.data.claimsToRoleMapping;
      if (parsed.data.autoProvisionUsers !== undefined) updates.autoProvisionUsers = parsed.data.autoProvisionUsers;
      if (parsed.data.defaultRole !== undefined) updates.defaultRole = parsed.data.defaultRole;
      if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
      if (parsed.data.jwksCacheTtlSeconds !== undefined) updates.jwksCacheTtlSeconds = parsed.data.jwksCacheTtlSeconds;
      if (parsed.data.requireEmailVerified !== undefined) updates.requireEmailVerified = parsed.data.requireEmailVerified;
      if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

      const [updated] = await db
        .update(enterpriseIdpRegistryTable)
        .set(updates)
        .where(eq(enterpriseIdpRegistryTable.id, idpId))
        .returning();

      if (updated) {
        void pushIdpToGateway(updated);
      }

      sendSuccess(res, { idp: updated, message: 'Enterprise IdP updated' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update enterprise IdP');
    }
  },
);

router.delete(
  '/admin/tenants/:id/enterprise-mcp/idps/:idpId',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const idpId = parseInt(String(req.params.idpId), 10);
      if (Number.isNaN(id) || Number.isNaN(idpId)) { sendBadRequest(res, 'Invalid ID'); return; }

      const [deleted] = await db
        .delete(enterpriseIdpRegistryTable)
        .where(
          and(
            eq(enterpriseIdpRegistryTable.id, idpId),
            eq(enterpriseIdpRegistryTable.tenantId, id),
          ),
        )
        .returning();

      if (!deleted) { sendNotFound(res, 'Enterprise IdP'); return; }

      // Unregister from gateway immediately so it stops accepting tokens from this IdP.
      // Without this, the gateway's in-memory registry would retain the deleted IdP until restart.
      void deleteIdpFromGateway(deleted.issuerUrl);

      await logActivity(
        req,
        'delete',
        'enterprise_idp',
        String(idpId),
        `Enterprise IdP removed: ${deleted.name} (${deleted.issuerUrl})`,
      ).catch(() => {});

      sendSuccess(res, { message: 'Enterprise IdP removed', deleted });
    } catch (err) {
      handleRouteError(res, err, 'Failed to remove enterprise IdP');
    }
  },
);

// ─── Provisioned MCP Users ────────────────────────────────────────────────────

router.get(
  '/admin/tenants/:id/enterprise-mcp/users',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) { sendBadRequest(res, 'Invalid tenant ID'); return; }

      const tenant = await resolveTenant(id);
      if (!tenant) { sendNotFound(res, 'Tenant'); return; }

      const users = await db
        .select({
          eventType: mcpEnterpriseAuditTable.eventType,
          subject: mcpEnterpriseAuditTable.subject,
          email: mcpEnterpriseAuditTable.email,
          mappedRole: mcpEnterpriseAuditTable.mappedRole,
          mcpScope: mcpEnterpriseAuditTable.mcpScope,
          issuer: mcpEnterpriseAuditTable.issuer,
          userId: mcpEnterpriseAuditTable.userId,
          createdAt: mcpEnterpriseAuditTable.createdAt,
        })
        .from(mcpEnterpriseAuditTable)
        .where(
          and(
            eq(mcpEnterpriseAuditTable.tenantId, id),
            eq(mcpEnterpriseAuditTable.eventType, 'token_issued'),
          ),
        )
        .orderBy(desc(mcpEnterpriseAuditTable.createdAt))
        .limit(200);

      const uniqueBySubject = new Map<string, typeof users[0]>();
      for (const u of users) {
        const key = `${u.issuer}|${u.subject}`;
        if (!uniqueBySubject.has(key)) uniqueBySubject.set(key, u);
      }

      const revokedSubjects = await db
        .select({ issuer: mcpRevokedSubjectsTable.issuer, subject: mcpRevokedSubjectsTable.subject })
        .from(mcpRevokedSubjectsTable)
        .where(eq(mcpRevokedSubjectsTable.tenantId, id));

      const revokedKeys = new Set(revokedSubjects.map((r) => `${r.issuer}|${r.subject}`));

      sendSuccess(res, {
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        provisionedUsers: Array.from(uniqueBySubject.values()).map((u) => ({
          subject: u.subject,
          email: u.email,
          mappedRole: u.mappedRole,
          mcpScope: u.mcpScope,
          issuer: u.issuer,
          userId: u.userId,
          lastAccessAt: u.createdAt,
          revoked: revokedKeys.has(`${u.issuer}|${u.subject}`),
        })),
        revokedCount: revokedSubjects.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list enterprise MCP users');
    }
  },
);

// ─── Audit Log ────────────────────────────────────────────────────────────────

router.get(
  '/admin/tenants/:id/enterprise-mcp/audit',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) { sendBadRequest(res, 'Invalid tenant ID'); return; }

      const tenant = await resolveTenant(id);
      if (!tenant) { sendNotFound(res, 'Tenant'); return; }

      const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
      const eventType = req.query.eventType as string | undefined;
      const rawIdpId = req.query.idpId ? parseInt(String(req.query.idpId), 10) : null;
      const idpIdFilter = rawIdpId && !isNaN(rawIdpId) ? rawIdpId : null;

      const conditions = [
        eq(mcpEnterpriseAuditTable.tenantId, id),
        ...(eventType ? [eq(mcpEnterpriseAuditTable.eventType, eventType as 'idjag_validation_success')] : []),
        ...(idpIdFilter !== null ? [eq(mcpEnterpriseAuditTable.idpId, idpIdFilter)] : []),
      ];

      const baseQuery = db
        .select()
        .from(mcpEnterpriseAuditTable)
        .where(and(...conditions))
        .orderBy(desc(mcpEnterpriseAuditTable.createdAt))
        .limit(limit);

      const events = await baseQuery;

      sendSuccess(res, {
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        count: events.length,
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          issuer: e.issuer,
          subject: e.subject,
          email: e.email,
          mappedRole: e.mappedRole,
          mcpScope: e.mcpScope,
          errorCode: e.errorCode,
          errorMessage: e.errorMessage,
          metadata: e.metadata,
          ipAddress: e.ipAddress,
          createdAt: e.createdAt,
        })),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get enterprise MCP audit log');
    }
  },
);

// ─── Revocation ───────────────────────────────────────────────────────────────

router.post(
  '/admin/tenants/:id/enterprise-mcp/revoke',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) { sendBadRequest(res, 'Invalid tenant ID'); return; }

      const tenant = await resolveTenant(id);
      if (!tenant) { sendNotFound(res, 'Tenant'); return; }

      const parsed = revokeSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; '));
        return;
      }

      const { issuer, subject, reason } = parsed.data;

      const [idp] = await db
        .select({ id: enterpriseIdpRegistryTable.id })
        .from(enterpriseIdpRegistryTable)
        .where(
          and(
            eq(enterpriseIdpRegistryTable.tenantId, id),
            eq(enterpriseIdpRegistryTable.issuerUrl, issuer),
          ),
        )
        .limit(1);

      await db.insert(mcpRevokedSubjectsTable).values({
        tenantId: id,
        idpId: idp?.id ?? null,
        issuer,
        subject,
        revokedAt: new Date(),
        revokedBy: req.user ? `admin:${req.user.id}` : 'admin',
        reason: reason ?? null,
      }).onConflictDoNothing();

      await db.insert(mcpEnterpriseAuditTable).values({
        tenantId: id,
        idpId: idp?.id ?? null,
        eventType: 'token_revoked',
        issuer,
        subject,
        errorMessage: reason ?? null,
        metadata: { revokedBy: req.user?.id, reason, adminAction: true },
        ipAddress: req.ip ?? null,
      });

      const gatewayBase = process.env.MCP_GATEWAY_BASE_URL;
      const gatewaySecret = process.env.MCP_REVOCATION_WEBHOOK_SECRET;
      if (gatewayBase && gatewaySecret) {
        void fetch(`${gatewayBase}/mcp/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-revocation-secret': gatewaySecret,
          },
          body: JSON.stringify({ issuer, subject, reason, revokedBy: `admin:${req.user?.id}` }),
          signal: AbortSignal.timeout(5_000),
        }).catch(() => {});
      }

      await logActivity(
        req,
        'update',
        'enterprise_mcp_subject',
        `${issuer}|${subject}`,
        `Enterprise MCP subject revoked: ${subject} from ${issuer}`,
      ).catch(() => {});

      sendSuccess(res, {
        message: 'Subject revoked from enterprise MCP access',
        issuer,
        subject,
        reason,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to revoke enterprise MCP subject');
    }
  },
);

// ─── Internal Audit Ingest (called by the gateway service) ───────────────────

router.post(
  '/enterprise-mcp/audit',
  async (req: Request, res: Response) => {
    const internalToken = req.headers['x-internal-token'];
    if (!internalToken || typeof internalToken !== 'string') {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const { verifyInternalHeader } = await import('../../lib/internal-tokens');
    if (!verifyInternalHeader(internalToken, req.originalUrl || req.url)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const eventType = body.eventType as string;

      const validEventTypes = [
        'idjag_validation_success',
        'idjag_validation_failure',
        'token_issued',
        'token_revoked',
        'user_linked',
        'user_provisioned',
        'revocation_webhook',
      ];

      if (!eventType || !validEventTypes.includes(eventType)) {
        res.status(400).json({ error: 'invalid_event_type' });
        return;
      }

      const rawTenantId = body.tenantId;
      const rawIdpId = body.idpId;
      const parsedTenantId = rawTenantId ? parseInt(String(rawTenantId), 10) : null;
      const parsedIdpId = rawIdpId ? parseInt(String(rawIdpId), 10) : null;

      await db.insert(mcpEnterpriseAuditTable).values({
        eventType: eventType as typeof mcpEnterpriseAuditTable.$inferInsert['eventType'],
        tenantId: parsedTenantId && !isNaN(parsedTenantId) ? parsedTenantId : null,
        idpId: parsedIdpId && !isNaN(parsedIdpId) ? parsedIdpId : null,
        issuer: (body.issuer as string) ?? null,
        subject: (body.subject as string) ?? null,
        email: (body.email as string) ?? null,
        mappedRole: (body.mappedRole as string) ?? null,
        mcpScope: (body.mcpScope as string) ?? null,
        errorCode: (body.errorCode as string) ?? null,
        errorMessage: (body.errorMessage as string) ?? null,
        metadata: (body.metadata as Record<string, unknown>) ?? {},
        ipAddress: (body.ipAddress as string) ?? null,
      });

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: 'Failed to record audit event' });
    }
  },
);

// ─── Internal User Linking / Auto-Provisioning (called by gateway) ───────────

router.post(
  '/enterprise-mcp/link-user',
  async (req: Request, res: Response) => {
    const internalToken = req.headers['x-internal-token'];
    if (!internalToken || typeof internalToken !== 'string') {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const { verifyInternalHeader } = await import('../../lib/internal-tokens');
    if (!verifyInternalHeader(internalToken, req.originalUrl || req.url)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const email = body.email as string | null | undefined;
      const subject = body.subject as string | undefined;
      const autoProvision = body.autoProvision === true;
      const rawTenantId = body.tenantId;
      const rawIdpId = body.idpId;
      const parsedTenantId = rawTenantId ? parseInt(String(rawTenantId), 10) : null;
      const parsedIdpId = rawIdpId ? parseInt(String(rawIdpId), 10) : null;

      if (!subject) {
        res.status(400).json({ error: 'subject is required' });
        return;
      }

      let userId: number | null = null;

      // Step 1: Subject-based identity lookup (durable — survives email changes).
      // The audit table records every user_linked and user_provisioned event with
      // (issuer, subject, userId). Use this as the primary lookup so repeated
      // assertion exchanges from the same IdP subject always resolve to the same user.
      if (body.issuer && subject) {
        const [previousLink] = await db
          .select({ userId: mcpEnterpriseAuditTable.userId })
          .from(mcpEnterpriseAuditTable)
          .where(
            and(
              eq(mcpEnterpriseAuditTable.issuer, body.issuer as string),
              eq(mcpEnterpriseAuditTable.subject, subject),
              isNotNull(mcpEnterpriseAuditTable.userId),
            ),
          )
          .orderBy(desc(mcpEnterpriseAuditTable.createdAt))
          .limit(1);
        if (previousLink?.userId != null) {
          userId = previousLink.userId;
        }
      }

      // Step 2: Email-based fallback (for first-time logins where no prior audit entry exists).
      if (!userId && email) {
        const [found] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .limit(1);
        if (found) {
          userId = found.id;
          await db.insert(mcpEnterpriseAuditTable).values({
            eventType: 'user_linked',
            tenantId: parsedTenantId && !isNaN(parsedTenantId) ? parsedTenantId : null,
            idpId: parsedIdpId && !isNaN(parsedIdpId) ? parsedIdpId : null,
            issuer: (body.issuer as string) ?? null,
            subject,
            email,
            userId,
            ipAddress: (body.ipAddress as string) ?? null,
            metadata: { autoProvision },
          });
        }
      }

      if (!userId && autoProvision) {
        const mappedRole = (body.mappedRole as string | undefined) ?? 'viewer';
        const displayName =
          (body.displayName as string | undefined) ??
          (email ? email.split('@')[0] : null) ??
          subject.split('@')[0] ??
          'Enterprise User';

        // Map MCP role → platform role stored on the user record.
        const platformRole = ((): 'operator' | 'pilot_customer_user' => {
          if (mappedRole === 'mcp_admin' || mappedRole === 'operator') return 'operator';
          return 'pilot_customer_user';
        })();

        // Map MCP role → org membership role used in orgMembersTable.
        const orgRole = ((): 'admin' | 'member' | 'viewer' => {
          if (mappedRole === 'mcp_admin') return 'admin';
          if (mappedRole === 'operator') return 'member';
          return 'viewer';
        })();

        try {
          const [newUser] = await db
            .insert(usersTable)
            .values({
              email: email ?? null,
              displayName,
              platformRole,
              isActive: true,
            })
            .returning({ id: usersTable.id });

          if (newUser) {
            userId = newUser.id;
            await db.insert(mcpEnterpriseAuditTable).values({
              eventType: 'user_provisioned',
              tenantId: parsedTenantId && !isNaN(parsedTenantId) ? parsedTenantId : null,
              idpId: parsedIdpId && !isNaN(parsedIdpId) ? parsedIdpId : null,
              issuer: (body.issuer as string) ?? null,
              subject,
              email: email ?? null,
              mappedRole,
              userId,
              ipAddress: (body.ipAddress as string) ?? null,
              metadata: { autoProvision, displayName, platformRole, orgRole },
            });

            // Link the provisioned user to the tenant's org if the tenant has one.
            if (parsedTenantId && !isNaN(parsedTenantId)) {
              const [tenantRow] = await db
                .select({ organizationId: azureTenantsTable.organizationId })
                .from(azureTenantsTable)
                .where(eq(azureTenantsTable.id, parsedTenantId))
                .limit(1);

              if (tenantRow?.organizationId != null) {
                await db
                  .insert(orgMembersTable)
                  .values({ orgId: tenantRow.organizationId, userId: newUser.id, role: orgRole })
                  .onConflictDoNothing();
              }
            }
          }
        } catch (provisionErr: unknown) {
          const msg = provisionErr instanceof Error ? provisionErr.message : String(provisionErr);
          await db.insert(mcpEnterpriseAuditTable).values({
            eventType: 'user_provisioned',
            tenantId: parsedTenantId && !isNaN(parsedTenantId) ? parsedTenantId : null,
            idpId: parsedIdpId && !isNaN(parsedIdpId) ? parsedIdpId : null,
            issuer: (body.issuer as string) ?? null,
            subject,
            email: email ?? null,
            ipAddress: (body.ipAddress as string) ?? null,
            metadata: { autoProvision, error: msg },
          });
        }
      }

      res.json({ userId, linked: userId !== null, provisioned: userId !== null && !!(body.autoProvision) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to link enterprise user' });
    }
  },
);

// GET /api/enterprise-mcp/idp-configs
// Internal endpoint — called by the gateway at startup to bulk-load all enabled
// IdP configurations from DB into its in-memory registry. This ensures the gateway
// never starts with an empty IdP registry after a restart or redeploy.
router.get(
  '/enterprise-mcp/idp-configs',
  async (req: Request, res: Response) => {
    const internalToken = req.headers['x-internal-token'];
    if (!internalToken || typeof internalToken !== 'string') {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { verifyInternalHeader } = await import('../../lib/internal-tokens');
    if (!verifyInternalHeader(internalToken, req.originalUrl || req.url)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const idps = await db
        .select()
        .from(enterpriseIdpRegistryTable)
        .where(eq(enterpriseIdpRegistryTable.enabled, true));

      const configs = idps.map((idp) => ({
        id: String(idp.id),
        tenantId: String(idp.tenantId),
        name: idp.name,
        issuerUrl: idp.issuerUrl,
        jwksUri: idp.jwksUri,
        expectedAudience: idp.expectedAudience,
        claimsToRoleMapping: idp.claimsToRoleMapping ?? {},
        autoProvisionUsers: idp.autoProvisionUsers,
        defaultRole: idp.defaultRole,
        enabled: idp.enabled,
        jwksCacheTtlSeconds: idp.jwksCacheTtlSeconds,
        requireEmailVerified: idp.requireEmailVerified,
        notes: idp.notes,
      }));

      res.json({ idps: configs, count: configs.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch IdP configurations' });
    }
  },
);

// POST /api/enterprise-mcp/internal-revoke
// Internal endpoint — called by the gateway to persist a revoked subject to the DB.
// This ensures revocation survives gateway restarts and multi-instance deployments.
router.post(
  '/enterprise-mcp/internal-revoke',
  async (req: Request, res: Response) => {
    const internalToken = req.headers['x-internal-token'];
    if (!internalToken || typeof internalToken !== 'string') {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { verifyInternalHeader } = await import('../../lib/internal-tokens');
    if (!verifyInternalHeader(internalToken, req.originalUrl || req.url)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const { issuer, subject, reason, revokedBy } = body;
      if (!issuer || !subject) {
        res.status(400).json({ error: 'issuer and subject are required' });
        return;
      }

      await db
        .insert(mcpRevokedSubjectsTable)
        .values({
          tenantId: null,
          idpId: null,
          issuer: issuer as string,
          subject: subject as string,
          revokedBy: (revokedBy as string) ?? 'idp-webhook',
          reason: (reason as string) ?? null,
        })
        .onConflictDoNothing();

      res.json({ ok: true, issuer, subject });
    } catch (err) {
      res.status(500).json({ error: 'Failed to persist revocation' });
    }
  },
);

// GET /api/enterprise-mcp/revoked-subjects
// Internal endpoint — returns all revoked (issuer, subject) pairs so the gateway
// can pre-load them into its in-memory set at startup.
router.get(
  '/enterprise-mcp/revoked-subjects',
  async (req: Request, res: Response) => {
    const internalToken = req.headers['x-internal-token'];
    if (!internalToken || typeof internalToken !== 'string') {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { verifyInternalHeader } = await import('../../lib/internal-tokens');
    if (!verifyInternalHeader(internalToken, req.originalUrl || req.url)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const rows = await db
        .select({ issuer: mcpRevokedSubjectsTable.issuer, subject: mcpRevokedSubjectsTable.subject })
        .from(mcpRevokedSubjectsTable);

      res.json({ subjects: rows, count: rows.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch revoked subjects' });
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
