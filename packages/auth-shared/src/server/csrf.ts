/**
 * CSRF helpers for server-side Express applications.
 *
 * Implements the double-submit cookie pattern:
 *  1. On any GET, a random CSRF token is written to a `csrf_token` cookie
 *     (readable by JavaScript — httpOnly=false — so the SPA can attach it).
 *  2. On state-changing requests, the middleware compares the cookie value
 *     against the `X-CSRF-Token` request header.  Mismatch → 403.
 *
 * Internal service-to-service calls (x-internal-token) and API clients that
 * authenticate via Bearer tokens bypass the check because CSRF attacks rely
 * on the browser automatically attaching cookies — Bearer tokens cannot be
 * forged this way.
 */

import { randomBytes } from "crypto";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../types.js";

export const CSRF_TOKEN_BYTES = 32;
export const CSRF_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Generates a cryptographically random hex CSRF token. */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString("hex");
}

/**
 * Timing-safe string comparison so token validation is not vulnerable to
 * timing side-channels.
 */
export function csrfTimingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Returns true if the HTTP method is safe (no state change). */
export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

// ── Cookie options factory ──────────────────────────────────────────────────

export interface CsrfCookieOptions {
  isProduction: boolean;
}

/** Returns `res.cookie(...)` options for the CSRF token cookie. */
export function csrfCookieOptions(opts: CsrfCookieOptions) {
  return {
    httpOnly: false,
    secure: opts.isProduction,
    sameSite: "strict" as const,
    maxAge: CSRF_COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

// ── Validation helpers ──────────────────────────────────────────────────────

export type CsrfValidationResult =
  | { ok: true }
  | { ok: false; reason: "missing_cookie" | "missing_header" | "mismatch" };

/**
 * Validates a CSRF double-submit pair.  Returns `{ ok: true }` when the
 * cookie and header are present and match, otherwise returns a reason code.
 */
export function validateCsrfPair(cookieToken: string | undefined, headerToken: string | undefined): CsrfValidationResult {
  if (!cookieToken) return { ok: false, reason: "missing_cookie" };
  if (!headerToken) return { ok: false, reason: "missing_header" };
  if (!csrfTimingSafeEqual(cookieToken, headerToken)) return { ok: false, reason: "mismatch" };
  return { ok: true };
}
