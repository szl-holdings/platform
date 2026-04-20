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
  scimSyncUsersSchema,
  tenantCreateSchema,
  tenantStatusSchema,
  validateBody,
} from '../../lib/validation';
import { authMiddleware, requireRole } from '../../middlewares/auth';
import { deprovisionUserSchema, linkOrganizationSchema, tenantRateLimit } from './shared';

const router: IRouter = Router();

router.post(
  '/admin/tenants/:id/scim/deprovision-user',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  validateBody(deprovisionUserSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid tenant ID');
        return;
      }

      const { userId, reason } = req.body ?? {};
      if (!userId) {
        sendBadRequest(res, 'userId is required');
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant || !tenant.organizationId) {
        sendNotFound(res, 'Tenant');
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
        sendNotFound(res, 'User membership');
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
        message: 'User deprovisioned from tenant organization',
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        userId: Number(userId),
        reason: reason ?? 'Manual deprovision via SCIM',
        deprovisionedAt: new Date().toISOString(),
        nextSteps: [
          "Revoke the user's Azure AD session tokens if applicable.",
          'Remove any application roles assigned to the user in Azure AD.',
        ],
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to deprovision user from tenant');
    }
  },
);

router.post(
  '/admin/tenants/:id/scim/sync-users',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  validateBody(scimSyncUsersSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid tenant ID');
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant || !tenant.organizationId) {
        sendNotFound(res, 'Tenant');
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

      const activeMembers = members.filter((m) => m.isActive);
      const inactiveMembers = members.filter((m) => !m.isActive);

      sendSuccess(res, {
        source: 'SCIM-style User Sync — Azure AD Tenant Membership',
        tenantId: tenant.azureTenantId,
        tenantName: tenant.displayName,
        organizationId: tenant.organizationId,
        summary: {
          totalMembers: members.length,
          activeMembers: activeMembers.length,
          inactiveMembers: inactiveMembers.length,
        },
        members: activeMembers.map((m) => ({
          userId: m.userId,
          displayName: m.displayName,
          email: m.email,
          orgRole: m.role,
          joinedAt: m.joinedAt,
        })),
        inactiveUsers: inactiveMembers.map((m) => ({
          userId: m.userId,
          displayName: m.displayName,
          email: m.email,
          orgRole: m.role,
        })),
        syncedAt: new Date().toISOString(),
        recommendation:
          inactiveMembers.length > 0
            ? `${inactiveMembers.length} inactive user(s) still have org membership. Consider deprovisioning them.`
            : 'All org members are active.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to sync tenant users');
    }
  },
);

router.patch(
  '/admin/tenants/:id/organization',
  tenantRateLimit,
  authMiddleware(),
  requireRole('admin'),
  validateBody(linkOrganizationSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid tenant ID');
        return;
      }

      const { organizationId } = req.body ?? {};
      if (organizationId === undefined) {
        sendBadRequest(res, 'organizationId is required (set to null to unlink)');
        return;
      }

      const [tenant] = await db
        .select()
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.id, id))
        .limit(1);

      if (!tenant) {
        sendNotFound(res, 'Tenant');
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
          : 'Tenant unlinked from organization',
        tenant: updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update tenant organization link');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
