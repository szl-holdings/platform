import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { sendError } from "../lib/api-response";

const isProduction = process.env.NODE_ENV === "production";

export function cacheControl(maxAgeSeconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`);
    next();
  };
}

export const SHORT_CACHE = cacheControl(30);
export const MEDIUM_CACHE = cacheControl(300);
export const LONG_CACHE = cacheControl(3600);

function makeRateLimitHandler(message: string) {
  return (_req: Request, res: Response) => {
    sendError(res, message, 429, "RATE_LIMITED");
  };
}

function makeServiceUnavailableHandler(message: string) {
  return (_req: Request, res: Response) => {
    sendError(res, message, 503, "SERVICE_UNAVAILABLE");
  };
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many requests, please try again later."),
  skip: (req) =>
    req.path === "/api/health" ||
    req.path === "/api/health/live" ||
    req.path === "/api/health/ready" ||
    req.path === "/api/ready",
}) as unknown as RequestHandler;

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many write requests, please try again later."),
}) as unknown as RequestHandler;

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 600 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many requests, please try again later."),
}) as unknown as RequestHandler;

export const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many submissions from this IP. Please try again in an hour."),
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
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many file uploads from this IP. Please try again in an hour."),
}) as unknown as RequestHandler;

export const gdprLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many data requests from this IP. Please try again in an hour."),
}) as unknown as RequestHandler;

export { makeServiceUnavailableHandler };
