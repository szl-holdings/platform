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
 *  - Per-service health probes
 */

import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { serverTelemetry } from "@szl-holdings/observability";
import { sendUnauthorized } from "../lib/api-response";
import { verifyInternalHeader } from "../lib/internal-tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Set by globalAuthEnforcer when a request is allowed through under a
       * narrow trust condition (rather than session/token auth). Downstream
       * middlewares can opt to relax their own checks for a specific reason
       * — e.g. tenantScope skips membership for `"nexus_loopback"` because
       * the orchestrator is a platform principal.
       */
      authBypassReason?: "nexus_loopback";
    }
  }
}

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
  // Carlota Jo invoice email — public, unauthenticated (same model as
  // /api/booking/time-entries and /api/booking/services). The route handler
  // applies its own validation (400 for missing fields) and rate limiting.
  "/api/booking/invoices/email",
  "/api/stream/webhook-siem",
  "/api/stream/ais-nmea",
  "/api/stream/siem-events",
  "/api/stream/market-data",
  "/api/stream/ais-tracking",
  "/api/stream/status",
  "/api/federation/health",
  "/api/federation/agents",
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
  // Alloy Policy Authoring Studio — read-only state endpoint for the demo
  // surface (lets the studio render its initial state without a session).
  // Mutating routes (POST/DELETE on /versions, /versions/:id/sign,
  // /test-cases) are NOT whitelisted and enforce auth via authMiddleware.
  "/api/alloy/policy-compiler/state",
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
  // Lyte macro market indicators — delayed/EOD feed via Alpha Vantage.
  // Public read surface; same pattern as lyte-surfaces.ts routes above.
  // Refresh POST is also public — no user data involved; worst case is an
  // extra Alpha Vantage API call which is rate-limited by the adapter.
  "/api/lyte/market-indicators",
  "/api/lyte/market-indicators/refresh",
  // Investor Hub company fundamentals — read-only descriptive metrics keyed by
  // category='fundamentals' in holdings_metrics. Public so the marketing
  // /investors page can render live values without a session, with a static
  // fallback baked into the page when the API is unavailable.
  "/api/holdings/fundamentals",
  // Investor sub-page content (overview, architecture, moat, roadmap, trust,
  // founder) — read-only descriptive content keyed by category='investor-content'
  // in holdings_metrics. Public so the marketing /investors/* pages can render
  // live content without a session, with a static fallback baked into each page
  // when the API is unavailable.
  "/api/holdings/investor-content",
  // Decision Runtime v1 — list endpoint GET /api/decisions/cards.
  // Per-card GET routes are whitelisted by prefix in PUBLIC_PREFIXES below.
  // Mutating routes (approve/reject/request-changes, simulate-policy) are NOT
  // whitelisted here — they enforce auth via requireAuth in the route handler.
  "/api/decisions/cards",
  // CONSTELLATION World Model live SSE stream — read-only, demo-pool driven
  // entity/edge updates that drive the live indicator on the World Model
  // Explorer. The mutating /api/graph/* endpoints are NOT covered here and
  // continue to enforce auth + tenant scope via routes/groups/graph.ts.
  "/api/graph/stream",
  // Helios — Frontier Intelligence & Evolution Engine read-only GET endpoints.
  // Exact-path entries ensure mutating routes (PATCH /proposals/:id/status,
  // PATCH /scanners/:id/toggle, POST /scanners/:id/run, POST /mcp) remain
  // protected by session auth and are NOT reachable anonymously.
  "/api/helios/stats",
  "/api/helios/signals",
  "/api/helios/mythos",
  "/api/helios/proposals",
  "/api/helios/benchmarks",
  "/api/helios/scanners",
  "/api/helios/memos",
  "/api/helios/frontier-briefing",
  "/api/hf-mcp/health",
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
  // Public contact form sub-paths: POST /contact/submit (lead capture from
  // every marketing surface) and the admin-guarded /contact/requests +
  // /contact/submissions GETs (those enforce adminGuard internally, so it is
  // safe to bypass the global enforcer here). Bare /api/contact above is
  // retained for the legacy fetch in szl-holdings/trust-center.
  "/api/contact/",
  // Carlota Jo time tracking & invoice persistence — publicly accessible from the
  // time-tracking page (which is unauthenticated like the rest of the marketing
  // demo). Backed by Postgres so the data syncs across devices.
  "/api/booking/time-entries",
  "/api/booking/time-invoices",
  "/api/booking/invoices/email-log/",
  "/api/booking/services",
  "/api/booking/health",
  // Carlota Jo dashboard KPI metrics — team capacity and engagements summary.
  // Public so the dashboard can show live DB-backed numbers without a session.
  "/api/booking/team",
  "/api/booking/engagements-summary",
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
  // Email provider bounce/complaint webhooks — server-to-server POST calls from
  // SendGrid and Resend. Authenticated via provider-specific secret headers.
  "/api/email-webhooks/",
  // Self-service email unsubscribe — public GET link embedded in every transactional
  // email. Validates HMAC token and writes to the email_suppressions table.
  "/api/email/unsubscribe",
  // Digest-specific unsubscribe — public GET link in digest email footer.
  // Validates HMAC token and sets email_enabled = false in notification_preferences.
  "/api/notifications/unsubscribe",
  // Digest re-subscribe — public GET link on the unsubscribe confirmation page.
  // Validates the same HMAC token and sets email_enabled = true.
  "/api/notifications/resubscribe",
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
  // Sentra cyber resilience cockpit — incidents + alerts CRUD backed by an
  // in-memory store (no DB). Public so the Sentra demo surface can fetch
  // live incident/alert data and run the create→triage→resolve flow without
  // a session. Write routes are still covered by CSRF double-submit
  // protection (global csrfMiddleware in server.ts).
  "/api/sentra/",
  // Crisis Arena — strictly public surfaces only: leaderboard ranking,
  // platform summary, and sanitized architect public profiles.
  // All engagement, submission, triage, award, and graduate endpoints require
  // a session (enforced both here and in route-level authMiddleware).
  "/api/crisis-arena/leaderboard",
  "/api/crisis-arena/summary",
  "/api/crisis-arena/architects/",
  "/api/crisis-arena/score",
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
  // A11oy Live Enterprise Execution Fabric — all read-side endpoints are fully
  // public in Phase 1 (demo mode, in-memory data). Mutating endpoints return 501.
  // Phase 2 will add session-gated write paths; the prefix bypass is intentional
  // for now so the A11oy demo renders without a session.
  "/api/a11oy/",
  // n8n Automation Bridge — MCP-compatible proxy to a connected n8n instance.
  // Public so the Command Automations surface renders in demo mode without a
  // session. When N8N_INSTANCE_URL/N8N_API_KEY are not set, the proxy returns
  // 503 { configured: false } rather than forwarding any request.
  "/api/n8n/",
  // Competitive Intel monitor — backs the Command Competitive Atlas page with
  // RSS-derived "Intel Update" alerts about tracked champions (CrowdStrike,
  // Clio, CoStar, Windward, Palantir, ThoughtSpot). The Atlas page is internal-
  // facing but unauthenticated like the rest of the Command demo surface; the
  // underlying data is sourced exclusively from public product blogs / RSS feeds.
  "/api/competitive-intel/",
  // NEXUS unified agentic AI layer — Research Swarm, Memory Fabric, and
  // Cross-App Orchestrator endpoints power the mockup-sandbox NEXUS demo and
  // are intended to be reachable without a session, mirroring the rest of the
  // SZL demo surface. Mutating routes (POST /memory, POST /orchestrate, etc.)
  // remain protected by CSRF + per-user write rate limiting in the router.
  "/api/nexus/",
  // Geospatial intelligence feed — read-only GET endpoints returning live-
  // mutating GeoPin data for the Command Geospatial Intelligence map. Public
  // so the map loads without a session (same model as /api/agent-mesh/).
  "/api/geo-intel/",
  // Decision Runtime v1 — per-card GET endpoints (GET /api/decisions/cards/:id).
  // Public so the Decision Center demo works without a session; route handlers
  // apply authMiddleware({ required: false }) and scope to ws-demo-001 for
  // unauthenticated callers. POST mutating routes at /decisions/cards/:id/approve
  // etc. enforce auth via requireAuth in the route handler (not here).
  "/api/decisions/cards/",
  // Knowledge base public GET endpoints — /support/knowledge (list) and
  // /support/knowledge/:slug (article detail). These are read-only and
  // intentionally accessible without a session so the support portal and
  // any marketing page can surface KB articles without requiring login.
  // Mutating routes (create/edit/archive KB articles) are under
  // /admin/kb-articles and remain protected by admin auth.
  "/api/support/knowledge",
  // Counsel Knowledge Index — graph+vector RAG over matter documents.
  // All endpoints (upload, status, query, seed) are public in the demo
  // surface; the route handler scopes results per-matter via matterId.
  // Mutating write routes remain covered by CSRF double-submit protection.
  "/api/counsel-knowledge/",
  // Helios sub-resource read-only paths — covers /mythos/search and
  // /mythos/nodes/:id (graph exploration) and /memos/:id (individual memo
  // detail). Mutating routes (PATCH /proposals/:id/status,
  // PATCH /scanners/:id/toggle, POST /scanners/:id/run, POST /mcp)
  // are NOT covered here and enforce auth via session/token.
  "/api/helios/mythos/",
  "/api/helios/memos/",
];

/**
 * Returns true if the given full request path (e.g. "/api/federation/health")
 * is whitelisted as a public endpoint by this enforcer's PUBLIC_EXACT_PATHS
 * or PUBLIC_PREFIXES tables.
 *
 * Exported so other middlewares mounted further down the router tree can
 * honor the same allowlist. Historically, group-level guards like
 * `tenantScope({ required: true })` mounted at a path prefix
 * (e.g. `router.use("/federation", tenantScope({...}))`) would 401 their
 * own subset of paths even when the global enforcer would have let them
 * through, because the allowlist only existed inside this file. Anything
 * downstream that wants to enforce auth should consult this function
 * first to avoid that trap.
 */
export function isAllowlistedPublicPath(fullPath: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(fullPath)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (fullPath === prefix || fullPath.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Resolves the `/api/...` form of the request from inside any nested router.
 * Express strips the matched prefix from `req.path` as routers are descended,
 * so `req.path` alone is `/command-feed` for a tenantScope mounted at
 * `/cortex` under `/api`. Concatenating `req.baseUrl` recovers the original
 * shape that this file's allowlist is keyed on.
 */
export function fullApiPath(req: Request): string {
  const base = req.baseUrl ?? "";
  const path = req.path ?? "";
  if (!base) return path;
  if (path === "/" || path === "") return base;
  return base + path;
}

function isValidInternalToken(req: Request): boolean {
  const header = req.headers["x-internal-token"];
  if (typeof header !== "string") return false;
  return verifyInternalHeader(header, req.originalUrl || req.url) !== null;
}

/**
 * NEXUS Cross-App Orchestrator loopback bypass.
 * The orchestrator (artifacts/api-server/src/routes/nexus.ts) issues GET requests
 * to other internal SZL routes from the same process so the LLM has real data
 * to synthesize. We allow these only when ALL of the following are true:
 *   1. The TCP peer address (req.socket.remoteAddress — NOT req.ip, which is
 *      X-Forwarded-For-derived under app.set("trust proxy", 1) and therefore
 *      spoofable) is a loopback interface (127.0.0.1 / ::1).
 *   2. The request method is GET or HEAD.
 *   3. The request carries the `x-nexus-orchestrator: 1` header.
 *   4. The request path is in a hard-coded allowlist of safe, read-only
 *      orchestrator target endpoints.
 * Using req.socket.remoteAddress closes the X-Forwarded-For spoof vector: the
 * value comes from the kernel-reported TCP peer and cannot be set by a remote
 * client. The path allowlist further constrains the bypass to read-only
 * informational endpoints already exposed in PUBLIC_PREFIXES or via
 * authMiddleware({ required: false }).
 */
const NEXUS_ORCHESTRATOR_PATH_ALLOWLIST = [
  "/api/agent-mesh/state",
  "/api/agent-mesh/index",
  "/api/narratives/",
  "/api/infrastructure/status",
  "/api/core/health",
  "/api/core/metrics",
  "/api/fabric/snapshot",
  "/api/booking/services",
  "/api/vessels/live/fleet-summary",
  "/api/vessels/live/ais/combined",
  "/api/vessels/cognitive/route-anomalies",
  "/api/terra/live/mortgage-rates",
  "/api/terra/live/hud-fair-market-rents",
  "/api/terra/portfolio/overview",
  "/api/firestorm/live/threat-summary",
  "/api/firestorm/live/threats",
  "/api/firestorm/live/incidents",
  "/api/firestorm/live/compliance-summary",
  "/api/firestorm/live/asset-risk",
  "/api/firestorm/mitre/coverage",
  "/api/imperium/cloud/resources",
  "/api/imperium/cloud/metrics",
  "/api/imperium/cloud/sentinels",
  "/api/imperium/intelligence/briefs",
  "/api/imperium/supply-lines/status",
];

function isNexusOrchestratorLoopback(req: Request): boolean {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const marker = req.headers["x-nexus-orchestrator"];
  if (marker !== "1") return false;
  // Use the kernel-reported TCP peer, not req.ip (which honors X-Forwarded-For
  // when trust proxy is enabled and is therefore spoofable from outside).
  const peer = req.socket?.remoteAddress ?? "";
  const isLoopback =
    peer === "127.0.0.1" || peer === "::1" || peer === "::ffff:127.0.0.1";
  if (!isLoopback) return false;
  const path = req.path;
  for (const allowed of NEXUS_ORCHESTRATOR_PATH_ALLOWLIST) {
    if (path === allowed || path.startsWith(`${allowed}/`)) return true;
  }
  return false;
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
  const secret = process.env.USAGE_EVENT_SERVICE_TOKEN;
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

  if (isNexusOrchestratorLoopback(req)) {
    // Authenticate the orchestrator loopback as an internal agent so that
    // downstream per-route authMiddleware() and group-level tenantScope()
    // see a valid principal and let the request through. This is the only
    // way the orchestrator can reach endpoints that apply additional auth
    // beyond the global enforcer (e.g. /api/firestorm/live/*, /api/imperium/*,
    // /api/vessels/live/* which are gated by tenantScope at the group mount).
    req.user = {
      id: 0,
      displayName: "Nexus Orchestrator (loopback)",
      email: null,
      roles: ["ops"],
      orgs: [],
    };
    req.isInternalAgent = true;
    req.authBypassReason = "nexus_loopback";
    next();
    return;
  }

  if (isValidUsageEventServiceToken(req)) {
    next();
    return;
  }

  const path = req.path;

  if (isAllowlistedPublicPath(path)) {
    next();
    return;
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
