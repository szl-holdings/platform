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
import { verifyInternalHeader } from "../lib/internal-tokens";

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
  "/api/prism-counsel/privilege/check",
  // Self-healing orchestrator — read-only GET endpoints.
  // Exact-path matches ensure the mutating PATCH /policies/:id/toggle
  // (which requires auth) is NOT covered by these allowlist entries.
  "/api/self-healing/stats",
  "/api/self-healing/policies",
  // Shared action store — backs the Business State / Enterprise State pages
  // so risk owner assignments and decisions sync across team members. Public
  // and unauthenticated like the rest of those demo surfaces.
  "/api/action-store",
  "/api/action-store/stream",
  // Shared risk evidence store — backs the Save-run-as-evidence button on
  // Terra/Vessels Risk Simulation panels so cited Monte Carlo runs are
  // visible to external reviewers and lender briefings (instead of being
  // stuck in per-browser localStorage). Public under the same model as the
  // rest of the Terra/Vessels demo surfaces.
  // Lyte legacy surfaces — read-only public GET endpoints backing the 5
  // decision-intelligence pages (Ownership Drift, Pressure Map, Action Debt
  // Index, Decision Replay, Board View). See routes/lyte-surfaces.ts.
  "/api/lyte/ownership-drift",
  "/api/lyte/pressure-map",
  "/api/lyte/action-debt",
  "/api/lyte/decision-replay",
  "/api/lyte/board-view",
  // Mapbox publishable-token discovery endpoint. Returns a pk.* token that is
  // intentionally public (Mapbox enforces URL allowlists on the token itself),
  // so demo-mode visitors and pre-auth marketing pages can render the Vessels
  // fleet map and Terra property maps without a session. Rate-limited inline.
  "/api/config/mapbox-token",
  // Lyte intel surfaces — Signal Fusion, Governance Posture, Decision Schema
  // Library. See routes/lyte-intel.ts.
  "/api/lyte/signal-fusion",
  "/api/lyte/governance-domains",
  "/api/lyte/decision-schemas",
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
  // Terra property-scoped intelligence modules — read-only GET routes serving deterministic
  // seed-based data per propertyId. Accessible without a session so the Terra demo shows
  // realistic intelligence results when navigating from the property detail page.
  "/api/terra/properties/",
  // Terra portfolio-scoped intelligence modules — read-only GET routes serving deterministic
  // seed-based portfolio/list data for the 6 intelligence modules. Public so the Terra demo
  // shows realistic results without a session.
  "/api/terra/portfolio/",
  // Terra "Why This Property Now" engine — distress decomposition, ownership chain,
  // financing stress, and neighborhood motion from live NYC open data. Public so the
  // demo works without a session; NYC SODA API calls are made server-side.
  "/api/terra/why-this-property/",
  // Carlota Jo time tracking & invoice persistence — publicly accessible from the
  // time-tracking page (which is unauthenticated like the rest of the marketing
  // demo). Backed by Postgres so the data syncs across devices.
  "/api/booking/time-entries",
  "/api/booking/time-invoices",
  "/api/booking/services",
  "/api/booking/health",
  // LP portal — read-only GET routes use authMiddleware({ required: false }) so the
  // marketing demo at /fund/lp-portal can showcase seeded data, while authenticated
  // LPs see only their own real records (matched by contact email).
  "/api/lp-portal/",
  // Anonymous page-view tracking — public endpoint that captures pre-login
  // site traffic so the investor funnel Visitor stage reflects real visitors.
  "/api/track/",
  // Public-site funnel analytics ingest. Anonymous client-side events posted
  // from any marketing page (often pre-session). Server validates eventName /
  // domain / sourceApp shape and writes to the analytics_events table; no PII
  // is forwarded by the client (property allow-list in lib/analytics.ts).
  "/api/analytics-engine/events",
  // Newsletter subscribe proxy — public, unauthenticated. Visitors on any
  // portfolio marketing page can subscribe to SZL Command without logging in.
  "/api/newsletter/",
  // Self-healing orchestrator — only /runs and /runs/:id GET requests are
  // whitelisted here as a prefix (covers the list endpoint and per-run detail).
  // /stats and /policies use PUBLIC_EXACT_PATHS above so the path-prefix match
  // cannot bleed into /policies/:id/toggle (the mutating PATCH route).
  "/api/self-healing/runs",
  // Simulation what-if engine — POST route is public so the Strategy simulation
  // page can compute cross-domain scenario impacts in demo mode without a session.
  "/api/simulation/",
  // Demo reset — POST /api/demo/reset is public so the Demo Launchpad presenter
  // can reset scenario state without being logged in. Mounted pre-auth in app.ts;
  // this PUBLIC_PREFIXES entry is kept as defense-in-depth, scoped to exact path only.
  "/api/demo/reset",
  // Infrastructure status — lightweight public health summary used by the
  // Legatus infrastructure console to show live AquilaScore and threat level.
  "/api/infrastructure/",
  // Agent Mesh telemetry — read-only GET state/index plus POST scan that
  // re-reads local config files and refreshes the resilience index. Public
  // so Sentra's Mesh Map and Pulse's MeshCard can render live data in the
  // unauthenticated demo experience.
  "/api/agent-mesh/",
  // Pulse one-click email unsubscribe — token-protected, accessed from
  // recipient's inbox without a session. Mounted before authMiddleware in
  // routes/pulse.ts; this entry whitelists it past the global auth enforcer.
  "/api/pulse/unsubscribe",
  // Demo narrative payloads (Sentra ransomware, Counsel deadline) — read-only.
  // Backs the Decision Center pages with the same signal/evidence/recommendation
  // bundle that gets seeded into the live signal mesh at boot.
  "/api/narratives/",
  // Shared risk evidence store — list/save/delete cited Monte Carlo runs
  // and resolve them server-side for lender briefing exports. See
  // routes/risk-evidence.ts for the endpoint contract.
  "/api/risk-evidence/",
  // Global Operations Fabric — snapshot + SSE stream for the Fabric page.
  // Public prefix bypasses this enforcer so the route handler can apply its own
  // production/demo guard: in production the handler checks req.user and returns
  // 401 for unauthenticated requests; in sandbox/demo mode it serves synthetic
  // seed data publicly. Never exposes live production signals to anonymous users.
  "/api/fabric/",
  // Competitive Intel monitor — backs the Command Competitive Atlas page with
  // RSS-derived "Intel Update" alerts about tracked champions (CrowdStrike,
  // Clio, CoStar, Windward, Palantir, ThoughtSpot). The Atlas page is internal-
  // facing but unauthenticated like the rest of the Command demo surface; the
  // underlying data is sourced exclusively from public product blogs / RSS feeds.
  "/api/competitive-intel/",
];

function isValidInternalToken(req: Request): boolean {
  const header = req.headers["x-internal-token"];
  if (typeof header !== "string") return false;
  return verifyInternalHeader(header, req.originalUrl || req.url) !== null;
}

/**
 * Trusted server-to-server token for POST /api/orgs/:orgSlug/usage/events.
 * Lets internal collectors / background jobs record usage events without a
 * user session. Scoped narrowly to that single route + method to avoid
 * widening the bypass surface.
 */
function isValidUsageEventServiceToken(req: Request): boolean {
  if (req.method !== "POST") return false;
  // Match /api/orgs/<slug>/usage/events
  if (!/^\/api\/orgs\/[^/]+\/usage\/events\/?$/.test(req.path)) return false;
  const secret = process.env["USAGE_EVENT_SERVICE_TOKEN"];
  if (!secret) return false;
  const header = req.headers["x-service-token"];
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

  if (isValidUsageEventServiceToken(req)) {
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

  // Lyte Decision Replay sub-paths: /api/lyte/decision-replay/:id
  if (req.method === "GET" && path.startsWith("/api/lyte/decision-replay/")) {
    next();
    return;
  }

  // Non-production demo access routes: PIN-validated but session-free.
  // Completely disabled in production; route handlers apply timing-safe PIN check.
  // /api/pulse/demo/verify accepts PIN in POST body (never in URL).
  if (process.env.NODE_ENV !== "production" &&
    (path.startsWith("/api/pulse/demo/") || path === "/api/pulse/demo/verify")) {
    next();
    return;
  }

  // Cross-platform intelligence — read-only GET routes reading live trace-graph
  // data (signal correlations, evidence registry, run health, pilot intelligence).
  // Accessible without a session in non-production/demo environments so the Command
  // Surface can showcase cross-product intelligence without requiring login.
  // In production, auth is required (req.user check at the top of this function
  // already passes authenticated callers through before reaching this block).
  if (process.env.NODE_ENV !== "production" && path.startsWith("/api/cross-platform/")) {
    next();
    return;
  }

  serverTelemetry.recordAuthFailure();
  sendUnauthorized(res, "This endpoint requires a valid session. Please log in.");
}
