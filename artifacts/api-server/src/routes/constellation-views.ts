/**
 * /constellation/views — saved Constellation filter views.
 *
 * A view is owned by one user and can be either:
 *   - "private": only the owner sees / can edit / delete it.
 *   - "org":     visible to every member of the owning org. The owner — or
 *                an org admin/owner — can rename or delete it; everyone else
 *                can only apply it.
 *
 * Routes (all require auth):
 *   GET    /constellation/views?domain=:domain   list visible saved views
 *   POST   /constellation/views                  create a saved view
 *   PATCH  /constellation/views/:id              rename or update filters
 *   DELETE /constellation/views/:id              delete a saved view
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { type ConstellationSavedView, constellationSavedViewsTable, db } from '@szl-holdings/db';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendConflict,
  sendForbidden,
  sendNoContent,
  sendNotFound,
  sendSuccess,
  sendUnauthorized,
} from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, type OrgMembership } from '../middlewares/auth';
import { perUserApiSlidingLimiter } from '../middlewares/sliding-window-limiter';

const router: IRouter = Router();
// Scope auth to /constellation paths only — this router is mounted without a path prefix
// so a bare router.use(auth) would block all requests passing through, not just ours.
router.use('/constellation', authMiddleware({ required: true }));
router.use('/constellation', perUserApiSlidingLimiter);

const filtersSchema = z
  .object({
    entityTypeFilter: z.string().nullable().optional(),
    activeOnly: z.boolean().optional(),
    sinceWindow: z.enum(['24h', '7d', '30d', 'all']).optional(),
    searchQuery: z.string().optional(),
  })
  .passthrough();

const NAME_MAX = 80;
const DOMAIN_MAX = 64;

const visibilitySchema = z.enum(['private', 'org']);

const createSchema = z.object({
  domain: z.string().min(1).max(DOMAIN_MAX),
  name: z.string().min(1).max(NAME_MAX).trim(),
  filters: filtersSchema,
  visibility: visibilitySchema.optional(),
  /** Only honored when visibility="org"; defaults to the user's primary org. */
  orgId: z.number().int().positive().optional(),
});

const updateSchema = z
  .object({
    name: z.string().min(1).max(NAME_MAX).trim().optional(),
    filters: filtersSchema.optional(),
    visibility: visibilitySchema.optional(),
    orgId: z.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.filters !== undefined ||
      v.visibility !== undefined ||
      v.orgId !== undefined,
    { message: 'Provide name, filters, visibility, and/or orgId to update' },
  );

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: string; cause?: unknown };
  if (e.code === '23505') return true;
  // drizzle/pg may wrap the underlying postgres error in a `cause`
  if (e.cause && typeof e.cause === 'object') {
    return (e.cause as { code?: string }).code === '23505';
  }
  return false;
}

function findOrgMembership(user: AuthenticatedUser, orgId: number): OrgMembership | undefined {
  return user.orgs.find((m) => m.orgId === orgId);
}

function isOrgAdmin(membership: OrgMembership | undefined): boolean {
  if (!membership) return false;
  return membership.role === 'owner' || membership.role === 'admin';
}

interface SavedViewResponse extends ConstellationSavedView {
  /** Whether the requesting user is allowed to rename / delete / change visibility. */
  canEdit: boolean;
  /** Convenience marker so UIs can group personal vs org-shared views. */
  isOwner: boolean;
  /** Human-readable org name, populated for visibility="org" rows. */
  orgName: string | null;
}

function annotateView(row: ConstellationSavedView, user: AuthenticatedUser): SavedViewResponse {
  const isOwner = row.userId === user.id;
  const orgMembership = row.orgId != null ? findOrgMembership(user, row.orgId) : undefined;
  const canEdit = isOwner || (row.visibility === 'org' && isOrgAdmin(orgMembership));
  return {
    ...row,
    canEdit,
    isOwner,
    orgName: orgMembership?.orgName ?? null,
  };
}

router.get(
  '/constellation/views',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        sendUnauthorized(res);
        return;
      }
      const domainParam = req.query['domain'];
      const orgIds = user.orgs.map((m) => m.orgId);
      // Visibility for the requesting user is the union of:
      //   (a) every saved view they own (regardless of visibility), and
      //   (b) every org-shared view in any org they belong to.
      const visibility =
        orgIds.length > 0
          ? or(
              eq(constellationSavedViewsTable.userId, user.id),
              and(
                eq(constellationSavedViewsTable.visibility, 'org'),
                inArray(constellationSavedViewsTable.orgId, orgIds),
              ),
            )!
          : eq(constellationSavedViewsTable.userId, user.id);
      const conditions = [visibility];
      if (typeof domainParam === 'string' && domainParam.length > 0) {
        conditions.push(eq(constellationSavedViewsTable.domain, domainParam));
      }
      const rows = await db
        .select()
        .from(constellationSavedViewsTable)
        .where(and(...conditions))
        .orderBy(asc(constellationSavedViewsTable.name));
      sendSuccess(
        res,
        rows.map((r) => annotateView(r, user)),
      );
    } catch (err) {
      handleRouteError(res, err, 'Saved view request failed');
    }
  },
);

router.post(
  '/constellation/views',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        sendUnauthorized(res);
        return;
      }
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid saved view payload', parsed.error.issues);
        return;
      }
      const { domain, name, filters } = parsed.data;
      const visibility = parsed.data.visibility ?? 'private';
      let orgId: number | null = null;
      if (visibility === 'org') {
        const requested = parsed.data.orgId ?? user.orgs[0]?.orgId ?? null;
        if (requested == null) {
          sendBadRequest(res, 'Cannot share view: user is not a member of any organization');
          return;
        }
        if (!findOrgMembership(user, requested)) {
          sendForbidden(res, "Cannot share view with an organization you don't belong to");
          return;
        }
        orgId = requested;
      }
      try {
        const [row] = await db
          .insert(constellationSavedViewsTable)
          .values({
            userId: user.id,
            orgId,
            visibility,
            domain,
            name,
            filters,
          })
          .returning();
        sendSuccess(res, annotateView(row!, user), 201);
      } catch (err) {
        if (isUniqueViolation(err)) {
          sendConflict(
            res,
            visibility === 'org'
              ? 'An org-shared view with that name already exists for this domain'
              : 'A saved view with that name already exists for this domain',
          );
          return;
        }
        throw err;
      }
    } catch (err) {
      handleRouteError(res, err, 'Saved view request failed');
    }
  },
);

function parseId(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Load a saved view by id and verify the requesting user is allowed to mutate
 * it. Returns the row + the user's ACL decision so handlers can branch on
 * "exists but forbidden" vs. "doesn't exist".
 */
async function loadEditableView(
  id: number,
  user: AuthenticatedUser,
): Promise<
  { kind: 'ok'; row: ConstellationSavedView } | { kind: 'not_found' } | { kind: 'forbidden' }
> {
  const [row] = await db
    .select()
    .from(constellationSavedViewsTable)
    .where(eq(constellationSavedViewsTable.id, id))
    .limit(1);
  if (!row) return { kind: 'not_found' };
  const isOwner = row.userId === user.id;
  if (isOwner) return { kind: 'ok', row };
  if (row.visibility === 'org' && row.orgId != null) {
    const membership = findOrgMembership(user, row.orgId);
    if (!membership) {
      // Hide existence of views the user can't see at all.
      return { kind: 'not_found' };
    }
    if (isOrgAdmin(membership)) return { kind: 'ok', row };
    return { kind: 'forbidden' };
  }
  // Private view owned by someone else — never reveal it.
  return { kind: 'not_found' };
}

router.patch(
  '/constellation/views/:id',
  validateBody(
    bodyShape({
      filters: z.unknown().optional(),
      name: z.unknown().optional(),
      visibility: z.unknown().optional(),
      orgId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        sendUnauthorized(res);
        return;
      }
      const id = parseId(req.params['id']);
      if (id === null) {
        sendBadRequest(res, 'Invalid saved view id');
        return;
      }
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid saved view payload', parsed.error.issues);
        return;
      }
      const access = await loadEditableView(id, user);
      if (access.kind === 'not_found') {
        sendNotFound(res, 'Saved view');
        return;
      }
      if (access.kind === 'forbidden') {
        sendForbidden(res, 'Only the owner or an org admin can modify this shared view');
        return;
      }
      const existing = access.row;
      // Only the owner is allowed to flip visibility or move the view to a
      // different org. An org admin can rename/edit filters but cannot, for
      // example, demote a shared view to private — that would silently strip
      // it from their teammates' lists.
      const wantsVisibilityChange =
        parsed.data.visibility !== undefined && parsed.data.visibility !== existing.visibility;
      const wantsOrgChange =
        parsed.data.orgId !== undefined && parsed.data.orgId !== existing.orgId;
      if ((wantsVisibilityChange || wantsOrgChange) && existing.userId !== user.id) {
        sendForbidden(res, 'Only the owner can change visibility or organization of a saved view');
        return;
      }

      const patch: {
        name?: string;
        filters?: unknown;
        visibility?: 'private' | 'org';
        orgId?: number | null;
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (parsed.data.name !== undefined) patch.name = parsed.data.name;
      if (parsed.data.filters !== undefined) patch.filters = parsed.data.filters;
      if (wantsVisibilityChange) {
        const nextVisibility = parsed.data.visibility!;
        patch.visibility = nextVisibility;
        if (nextVisibility === 'org') {
          const requested = parsed.data.orgId ?? existing.orgId ?? user.orgs[0]?.orgId ?? null;
          if (requested == null) {
            sendBadRequest(res, 'Cannot share view: user is not a member of any organization');
            return;
          }
          if (!findOrgMembership(user, requested)) {
            sendForbidden(res, "Cannot share view with an organization you don't belong to");
            return;
          }
          patch.orgId = requested;
        } else {
          // Demoting back to private — drop the org link entirely so the
          // partial unique constraint over (org_id, domain, name) doesn't fire.
          patch.orgId = null;
        }
      } else if (wantsOrgChange) {
        // Owner is moving an already-shared view to a different org.
        if (existing.visibility !== 'org') {
          sendBadRequest(res, 'orgId only applies to org-shared views');
          return;
        }
        if (parsed.data.orgId == null || !findOrgMembership(user, parsed.data.orgId)) {
          sendForbidden(res, "Cannot share view with an organization you don't belong to");
          return;
        }
        patch.orgId = parsed.data.orgId;
      }
      try {
        const [row] = await db
          .update(constellationSavedViewsTable)
          .set(patch)
          .where(eq(constellationSavedViewsTable.id, id))
          .returning();
        if (!row) {
          sendNotFound(res, 'Saved view');
          return;
        }
        sendSuccess(res, annotateView(row, user));
      } catch (err) {
        if (isUniqueViolation(err)) {
          sendConflict(res, 'A saved view with that name already exists for this domain');
          return;
        }
        throw err;
      }
    } catch (err) {
      handleRouteError(res, err, 'Saved view request failed');
    }
  },
);

router.delete(
  '/constellation/views/:id',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        sendUnauthorized(res);
        return;
      }
      const id = parseId(req.params['id']);
      if (id === null) {
        sendBadRequest(res, 'Invalid saved view id');
        return;
      }
      const access = await loadEditableView(id, user);
      if (access.kind === 'not_found') {
        sendNotFound(res, 'Saved view');
        return;
      }
      if (access.kind === 'forbidden') {
        sendForbidden(res, 'Only the owner or an org admin can delete this shared view');
        return;
      }
      const [row] = await db
        .delete(constellationSavedViewsTable)
        .where(eq(constellationSavedViewsTable.id, id))
        .returning({ id: constellationSavedViewsTable.id });
      if (!row) {
        sendNotFound(res, 'Saved view');
        return;
      }
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Saved view request failed');
    }
  },
);

export default router;
