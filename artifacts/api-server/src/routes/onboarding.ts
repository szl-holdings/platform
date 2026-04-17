/**
 * Tenant Onboarding API
 *
 * POST   /api/onboarding/org               — create organization + set first admin
 * GET    /api/onboarding/wizard/:orgSlug   — get wizard progress
 * PUT    /api/onboarding/wizard/:orgSlug   — update wizard step
 * POST   /api/onboarding/wizard/:orgSlug/complete — mark onboarding complete
 */

import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import {
  db, pool,
  organizationsTable,
  orgMembersTable,
  orgInvitationsTable,
  usersTable,
  auditEventsTable,
  notificationsTable,
} from "@szl-holdings/db";
import { eq, and, gt } from "drizzle-orm";
import { authMiddleware, isElevatedUser } from "../middlewares/auth";
import { writeLimiter } from "../middlewares/rate-limiters";
import { validateBody } from "../lib/validation";
import { sendSuccess, sendCreated, sendBadRequest, sendForbidden, handleRouteError, sendNotFound } from "../lib/api-response";
import { sendEmail, buildOrgInviteEmail } from "../lib/email";
import { logger } from "../lib/logger";
import type { Request, Response } from "express";

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
  domain: z.string().optional(),
  orgType: z.string().optional(),
  plan: z.enum(["free", "starter", "professional", "enterprise"]).default("free"),
});

const wizardStepSchema = z.object({
  step: z.enum(["profile", "team", "notifications", "integrations", "complete"]),
  data: z.record(z.unknown()).optional(),
});

const resendInviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

const INVITE_TTL = 7 * 24 * 60 * 60 * 1000;
const ORG_ROLE_HIERARCHY: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

type WizardState = {
  completedSteps: string[];
  currentStep: string;
  profile: Record<string, unknown>;
  team: Record<string, unknown>;
  notifications: Record<string, unknown>;
  integrations: Record<string, unknown>;
  completedAt: string | null;
};

function defaultWizardState(): WizardState {
  return {
    completedSteps: [],
    currentStep: "profile",
    profile: {},
    team: {},
    notifications: {},
    integrations: {},
    completedAt: null,
  };
}


async function getWizardState(orgId: number): Promise<WizardState> {
  const { rows } = await pool.query<{
    current_step: string;
    completed_steps: string[];
    step_data: Record<string, Record<string, unknown>>;
    completed_at: string | null;
  }>(
    `SELECT current_step, completed_steps, step_data, completed_at FROM onboarding_wizard_state WHERE org_id = $1`,
    [orgId],
  );
  if (!rows.length) return defaultWizardState();
  const row = rows[0]!;
  const data = row.step_data ?? {};
  return {
    completedSteps: row.completed_steps ?? [],
    currentStep: row.current_step ?? "profile",
    profile: (data["profile"] as Record<string, unknown>) ?? {},
    team: (data["team"] as Record<string, unknown>) ?? {},
    notifications: (data["notifications"] as Record<string, unknown>) ?? {},
    integrations: (data["integrations"] as Record<string, unknown>) ?? {},
    completedAt: row.completed_at ?? null,
  };
}

async function saveWizardState(orgId: number, state: WizardState): Promise<void> {
  const stepData = JSON.stringify({
    profile: state.profile,
    team: state.team,
    notifications: state.notifications,
    integrations: state.integrations,
  });
  await pool.query(
    `INSERT INTO onboarding_wizard_state (org_id, current_step, completed_steps, step_data, completed_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
     ON CONFLICT (org_id) DO UPDATE SET
       current_step = EXCLUDED.current_step,
       completed_steps = EXCLUDED.completed_steps,
       step_data = EXCLUDED.step_data,
       completed_at = EXCLUDED.completed_at,
       updated_at = NOW()`,
    [orgId, state.currentStep, JSON.stringify(state.completedSteps), stepData, state.completedAt],
  );
}

router.post(
  "/onboarding/org",
  writeLimiter,
  authMiddleware(),
  validateBody(createOrgSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { name, slug, domain, orgType, plan } = req.body as z.infer<typeof createOrgSchema>;

      const [existing] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, slug))
        .limit(1);

      if (existing) {
        sendBadRequest(res, "An organization with this slug already exists");
        return;
      }

      const [org] = await db
        .insert(organizationsTable)
        .values({
          name,
          slug,
          domain: domain ?? null,
          orgType: orgType ?? null,
          plan: plan ?? "free",
          status: "active",
          isActive: true,
        })
        .returning();

      await db.insert(orgMembersTable).values({
        orgId: org.id,
        userId,
        role: "owner",
      });

      await db.insert(auditEventsTable).values({
        userId,
        action: "org_created",
        entityType: "organization",
        entityId: String(org.id),
        ipAddress: req.ip ?? null,
        newValues: { name, slug, plan },
      });

      await db.insert(notificationsTable).values({
        userId,
        type: "success",
        channel: "in_app",
        title: "Organization created",
        message: `Welcome to ${name}! Complete your setup to get started.`,
        actionUrl: `/onboarding/${slug}`,
      });

      await saveWizardState(org.id, defaultWizardState());

      logger.info({ userId, orgId: org.id, slug }, "[onboarding] Organization created");

      sendCreated(res, {
        org,
        wizardUrl: `/onboarding/${slug}`,
        nextStep: "profile",
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create organization");
    }
  },
);

router.get(
  "/onboarding/wizard/:orgSlug",
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const user = req.user!;

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, "Organization");
        return;
      }

      const isElevated = user.roles.includes("super_admin") || user.roles.includes("admin");
      if (!isElevated) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, user.id)))
          .limit(1);
        if (!membership || (ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
          res.status(403).json({ error: "Admin access required" });
          return;
        }
      }

      const state = await getWizardState(org.id);

      const steps = [
        { id: "profile", label: "Organization Profile", completed: state.completedSteps.includes("profile") },
        { id: "team", label: "Invite Team Members", completed: state.completedSteps.includes("team") },
        { id: "notifications", label: "Notification Preferences", completed: state.completedSteps.includes("notifications") },
        { id: "integrations", label: "Integrations", completed: state.completedSteps.includes("integrations") },
      ];

      sendSuccess(res, {
        org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
        wizard: {
          steps,
          currentStep: state.currentStep,
          completedAt: state.completedAt,
          isComplete: !!state.completedAt,
          progress: Math.round((state.completedSteps.length / steps.length) * 100),
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get wizard state");
    }
  },
);

router.put(
  "/onboarding/wizard/:orgSlug",
  writeLimiter,
  authMiddleware(),
  validateBody(wizardStepSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const user = req.user!;
      const { step, data } = req.body as z.infer<typeof wizardStepSchema>;

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, "Organization");
        return;
      }

      const isElevated = user.roles.includes("super_admin") || user.roles.includes("admin");
      if (!isElevated) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, user.id)))
          .limit(1);
        if (!membership || (ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
          res.status(403).json({ error: "Admin access required" });
          return;
        }
      }

      const state = await getWizardState(org.id);

      if (step !== "complete" && data) {
        (state as Record<string, unknown>)[step] = data;
      }

      if (!state.completedSteps.includes(step) && step !== "complete") {
        state.completedSteps.push(step);
      }

      const steps = ["profile", "team", "notifications", "integrations"];
      const currentIdx = steps.indexOf(step);
      state.currentStep = currentIdx >= 0 && currentIdx < steps.length - 1
        ? steps[currentIdx + 1]!
        : "complete";

      await saveWizardState(org.id, state);

      if (step === "profile" && data && typeof data === "object" && "name" in data) {
        await db
          .update(organizationsTable)
          .set({ name: String((data as Record<string, unknown>)["name"] ?? org.name), updatedAt: new Date() })
          .where(eq(organizationsTable.id, org.id));
      }

      sendSuccess(res, {
        step,
        completedSteps: state.completedSteps,
        currentStep: state.currentStep,
        progress: Math.round((state.completedSteps.length / steps.length) * 100),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update wizard step");
    }
  },
);

router.post(
  "/onboarding/wizard/:orgSlug/complete",
  writeLimiter,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const user = req.user!;

      const [org] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, "Organization");
        return;
      }

      if (!isElevatedUser(user)) {
        const [membership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, user.id)))
          .limit(1);
        if (!membership || (ORG_ROLE_HIERARCHY[membership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
          sendForbidden(res, "Org admin role required");
          return;
        }
      }

      const state = await getWizardState(org.id);
      state.completedAt = new Date().toISOString();
      state.currentStep = "complete";
      await saveWizardState(org.id, state);

      await db.insert(notificationsTable).values({
        userId: user.id,
        type: "success",
        channel: "in_app",
        title: "Onboarding complete",
        message: `${org.name} is fully set up and ready to use.`,
        actionUrl: `/`,
      });

      await db.insert(auditEventsTable).values({
        userId: user.id,
        action: "onboarding_completed",
        entityType: "organization",
        entityId: String(org.id),
        ipAddress: req.ip ?? null,
      });

      logger.info({ userId: user.id, orgId: org.id }, "[onboarding] Onboarding completed");

      sendSuccess(res, { message: "Onboarding complete", completedAt: state.completedAt });
    } catch (err) {
      handleRouteError(res, err, "Failed to complete onboarding");
    }
  },
);

router.post(
  "/onboarding/resend-invite/:orgSlug",
  writeLimiter,
  authMiddleware(),
  validateBody(resendInviteSchema),
  async (req: Request, res: Response) => {
    try {
      const orgSlug = req.params["orgSlug"] as string;
      const { email, role } = req.body as z.infer<typeof resendInviteSchema>;
      const user = req.user!;

      const [org] = await db
        .select({ id: organizationsTable.id, name: organizationsTable.name })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, orgSlug))
        .limit(1);

      if (!org) {
        sendNotFound(res, "Organization");
        return;
      }

      if (!isElevatedUser(user)) {
        const [inviteMembership] = await db
          .select()
          .from(orgMembersTable)
          .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, user.id)))
          .limit(1);
        if (!inviteMembership || (ORG_ROLE_HIERARCHY[inviteMembership.role] ?? 0) < ORG_ROLE_HIERARCHY["admin"]) {
          sendForbidden(res, "Org admin role required");
          return;
        }
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + INVITE_TTL);

      await db
        .update(orgInvitationsTable)
        .set({ status: "expired" })
        .where(
          and(
            eq(orgInvitationsTable.orgId, org.id),
            eq(orgInvitationsTable.email, email.toLowerCase()),
            eq(orgInvitationsTable.status, "pending"),
          ),
        );

      const [invitation] = await db
        .insert(orgInvitationsTable)
        .values({
          orgId: org.id,
          invitedByUserId: user.id,
          email: email.toLowerCase(),
          role,
          token,
          status: "pending",
          expiresAt,
        })
        .returning();

      logger.info({ userId: user.id, orgId: org.id, email }, "[onboarding] Invite sent");

      const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://szlholdings.com";
      const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

      const [inviter] = await db
        .select({ displayName: usersTable.displayName, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

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
        if (!result.success) logger.warn({ error: result.error, email: email.toLowerCase() }, "[onboarding] Email provider rejected invite email");
      }).catch(err => logger.warn({ err, email: email.toLowerCase() }, "[onboarding] Failed to send invite email"));

      sendCreated(res, {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviteUrl: `/accept-invite?token=${token}`,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to send invitation");
    }
  },
);

export default router;
