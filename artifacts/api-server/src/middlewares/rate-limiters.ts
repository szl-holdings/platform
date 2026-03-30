import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

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

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) =>
    req.path === "/api/health" ||
    req.path === "/api/health/live" ||
    req.path === "/api/health/ready",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many write requests, please try again later." },
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many read requests, please try again later." },
});
