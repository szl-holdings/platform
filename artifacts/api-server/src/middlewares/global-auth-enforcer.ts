/**
 * Global Auth Enforcer (Deny-by-default)
 *
 * This middleware runs AFTER the auth hydrator (authMiddleware.ts) which populates
 * req.user / req.oidcUser. It enforces authentication for all /api/* routes by
 * default, returning 401 for unauthenticated requests unless the request path is
 * in the explicit public allowlist below.
 *
 * Public route groups:
 *  - Health endpoints (/api/health*)
 *  - Auth/login/register (/api/auth/*)
 *  - OIDC callbacks (/api/oidc/*)
 *  - Contact form (/api/contact)
 *  - Demo requests (/api/demo-requests)
 *  - Public status (/api/public/*)
 *  - Webhooks (/api/webhooks/*) — use HMAC authentication internally
 *  - SCIM 2.0 (/api/scim/*) — uses scimTokensTable bearer token auth (RFC 7643/7644);
 *    the SCIM auth is enforced within the SCIM router via scimBearerAuth middleware
 *  - Streaming webhook ingestion endpoints (/api/stream/webhook/*, /api/stream/webhook-siem,
 *    /api/stream/ais-nmea) — use source token authentication (streamed-ingestion authToken)
 *  - Streaming SSE read endpoints (/api/stream/siem-events, /api/stream/market-data,
 *    /api/stream/ais-tracking, /api/stream/status) — read-only live feeds used by dashboards
 *  - A2A Federation discovery endpoints (/api/federation/agents*, /api/federation/health)
 *    POST /federation/agents/:id/chat uses its own FEDERATION_API_TOKENS bearer token
 *  - DOS Public API (/api/v1/*)
 *  - API docs (/api/docs*, /api/docs.json)
 *  - CSRF token endpoint (/api/csrf-token)
 *  - Per-service health probes (e.g. /api/prism-counsel/health)
 */

import { timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { serverTelemetry } from "@szl-holdings/observability";
import { sendUnauthorized } from "../lib/api-response";

const PUBLIC_EXACT_PATHS = new Set([
  "/api/contact",
  "/api/demo-requests",
  "/api/csrf-token",
  // Mobile OIDC token exchange — called before the user has a session, so must be public.
  // The route validates the OIDC authorization code and issues a session token.
  "/api/mobile-auth/token-exchange",
  "/api/docs.json",
  "/api/openapi",
  "/api/openapi.json",
  "/api/version",
  "/api/ready",
  "/api/stream/webhook-siem",
  "/api/stream/ais-nmea",
  "/api/stream/siem-events",
  "/api/stream/market-data",
  "/api/stream/ais-tracking",
  "/api/stream/status",
  "/api/federation/health",
  "/api/federation/agents",
  "/api/prism-counsel/health",
  "/api/prism-counsel/readiness",
]);

const PUBLIC_PREFIXES = [
  "/api/health",
  "/api/auth/",
  "/api/oidc/",
  "/api/public/",
  "/api/webhooks/",
  "/api/scim/",
  "/api/stream/webhook/",
  "/api/federation/agents/",
  "/api/v1/",
  "/api/docs/",
  // Terra Cognitive runtime — read-only GET routes use authMiddleware({ required: false })
  // and are intentionally accessible without a session (richer context shown when authed).
  // The POST mutation /submit-review is NOT included here; it enforces its own auth.
  "/api/terra/cognitive/",
  // Carlota Jo time tracking & invoice persistence — publicly accessible from the
  // time-tracking page (which is unauthenticated like the rest of the marketing
  // demo). Backed by Postgres so the data syncs across devices.
  "/api/booking/time-entries",
  "/api/booking/time-invoices",
  "/api/booking/services",
  // Debug: add console.log to confirm matching
  "/api/booking/health",
  // LP portal — read-only GET routes use authMiddleware({ required: false }) so the
  // marketing demo at /fund/lp-portal can showcase seeded data, while authenticated
  // LPs see only their own real records (matched by contact email).
  "/api/lp-portal/",
  // Anonymous page-view tracking — public endpoint that captures pre-login
  // site traffic so the investor funnel Visitor stage reflects real visitors.
  "/api/track/",
];

function isValidInternalToken(req: Request): boolean {
  const secret = process.env["ALLOY_INTERNAL_TOKEN"];
  if (!secret) return false;
  const header = req.headers["x-internal-token"];
  if (typeof header !== "string") return false;
  const a = Buffer.from(secret, "utf8");
  const b = Buffer.from(header, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function globalAuthEnforcer(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.path.startsWith("/api")) {
    next();
    return;
  }

  if (req.user || req.oidcUser) {
    next();
    return;
  }

  if (isValidInternalToken(req)) {
    next();
    return;
  }

  const path = req.path;

  if (PUBLIC_EXACT_PATHS.has(path)) {
    next();
    return;
  }

  for (const prefix of PUBLIC_PREFIXES) {
    if (path === prefix || path.startsWith(prefix)) {
      next();
      return;
    }
  }

  // Non-production demo access routes: PIN-validated but session-free.
  // Completely disabled in production; route handlers apply timing-safe PIN check.
  // /api/pulse/demo/verify accepts PIN in POST body (never in URL).
  if (process.env.NODE_ENV !== "production" &&
    (path.startsWith("/api/pulse/demo/") || path === "/api/pulse/demo/verify")) {
    next();
    return;
  }

  serverTelemetry.recordAuthFailure();
  sendUnauthorized(res, "This endpoint requires a valid session. Please log in.");
}
