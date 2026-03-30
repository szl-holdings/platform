import { type Request, type Response, type NextFunction } from "express";
import { getSessionToken, getSessionUser } from "../lib/auth";
import type { RoleName } from "@workspace/db";

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
  } as Request["isAuthenticated"];

  const token = getSessionToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const user = await getSessionUser(token);
    if (user) {
      req.oidcUser = user;
    }
  } catch {
    // ignore errors, just proceed unauthenticated
  }

  next();
}
