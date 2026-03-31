import { type Request, type Response, type NextFunction } from "express";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const CSRF_TOKEN_BYTES = 32;
const CSRF_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const EXEMPT_PATHS = new Set([
  "/api/health",
  "/api/health/live",
  "/api/health/ready",
  "/api/health/detailed",
  "/api/csrf-token",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/callback",
  "/api/webhooks",
]);

const GRAPHQL_PATHS = ["/api/graphql", "/graphql"];

function isExempt(path: string): boolean {
  if (EXEMPT_PATHS.has(path)) return true;
  if (path.startsWith("/api/webhooks/")) return true;
  if (path.startsWith("/api-docs")) return true;
  return false;
}

function isGraphQLPath(path: string): boolean {
  return GRAPHQL_PATHS.some(p => path === p || path.startsWith(p + "/"));
}

function generateToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = generateToken();
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: CSRF_COOKIE_MAX_AGE_MS,
        path: "/",
      });
    }
    return next();
  }

  if (isExempt(req.path)) return next();

  if (isGraphQLPath(req.path)) {
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.startsWith("application/json")) {
      logger.warn({ path: req.path, method: req.method, contentType }, "GraphQL request rejected: requires Content-Type: application/json");
      res.status(415).json({ error: "Unsupported Media Type", message: "GraphQL requests must use Content-Type: application/json." });
      return;
    }
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    logger.warn({ path: req.path, method: req.method }, "CSRF token missing");
    res.status(403).json({ error: "Forbidden", message: "CSRF token missing." });
    return;
  }

  if (!timingSafeEqual(cookieToken, headerToken)) {
    logger.warn({ path: req.path, method: req.method }, "CSRF token mismatch");
    res.status(403).json({ error: "Forbidden", message: "CSRF token mismatch." });
    return;
  }

  next();
}
