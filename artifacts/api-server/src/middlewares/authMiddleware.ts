/**
 * Global Auth Middleware (OIDC Session Hydration)
 *
 * This middleware runs on EVERY request and hydrates req.oidcUser from the session
 * cookie or Bearer token. It acts as an always-on session lookup that populates
 * both req.oidcUser (legacy) and req.user (canonical) simultaneously.
 *
 * Architecture note: This is deliberately kept as a global hydrator (not an enforcer).
 * Route-level authorization uses authMiddleware() from middlewares/auth.ts which applies
 * required: true/false and role checks. This ensures all routes have user context
 * available without mandating authentication for public/optional endpoints.
 *
 * Auth system unification: Both req.oidcUser and req.user are always populated together
 * from the same session lookup. Routes can use req.user (the canonical AuthenticatedUser
 * from auth.ts) for RBAC checks without needing a second lookup.
 */

import type { RoleName } from '@szl-holdings/db';
import type { NextFunction, Request, Response } from 'express';
import { getSessionToken, getSessionUser } from '../lib/auth';

export interface OidcUser {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roles: RoleName[];
}

declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): this is AuthedRequest;
      oidcUser?: OidcUser;
    }

    interface AuthedRequest extends Request {
      oidcUser: OidcUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  req.isAuthenticated = function (this: Request) {
    return this.oidcUser != null;
  } as Request['isAuthenticated'];

  const token = getSessionToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const user = await getSessionUser(token);
    if (user) {
      req.oidcUser = user;
      if (!req.user) {
        req.user = {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          roles: user.roles,
          orgs: [],
        };
      }
    }
  } catch {
    // ignore errors, proceed as unauthenticated
  }

  next();
}
