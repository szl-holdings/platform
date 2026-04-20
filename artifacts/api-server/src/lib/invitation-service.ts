/**
 * Canonical invitation service — used by both the onboarding wizard
 * (POST /onboarding/resend-invite/:orgSlug) and the org-settings
 * invite endpoint (POST /orgs/:orgSlug/invite).
 *
 * Centralizing the logic prevents the two flows from drifting (different
 * audit events, different email copy, different conflict handling).
 */

import { hashIp } from '@szl-holdings/audit';
import { auditEventsTable, db, orgInvitationsTable, usersTable } from '@szl-holdings/db';
import crypto from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { buildOrgInviteEmail, sendEmail } from './email';
import { logger } from './logger';

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteRole = 'admin' | 'member' | 'viewer';

export interface CreateInvitationParams {
  orgId: number;
  orgName: string;
  email: string;
  role: InviteRole;
  invitedByUserId: number;
  ipAddress?: string | null;
  /**
   * "replace" — used by the onboarding resend flow: marks any existing
   *             pending invitation for this email expired, then issues
   *             a fresh one.
   * "reject"  — used by the org-settings invite flow: returns
   *             { conflict: true } if a non-expired pending invitation
   *             already exists.
   */
  conflictMode: 'replace' | 'reject';
}

export type CreateInvitationResult =
  | {
      conflict: true;
      reason: 'already_pending';
    }
  | {
      conflict: false;
      invitation: {
        id: number;
        email: string;
        role: InviteRole;
        expiresAt: Date;
        token: string;
        inviteUrl: string;
      };
    };

/**
 * Issue an organization invitation: handles conflict policy, DB insert,
 * audit log, and email send (fire-and-forget — failure to deliver does
 * NOT roll back the invitation row, mirroring previous behavior).
 *
 * Authorization MUST be checked by the caller before invoking this.
 */
export async function createOrgInvitation(
  params: CreateInvitationParams,
): Promise<CreateInvitationResult> {
  const email = params.email.toLowerCase();

  if (params.conflictMode === 'reject') {
    // Only treat NON-EXPIRED pending invites as conflicts. Stale rows whose
    // expiresAt has passed (but were never marked "expired" by a sweeper)
    // must not block re-inviting the same email.
    const now = new Date();
    const existing = await db
      .select({ id: orgInvitationsTable.id })
      .from(orgInvitationsTable)
      .where(
        and(
          eq(orgInvitationsTable.orgId, params.orgId),
          eq(orgInvitationsTable.email, email),
          eq(orgInvitationsTable.status, 'pending'),
          gt(orgInvitationsTable.expiresAt, now),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { conflict: true, reason: 'already_pending' };
    }
  } else {
    // "replace" — expire any existing pending invitations for this email
    await db
      .update(orgInvitationsTable)
      .set({ status: 'expired' })
      .where(
        and(
          eq(orgInvitationsTable.orgId, params.orgId),
          eq(orgInvitationsTable.email, email),
          eq(orgInvitationsTable.status, 'pending'),
        ),
      );
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const [invitation] = await db
    .insert(orgInvitationsTable)
    .values({
      orgId: params.orgId,
      invitedByUserId: params.invitedByUserId,
      email,
      role: params.role,
      token,
      status: 'pending',
      expiresAt,
    })
    .returning();

  // Audit (non-fatal on failure)
  try {
    await db.insert(auditEventsTable).values({
      userId: params.invitedByUserId,
      action: 'invitation_sent',
      entityType: 'org_invitation',
      entityId: String(invitation.id),
      ipAddress: hashIp(params.ipAddress ?? null),
      newValues: {
        orgId: params.orgId,
        email,
        role: params.role,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, '[invitation-service] Failed to write invitation audit event');
  }

  // Fire-and-forget email — preserves existing semantics where DB row is
  // the source of truth and email is a best-effort notification.
  const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://szlholdings.com';
  const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

  void (async () => {
    try {
      const [inviter] = await db
        .select({ displayName: usersTable.displayName, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, params.invitedByUserId))
        .limit(1);

      const result = await sendEmail({
        to: email,
        subject: `You've been invited to join ${params.orgName} on SZL Holdings`,
        html: buildOrgInviteEmail({
          orgName: params.orgName,
          inviteUrl,
          role: params.role,
          expiresAt: expiresAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          invitedByName: inviter?.displayName || inviter?.email || undefined,
        }),
        text: `You've been invited to join ${params.orgName} as a ${params.role}. Accept your invitation here: ${inviteUrl} (expires ${expiresAt.toLocaleDateString()})`,
      });
      if (!result.success) {
        logger.warn(
          { error: result.error, email },
          '[invitation-service] Email provider rejected invite email',
        );
      }
    } catch (err) {
      logger.warn({ err, email }, '[invitation-service] Failed to send invite email');
    }
  })();

  return {
    conflict: false,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as InviteRole,
      expiresAt: invitation.expiresAt,
      token,
      inviteUrl: `/accept-invite?token=${token}`,
    },
  };
}
