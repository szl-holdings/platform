/**
 * Invited-User Onboarding Flow
 *
 * POST   /api/orgs/:orgSlug/invite          — send invitation (org admin/owner only)
 * GET    /api/orgs/accept-invite            — validate invite token (returns org info)
 * POST   /api/orgs/accept-invite            — accept invitation (authenticated user)
 * DELETE /api/orgs/:orgSlug/invitations/:id — revoke pending invitation
 * GET    /api/orgs/:orgSlug/invitations     — list pending invitations
 */

import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { db, orgInvitationsTable, organizationsTable, orgMembersTable, auditEventsTable, usersTable } from "@szl-holdings/db";
import { eq, and, gt } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { writeLimiter } from "../middlewares/rate-limiters";
import { logger } from "../lib/logger";
import { validateBody } from "../lib/validation";
import { sendError, sendUnauthorized, sendNotFound, sendForbidden, sendBadRequest, handleRouteError } from "../lib/api-response";
import { sendEmail, buildOrgInviteEmail } from "../lib/email";
import type { Request, Response } from "express";

const router = Router();

const INVITE_TTL = 7 * 24 * 60 * 60 * 1000;

const inviteBodySchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
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
      ipAddress: params.ipAddress ?? null,
      newValues: params.newValues ?? null,
    };
    await db.insert(auditEventsTable).values(row);
  } catch (err) {
    logger.error({ err }, "Failed to write invitation audit event");
  }
}

async function resolveOrgAndCheckAdminRole(
  req: Request,
  res: Response,
  orgSlug: string,
): Promise<{ id: number; name: string } | null> {
  const user = req.user;
  if (!user) {
    sendUnauthorized(res, "Authentication required");
    return null;
  }

  const [org] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.slug, orgSlug))
    .limit(1);

  if (!org) {
    sendNotFound(res, "Organization");
    return null;
  }

  const isElevated = user.roles.includes("super_admin") || user.roles.includes("admin");
  if (isElevated) return org;

  const membership = user.orgs.find((o) => o.orgSlug === orgSlug);
  if (!membership) {
    sendForbidden(res, "Not a member of this organization");
    return null;
  }

  if ((ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
    sendForbidden(res, "Insufficient organization role — admin or owner required");
    return null;
  }

  return org;
}

router.post(
  "/orgs/:orgSlug/invite",
  writeLimiter,
  authMiddleware(),
  validateBody(inviteBodySchema),
  async (req, res) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const { email, role } = req.body as z.infer<typeof inviteBodySchema>;

      const org = await resolveOrgAndCheckAdminRole(req, res, orgSlug);
      if (!org) return;

      const existing = await db
        .select({ id: orgInvitationsTable.id })
        .from(orgInvitationsTable)
        .where(
          and(
            eq(orgInvitationsTable.orgId, org.id),
            eq(orgInvitationsTable.email, email.toLowerCase()),
            eq(orgInvitationsTable.status, "pending"),
            gt(orgInvitationsTable.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        sendError(res, "A pending invitation already exists for this email", 409, "CONFLICT");
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + INVITE_TTL);

      const [invitation] = await db
        .insert(orgInvitationsTable)
        .values({
          orgId: org.id,
          invitedByUserId: req.user!.id,
          email: email.toLowerCase(),
          role: role as "admin" | "member" | "viewer",
          token,
          status: "pending",
          expiresAt,
        })
        .returning();

      await writeAuditEvent({
        userId: req.user!.id,
        action: "invitation_sent",
        entityType: "org_invitation",
        entityId: String(invitation.id),
        ipAddress: req.ip,
        newValues: { orgId: org.id, email: email.toLowerCase(), role, expiresAt: expiresAt.toISOString() },
      });

      const [inviter] = await db
        .select({ displayName: usersTable.displayName, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, req.user!.id))
        .limit(1);

      const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://szlholdings.com";
      const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

      sendEmail({
        to: email.toLowerCase(),
        subject: `You've been invited to join ${org.name} on SZL Holdings`,
        html: buildOrgInviteEmail({
          orgName: org.name,
          inviteUrl,
          role,
          expiresAt: expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          invitedByName: inviter?.displayName || inviter?.email || undefined,
        }),
        text: `You've been invited to join ${org.name} as a ${role}. Accept your invitation here: ${inviteUrl} (expires ${expiresAt.toLocaleDateString()})`,
      }).then(result => {
        if (!result.success) logger.warn({ error: result.error, email: email.toLowerCase() }, "[invitations] Email provider rejected invite email");
      }).catch(err => logger.warn({ err, email: email.toLowerCase() }, "[invitations] Failed to send invite email"));

      res.status(201).json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviteUrl: `/accept-invite?token=${token}`,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create invitation");
    }
  },
);

router.get("/orgs/accept-invite", async (req, res) => {
  try {
    const token = req.query["token"];
    if (!token || typeof token !== "string") {
      sendBadRequest(res, "Invitation token is required");
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
      sendNotFound(res, "Invitation");
      return;
    }

    if (invitation.status === "accepted") {
      sendError(res, "This invitation has already been used", 410, "GONE");
      return;
    }

    if (invitation.status === "revoked") {
      sendError(res, "This invitation has been revoked", 410, "GONE");
      return;
    }

    if (invitation.status === "expired" || invitation.expiresAt < new Date()) {
      if (invitation.status !== "expired") {
        await db
          .update(orgInvitationsTable)
          .set({ status: "expired" })
          .where(eq(orgInvitationsTable.id, invitation.id));
      }
      sendError(res, "This invitation has expired", 410, "GONE");
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
    handleRouteError(res, err, "Failed to validate invitation");
  }
});

router.post(
  "/orgs/accept-invite",
  authMiddleware(),
  async (req, res) => {
    try {
      const { token } = req.body as { token?: string };

      if (!token || typeof token !== "string") {
        sendBadRequest(res, "Invitation token is required");
        return;
      }

      const [invitation] = await db
        .select()
        .from(orgInvitationsTable)
        .where(eq(orgInvitationsTable.token, token))
        .limit(1);

      if (!invitation) {
        sendNotFound(res, "Invitation");
        return;
      }

      if (invitation.status === "accepted") {
        sendError(res, "This invitation has already been used", 410, "GONE");
        return;
      }

      if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
        sendError(res, "This invitation is no longer valid", 410, "GONE");
        return;
      }

      const userEmail = (req.user!.email ?? "").toLowerCase();
      if (userEmail !== invitation.email.toLowerCase()) {
        await writeAuditEvent({
          userId: req.user!.id,
          action: "invitation_accept_denied",
          entityType: "org_invitation",
          entityId: String(invitation.id),
          ipAddress: req.ip,
          newValues: { reason: "email_mismatch", invitedEmail: invitation.email },
        });
        sendForbidden(res, "This invitation was not issued to your account");
        return;
      }

      const existingMembership = await db
        .select({ id: orgMembersTable.id })
        .from(orgMembersTable)
        .where(
          and(
            eq(orgMembersTable.orgId, invitation.orgId),
            eq(orgMembersTable.userId, req.user!.id),
          ),
        )
        .limit(1);

      if (existingMembership.length > 0) {
        await db
          .update(orgInvitationsTable)
          .set({
            status: "accepted",
            acceptedByUserId: req.user!.id,
            acceptedAt: new Date(),
          })
          .where(eq(orgInvitationsTable.id, invitation.id));

        res.status(200).json({ message: "You are already a member of this organization" });
        return;
      }

      await db.insert(orgMembersTable).values({
        orgId: invitation.orgId,
        userId: req.user!.id,
        role: invitation.role as "admin" | "member" | "viewer",
      });

      await db
        .update(orgInvitationsTable)
        .set({
          status: "accepted",
          acceptedByUserId: req.user!.id,
          acceptedAt: new Date(),
        })
        .where(eq(orgInvitationsTable.id, invitation.id));

      await writeAuditEvent({
        userId: req.user!.id,
        action: "invitation_accepted",
        entityType: "org_invitation",
        entityId: String(invitation.id),
        ipAddress: req.ip,
        newValues: {
          orgId: invitation.orgId,
          acceptedByUserId: req.user!.id,
          role: invitation.role,
        },
      });

      const [org] = await db
        .select({ name: organizationsTable.name, slug: organizationsTable.slug })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, invitation.orgId))
        .limit(1);

      res.status(200).json({
        message: "Invitation accepted successfully",
        org: org ? { name: org.name, slug: org.slug } : null,
        role: invitation.role,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to accept invitation");
    }
  },
);

router.delete(
  "/orgs/:orgSlug/invitations/:invitationId",
  authMiddleware(),
  async (req, res) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const invitationId = req.params["invitationId"] as string;
      const id = parseInt(invitationId, 10);

      if (isNaN(id)) {
        sendBadRequest(res, "Invalid invitation ID");
        return;
      }

      const org = await resolveOrgAndCheckAdminRole(req, res, orgSlug);
      if (!org) return;

      const [invitation] = await db
        .select({ id: orgInvitationsTable.id, orgId: orgInvitationsTable.orgId, status: orgInvitationsTable.status })
        .from(orgInvitationsTable)
        .where(eq(orgInvitationsTable.id, id))
        .limit(1);

      if (!invitation) {
        sendNotFound(res, "Invitation");
        return;
      }

      if (invitation.orgId !== org.id) {
        sendForbidden(res, "Invitation does not belong to this organization");
        return;
      }

      if (invitation.status !== "pending") {
        sendError(res, "Only pending invitations can be revoked", 409, "CONFLICT");
        return;
      }

      await db
        .update(orgInvitationsTable)
        .set({ status: "revoked" })
        .where(eq(orgInvitationsTable.id, id));

      await writeAuditEvent({
        userId: req.user!.id,
        action: "invitation_revoked",
        entityType: "org_invitation",
        entityId: String(id),
        ipAddress: req.ip,
        newValues: { revokedByUserId: req.user!.id },
      });

      res.status(200).json({ message: "Invitation revoked" });
    } catch (err) {
      handleRouteError(res, err, "Failed to revoke invitation");
    }
  },
);

router.get(
  "/orgs/:orgSlug/invitations",
  authMiddleware(),
  async (req, res) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;

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
        .where(
          and(
            eq(orgInvitationsTable.orgId, org.id),
            eq(orgInvitationsTable.status, "pending"),
          ),
        );

      res.status(200).json({ invitations });
    } catch (err) {
      handleRouteError(res, err, "Failed to list invitations");
    }
  },
);

export default router;
