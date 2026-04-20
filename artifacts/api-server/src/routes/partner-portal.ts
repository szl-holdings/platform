/**
 * Partner Portal API Routes
 *
 * Provides endpoints for:
 * - Partner account management (CRUD)
 * - Managed tenant (org) provisioning and assignment
 * - Org white-label branding configuration
 * - Custom domain verification and management
 * - Aggregate billing/usage views
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  type InsertOrgBranding,
  type InsertOrgCustomDomain,
  type InsertPartnerAccount,
  type InsertPartnerOrgAssignment,
  meteringEventsTable,
  organizationsTable,
  orgBrandingTable,
  orgCustomDomainsTable,
  orgMembersTable,
  partnerAccountsTable,
  partnerOrgAssignmentsTable,
  partnerUsersTable,
  usageAggregatesTable,
  usersTable,
} from '@szl-holdings/db';
import { randomBytes } from 'crypto';
import { promises as dnsPromises } from 'dns';
import { and, count, desc, eq, inArray, or } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { assertExternalUrl } from '../lib/ssrf-guard';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

function strParam(raw: string | string[]): string {
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPartnerForUser(userId: number) {
  const [member] = await db
    .select({
      partnerId: partnerUsersTable.partnerId,
      role: partnerUsersTable.role,
    })
    .from(partnerUsersTable)
    .where(eq(partnerUsersTable.userId, userId))
    .limit(1);
  return member ?? null;
}

function isAdmin(req: Request): boolean {
  const roles = req.user?.roles ?? [];
  return roles.includes('super_admin') || roles.includes('admin');
}

/** Check partner-level access to an org via partner_org_assignments.
 *  @param writeAccess - if true, requires manage or admin access level (not view-only) */
async function hasPartnerOrgAccess(
  userId: number,
  orgId: number,
  writeAccess = false,
): Promise<boolean> {
  const partner = await getPartnerForUser(userId);
  if (!partner) return false;
  const [assignment] = await db
    .select({ accessLevel: partnerOrgAssignmentsTable.accessLevel })
    .from(partnerOrgAssignmentsTable)
    .where(
      and(
        eq(partnerOrgAssignmentsTable.partnerId, partner.partnerId),
        eq(partnerOrgAssignmentsTable.orgId, orgId),
      ),
    )
    .limit(1);
  if (!assignment) return false;
  if (writeAccess) {
    return assignment.accessLevel === 'manage' || assignment.accessLevel === 'admin';
  }
  return true; // any assignment level grants read access
}

// ─── Partner Account Routes ────────────────────────────────────────────────────

const createPartnerSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  contactEmail: z.string().email().optional(),
  contactName: z.string().max(100).optional(),
  website: z.string().url().optional(),
  tier: z.enum(['referral', 'reseller', 'white_label', 'oem']).optional(),
});

router.get(
  '/partner/accounts',
  authMiddleware(),
  requireRole('admin'),
  async (_req: Request, res: Response) => {
    try {
      const partners = await db
        .select({
          id: partnerAccountsTable.id,
          name: partnerAccountsTable.name,
          slug: partnerAccountsTable.slug,
          status: partnerAccountsTable.status,
          tier: partnerAccountsTable.tier,
          contactEmail: partnerAccountsTable.contactEmail,
          contactName: partnerAccountsTable.contactName,
          website: partnerAccountsTable.website,
          commissionRate: partnerAccountsTable.commissionRate,
          maxManagedTenants: partnerAccountsTable.maxManagedTenants,
          approvedAt: partnerAccountsTable.approvedAt,
          createdAt: partnerAccountsTable.createdAt,
        })
        .from(partnerAccountsTable)
        .orderBy(desc(partnerAccountsTable.createdAt));

      sendSuccess(res, { partners, count: partners.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list partner accounts');
    }
  },
);

router.post(
  '/partner/accounts',
  authMiddleware(),
  validateBody(createPartnerSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createPartnerSchema>;

      const existing = await db
        .select({ id: partnerAccountsTable.id })
        .from(partnerAccountsTable)
        .where(eq(partnerAccountsTable.slug, body.slug))
        .limit(1);

      if (existing.length > 0) {
        sendBadRequest(res, 'Partner slug already in use');
        return;
      }

      const [partner] = await db
        .insert(partnerAccountsTable)
        .values({
          name: body.name,
          slug: body.slug,
          ownerUserId: req.user!.id,
          status: isAdmin(req) ? 'active' : 'pending_approval',
          tier: body.tier ?? 'reseller',
          contactEmail: body.contactEmail ?? null,
          contactName: body.contactName ?? null,
          website: body.website ?? null,
        } as InsertPartnerAccount)
        .returning();

      await db.insert(partnerUsersTable).values({
        partnerId: partner.id,
        userId: req.user!.id,
        role: 'owner',
      });

      sendCreated(res, { partner });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create partner account');
    }
  },
);

router.get('/partner/me', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const membership = await getPartnerForUser(req.user!.id);
    if (!membership) {
      sendNotFound(res, 'Partner account');
      return;
    }

    const [partner] = await db
      .select()
      .from(partnerAccountsTable)
      .where(eq(partnerAccountsTable.id, membership.partnerId))
      .limit(1);

    if (!partner) {
      sendNotFound(res, 'Partner account');
      return;
    }

    const managedOrgs = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        slug: organizationsTable.slug,
        plan: organizationsTable.plan,
        status: organizationsTable.status,
        accessLevel: partnerOrgAssignmentsTable.accessLevel,
        assignedAt: partnerOrgAssignmentsTable.createdAt,
      })
      .from(partnerOrgAssignmentsTable)
      .innerJoin(organizationsTable, eq(partnerOrgAssignmentsTable.orgId, organizationsTable.id))
      .where(eq(partnerOrgAssignmentsTable.partnerId, partner.id));

    sendSuccess(res, {
      partner,
      role: membership.role,
      managedOrgs,
      managedOrgCount: managedOrgs.length,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get partner profile');
  }
});

router.get('/partner/accounts/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid partner ID');
      return;
    }

    if (!isAdmin(req)) {
      const membership = await getPartnerForUser(req.user!.id);
      if (!membership || membership.partnerId !== id) {
        sendForbidden(res);
        return;
      }
    }

    const [partner] = await db
      .select()
      .from(partnerAccountsTable)
      .where(eq(partnerAccountsTable.id, id))
      .limit(1);

    if (!partner) {
      sendNotFound(res, 'Partner account');
      return;
    }

    const managedOrgs = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        slug: organizationsTable.slug,
        plan: organizationsTable.plan,
        status: organizationsTable.status,
        accessLevel: partnerOrgAssignmentsTable.accessLevel,
        assignedAt: partnerOrgAssignmentsTable.createdAt,
      })
      .from(partnerOrgAssignmentsTable)
      .innerJoin(organizationsTable, eq(partnerOrgAssignmentsTable.orgId, organizationsTable.id))
      .where(eq(partnerOrgAssignmentsTable.partnerId, id));

    const teamMembers = await db
      .select({
        userId: partnerUsersTable.userId,
        role: partnerUsersTable.role,
        displayName: usersTable.displayName,
        email: usersTable.email,
        joinedAt: partnerUsersTable.joinedAt,
      })
      .from(partnerUsersTable)
      .innerJoin(usersTable, eq(partnerUsersTable.userId, usersTable.id))
      .where(eq(partnerUsersTable.partnerId, id));

    sendSuccess(res, { partner, managedOrgs, teamMembers });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get partner account');
  }
});

router.patch(
  '/partner/accounts/:id',
  authMiddleware(),
  validateBody(
    bodyShape({
      approvedAt: z.unknown().optional(),
      commissionRate: z.unknown().optional(),
      contactEmail: z.unknown().optional(),
      contactName: z.unknown().optional(),
      maxManagedTenants: z.unknown().optional(),
      name: z.unknown().optional(),
      notes: z.unknown().optional(),
      status: z.unknown().optional(),
      tier: z.unknown().optional(),
      website: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid partner ID');
        return;
      }

      if (!isAdmin(req)) {
        const membership = await getPartnerForUser(req.user!.id);
        if (
          !membership ||
          membership.partnerId !== id ||
          !['owner', 'admin'].includes(membership.role)
        ) {
          sendForbidden(res);
          return;
        }
      }

      const body = req.body ?? {};
      const updates: Partial<typeof partnerAccountsTable.$inferSelect> = { updatedAt: new Date() };
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.contactEmail !== undefined) updates.contactEmail = body.contactEmail || null;
      if (body.contactName !== undefined) updates.contactName = body.contactName || null;
      if (body.website !== undefined) updates.website = body.website || null;
      if (body.notes !== undefined) updates.notes = body.notes || null;
      if (isAdmin(req)) {
        if (body.status !== undefined) updates.status = body.status;
        if (body.tier !== undefined) updates.tier = body.tier;
        if (body.commissionRate !== undefined) updates.commissionRate = String(body.commissionRate);
        if (body.maxManagedTenants !== undefined)
          updates.maxManagedTenants = Number(body.maxManagedTenants);
        if (body.status === 'active' && !body.approvedAt) {
          updates.approvedAt = new Date();
          updates.approvedByUserId = req.user!.id;
        }
      }

      const [updated] = await db
        .update(partnerAccountsTable)
        .set(updates)
        .where(eq(partnerAccountsTable.id, id))
        .returning();

      if (!updated) {
        sendNotFound(res, 'Partner account');
        return;
      }

      sendSuccess(res, { partner: updated });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update partner account');
    }
  },
);

// ─── Partner Tenant Provisioning ──────────────────────────────────────────────

const provisionTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  accessLevel: z.enum(['view', 'manage', 'admin']).optional(),
});

router.post(
  '/partner/accounts/:id/tenants',
  authMiddleware(),
  validateBody(provisionTenantSchema),
  async (req: Request, res: Response) => {
    try {
      const partnerId = parseIdParam(req.params.id);
      if (isNaN(partnerId)) {
        sendBadRequest(res, 'Invalid partner ID');
        return;
      }

      if (!isAdmin(req)) {
        const membership = await getPartnerForUser(req.user!.id);
        if (
          !membership ||
          membership.partnerId !== partnerId ||
          !['owner', 'admin'].includes(membership.role)
        ) {
          sendForbidden(res);
          return;
        }
      }

      const [partner] = await db
        .select({
          id: partnerAccountsTable.id,
          status: partnerAccountsTable.status,
          maxManagedTenants: partnerAccountsTable.maxManagedTenants,
        })
        .from(partnerAccountsTable)
        .where(eq(partnerAccountsTable.id, partnerId))
        .limit(1);

      if (!partner) {
        sendNotFound(res, 'Partner account');
        return;
      }
      if (partner.status !== 'active') {
        sendForbidden(res);
        return;
      }

      const [{ currentCount }] = await db
        .select({ currentCount: count() })
        .from(partnerOrgAssignmentsTable)
        .where(eq(partnerOrgAssignmentsTable.partnerId, partnerId));

      if (Number(currentCount) >= partner.maxManagedTenants) {
        res.status(422).json({ error: `Tenant limit reached (${partner.maxManagedTenants})` });
        return;
      }

      const body = req.body as z.infer<typeof provisionTenantSchema>;

      const existing = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.slug, body.slug))
        .limit(1);

      if (existing.length > 0) {
        sendBadRequest(res, 'Organization slug already in use');
        return;
      }

      const [org] = await db
        .insert(organizationsTable)
        .values({
          name: body.name,
          slug: body.slug,
          plan: body.plan ?? 'starter',
          status: 'active',
        })
        .returning();

      await db.insert(orgMembersTable).values({
        orgId: org.id,
        userId: req.user!.id,
        role: 'owner',
      });

      await db.insert(partnerOrgAssignmentsTable).values({
        partnerId,
        orgId: org.id,
        accessLevel: body.accessLevel ?? 'manage',
        provisionedByUserId: req.user!.id,
      } as InsertPartnerOrgAssignment);

      sendCreated(res, { org });
    } catch (err) {
      handleRouteError(res, err, 'Failed to provision tenant');
    }
  },
);

router.post(
  '/partner/accounts/:id/tenants/assign',
  authMiddleware(),
  validateBody(
    bodyShape({
      accessLevel: z.unknown().optional(),
      orgId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const partnerId = parseIdParam(req.params.id);
      if (isNaN(partnerId)) {
        sendBadRequest(res, 'Invalid partner ID');
        return;
      }

      if (!isAdmin(req)) {
        const membership = await getPartnerForUser(req.user!.id);
        if (
          !membership ||
          membership.partnerId !== partnerId ||
          !['owner', 'admin'].includes(membership.role)
        ) {
          sendForbidden(res);
          return;
        }
      }

      const { orgId, accessLevel } = req.body ?? {};
      if (!orgId) {
        sendBadRequest(res, 'orgId is required');
        return;
      }

      // Enforce partner active status and quota before assigning
      const [partnerRecord] = await db
        .select({
          status: partnerAccountsTable.status,
          maxManagedTenants: partnerAccountsTable.maxManagedTenants,
        })
        .from(partnerAccountsTable)
        .where(eq(partnerAccountsTable.id, partnerId))
        .limit(1);

      if (!partnerRecord) {
        sendNotFound(res, 'Partner account');
        return;
      }
      if (partnerRecord.status !== 'active') {
        sendBadRequest(
          res,
          'Partner account is not active. Only active partners can manage tenants.',
        );
        return;
      }

      const [{ currentCount }] = await db
        .select({ currentCount: count() })
        .from(partnerOrgAssignmentsTable)
        .where(eq(partnerOrgAssignmentsTable.partnerId, partnerId));

      if (currentCount >= partnerRecord.maxManagedTenants) {
        sendBadRequest(
          res,
          `Partner has reached the maximum of ${partnerRecord.maxManagedTenants} managed tenants.`,
        );
        return;
      }

      const [org] = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, Number(orgId)))
        .limit(1);
      if (!org) {
        sendNotFound(res, 'Organization');
        return;
      }

      const [assignment] = await db
        .insert(partnerOrgAssignmentsTable)
        .values({
          partnerId,
          orgId: org.id,
          accessLevel: accessLevel ?? 'manage',
          provisionedByUserId: req.user!.id,
        } as InsertPartnerOrgAssignment)
        .onConflictDoUpdate({
          target: [partnerOrgAssignmentsTable.partnerId, partnerOrgAssignmentsTable.orgId],
          set: { accessLevel: accessLevel ?? 'manage', updatedAt: new Date() },
        })
        .returning();

      sendCreated(res, { assignment });
    } catch (err) {
      handleRouteError(res, err, 'Failed to assign tenant to partner');
    }
  },
);

router.delete(
  '/partner/accounts/:id/tenants/:orgId',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const partnerId = parseIdParam(req.params.id);
      const orgId = parseIdParam(req.params.orgId);
      if (isNaN(partnerId) || isNaN(orgId)) {
        sendBadRequest(res, 'Invalid ID');
        return;
      }

      if (!isAdmin(req)) {
        const membership = await getPartnerForUser(req.user!.id);
        if (
          !membership ||
          membership.partnerId !== partnerId ||
          !['owner', 'admin'].includes(membership.role)
        ) {
          sendForbidden(res);
          return;
        }
      }

      await db
        .delete(partnerOrgAssignmentsTable)
        .where(
          and(
            eq(partnerOrgAssignmentsTable.partnerId, partnerId),
            eq(partnerOrgAssignmentsTable.orgId, orgId),
          ),
        );

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to unassign tenant');
    }
  },
);

// ─── Org Branding Routes ──────────────────────────────────────────────────────

const brandingSchema = z.object({
  appName: z.string().max(100).optional(),
  tagline: z.string().max(255).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  faviconUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  surfaceColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  customCss: z.string().max(50000).optional(),
  emailFromName: z.string().max(100).optional(),
  emailFooterText: z.string().max(500).optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportUrl: z.string().url().optional().or(z.literal('')),
  privacyUrl: z.string().url().optional().or(z.literal('')),
  termsUrl: z.string().url().optional().or(z.literal('')),
});

router.get('/org-branding/:orgSlug', async (req: Request, res: Response) => {
  try {
    const orgSlug = strParam(req.params.orgSlug);
    const [org] = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        status: organizationsTable.status,
      })
      .from(organizationsTable)
      .where(eq(organizationsTable.slug, orgSlug))
      .limit(1);

    if (!org || org.status !== 'active') {
      sendSuccess(res, { branding: null });
      return;
    }

    const [branding] = await db
      .select()
      .from(orgBrandingTable)
      .where(and(eq(orgBrandingTable.orgId, org.id), eq(orgBrandingTable.isActive, true)))
      .limit(1);

    sendSuccess(res, { branding: branding ?? null, org: { id: org.id, name: org.name } });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get org branding');
  }
});

router.get('/orgs/:orgId/branding', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = parseIdParam(req.params.orgId);
    if (isNaN(orgId)) {
      sendBadRequest(res, 'Invalid org ID');
      return;
    }

    if (!isAdmin(req)) {
      const isMember = req.user?.orgs?.some((o) => o.orgId === orgId);
      const isPartner = await hasPartnerOrgAccess(req.user!.id, orgId);
      if (!isMember && !isPartner) {
        sendForbidden(res);
        return;
      }
    }

    const [branding] = await db
      .select()
      .from(orgBrandingTable)
      .where(eq(orgBrandingTable.orgId, orgId))
      .limit(1);

    sendSuccess(res, { branding: branding ?? null });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get org branding');
  }
});

router.put(
  '/orgs/:orgId/branding',
  authMiddleware(),
  validateBody(brandingSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (isNaN(orgId)) {
        sendBadRequest(res, 'Invalid org ID');
        return;
      }

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      const body = req.body as z.infer<typeof brandingSchema>;

      const upsertData: InsertOrgBranding = {
        orgId,
        updatedByUserId: req.user!.id,
        ...(body.appName !== undefined ? { appName: body.appName || null } : {}),
        ...(body.tagline !== undefined ? { tagline: body.tagline || null } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
        ...(body.faviconUrl !== undefined ? { faviconUrl: body.faviconUrl || null } : {}),
        ...(body.primaryColor ? { primaryColor: body.primaryColor } : {}),
        ...(body.secondaryColor ? { secondaryColor: body.secondaryColor } : {}),
        ...(body.accentColor ? { accentColor: body.accentColor } : {}),
        ...(body.backgroundColor ? { backgroundColor: body.backgroundColor } : {}),
        ...(body.surfaceColor ? { surfaceColor: body.surfaceColor } : {}),
        ...(body.textColor ? { textColor: body.textColor } : {}),
        ...(body.customCss !== undefined ? { customCss: body.customCss || null } : {}),
        ...(body.emailFromName !== undefined ? { emailFromName: body.emailFromName || null } : {}),
        ...(body.emailFooterText !== undefined
          ? { emailFooterText: body.emailFooterText || null }
          : {}),
        ...(body.supportEmail !== undefined ? { supportEmail: body.supportEmail || null } : {}),
        ...(body.supportUrl !== undefined ? { supportUrl: body.supportUrl || null } : {}),
        ...(body.privacyUrl !== undefined ? { privacyUrl: body.privacyUrl || null } : {}),
        ...(body.termsUrl !== undefined ? { termsUrl: body.termsUrl || null } : {}),
      } as InsertOrgBranding;

      const [branding] = await db
        .insert(orgBrandingTable)
        .values(upsertData)
        .onConflictDoUpdate({
          target: orgBrandingTable.orgId,
          set: { ...upsertData, updatedAt: new Date() },
        })
        .returning();

      sendSuccess(res, { branding });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update org branding');
    }
  },
);

router.delete(
  '/orgs/:orgId/branding',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (isNaN(orgId)) {
        sendBadRequest(res, 'Invalid org ID');
        return;
      }

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      await db.delete(orgBrandingTable).where(eq(orgBrandingTable.orgId, orgId));
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to reset org branding');
    }
  },
);

// ─── Custom Domain Routes ──────────────────────────────────────────────────────

router.get('/orgs/:orgId/custom-domains', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const orgId = parseIdParam(req.params.orgId);
    if (isNaN(orgId)) {
      sendBadRequest(res, 'Invalid org ID');
      return;
    }

    if (!isAdmin(req)) {
      const isMember = req.user?.orgs?.some((o) => o.orgId === orgId);
      const isPartner = await hasPartnerOrgAccess(req.user!.id, orgId);
      if (!isMember && !isPartner) {
        sendForbidden(res);
        return;
      }
    }

    const domains = await db
      .select()
      .from(orgCustomDomainsTable)
      .where(eq(orgCustomDomainsTable.orgId, orgId))
      .orderBy(desc(orgCustomDomainsTable.createdAt));

    sendSuccess(res, { domains, count: domains.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list custom domains');
  }
});

router.post(
  '/orgs/:orgId/custom-domains',
  authMiddleware(),
  validateBody(
    bodyShape({
      domain: z.unknown().optional(),
      verificationMethod: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      if (isNaN(orgId)) {
        sendBadRequest(res, 'Invalid org ID');
        return;
      }

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      const { domain, verificationMethod } = req.body ?? {};
      if (!domain || typeof domain !== 'string') {
        sendBadRequest(res, 'domain is required');
        return;
      }

      const normalized = domain
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');

      const existing = await db
        .select({ id: orgCustomDomainsTable.id })
        .from(orgCustomDomainsTable)
        .where(eq(orgCustomDomainsTable.domain, normalized))
        .limit(1);

      if (existing.length > 0) {
        sendBadRequest(res, 'Domain already registered');
        return;
      }

      const verificationToken = `verify_${randomBytes(16).toString('hex')}`;
      const method = verificationMethod ?? 'dns_txt';

      let verificationRecord: string | null = null;
      if (method === 'dns_txt') {
        verificationRecord = `szl-verify=${verificationToken}`;
      } else if (method === 'dns_cname') {
        verificationRecord = `verify.szl.io`;
      } else if (method === 'http_file') {
        verificationRecord = `/.well-known/szl-verification/${verificationToken}`;
      }

      const [domainRecord] = await db
        .insert(orgCustomDomainsTable)
        .values({
          orgId,
          domain: normalized,
          verificationMethod: method,
          verificationToken,
          verificationRecord,
          createdByUserId: req.user!.id,
        } as InsertOrgCustomDomain)
        .returning();

      sendCreated(res, {
        domain: domainRecord,
        instructions: {
          method,
          record: verificationRecord,
          token: verificationToken,
          hint:
            method === 'dns_txt'
              ? `Add a TXT record to your DNS: Name="_szl-verification" Value="${verificationRecord}"`
              : method === 'dns_cname'
                ? `Add a CNAME record: Name="@" (root domain) Target="${verificationRecord}"`
                : `Create a file at "${verificationRecord}" with content "${verificationToken}"`,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to add custom domain');
    }
  },
);

router.post(
  '/orgs/:orgId/custom-domains/:domainId/verify',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const domainId = parseIdParam(req.params.domainId);
      if (isNaN(orgId) || isNaN(domainId)) {
        sendBadRequest(res, 'Invalid ID');
        return;
      }

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      const [domainRecord] = await db
        .select()
        .from(orgCustomDomainsTable)
        .where(and(eq(orgCustomDomainsTable.id, domainId), eq(orgCustomDomainsTable.orgId, orgId)))
        .limit(1);

      if (!domainRecord) {
        sendNotFound(res, 'Custom domain');
        return;
      }

      if (domainRecord.status === 'active' || domainRecord.status === 'verified') {
        sendSuccess(res, { verified: true, domain: domainRecord });
        return;
      }

      // Method-aware verification
      const method = domainRecord.verificationMethod;
      const token = domainRecord.verificationToken;
      let checkPassed = false;
      let checkError: string | null = null;

      if (method === 'dns_txt') {
        // Look up TXT at the _szl-verification subdomain (matches create instructions)
        const expectedTxt = `szl-verify=${token}`;
        const verificationSubdomain = `_szl-verification.${domainRecord.domain}`;
        try {
          const records = await dnsPromises.resolveTxt(verificationSubdomain);
          checkPassed = records.some((chunks) => chunks.join('').includes(expectedTxt));
          if (!checkPassed) {
            checkError = `TXT record not found at ${verificationSubdomain}. Add a DNS TXT record: Name="_szl-verification" on ${domainRecord.domain}, Value="${expectedTxt}"`;
          }
        } catch (err: unknown) {
          checkError = `DNS TXT lookup failed for ${verificationSubdomain}: ${err instanceof Error ? err.message : String(err)}`;
        }
      } else if (method === 'dns_cname') {
        // Expect CNAME pointing to verify.szl.io
        const expectedCname = 'verify.szl.io';
        try {
          const cnames = await dnsPromises.resolveCname(domainRecord.domain);
          checkPassed = cnames.some((c) => c.toLowerCase().includes(expectedCname));
          if (!checkPassed) {
            checkError = `CNAME record not found. Add a CNAME record for ${domainRecord.domain} pointing to ${expectedCname}`;
          }
        } catch (err: unknown) {
          checkError = `DNS CNAME lookup failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      } else if (method === 'http_file') {
        // Expect the well-known file to contain the token.
        // Validate the URL against the SSRF guard before making any request.
        const fileUrl = `https://${domainRecord.domain}/.well-known/szl-verification/${token}`;
        const safeUrl = await assertExternalUrl(fileUrl, res);
        if (!safeUrl) {
          // assertExternalUrl already sent a 400 response; clean up check timestamp and return
          await db
            .update(orgCustomDomainsTable)
            .set({ lastCheckAt: new Date(), updatedAt: new Date() })
            .where(eq(orgCustomDomainsTable.id, domainId));
          return;
        }
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10_000);
          const response = await fetch(safeUrl.toString(), { signal: controller.signal });
          clearTimeout(timeout);
          if (response.ok) {
            const body = (await response.text()).trim();
            checkPassed = body === token;
            if (!checkPassed) {
              checkError = `Verification file content mismatch at ${fileUrl}. Expected: "${token}"`;
            }
          } else {
            checkError = `HTTP verification file not accessible at ${fileUrl} (HTTP ${response.status})`;
          }
        } catch (err: unknown) {
          checkError = `HTTP file check failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      } else {
        checkError = `Unknown verification method: ${method}`;
      }

      // Update last check timestamp regardless of outcome
      await db
        .update(orgCustomDomainsTable)
        .set({ lastCheckAt: new Date(), updatedAt: new Date() })
        .where(eq(orgCustomDomainsTable.id, domainId));

      if (!checkPassed) {
        sendBadRequest(res, checkError ?? 'Domain verification failed');
        return;
      }

      const [updated] = await db
        .update(orgCustomDomainsTable)
        .set({
          status: 'verified',
          lastVerifiedAt: new Date(),
          lastCheckAt: new Date(),
          sslStatus: 'provisioning',
          updatedAt: new Date(),
        })
        .where(eq(orgCustomDomainsTable.id, domainId))
        .returning();

      sendSuccess(res, { verified: true, domain: updated });
    } catch (err) {
      handleRouteError(res, err, 'Failed to verify domain');
    }
  },
);

// ─── Domain Activation ────────────────────────────────────────────────────────
// Transitions a verified domain to active status, completing the SSL lifecycle.
// Must be called after successful /verify. Only org admins and platform admins
// may activate. In production this would integrate with an SSL provisioning job.

router.post(
  '/orgs/:orgId/custom-domains/:domainId/activate',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const domainId = parseIdParam(req.params.domainId);

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      const [domainRecord] = await db
        .select()
        .from(orgCustomDomainsTable)
        .where(and(eq(orgCustomDomainsTable.id, domainId), eq(orgCustomDomainsTable.orgId, orgId)))
        .limit(1);

      if (!domainRecord) {
        sendNotFound(res, 'Custom domain');
        return;
      }

      if (domainRecord.status === 'active') {
        sendSuccess(res, { activated: true, domain: domainRecord });
        return;
      }

      if (domainRecord.status !== 'verified') {
        sendBadRequest(
          res,
          `Domain must be in 'verified' status before activation (current: ${domainRecord.status}). Call /verify first.`,
        );
        return;
      }

      const [activated] = await db
        .update(orgCustomDomainsTable)
        .set({
          status: 'active',
          sslStatus: 'active',
          updatedAt: new Date(),
        })
        .where(eq(orgCustomDomainsTable.id, domainId))
        .returning();

      sendSuccess(res, { activated: true, domain: activated });
    } catch (err) {
      handleRouteError(res, err, 'Failed to activate domain');
    }
  },
);

router.patch(
  '/orgs/:orgId/custom-domains/:domainId',
  authMiddleware(),
  validateBody(
    bodyShape({
      isPrimary: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const domainId = parseIdParam(req.params.domainId);
      if (isNaN(orgId) || isNaN(domainId)) {
        sendBadRequest(res, 'Invalid ID');
        return;
      }

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      const { isPrimary } = req.body ?? {};

      if (isPrimary) {
        await db
          .update(orgCustomDomainsTable)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(orgCustomDomainsTable.orgId, orgId));
      }

      const [updated] = await db
        .update(orgCustomDomainsTable)
        .set({ isPrimary: isPrimary ?? false, updatedAt: new Date() })
        .where(and(eq(orgCustomDomainsTable.id, domainId), eq(orgCustomDomainsTable.orgId, orgId)))
        .returning();

      if (!updated) {
        sendNotFound(res, 'Custom domain');
        return;
      }

      sendSuccess(res, { domain: updated });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update domain');
    }
  },
);

router.delete(
  '/orgs/:orgId/custom-domains/:domainId',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = parseIdParam(req.params.orgId);
      const domainId = parseIdParam(req.params.domainId);
      if (isNaN(orgId) || isNaN(domainId)) {
        sendBadRequest(res, 'Invalid ID');
        return;
      }

      if (!isAdmin(req)) {
        const orgMembership = req.user?.orgs?.find((o) => o.orgId === orgId);
        const hasOrgAccess =
          (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) ||
          (await hasPartnerOrgAccess(req.user!.id, orgId, true));
        if (!hasOrgAccess) {
          sendForbidden(res);
          return;
        }
      }

      await db
        .delete(orgCustomDomainsTable)
        .where(and(eq(orgCustomDomainsTable.id, domainId), eq(orgCustomDomainsTable.orgId, orgId)));

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete custom domain');
    }
  },
);

// ─── Partner Usage / Aggregate Billing ────────────────────────────────────────

router.get('/partner/accounts/:id/usage', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const partnerId = parseIdParam(req.params.id);
    if (isNaN(partnerId)) {
      sendBadRequest(res, 'Invalid partner ID');
      return;
    }

    if (!isAdmin(req)) {
      const membership = await getPartnerForUser(req.user!.id);
      if (!membership || membership.partnerId !== partnerId) {
        sendForbidden(res);
        return;
      }
    }

    const assignments = await db
      .select({ orgId: partnerOrgAssignmentsTable.orgId })
      .from(partnerOrgAssignmentsTable)
      .where(eq(partnerOrgAssignmentsTable.partnerId, partnerId));

    const orgIds = assignments.map((a) => a.orgId);

    if (orgIds.length === 0) {
      sendSuccess(res, { usage: [], totalEvents: 0 });
      return;
    }

    const aggregates = await db
      .select({
        orgId: usageAggregatesTable.orgId,
        featureKey: usageAggregatesTable.featureKey,
        product: usageAggregatesTable.product,
        periodType: usageAggregatesTable.periodType,
        periodStart: usageAggregatesTable.periodStart,
        totalQuantity: usageAggregatesTable.totalQuantity,
        eventCount: usageAggregatesTable.eventCount,
      })
      .from(usageAggregatesTable)
      .where(
        and(
          inArray(usageAggregatesTable.orgId, orgIds),
          eq(usageAggregatesTable.periodType, 'month'),
        ),
      )
      .orderBy(desc(usageAggregatesTable.periodStart))
      .limit(500);

    const totalEvents = aggregates.reduce((sum, r) => sum + r.eventCount, 0);

    sendSuccess(res, { usage: aggregates, totalEvents, managedOrgCount: orgIds.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get partner usage');
  }
});

// ─── Public: domain-to-org resolution (for host-header routing) ───────────────

router.get(
  '/resolve-domain',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const domain = String(req.query.domain ?? '').toLowerCase();
      if (!domain) {
        sendBadRequest(res, 'domain query param required');
        return;
      }

      const [domainRecord] = await db
        .select({
          orgId: orgCustomDomainsTable.orgId,
          status: orgCustomDomainsTable.status,
          sslStatus: orgCustomDomainsTable.sslStatus,
        })
        .from(orgCustomDomainsTable)
        .where(
          and(eq(orgCustomDomainsTable.domain, domain), eq(orgCustomDomainsTable.status, 'active')),
        )
        .limit(1);

      if (!domainRecord) {
        sendNotFound(res, 'Domain');
        return;
      }

      const [org] = await db
        .select({
          id: organizationsTable.id,
          slug: organizationsTable.slug,
          name: organizationsTable.name,
        })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, domainRecord.orgId))
        .limit(1);

      const [branding] = await db
        .select()
        .from(orgBrandingTable)
        .where(
          and(eq(orgBrandingTable.orgId, domainRecord.orgId), eq(orgBrandingTable.isActive, true)),
        )
        .limit(1);

      sendSuccess(res, { org, branding: branding ?? null });
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve domain');
    }
  },
);

export default router;
