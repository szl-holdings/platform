/**
 * Invited-User Onboarding Flow
 *
 * POST   /api/orgs/:orgSlug/invite          — send invitation (org admin/owner only)
 * GET    /api/orgs/accept-invite            — validate invite token (returns org info)
 * POST   /api/orgs/accept-invite            — accept invitation (authenticated user)
 * DELETE /api/orgs/:orgSlug/invitations/:id — revoke pending invitation
 * GET    /api/orgs/:orgSlug/invitations     — list pending invitations
 */

import { hashIp } from '@szl-holdings/audit';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  auditEventsTable,
  db,
  organizationsTable,
  orgInvitationsTable,
  orgMembersTable,
} from '@szl-holdings/db';
import { and, eq, } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendForbidden,
  sendNotFound,
  sendUnauthorized,
} from '../lib/api-response';
import { createOrgInvitation } from '../lib/invitation-service';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { writeLimiter } from '../middlewares/rate-limiters';

const router = Router();

const _INVITE_TTL = 7 * 24 * 60 * 60 * 1000;

const inviteBodySchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const ORG_ROLE_HIERARCHY: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

type AuditInsert = typeof auditEventsTable.$inferInsert;

async function writeAuditEvent(params: {
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  newValues?: Record<string, unknown>;
}) {
  try {
    const row: AuditInsert = {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      ipAddress: hashIp(params.ipAddress ?? null),
      newValues: params.newValues ?? null,
    };
    await db.insert(auditEventsTable).values(row);
  } catch (err) {
    logger.error({ err }, 'Failed to write invitation audit event');
  }
}

async function resolveOrgAndCheckAdminRole(
  req: Request,
  res: Response,
  orgSlug: string,
): Promise<{ id: number; name: string } | null> {
  const user = req.user;
  if (!user) {
    sendUnauthorized(res, 'Authentication required');
    return null;
  }

  const [org] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.slug, orgSlug))
    .limit(1);

  if (!org) {
    sendNotFound(res, 'Organization');
    return null;
  }

  const isElevated = user.roles.includes('super_admin') || user.roles.includes('admin');
  if (isElevated) return org;

  const membership = user.orgs.find((o) => o.orgSlug === orgSlug);
  if (!membership) {
    sendForbidden(res, 'Not a member of this organization');
    return null;
  }

  if ((ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY.admin) {
    sendForbidden(res, 'Insufficient organization role — admin or owner required');
    return null;
  }

  return org;
}

router.post(
  '/orgs/:orgSlug/invite',
  writeLimiter,
  authMiddleware(),
  validateBody(inviteBodySchema),
  async (req, res) => {
    try {
      const orgSlug = req.params.orgSlug as string;
      const { email, role } = req.body as z.infer<typeof inviteBodySchema>;

      const org = await resolveOrgAndCheckAdminRole(req, res, orgSlug);
      if (!org) return;

      // Delegate to the canonical invitation service. Org-settings uses
      // "reject" so a duplicate pending invite returns 409 instead of
      // silently superseding (matches the previous explicit-conflict UX).
      const result = await createOrgInvitation({
        orgId: org.id,
        orgName: org.name,
        email,
        role: role as 'admin' | 'member' | 'viewer',
        invitedByUserId: req.user?.id,
        ipAddress: req.ip,
        conflictMode: 'reject',
      });

      if (result.conflict) {
        sendError(res, 'A pending invitation already exists for this email', 409, 'CONFLICT');
        return;
      }

      res.status(201).json({
        id: result.invitation.id,
        email: result.invitation.email,
        role: result.invitation.role,
        expiresAt: result.invitation.expiresAt,
        inviteUrl: result.invitation.inviteUrl,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create invitation');
    }
  },
);

router.get('/orgs/accept-invite', validateQuery(listQuerySchema), async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      sendBadRequest(res, 'Invitation token is required');
      return;
    }

    const [invitation] = await db
      .select({
        id: orgInvitationsTable.id,
        orgId: orgInvitationsTable.orgId,
        email: orgInvitationsTable.email,
        role: orgInvitationsTable.role,
        status: orgInvitationsTable.status,
        expiresAt: orgInvitationsTable.expiresAt,
      })
      .from(orgInvitationsTable)
      .where(eq(orgInvitationsTable.token, token))
      .limit(1);

    if (!invitation) {
      sendNotFound(res, 'Invitation');
      return;
    }

    if (invitation.status === 'accepted') {
      sendError(res, 'This invitation has already been used', 410, 'GONE');
      return;
    }

    if (invitation.status === 'revoked') {
      sendError(res, 'This invitation has been revoked', 410, 'GONE');
      return;
    }

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      if (invitation.status !== 'expired') {
        await db
          .update(orgInvitationsTable)
          .set({ status: 'expired' })
          .where(eq(orgInvitationsTable.id, invitation.id));
      }
      sendError(res, 'This invitation has expired', 410, 'GONE');
      return;
    }

    const [org] = await db
      .select({ name: organizationsTable.name, slug: organizationsTable.slug })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, invitation.orgId))
      .limit(1);

    res.status(200).json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
      org: org ? { name: org.name, slug: org.slug } : null,
      expiresAt: invitation.expiresAt,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to validate invitation');
  }
});

router.post(
  '/orgs/accept-invite',
  authMiddleware(),
  validateBody(
    bodyShape({
      token: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { token } = req.body as { token?: string };

      if (!token || typeof token !== 'string') {
        sendBadRequest(res, 'Invitation token is required');
        return;
      }

      const [invitation] = await db
        .select()
        .from(orgInvitationsTable)
        .where(eq(orgInvitationsTable.token, token))
        .limit(1);

      if (!invitation) {
        sendNotFound(res, 'Invitation');
        return;
      }

      if (invitation.status === 'accepted') {
        sendError(res, 'This invitation has already been used', 410, 'GONE');
        return;
      }

      if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
        sendError(res, 'This invitation is no longer valid', 410, 'GONE');
        return;
      }

      const userEmail = (req.user?.email ?? '').toLowerCase();
      if (userEmail !== invitation.email.toLowerCase()) {
        await writeAuditEvent({
          userId: req.user?.id,
          action: 'invitation_accept_denied',
          entityType: 'org_invitation',
          entityId: String(invitation.id),
          ipAddress: req.ip,
          newValues: { reason: 'email_mismatch', invitedEmail: invitation.email },
        });
        sendForbidden(res, 'This invitation was not issued to your account');
        return;
      }

      const existingMembership = await db
        .select({ id: orgMembersTable.id })
        .from(orgMembersTable)
        .where(
          and(
            eq(orgMembersTable.orgId, invitation.orgId),
            eq(orgMembersTable.userId, req.user?.id),
          ),
        )
        .limit(1);

      if (existingMembership.length > 0) {
        await db
          .update(orgInvitationsTable)
          .set({
            status: 'accepted',
            acceptedByUserId: req.user?.id,
            acceptedAt: new Date(),
          })
          .where(eq(orgInvitationsTable.id, invitation.id));

        res.status(200).json({ message: 'You are already a member of this organization' });
        return;
      }

      await db.insert(orgMembersTable).values({
        orgId: invitation.orgId,
        userId: req.user?.id,
        role: invitation.role as 'admin' | 'member' | 'viewer',
      });

      await db
        .update(orgInvitationsTable)
        .set({
          status: 'accepted',
          acceptedByUserId: req.user?.id,
          acceptedAt: new Date(),
        })
        .where(eq(orgInvitationsTable.id, invitation.id));

      await writeAuditEvent({
        userId: req.user?.id,
        action: 'invitation_accepted',
        entityType: 'org_invitation',
        entityId: String(invitation.id),
        ipAddress: req.ip,
        newValues: {
          orgId: invitation.orgId,
          acceptedByUserId: req.user?.id,
          role: invitation.role,
        },
      });

      const [org] = await db
        .select({ name: organizationsTable.name, slug: organizationsTable.slug })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, invitation.orgId))
        .limit(1);

      res.status(200).json({
        message: 'Invitation accepted successfully',
        org: org ? { name: org.name, slug: org.slug } : null,
        role: invitation.role,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to accept invitation');
    }
  },
);

router.delete(
  '/orgs/:orgSlug/invitations/:invitationId',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req, res) => {
    try {
      const orgSlug = req.params.orgSlug as string;
      const invitationId = req.params.invitationId as string;
      const id = parseInt(invitationId, 10);

      if (Number.isNaN(id)) {
        sendBadRequest(res, 'Invalid invitation ID');
        return;
      }

      const org = await resolveOrgAndCheckAdminRole(req, res, orgSlug);
      if (!org) return;

      const [invitation] = await db
        .select({
          id: orgInvitationsTable.id,
          orgId: orgInvitationsTable.orgId,
          status: orgInvitationsTable.status,
        })
        .from(orgInvitationsTable)
        .where(eq(orgInvitationsTable.id, id))
        .limit(1);

      if (!invitation) {
        sendNotFound(res, 'Invitation');
        return;
      }

      if (invitation.orgId !== org.id) {
        sendForbidden(res, 'Invitation does not belong to this organization');
        return;
      }

      if (invitation.status !== 'pending') {
        sendError(res, 'Only pending invitations can be revoked', 409, 'CONFLICT');
        return;
      }

      await db
        .update(orgInvitationsTable)
        .set({ status: 'revoked' })
        .where(eq(orgInvitationsTable.id, id));

      await writeAuditEvent({
        userId: req.user?.id,
        action: 'invitation_revoked',
        entityType: 'org_invitation',
        entityId: String(id),
        ipAddress: req.ip,
        newValues: { revokedByUserId: req.user?.id },
      });

      res.status(200).json({ message: 'Invitation revoked' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to revoke invitation');
    }
  },
);

router.get('/orgs/:orgSlug/invitations', authMiddleware(), async (req, res) => {
  try {
    const orgSlug = req.params.orgSlug as string;

    const org = await resolveOrgAndCheckAdminRole(req, res, orgSlug);
    if (!org) return;

    const invitations = await db
      .select({
        id: orgInvitationsTable.id,
        email: orgInvitationsTable.email,
        role: orgInvitationsTable.role,
        status: orgInvitationsTable.status,
        expiresAt: orgInvitationsTable.expiresAt,
        createdAt: orgInvitationsTable.createdAt,
      })
      .from(orgInvitationsTable)
      .where(and(eq(orgInvitationsTable.orgId, org.id), eq(orgInvitationsTable.status, 'pending')));

    res.status(200).json({ invitations });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list invitations');
  }
});

export default router;
