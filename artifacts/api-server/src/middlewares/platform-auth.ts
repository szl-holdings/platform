import type { PlatformRole } from '@szl-holdings/db';
import {
  canWritePlatform,
  db,
  hasPlatformRole,
  isPlatformAdmin,
  organizationsTable,
  orgMembersTable,
  PLATFORM_ROLE_HIERARCHY,
  rolesTable,
  sessionsTable,
  userRolesTable,
  usersTable,
} from '@szl-holdings/db';
import { and, eq, gt } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

export interface PlatformUser {
  id: number;
  displayName: string;
  email: string | null;
  platformRole: PlatformRole | null;
  team: string | null;
  orgId: number | null;
  orgSlug: string | null;
}

declare global {
  namespace Express {
    interface Request {
      platformUser?: PlatformUser;
    }
  }
}

async function resolveUserFromToken(token: string): Promise<{
  id: number;
  displayName: string;
  email: string | null;
  platformRole: PlatformRole | null;
  team: string | null;
} | null> {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())));
  if (!session) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    platformRole: (user.platformRole as PlatformRole) || null,
    team: user.team || null,
  };
}

async function resolveOrgFromRequest(
  req: Request,
  userId: number,
): Promise<{ orgId: number; orgSlug: string } | null> {
  const orgSlugHeader = req.headers['x-org-slug'] as string | undefined;
  const orgIdHeader = req.headers['x-org-id'] as string | undefined;
  const orgSlugQuery = req.query.orgSlug as string | undefined;
  const orgIdQuery = req.query.orgId as string | undefined;

  const orgSlug = orgSlugHeader || orgSlugQuery;
  const orgIdRaw = orgIdHeader || orgIdQuery;

  if (orgSlug) {
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.slug, orgSlug));
    if (!org) return null;

    const [membership] = await db
      .select()
      .from(orgMembersTable)
      .where(and(eq(orgMembersTable.orgId, org.id), eq(orgMembersTable.userId, userId)));

    if (!membership) return null;
    return { orgId: org.id, orgSlug: org.slug };
  }

  if (orgIdRaw) {
    const orgId = parseInt(orgIdRaw, 10);
    if (isNaN(orgId)) return null;

    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, orgId));
    if (!org) return null;

    const [membership] = await db
      .select()
      .from(orgMembersTable)
      .where(and(eq(orgMembersTable.orgId, orgId), eq(orgMembersTable.userId, userId)));

    if (!membership) return null;
    return { orgId, orgSlug: org.slug };
  }

  const memberships = await db
    .select({ orgId: orgMembersTable.orgId, orgSlug: organizationsTable.slug })
    .from(orgMembersTable)
    .innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
    .where(eq(orgMembersTable.userId, userId))
    .limit(1);

  if (memberships.length === 0) return null;
  return { orgId: memberships[0].orgId, orgSlug: memberships[0].orgSlug };
}

export function platformAuth(options: { required?: boolean; minRole?: PlatformRole } = {}) {
  const { required = true, minRole } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        if (required) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }
        next();
        return;
      }

      const token = authHeader.slice(7);
      const userBase = await resolveUserFromToken(token);

      if (!userBase) {
        if (required) {
          res.status(401).json({ error: 'Invalid or expired session' });
          return;
        }
        next();
        return;
      }

      if (minRole && userBase.platformRole) {
        const userLevel = PLATFORM_ROLE_HIERARCHY[userBase.platformRole] ?? 0;
        const requiredLevel = PLATFORM_ROLE_HIERARCHY[minRole] ?? 0;
        if (userLevel < requiredLevel) {
          res.status(403).json({
            error: 'Insufficient platform role',
            required: minRole,
            current: userBase.platformRole,
          });
          return;
        }
      }

      const orgContext = await resolveOrgFromRequest(req, userBase.id);

      req.platformUser = {
        ...userBase,
        orgId: orgContext?.orgId ?? null,
        orgSlug: orgContext?.orgSlug ?? null,
      };

      next();
    } catch (err) {
      console.error('[platform-auth] error:', err);
      res.status(500).json({ error: 'Authentication error' });
    }
  };
}

export function requirePlatformRole(...allowedRoles: PlatformRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.platformUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.platformUser.platformRole;
    if (!userRole) {
      res.status(403).json({ error: 'No platform role assigned' });
      return;
    }

    if (isPlatformAdmin(userRole)) {
      next();
      return;
    }

    const hasRole = allowedRoles.some((r) => {
      const userLevel = PLATFORM_ROLE_HIERARCHY[userRole] ?? 0;
      const requiredLevel = PLATFORM_ROLE_HIERARCHY[r] ?? 0;
      return userLevel >= requiredLevel;
    });

    if (!hasRole) {
      res.status(403).json({
        error: 'Insufficient platform permissions',
        required: allowedRoles,
        current: userRole,
      });
      return;
    }

    next();
  };
}

export function requireOrgScope() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.platformUser?.orgId) {
      res
        .status(403)
        .json({ error: 'Org scope required — provide x-org-slug header or orgSlug query param' });
      return;
    }
    next();
  };
}

export function requireWriteAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.platformUser?.platformRole;
    if (!canWritePlatform(role ?? undefined)) {
      res.status(403).json({ error: 'Write access not permitted for this role', current: role });
      return;
    }
    next();
  };
}

export function enforceOrgScope(orgIdGetter: (req: Request) => number | null | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceOrgId = orgIdGetter(req);
    if (resourceOrgId && req.platformUser?.orgId && resourceOrgId !== req.platformUser.orgId) {
      if (!isPlatformAdmin(req.platformUser.platformRole ?? undefined)) {
        res
          .status(403)
          .json({ error: 'Access denied — resource belongs to a different organization' });
        return;
      }
    }
    next();
  };
}

export function logPlatformEvent(eventType: string, entityType: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    next();
    try {
      const { db: database, eventLogTable } = await import('@szl-holdings/db');
      if (req.platformUser) {
        await database.insert(eventLogTable).values({
          orgId: req.platformUser.orgId ?? undefined,
          product: 'platform',
          actorId: req.platformUser.id,
          actorName: req.platformUser.displayName,
          eventType,
          entityType,
          entityId: req.params.id ?? null,
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        } as any);
      }
    } catch {}
  };
}
