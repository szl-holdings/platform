import type { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { sendError } from '../lib/api-response';
import { verifyInternalHeader } from '../lib/internal-tokens';

const isProduction = process.env.NODE_ENV === 'production';

export function cacheControl(maxAgeSeconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`);
    next();
  };
}

export const SHORT_CACHE = cacheControl(30);
export const MEDIUM_CACHE = cacheControl(300);
export const LONG_CACHE = cacheControl(3600);

function makeRateLimitHandler(message: string) {
  return (_req: Request, res: Response) => {
    sendError(res, message, 429, 'RATE_LIMITED');
  };
}

function makeServiceUnavailableHandler(message: string) {
  return (_req: Request, res: Response) => {
    sendError(res, message, 503, 'SERVICE_UNAVAILABLE');
  };
}

/**
 * Key generator that uses user/org ID for authenticated traffic and falls back
 * to IP address for anonymous traffic. Applied consistently across all limiters
 * so authenticated users share a budget that isn't polluted by IP collisions
 * (e.g. shared NAT, CDN egress nodes).
 */
function userOrgKeyGenerator(req: Request): string {
  const user = (req as Request & { user?: { id?: string | number; orgId?: string | number } })
    .user;
  if (user?.orgId != null) return `org:${user.orgId}`;
  if (user?.id != null) return `user:${user.id}`;
  return ipKeyGenerator(req.ip ?? '');
}

/**
 * Skip function that bypasses rate limiting for verified internal service
 * callers (those presenting a valid X-Internal-Token header matched against
 * INTERNAL_SERVICE_TOKENS). Internal callers are trusted pipeline services
 * (e.g. Continuum runner, health-prober) that should never be throttled.
 *
 * NOTE: This is a single-instance in-memory limiter (v1). A distributed
 * deployment sharing rate-limit state across instances should migrate to
 * the PostgreSQL-backed sliding-window limiter (sliding-window-limiter.ts).
 */
export function skipForInternalCallers(req: Request): boolean {
  if (req.path === '/api/health' || req.path === '/healthz' || req.path === '/readyz') return true;
  const token = req.headers['x-internal-token'] as string | undefined;
  if (!token) return false;
  const match = verifyInternalHeader(token, req.originalUrl || req.url);
  return match !== null;
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  // Emit BOTH the IETF draft `RateLimit-*` headers (standard) and the
  // widely-implemented legacy `X-RateLimit-Limit/Remaining/Reset` headers.
  // Legacy headers are what most SDKs and our public OpenAPI documents,
  // so we keep them on by default. `Retry-After` is added automatically
  // by express-rate-limit on 429 responses.
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: userOrgKeyGenerator,
  handler: makeRateLimitHandler('Too many requests, please try again later.'),
  skip: (req) =>
    req.path === '/api/health' ||
    req.path === '/api/health/live' ||
    req.path === '/api/health/ready' ||
    req.path === '/api/ready' ||
    skipForInternalCallers(req),
}) as unknown as RequestHandler;

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: userOrgKeyGenerator,
  handler: makeRateLimitHandler('Too many write requests, please try again later.'),
  skip: skipForInternalCallers,
}) as unknown as RequestHandler;

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 600 : 2000,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: userOrgKeyGenerator,
  handler: makeRateLimitHandler('Too many requests, please try again later.'),
  skip: skipForInternalCallers,
}) as unknown as RequestHandler;

export const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: true,
  handler: makeRateLimitHandler('Too many submissions from this IP. Please try again in an hour.'),
}) as unknown as RequestHandler;

// Looser bucket for public file-upload endpoints. A single deal submission
// can attach up to 10 files and a founder may iterate (replace, retry, add)
// before they actually submit, so the 5/hour publicSubmitLimiter would lock
// them out. This limiter targets ~6 full submissions per hour worth of
// uploads and is paired with the strict publicSubmitLimiter on the final
// submit endpoint, which still gates how many deals can be created.
export const publicUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: true,
  handler: makeRateLimitHandler('Too many file uploads from this IP. Please try again in an hour.'),
}) as unknown as RequestHandler;

/**
 * Login / credential-verification limiter (FINDING F-01, Phase A auth review).
 *
 * Strict per-IP cap on credential-verification endpoints to mitigate online
 * password / TOTP brute-force attacks. Applied to:
 *   - POST /auth/login            (Replit identity verification)
 *   - POST /auth/login-password   (email + password)
 *   - POST /auth/refresh          (refresh-token rotation; replay-detected)
 *   - POST /auth/mfa/challenge    (TOTP verification at login)
 *   - POST /auth/mfa/setup-required, /auth/mfa/enable-required (post-login MFA setup)
 *
 * The limit is intentionally small (production: 10 attempts / 15 min) so that
 * a credential-stuffing burst is throttled long before it can enumerate
 * realistic password lists. Successful logins are NOT counted (skipSuccessful)
 * so a legitimate user mistyping once does not get locked out.
 *
 * NOTE: This is per-IP only. A distributed attacker rotating IPs is not
 * stopped by this limiter alone — that requires per-account lockout, which
 * is tracked as a separate hardening item (out of scope for this finding).
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: true,
  skipSuccessfulRequests: true,
  handler: makeRateLimitHandler(
    "Too many login attempts from this IP. Please wait a few minutes before trying again.",
  ),
}) as unknown as RequestHandler;

export const gdprLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 30,
  standardHeaders: true,
  legacyHeaders: true,
  handler: makeRateLimitHandler(
    'Too many data requests from this IP. Please try again in an hour.',
  ),
}) as unknown as RequestHandler;

/**
 * AI inference limiter.
 *
 * Applied to endpoints that invoke AI model calls (reasoning, generation,
 * extraction, planning, forge). Stricter than the general read limiter to
 * prevent runaway cost spikes from misconfigured clients or accidental loops.
 *
 * Keyed by user/org for authenticated traffic, by IP for anonymous callers.
 * Internal service callers are bypassed (skipForInternalCallers).
 *
 * Production:  30 calls / 15 min per user/org
 * Development: 200 calls / 15 min (permissive for local iteration)
 *
 * Pair with the DB-backed `aiInferenceSlidingLimiter` (sliding-window-limiter.ts)
 * for per-user minute-level enforcement that survives process restarts.
 */
export const aiInferenceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: userOrgKeyGenerator,
  handler: makeRateLimitHandler(
    'AI inference rate limit exceeded. Please wait before making additional AI requests.',
  ),
  skip: skipForInternalCallers,
}) as unknown as RequestHandler;

/**
 * Bulk export limiter.
 *
 * Applied to endpoints that generate heavyweight exports (PDF reports,
 * SIEM export bundles, data dumps). These requests are CPU/IO intensive
 * and can saturate the server if not throttled.
 *
 * Keyed by user/org for authenticated traffic, by IP for anonymous callers.
 * Internal service callers are bypassed (skipForInternalCallers).
 *
 * Production:  10 exports / hour per user/org
 * Development: 100 exports / hour
 */
export const bulkExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: userOrgKeyGenerator,
  handler: makeRateLimitHandler(
    'Export rate limit exceeded. You may generate up to 10 exports per hour. Please try again later.',
  ),
  skip: skipForInternalCallers,
}) as unknown as RequestHandler;

export { makeServiceUnavailableHandler };
