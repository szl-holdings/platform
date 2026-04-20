/**
 * Organization Settings API
 *
 * GET    /api/orgs/:orgSlug/profile        — get org profile
 * PUT    /api/orgs/:orgSlug/profile        — update org profile
 * GET    /api/orgs/:orgSlug/members        — list members
 * DELETE /api/orgs/:orgSlug/members/:userId — remove member
 * PUT    /api/orgs/:orgSlug/members/:userId/role — update member role
 * GET    /api/orgs/:orgSlug/notification-prefs — get org notification settings
 * PUT    /api/orgs/:orgSlug/notification-prefs — update org notification settings
 * GET    /api/user/profile                 — get current user profile
 * PUT    /api/user/profile                 — update current user profile
 * POST   /api/user/deactivate              — request account deactivation
 * POST   /api/user/password-reset          — request password reset token
 * POST   /api/user/password-reset/confirm  — verify token and set new password
 * GET    /api/user/notification-preferences — get personal notification prefs
 * PUT    /api/user/notification-preferences — update personal notification prefs
 */

import { hashIp } from '@szl-holdings/audit';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  auditEventsTable,
  db,
  notificationPreferencesTable,
  notificationsTable,
  organizationsTable,
  orgMembersTable,
  pool,
  sessionsTable,
  usersTable,
} from '@szl-holdings/db';
import crypto, { pbkdf2Sync, randomBytes } from 'crypto';
import { and, eq, ne } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { buildPasswordResetEmail, sendEmail } from '../lib/email';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { readLimiter, writeLimiter } from '../middlewares/rate-limiters';
import { revokeUserSessionsOnRoleChange } from '../middlewares/session-policy';

const router = Router();

const ORG_ROLE_HIERARCHY: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

async function resolveOrgMembership(
  orgSlug: string,
  userId: number,
  minRole: 'owner' | 'admin' | 'member' | 'viewer' = 'viewer',
) {
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(and(eq(organizationsTable.slug, orgSlug), eq(organizationsTable.isActive, true)))
    .limit(1);

  if (!org) return { org: null, membership: null };

  const [membership] = await db
    .select()
    .from(orgMembersTable)
    .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, userId)))
    .limit(1);

  if (!membership || (ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY[minRole]) {
    return { org, membership: null };
  }

  return { org, membership };
}

function isElevated(req: Request): boolean {
  return (req.user?.roles.includes('super_admin') || req.user?.roles.includes('admin')) ?? false;
}

const updateOrgProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  orgType: z.string().optional().nullable(),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

const notifPrefsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  slackEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});

const userProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

router.get(
  '/orgs/:orgSlug/profile',
  readLimiter,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, req.user!.id)))
          .limit(1);
        if (!membership) {
          sendForbidden(res, 'Not a member of this organization');
          return;
        }
      }

      sendSuccess(res, {
        id: org.id,
        name: org.name,
        slug: org.slug,
        domain: org.domain,
        logoUrl: org.logoUrl,
        orgType: org.orgType,
        plan: org.plan,
        status: org.status,
        mfaRequired: org.mfaRequired,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get organization profile');
    }
  },
);

const mfaRequiredSchema = z.object({
  mfaRequired: z.boolean(),
});

/**
 * PATCH /orgs/:orgSlug/mfa-required — toggle org-wide MFA enforcement.
 *
 * When enabled, all members of the org who attempt to log in without MFA
 * already enabled are forced through MFA setup before a session is issued
 * (see /auth/login and /auth/mfa/setup-required).
 *
 * Org admin role required (or platform-elevated user). Audited.
 */
router.patch(
  '/orgs/:orgSlug/mfa-required',
  writeLimiter,
  authMiddleware(),
  validateBody(mfaRequiredSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const { mfaRequired } = req.body as z.infer<typeof mfaRequiredSchema>;

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const { membership } = await resolveOrgMembership(orgSlug, req.user!.id, 'admin');
        if (!membership) {
          sendForbidden(res, 'Admin access required to change MFA enforcement');
          return;
        }
      }

      const previous = org.mfaRequired;

      const [updated] = await db
        .update(organizationsTable)
        .set({ mfaRequired, updatedAt: new Date() })
        .where(eq(organizationsTable.id, org.id))
        .returning();

      await db.insert(auditEventsTable).values({
        userId: req.user!.id,
        action: mfaRequired ? 'org_mfa_enforcement_enabled' : 'org_mfa_enforcement_disabled',
        entityType: 'organization',
        entityId: String(org.id),
        ipAddress: hashIp(req.ip ?? null),
        oldValues: { mfaRequired: previous },
        newValues: { mfaRequired },
      });

      logger.info(
        { orgId: org.id, orgSlug, mfaRequired, changedBy: req.user!.id },
        '[org-mfa] Org-level MFA enforcement updated',
      );

      sendSuccess(res, {
        id: updated.id,
        slug: updated.slug,
        mfaRequired: updated.mfaRequired,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update MFA enforcement');
    }
  },
);

/**
 * Convenience alias matching the task spec wording: PATCH /orgs/:orgSlug
 * Accepts `{ mfaRequired: boolean }` as a partial org update for the same
 * MFA-enforcement toggle. Other fields are ignored on this endpoint to keep
 * the surface area small; use PUT /orgs/:orgSlug/profile for profile fields.
 */
router.patch(
  '/orgs/:orgSlug',
  writeLimiter,
  authMiddleware(),
  validateBody(mfaRequiredSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const { mfaRequired } = req.body as z.infer<typeof mfaRequiredSchema>;

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const { membership } = await resolveOrgMembership(orgSlug, req.user!.id, 'admin');
        if (!membership) {
          sendForbidden(res, 'Admin access required');
          return;
        }
      }

      const previous = org.mfaRequired;
      const [updated] = await db
        .update(organizationsTable)
        .set({ mfaRequired, updatedAt: new Date() })
        .where(eq(organizationsTable.id, org.id))
        .returning();

      await db.insert(auditEventsTable).values({
        userId: req.user!.id,
        action: mfaRequired ? 'org_mfa_enforcement_enabled' : 'org_mfa_enforcement_disabled',
        entityType: 'organization',
        entityId: String(org.id),
        ipAddress: hashIp(req.ip ?? null),
        oldValues: { mfaRequired: previous },
        newValues: { mfaRequired },
      });

      sendSuccess(res, {
        id: updated.id,
        slug: updated.slug,
        mfaRequired: updated.mfaRequired,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update organization');
    }
  },
);

router.put(
  '/orgs/:orgSlug/profile',
  writeLimiter,
  authMiddleware(),
  validateBody(updateOrgProfileSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const updates = req.body as z.infer<typeof updateOrgProfileSchema>;

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const { membership } = await resolveOrgMembership(orgSlug, req.user!.id, 'admin');
        if (!membership) {
          sendForbidden(res, 'Admin access required to update organization profile');
          return;
        }
      }

      const [updated] = await db
        .update(organizationsTable)
        .set({
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.domain !== undefined ? { domain: updates.domain } : {}),
          ...(updates.logoUrl !== undefined ? { logoUrl: updates.logoUrl } : {}),
          ...(updates.orgType !== undefined ? { orgType: updates.orgType } : {}),
          updatedAt: new Date(),
        })
        .where(eq(organizationsTable.id, org.id))
        .returning();

      await db.insert(auditEventsTable).values({
        userId: req.user!.id,
        action: 'org_profile_updated',
        entityType: 'organization',
        entityId: String(org.id),
        ipAddress: hashIp(req.ip ?? null),
        newValues: updates,
      });

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update organization profile');
    }
  },
);

router.get(
  '/orgs/:orgSlug/members',
  readLimiter,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;

      const [org] = await db
        .select({ id: organizationsTable.id, name: organizationsTable.name })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, req.user!.id)))
          .limit(1);
        if (!membership) {
          sendForbidden(res, 'Not a member of this organization');
          return;
        }
      }

      const members = await db
        .select({
          memberId: orgMembersTable.id,
          userId: orgMembersTable.userId,
          role: orgMembersTable.role,
          joinedAt: orgMembersTable.joinedAt,
          displayName: usersTable.displayName,
          email: usersTable.email,
          avatarUrl: usersTable.avatarUrl,
          isActive: usersTable.isActive,
          lastLoginAt: usersTable.lastLoginAt,
        })
        .from(orgMembersTable)
        .innerJoin(usersTable, eq(orgMembersTable.userId, usersTable.id))
        .where(eq(orgMembersTable.orgId, org.id));

      sendSuccess(res, { members, total: members.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list members');
    }
  },
);

router.delete(
  '/orgs/:orgSlug/members/:userId',
  validateBody(bodyShape({})),
  writeLimiter,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const targetUserId = parseInt(req.params['userId'] as string, 10);

      if (isNaN(targetUserId)) {
        sendBadRequest(res, 'Invalid user ID');
        return;
      }

      const [org] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const [requesterMembership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, req.user!.id)))
          .limit(1);

        if (
          !requesterMembership ||
          (ORG_ROLE_HIERARCHY[requesterMembership.role] ?? 0) < ORG_ROLE_HIERARCHY['admin']
        ) {
          sendForbidden(res, 'Admin access required');
          return;
        }
      }

      if (targetUserId === req.user!.id) {
        sendBadRequest(res, 'Cannot remove yourself from the organization');
        return;
      }

      const [targetMembership] = await db
        .select()
        .from(orgMembersTable)
        .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, targetUserId)))
        .limit(1);

      if (!targetMembership) {
        sendNotFound(res, 'Member');
        return;
      }

      if (targetMembership.role === 'owner') {
        sendForbidden(res, 'Cannot remove the organization owner');
        return;
      }

      await db
        .delete(orgMembersTable)
        .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, targetUserId)));

      await db.insert(auditEventsTable).values({
        userId: req.user!.id,
        action: 'member_removed',
        entityType: 'org_member',
        entityId: String(targetMembership.id),
        ipAddress: hashIp(req.ip ?? null),
        newValues: { orgId: org.id, targetUserId },
      });

      // Org membership change ⇒ revoke target user's existing sessions so
      // their access reflects the new membership within ≤30s.
      await revokeUserSessionsOnRoleChange({
        userId: targetUserId,
        changedByUserId: req.user!.id,
        reason: 'org_member_removed',
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to remove member');
    }
  },
);

router.put(
  '/orgs/:orgSlug/members/:userId/role',
  writeLimiter,
  authMiddleware(),
  validateBody(updateMemberRoleSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const targetUserId = parseInt(req.params['userId'] as string, 10);
      const { role } = req.body as z.infer<typeof updateMemberRoleSchema>;

      if (isNaN(targetUserId)) {
        sendBadRequest(res, 'Invalid user ID');
        return;
      }

      const [org] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const [requesterMembership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, req.user!.id)))
          .limit(1);

        if (
          !requesterMembership ||
          (ORG_ROLE_HIERARCHY[requesterMembership.role] ?? 0) < ORG_ROLE_HIERARCHY['admin']
        ) {
          sendForbidden(res, 'Admin access required');
          return;
        }
      }

      const [targetMembership] = await db
        .select()
        .from(orgMembersTable)
        .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, targetUserId)))
        .limit(1);

      if (!targetMembership) {
        sendNotFound(res, 'Member');
        return;
      }

      if (targetMembership.role === 'owner') {
        sendForbidden(res, 'Cannot change the role of the organization owner');
        return;
      }

      const [updated] = await db
        .update(orgMembersTable)
        .set({ role })
        .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, targetUserId)))
        .returning();

      await db.insert(auditEventsTable).values({
        userId: req.user!.id,
        action: 'member_role_updated',
        entityType: 'org_member',
        entityId: String(targetMembership.id),
        ipAddress: hashIp(req.ip ?? null),
        newValues: { orgId: org.id, targetUserId, oldRole: targetMembership.role, newRole: role },
      });

      await revokeUserSessionsOnRoleChange({
        userId: targetUserId,
        changedByUserId: req.user!.id,
        reason: 'org_member_role_updated',
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update member role');
    }
  },
);

router.get(
  '/orgs/:orgSlug/notification-prefs',
  readLimiter,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const [org] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, req.user!.id)))
          .limit(1);
        if (!membership) {
          sendForbidden(res, 'Not a member of this organization');
          return;
        }
      }

      const { rows } = await pool.query<{
        email_enabled: boolean;
        sms_enabled: boolean;
        slack_enabled: boolean;
        in_app_enabled: boolean;
      }>(
        `SELECT email_enabled, sms_enabled, slack_enabled, in_app_enabled
       FROM org_notification_settings WHERE org_id = $1`,
        [org.id],
      );

      const prefs = rows[0];
      sendSuccess(res, {
        emailEnabled: prefs?.email_enabled ?? true,
        smsEnabled: prefs?.sms_enabled ?? false,
        slackEnabled: prefs?.slack_enabled ?? false,
        inAppEnabled: prefs?.in_app_enabled ?? true,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get notification preferences');
    }
  },
);

router.put(
  '/orgs/:orgSlug/notification-prefs',
  writeLimiter,
  authMiddleware(),
  validateBody(notifPrefsSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params['orgSlug'] as string;
      const updates = req.body as z.infer<typeof notifPrefsSchema>;
      const userId = req.user!.id;

      const [org] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      if (!isElevated(req)) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, userId)))
          .limit(1);
        if (
          !membership ||
          (ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY['admin']
        ) {
          sendForbidden(res, 'Org admin role required to update notification settings');
          return;
        }
      }

      const { rows: existingRows } = await pool.query<{
        email_enabled: boolean;
        sms_enabled: boolean;
        slack_enabled: boolean;
        in_app_enabled: boolean;
      }>(
        `SELECT email_enabled, sms_enabled, slack_enabled, in_app_enabled FROM org_notification_settings WHERE org_id = $1`,
        [org.id],
      );

      const existing = existingRows[0];
      const merged = {
        emailEnabled: updates.emailEnabled ?? existing?.email_enabled ?? true,
        smsEnabled: updates.smsEnabled ?? existing?.sms_enabled ?? false,
        slackEnabled: updates.slackEnabled ?? existing?.slack_enabled ?? false,
        inAppEnabled: updates.inAppEnabled ?? existing?.in_app_enabled ?? true,
      };

      await pool.query(
        `INSERT INTO org_notification_settings (org_id, email_enabled, sms_enabled, slack_enabled, in_app_enabled)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (org_id) DO UPDATE SET
           email_enabled = EXCLUDED.email_enabled,
           sms_enabled = EXCLUDED.sms_enabled,
           slack_enabled = EXCLUDED.slack_enabled,
           in_app_enabled = EXCLUDED.in_app_enabled,
           updated_at = NOW()`,
        [org.id, merged.emailEnabled, merged.smsEnabled, merged.slackEnabled, merged.inAppEnabled],
      );

      sendSuccess(res, merged);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update notification preferences');
    }
  },
);

router.get('/user/profile', readLimiter, authMiddleware(), async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        bio: usersTable.bio,
        isActive: usersTable.isActive,
        lastLoginAt: usersTable.lastLoginAt,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (!user) {
      sendNotFound(res, 'User');
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get user profile');
  }
});

router.put(
  '/user/profile',
  writeLimiter,
  authMiddleware(),
  validateBody(userProfileSchema),
  async (req: Request, res: Response) => {
    try {
      const updates = req.body as z.infer<typeof userProfileSchema>;
      const userId = req.user!.id;

      const [updated] = await db
        .update(usersTable)
        .set({
          ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
          ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
          ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId))
        .returning({
          id: usersTable.id,
          displayName: usersTable.displayName,
          email: usersTable.email,
          avatarUrl: usersTable.avatarUrl,
          bio: usersTable.bio,
        });

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update user profile');
    }
  },
);

router.post(
  '/user/deactivate',
  writeLimiter,
  authMiddleware(),
  validateBody(
    bodyShape({
      reason: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { reason } = req.body as { reason?: string };

      await db
        .update(usersTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

      await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));

      await db.insert(auditEventsTable).values({
        userId,
        action: 'account_deactivated',
        entityType: 'user',
        entityId: String(userId),
        ipAddress: hashIp(req.ip ?? null),
        newValues: { reason: reason ?? null },
      });

      logger.info({ userId }, '[user-lifecycle] Account deactivated');

      // Clear both the new __Host-sid cookie and the legacy sid cookie
      // during the FINDING-005 rollout window.
      res.clearCookie('__Host-sid', { path: '/' });
      res.clearCookie('sid', { path: '/' });
      sendSuccess(res, { message: 'Account deactivated. You have been logged out.' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to deactivate account');
    }
  },
);

router.post(
  '/user/password-reset',
  writeLimiter,
  validateBody(
    bodyShape({
      email: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email || typeof email !== 'string') {
        sendBadRequest(res, 'email is required');
        return;
      }

      const [user] = await db
        .select({ id: usersTable.id, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase()))
        .limit(1);

      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query(
          `UPDATE users SET password_reset_token = $1, password_reset_token_expires_at = $2, updated_at = NOW() WHERE id = $3`,
          [token, expiresAt, user.id],
        );

        await db.insert(notificationsTable).values({
          userId: user.id,
          type: 'info',
          channel: 'in_app',
          title: 'Password reset requested',
          message: 'A password reset link has been generated. Check your email.',
        });

        const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://szlholdings.com';
        const resetUrl = `${appUrl}/reset-password?token=${token}`;

        const [userDetails] = await db
          .select({ displayName: usersTable.displayName })
          .from(usersTable)
          .where(eq(usersTable.id, user.id))
          .limit(1);

        sendEmail({
          to: user.email ?? '',
          subject: 'Reset your SZL Holdings password',
          html: buildPasswordResetEmail(userDetails?.displayName || (user.email ?? ''), resetUrl),
          text: `Reset your SZL Holdings password by visiting: ${resetUrl} — This link expires in 1 hour.`,
        })
          .then((result) => {
            if (!result.success)
              logger.warn(
                { error: result.error, userId: user.id },
                '[user-lifecycle] Email provider rejected password reset email',
              );
          })
          .catch((err) =>
            logger.warn(
              { err, userId: user.id },
              '[user-lifecycle] Failed to send password reset email',
            ),
          );

        logger.info(
          { userId: user.id, email: user.email },
          '[user-lifecycle] Password reset token generated',
        );
      }

      sendSuccess(res, {
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to request password reset');
    }
  },
);

router.post(
  '/user/password-reset/confirm',
  writeLimiter,
  validateBody(
    bodyShape({
      newPassword: z.unknown().optional(),
      token: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body as { token?: string; newPassword?: string };
      if (!token || typeof token !== 'string') {
        sendBadRequest(res, 'token is required');
        return;
      }
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        sendBadRequest(res, 'newPassword must be at least 8 characters');
        return;
      }

      const { rows } = await pool.query<{ id: number; email: string }>(
        `SELECT id, email FROM users
       WHERE password_reset_token = $1
         AND password_reset_token_expires_at > NOW()
         AND password_reset_token IS NOT NULL
       LIMIT 1`,
        [token],
      );

      if (rows.length === 0) {
        sendBadRequest(res, 'Invalid or expired reset token');
        return;
      }

      const user = rows[0];
      const salt = randomBytes(16).toString('hex');
      const passwordHash = `pbkdf2:${salt}:${pbkdf2Sync(newPassword, salt, 100_000, 64, 'sha512').toString('hex')}`;

      await pool.query(
        `UPDATE users SET
         password_hash = $1,
         password_reset_token = NULL,
         password_reset_token_expires_at = NULL,
         updated_at = NOW()
       WHERE id = $2`,
        [passwordHash, user.id],
      );

      await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [user.id]);

      await db.insert(notificationsTable).values({
        userId: user.id,
        type: 'success',
        channel: 'in_app',
        title: 'Password updated',
        message:
          'Your password has been reset successfully. All other sessions have been signed out.',
      });

      logger.info(
        { userId: user.id, email: user.email },
        '[user-lifecycle] Password reset confirmed and sessions invalidated',
      );
      sendSuccess(res, { message: 'Password has been reset successfully.' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to confirm password reset');
    }
  },
);

router.get(
  '/user/notification-preferences',
  readLimiter,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const [prefs] = await db
        .select()
        .from(notificationPreferencesTable)
        .where(eq(notificationPreferencesTable.userId, userId))
        .limit(1);

      sendSuccess(
        res,
        prefs ?? {
          emailEnabled: true,
          smsEnabled: false,
          slackEnabled: false,
          inAppEnabled: true,
        },
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to get notification preferences');
    }
  },
);

router.put(
  '/user/notification-preferences',
  writeLimiter,
  authMiddleware(),
  validateBody(notifPrefsSchema),
  async (req: Request, res: Response) => {
    try {
      const updates = req.body as z.infer<typeof notifPrefsSchema>;
      const userId = req.user!.id;

      const [existing] = await db
        .select()
        .from(notificationPreferencesTable)
        .where(eq(notificationPreferencesTable.userId, userId))
        .limit(1);

      let prefs;
      if (existing) {
        [prefs] = await db
          .update(notificationPreferencesTable)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(notificationPreferencesTable.userId, userId))
          .returning();
      } else {
        [prefs] = await db
          .insert(notificationPreferencesTable)
          .values({
            userId,
            emailEnabled: updates.emailEnabled ?? true,
            smsEnabled: updates.smsEnabled ?? false,
            slackEnabled: updates.slackEnabled ?? false,
            inAppEnabled: updates.inAppEnabled ?? true,
          })
          .returning();
      }

      sendSuccess(res, prefs);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update notification preferences');
    }
  },
);

export default router;
