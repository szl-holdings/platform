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
import { db, orgInvitationsTable, organizationsTable, orgMembersTable, auditEventsTable } from "@szl-holdings/db";
import { eq, and, gt } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { writeLimiter } from "../middlewares/rate-limiters";
import { logger } from "../lib/logger";
import type { Request, Response } from "express";

const router = Router();

const INVITE_TTL = 7 * 24 * 60 * 60 * 1000;

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
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  const [org] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(eq(organizationsTable.slug, orgSlug))
    .limit(1);

  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return null;
  }

  const isElevated = user.roles.includes("super_admin") || user.roles.includes("admin");
  if (isElevated) return org;

  const membership = user.orgs.find((o) => o.orgSlug === orgSlug);
  if (!membership) {
    res.status(403).json({ error: "Not a member of this organization" });
    return null;
  }

  if ((ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
    res.status(403).json({ error: "Insufficient organization role — admin or owner required" });
    return null;
  }

  return org;
}

router.post(
  "/orgs/:orgSlug/invite",
  writeLimiter,
  authMiddleware(),
  async (req, res) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const { email, role = "member" } = req.body as { email?: string; role?: string };

      if (!email || typeof email !== "string" || !email.includes("@")) {
        res.status(400).json({ error: "Valid email is required" });
        return;
      }

      const validRoles = ["admin", "member", "viewer"];
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: `Role must be one of: ${validRoles.join(", ")}` });
        return;
      }

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
        res.status(409).json({ error: "A pending invitation already exists for this email" });
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

      res.status(201).json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviteUrl: `/accept-invite?token=${token}`,
      });
    } catch (err) {
      logger.error({ err }, "Failed to create invitation");
      res.status(500).json({ error: "Failed to create invitation" });
    }
  },
);

router.get("/orgs/accept-invite", async (req, res) => {
  try {
    const token = req.query["token"];
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Invitation token is required" });
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
      res.status(404).json({ error: "Invitation not found" });
      return;
    }

    if (invitation.status === "accepted") {
      res.status(410).json({ error: "This invitation has already been used" });
      return;
    }

    if (invitation.status === "revoked") {
      res.status(410).json({ error: "This invitation has been revoked" });
      return;
    }

    if (invitation.status === "expired" || invitation.expiresAt < new Date()) {
      if (invitation.status !== "expired") {
        await db
          .update(orgInvitationsTable)
          .set({ status: "expired" })
          .where(eq(orgInvitationsTable.id, invitation.id));
      }
      res.status(410).json({ error: "This invitation has expired" });
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
    logger.error({ err }, "Failed to validate invitation");
    res.status(500).json({ error: "Failed to validate invitation" });
  }
});

router.post(
  "/orgs/accept-invite",
  authMiddleware(),
  async (req, res) => {
    try {
      const { token } = req.body as { token?: string };

      if (!token || typeof token !== "string") {
        res.status(400).json({ error: "Invitation token is required" });
        return;
      }

      const [invitation] = await db
        .select()
        .from(orgInvitationsTable)
        .where(eq(orgInvitationsTable.token, token))
        .limit(1);

      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      if (invitation.status === "accepted") {
        res.status(410).json({ error: "This invitation has already been used" });
        return;
      }

      if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
        res.status(410).json({ error: "This invitation is no longer valid" });
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
        res.status(403).json({ error: "This invitation was not issued to your account" });
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
      logger.error({ err }, "Failed to accept invitation");
      res.status(500).json({ error: "Failed to accept invitation" });
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
        res.status(400).json({ error: "Invalid invitation ID" });
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
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      if (invitation.orgId !== org.id) {
        res.status(403).json({ error: "Invitation does not belong to this organization" });
        return;
      }

      if (invitation.status !== "pending") {
        res.status(409).json({ error: "Only pending invitations can be revoked" });
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
      logger.error({ err }, "Failed to revoke invitation");
      res.status(500).json({ error: "Failed to revoke invitation" });
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
      logger.error({ err }, "Failed to list invitations");
      res.status(500).json({ error: "Failed to list invitations" });
    }
  },
);

export default router;
