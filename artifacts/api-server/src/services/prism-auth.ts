import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

export const PRISM_ROLES = {
  FOUNDER_ADMIN: 'founder_admin',
  ORG_ADMIN: 'org_admin',
  ATTORNEY: 'attorney',
  PARALEGAL: 'paralegal',
  OPERATOR: 'operator',
  ANALYST: 'analyst',
  CLIENT_VIEWER: 'client_viewer',
  EXTERNAL_REVIEWER: 'external_reviewer',
} as const;

type PrismRole = (typeof PRISM_ROLES)[keyof typeof PRISM_ROLES];

const ROLE_HIERARCHY: Record<string, number> = {
  founder_admin: 100,
  super_admin: 95,
  admin: 90,
  org_admin: 85,
  attorney: 70,
  paralegal: 60,
  operator: 50,
  ops: 50,
  analyst: 40,
  member: 30,
  client_viewer: 20,
  viewer: 15,
  external_reviewer: 10,
};

const WRITE_ROLES = new Set([
  'founder_admin',
  'super_admin',
  'admin',
  'org_admin',
  'attorney',
  'paralegal',
  'operator',
  'ops',
]);

const EXPORT_ROLES = new Set(['founder_admin', 'super_admin', 'admin', 'org_admin', 'attorney']);

const ADMIN_ROLES = new Set(['founder_admin', 'super_admin', 'admin', 'org_admin']);

const APPROVAL_ROLES = new Set(['founder_admin', 'super_admin', 'admin', 'org_admin', 'attorney']);

function getUserRoles(req: Request): string[] {
  return req.user?.roles ?? [];
}

function hasAnyRole(userRoles: string[], allowedRoles: Set<string>): boolean {
  return userRoles.some((r) => allowedRoles.has(r));
}

function getHighestRoleLevel(userRoles: string[]): number {
  return Math.max(0, ...userRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));
}

export function requirePrismRole(...allowedRoles: PrismRole[]) {
  const allowed = new Set<string>(allowedRoles);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userRoles = getUserRoles(req);
    if (hasAnyRole(userRoles, ADMIN_ROLES) || hasAnyRole(userRoles, allowed)) {
      next();
      return;
    }
    logger.warn(
      {
        userId: req.user.id,
        requiredRoles: allowedRoles,
        actualRoles: userRoles,
      },
      '[prism-auth] Access denied: insufficient role',
    );
    res.status(403).json({ error: 'Insufficient permissions' });
  };
}

export function requirePrismWrite() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userRoles = getUserRoles(req);
    if (!hasAnyRole(userRoles, WRITE_ROLES)) {
      res.status(403).json({ error: 'Write access denied' });
      return;
    }
    next();
  };
}

export function requirePrismExport() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userRoles = getUserRoles(req);
    if (!hasAnyRole(userRoles, EXPORT_ROLES)) {
      logger.warn({ userId: req.user.id }, '[prism-auth] Export access denied');
      res.status(403).json({ error: 'Export access requires attorney or admin role' });
      return;
    }
    next();
  };
}

export function requirePrismApproval() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userRoles = getUserRoles(req);
    if (!hasAnyRole(userRoles, APPROVAL_ROLES)) {
      res.status(403).json({ error: 'Approval authority requires attorney or admin role' });
      return;
    }
    next();
  };
}

export function requirePrismAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userRoles = getUserRoles(req);
    if (!hasAnyRole(userRoles, ADMIN_ROLES)) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  };
}

export function enforcePrivilegeFilter() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRoles = getUserRoles(req);
    const canSeePrivileged = hasAnyRole(
      userRoles,
      new Set(['founder_admin', 'super_admin', 'admin', 'org_admin', 'attorney']),
    );
    (req as any).canViewPrivileged = canSeePrivileged;
    next();
  };
}

export function getPrismCapabilities(userRoles: string[]) {
  return {
    canWrite: hasAnyRole(userRoles, WRITE_ROLES),
    canExport: hasAnyRole(userRoles, EXPORT_ROLES),
    canApprove: hasAnyRole(userRoles, APPROVAL_ROLES),
    canAdmin: hasAnyRole(userRoles, ADMIN_ROLES),
    canViewPrivileged: hasAnyRole(
      userRoles,
      new Set(['founder_admin', 'super_admin', 'admin', 'org_admin', 'attorney']),
    ),
    roleLevel: getHighestRoleLevel(userRoles),
  };
}
