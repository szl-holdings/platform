/**
 * Session token helpers — pure functions for creating, validating and
 * inspecting opaque session tokens.  No DB I/O here; that layer lives in
 * `artifacts/api-server`.
 */

import { randomBytes } from 'node:crypto';
import type { SessionToken } from '../types.js';

/** Number of random bytes used for a session token (64-char hex). */
const SESSION_TOKEN_BYTES = 32;

/** Default session TTL in milliseconds (7 days). */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Absolute maximum session lifetime from creation (7 days).
 *
 * Matches the `SESSION_TTL` constant enforced by the sliding-window
 * refresh policy in `artifacts/api-server/src/middlewares/session-policy.ts`.
 * No session may outlive `createdAt + SESSION_ABSOLUTE_MAX_MS` regardless of
 * how many sliding-window refreshes occur.
 */
export const SESSION_ABSOLUTE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Refresh token TTL (30 days).
 *
 * Refresh tokens live longer than access sessions so users can silently
 * re-authenticate after the 7-day session window without a full OIDC redirect.
 * After 30 days the refresh token expires and the user must log in again.
 */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cookie name used to carry the opaque session token.
 *
 * Uses the `__Host-` prefix (FINDING-005, NCC Group 2026-04 pen test) so
 * browsers enforce Secure=true, Path=/, and no Domain attribute, preventing
 * subdomain cookie-injection attacks.
 *
 * @see artifacts/api-server/src/lib/auth.ts — SESSION_COOKIE / LEGACY_SESSION_COOKIE
 */
export const SESSION_COOKIE_NAME = '__Host-sid' as const;

/** Generates a new cryptographically random session token. */
export function generateSessionToken(): SessionToken {
  return randomBytes(SESSION_TOKEN_BYTES).toString('hex') as SessionToken;
}

/** Returns true if a token string matches the expected 64-char hex format. */
export function isValidTokenFormat(token: string): boolean {
  return /^[0-9a-f]{64}$/i.test(token);
}

/** Computes the expiry Date from now + TTL. */
export function sessionExpiresAt(ttlMs: number = SESSION_TTL_MS): Date {
  return new Date(Date.now() + ttlMs);
}

// ── Cookie options factory ──────────────────────────────────────────────────

export interface SessionCookieOptions {
  isProduction: boolean;
  ttlMs?: number;
}

/**
 * Returns `res.cookie(...)` options for the session cookie.
 *
 * `secure` is always `true` — the `__Host-` prefix mandates it, and the
 * platform only runs over HTTPS in all environments (development uses the
 * Replit proxy, which terminates TLS). Passing `isProduction` is kept for
 * API back-compat but no longer affects the `secure` flag.
 */
export function sessionCookieOptions(opts: SessionCookieOptions) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    maxAge: opts.ttlMs ?? SESSION_TTL_MS,
    path: '/',
  };
}

/** Returns `res.clearCookie(...)` options for the session cookie. */
export function sessionClearCookieOptions(opts: Pick<SessionCookieOptions, 'isProduction'>) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  };
}

// ── Login / logout response builders ───────────────────────────────────────
//
// These are framework-agnostic helpers. They do NOT perform DB I/O themselves;
// the caller is responsible for persisting the session token and providing the
// user object. This keeps auth-shared free of any specific DB dependency.

export interface LoginResponseOptions {
  /** The session token that was persisted by the caller. */
  token: SessionToken;
  /** TTL in ms; defaults to SESSION_TTL_MS (7 days). */
  ttlMs?: number;
  /** Whether to set Secure on the cookie (set to true in production). */
  isProduction: boolean;
}

/**
 * Writes the session cookie onto the response.
 *
 * Usage in an Express route handler:
 * ```ts
 * const token = generateSessionToken();
 * await db.insert(sessionsTable).values({ token, userId, expiresAt: ... });
 * writeSessionCookie(res, { token, isProduction: isProd });
 * res.json({ ok: true });
 * ```
 */
export function writeSessionCookie(
  res: { cookie: (name: string, value: string, options: object) => void },
  opts: LoginResponseOptions,
): void {
  res.cookie(SESSION_COOKIE_NAME, opts.token, sessionCookieOptions(opts));
}

/**
 * Clears the session cookie from the response (for logout).
 *
 * Usage in an Express route handler:
 * ```ts
 * await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
 * clearSessionCookie(res, { isProduction: isProd });
 * res.json({ ok: true });
 * ```
 */
export function clearSessionCookie(
  res: { clearCookie: (name: string, options: object) => void },
  opts: Pick<LoginResponseOptions, 'isProduction'>,
): void {
  res.clearCookie(SESSION_COOKIE_NAME, sessionClearCookieOptions(opts));
}

// ── Express route-guard middleware factories ────────────────────────────────
//
// These are typed against the minimal subset of Express Request / Response /
// NextFunction so that auth-shared has no hard Express runtime dependency
// (it lives in `devDependencies` of consuming packages).

export interface MinimalRequest {
  cookies?: Record<string, string>;
  user?: unknown;
}
export interface MinimalResponse {
  status: (code: number) => MinimalResponse;
  json: (body: unknown) => void;
}
export type NextFn = () => void;

/**
 * Minimal Express-compatible middleware that rejects unauthenticated requests.
 *
 * The consuming application is responsible for populating `req.user` earlier
 * in the middleware chain (e.g. in the api-server `requireAuth` middleware).
 * This guard is a lightweight second-layer assertion, useful in modular routers
 * that run before the global auth enforcer.
 *
 * Usage:
 * ```ts
 * import { requireSessionMiddleware } from "@szl-holdings/auth-shared/server";
 * router.use(requireSessionMiddleware());
 * ```
 */
export function requireSessionMiddleware() {
  return function sessionGuard(req: MinimalRequest, res: MinimalResponse, next: NextFn): void {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  };
}

/**
 * Minimal Express-compatible middleware that rejects requests whose `req.user`
 * does not have at least one of the specified platform roles.
 *
 * Usage:
 * ```ts
 * router.use(requireRoleMiddleware(["super_admin", "platform_admin"]));
 * ```
 */
export function requireRoleMiddleware(allowed: string[]) {
  return function roleGuard(req: MinimalRequest, res: MinimalResponse, next: NextFn): void {
    const user = req.user as { roles?: string[] } | undefined;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const hasRole = (user.roles ?? []).some((r) => allowed.includes(r));
    if (!hasRole) {
      res.status(403).json({ error: 'Insufficient role' });
      return;
    }
    next();
  };
}
