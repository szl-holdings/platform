import type { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { sendError } from '../lib/api-response';

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
  handler: makeRateLimitHandler('Too many requests, please try again later.'),
  skip: (req) =>
    req.path === '/api/health' ||
    req.path === '/api/health/live' ||
    req.path === '/api/health/ready' ||
    req.path === '/api/ready',
}) as unknown as RequestHandler;

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: true,
  handler: makeRateLimitHandler('Too many write requests, please try again later.'),
}) as unknown as RequestHandler;

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 600 : 2000,
  standardHeaders: true,
  legacyHeaders: true,
  handler: makeRateLimitHandler('Too many requests, please try again later.'),
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

export { makeServiceUnavailableHandler };
