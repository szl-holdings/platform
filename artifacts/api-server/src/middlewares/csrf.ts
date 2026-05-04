import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../lib/api-response';
import { verifyInternalHeader } from '../lib/internal-tokens';
import { logger } from '../lib/logger';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_TOKEN_BYTES = 32;
const CSRF_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_PATHS = new Set([
  // Terra Cognitive POST mutations — server-to-server calls authenticated via
  // authMiddleware({ required: true }) at route level; CSRF not applicable.
  '/api/terra/cognitive/covenants/submit-review',
  // Mobile OIDC auth — native apps use Authorization header + PKCE, not browser cookies,
  // so double-submit CSRF protection does not apply.
  '/api/mobile-auth/token-exchange',
  '/api/mobile-auth/logout',
  '/api/health',
  '/api/health/live',
  '/api/health/ready',
  '/api/health/detailed',
  '/api/ready',
  '/api/version',
  '/api/openapi',
  '/api/openapi.json',
  '/api/csrf-token',
  '/api/auth/login',
  '/api/auth/login-password',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/logout',
  '/api/auth/callback',
  '/api/auth/ws-ticket',
  '/api/webhooks',
  '/api/billing/webhooks',
  '/api/stripe/checkout',
  '/api/billing/checkout',
  '/api/billing/terra/subscribe',
  '/api/billing/aegis/enterprise-quote',
  '/api/billing/customer-portal',
  '/api/documents/generate',
  '/api/observability/vitals',
  '/api/observability/client-errors',
  '/api/observability/error-feedback',
  '/api/telemetry/events',
  '/api/analytics/event',
  // Public-site funnel analytics ingest. Anonymous client-side events posted
  // from any marketing page (often pre-session); CSRF double-submit is not
  // applicable. Server still validates eventName / domain / sourceApp shape.
  '/api/analytics-engine/events',
  '/api/analytics-engine/events/batch',
  '/api/public/fund-inbound-deals',
  '/api/public/fund-inbound-deals/upload',
  // Anonymous page-view tracking — called from any page (including pre-login) without a
  // browser session/cookie, so CSRF double-submit is not applicable.
  '/api/track/page-view',
  // SZL Holdings public replay-attestation (Track C-02). Stateless POST that
  // accepts only { run_id }, returns an Ed25519-signed envelope. No cookies,
  // no session, no per-user mutation — CSRF double-submit is not applicable.
  // Anyone in the world (including curl + the standalone CLI verifier) must
  // be able to call this endpoint without first fetching a CSRF token.
  '/api/v1/replay-attestation',
  // Newsletter subscription — public anonymous marketing form embedded across portfolio
  // sites; no session or user state is modified, CSRF double-submit not applicable.
  '/api/newsletter/subscribe',
  // A11oy public chat surface — stateless SSE proxy to the Replit AI Integrations
  // Anthropic endpoint. No per-user state written; conversation memory is held
  // entirely in the browser tab. Public so anyone can demo A11oy without a session.
  '/api/a11oy/chat',
  '/api/a11oy/health',
  // Demo reset — public POST endpoint called by the Demo Launchpad presenter
  // surface to clear in-memory scenario state without a browser session.
  // No per-user state modified; memory flush is safe without CSRF protection.
  '/api/demo/reset',
  // Causal scenario engine — POST /scenarios/run is public (no per-user state
  // written; scenario inputs and results are entirely in-process deterministic
  // computation). Called from Lyte's Scenario Composer and the SZL Holdings
  // portfolio card without a browser session in demo mode.
  '/api/scenarios/run',
  // Agent Mesh telemetry rescan — public POST that re-reads local config files
  // and refreshes the resilience index for the demo. No per-user state mutated;
  // path is also in the unauthenticated PUBLIC_PREFIXES allowlist.
  '/api/agent-mesh/scan',
  // Lyte market-data cache flush — public POST that invalidates the in-process
  // LRU cache and triggers a re-fetch from Alpha Vantage (or returns the seed
  // snapshot when the key is absent). No per-user state is read or modified;
  // CSRF double-submit is not applicable.
  '/api/lyte/market-indicators/refresh',
  // OAuth 2.0 client_credentials token endpoint — machine-to-machine; clients
  // authenticate via HTTP Basic Auth (client_id + hashed secret), not browser
  // cookies. CSRF double-submit protection does not apply.
  '/api/oauth/token',
  // Carlota Jo AI advisor chat — public visitor-facing endpoint embedded on the
  // marketing site. No per-user state mutated; session is keyed by a client-
  // generated UUID, not a browser session cookie. Rate-limited in the route handler.
  '/api/carlota/advisor/chat',
  // Carlota Jo booking reservation — public visitor-facing action (same model
  // as /api/contact / /api/demo-requests). No per-user authenticated state;
  // the booking is scoped to the provided email/name fields. Auth-gated CRUD
  // routes (PATCH/DELETE /booking/reservations/:id) are covered by authMiddleware.
  '/api/booking/reservations',
  // Magic link auth — passwordless email-based sign-in. POST /request is called
  // from any page (including pre-session); GET /verify is a one-time token link
  // from an email. Neither flow uses browser cookies; CSRF does not apply.
  '/api/auth/magic-link/request',
  '/api/auth/magic-link/verify',
  '/api/auth/lockout-status',
  '/api/auth/risk-assessment',
]);

// Risk evidence store — public POST/DELETE endpoints accept any
// /api/risk-evidence/<domain>[/<evidenceId>] path, so add a prefix-based
// CSRF exemption alongside the EXEMPT_PATHS set.

const GRAPHQL_PATHS = ['/api/graphql', '/graphql'];

function isExempt(path: string): boolean {
  if (EXEMPT_PATHS.has(path)) return true;
  if (path.startsWith('/api/webhooks/')) return true;
  if (path.startsWith('/api/risk-evidence/')) return true;
  // A2A federation endpoints — machine-to-machine; authenticated via Bearer token
  // (API key or OAuth JWT), not browser cookies. CSRF double-submit not applicable.
  if (path.startsWith('/api/federation/')) return true;
  // Ouroboros integration adapters — pure-functional, stateless except for
  // the in-memory Sentra accumulator (process-local). All inputs strictly
  // Zod-validated. Public in demo mode so the three artifact frontends can
  // POST without a browser CSRF token; rate-limited by route group.
  if (path.startsWith('/api/ouroboros/')) return true;
  // SIGIL — SZL Integrated Governance & Invariant Layer.
  // Pure-functional, stateless, all inputs strictly Zod-validated, no
  // session or PII involved. The demo UI in A11oy/Sentra/Amaru POSTs
  // payloads from the browser before a session exists. Rate-limited
  // by the global limiter; no CSRF risk surface.
  if (path.startsWith('/api/sigil/')) return true;
  // Ouroboros · Gauß axis ONLY — operationalised v5 primitives 17 + 20.
  // Pure compute, Zod-validated, no PII or session. Other /api/ouroboros/*
  // routes (anchor append/batch, fleet audit, etc.) are stateful and MUST
  // continue to require CSRF, so we narrow this exemption to the gauss path.
  if (path.startsWith('/api/ouroboros/gauss/')) return true;
  // Ouroboros · Guardrails axis ONLY — operationalised v6 SKU
  // (@workspace/ouroboros-guardrails). Same compute-only posture as gauss:
  // every endpoint is stateless, Zod-validated, no PII, no session, no
  // server-side persistence (receipts are returned to the caller; tenants
  // who need an append-only log persist them themselves). Stateful
  // /api/ouroboros/* routes (anchor, fleet audit, reconcile-handoff)
  // continue to require CSRF — this exemption stays narrowed to guardrails.
  if (path.startsWith('/api/ouroboros/guardrails/')) return true;
  if (path.startsWith('/api-docs')) return true;
  if (path.startsWith('/api/ai/')) return true;
  if (path === '/api/alloy/channels/slack/webhook') return true;
  if (path === '/api/alloy/channels/slack/interactive') return true;
  if (path === '/api/alloy/email/ingest') return true;
  if (path.startsWith('/api/alloy/integrations/webhooks/receive/')) return true;
  // Email provider bounce/complaint webhooks — server-to-server; validated via
  // provider-specific secret headers (SENDGRID_WEBHOOK_SECRET / RESEND_WEBHOOK_SECRET).
  if (path.startsWith('/api/email-webhooks/')) return true;
  // Self-service email unsubscribe — public GET link embedded in transactional emails.
  if (path === '/api/email/unsubscribe') return true;
  // Digest-specific unsubscribe — public GET link in digest email footer.
  if (path === '/api/notifications/unsubscribe') return true;
  // Digest re-subscribe — public GET link on the unsubscribe confirmation page.
  if (path === '/api/notifications/resubscribe') return true;
  if (path === '/api/mcp' || path.startsWith('/api/mcp/')) return true;
  if (path.startsWith('/api/mcp-governed-gateway/')) return true;
  if (path.startsWith('/api-server/mcp-governed-gateway/')) return true;
  // A11oy demo-management endpoints — public machine-to-machine paths called by
  // the demo launchpad / presenter without a browser session. These endpoints
  // only flush/reload the in-memory demo dataset (no per-user state mutated).
  // All other A11oy mutation routes (approve, execute, replay, PCE, etc.) rely
  // on the Bearer-token bypass above: the CLI always sends
  // `Authorization: Bearer <A11OY_API_TOKEN|a11oy-demo-cli>`, and material
  // execution is further gated by the PCE gate + MirrorEval block checks.
  if (path.startsWith('/api/a11oy/demo/')) return true;
  if (path.match(/^\/api\/distribution-os\/linktree\/\d+\/click$/)) return true;
  // Sentra EDR agent endpoints — machine-to-machine; agents authenticate via
  // long-lived bearer tokens issued at enrollment-token exchange time.
  // No browser session or cookie involved; CSRF double-submit not applicable.
  if (path === '/api/sentra/agents/heartbeat') return true;
  if (path === '/api/sentra/agents/exchange') return true;
  if (path === '/api/sentra/agents/poll') return true;
  if (path.startsWith('/api/sentra/agents/commands/') && path.endsWith('/ack')) return true;
  // Sentra SIEM webhook ingest — external SIEM platforms push events to this
  // endpoint. HMAC-SHA256 signature in x-signature-sha256 header authenticates
  // the push; no browser session or cookie involved, CSRF not applicable.
  if (path.startsWith('/api/sentra/siem/ingest/')) return true;
  // Non-production demo PIN verification — stateless read-only PIN check;
  // no session or user state is modified on the server side.
  if (process.env.NODE_ENV !== 'production' && path === '/api/pulse/demo/verify') return true;
  // Non-production demo PDF export — POST authenticated by the x-demo-token
  // header (PIN), which an attacker cannot forge cross-origin without the PIN.
  // No server state mutated; the route only renders a PDF response.
  if (process.env.NODE_ENV !== 'production' && path === '/api/pulse/demo/export/pdf') return true;
  // HuggingFace ML Intelligence — POST inference endpoints are public demo surfaces.
  // No browser session, cookie, or user-state mutations involved; all inference is
  // stateless. CSRF double-submit is not applicable.
  if (path.startsWith('/api/hf-intelligence/')) return true;
  // PRAXIS Tool Bridge — public audit execution endpoints (marketing-audit,
  // seo-audit, finance-terminal). No per-user authenticated state is read or
  // written; all routes are stateless audit computations. Calls originate from
  // Carlota Jo, KORA (lyte-command-center), and the NEXUS Bridge without a
  // browser session. CSRF double-submit is not applicable.
  if (path.startsWith('/api/praxis-tools/') || path.startsWith('/praxis-tools/')) return true;
  // Reliquary — provenance-bound cache spine. All mutations are content-addressed
  // (idempotent by SHA-256 hash) and governance-bound; no per-user session data is
  // read or mutated. CSRF double-submit is not applicable: there is no user-specific
  // state that an attacker could hijack. Mutating routes additionally carry
  // authMiddleware({ required: false }) so sessions are attached when available.
  if (path.startsWith('/api/reliquary/')) return true;
  // LaaS v1 guard — public Lambda-as-a-Service endpoint. Stateless, Zod-validated,
  // no PII or session. Receipts returned to caller; no server-side persistence.
  if (path === '/api/v1/guard' || path.startsWith('/api/v1/guard/')) return true;
  return false;
}

function isGraphQLPath(path: string): boolean {
  return GRAPHQL_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

function generateToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString('hex');
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
  // Internal service-to-service requests carry x-internal-token instead of a
  // browser CSRF cookie — bypass CSRF enforcement for them. The token must
  // be present in the scoped registry (or the legacy ALLOY_INTERNAL_TOKEN env
  // var) and the request path must be in the token's allowed prefixes.
  const internalHeader = req.headers['x-internal-token'] as string | undefined;
  if (internalHeader && verifyInternalHeader(internalHeader, req.originalUrl || req.url)) {
    return next();
  }

  // NEXUS v1 orchestrator — server-side router calling domain endpoints via
  // localhost. No browser involved; no CSRF attack surface. The header must be
  // the literal sentinel value '1', the request MUST originate from the loopback
  // interface (127.0.0.1 / ::1), and the path must not touch admin or org routes.
  // Requiring the loopback source ensures an external client that merely sets this
  // header cannot exploit the bypass — traffic from the internet never arrives on
  // the loopback adapter.
  const nexusOrch = req.headers['x-nexus-orchestrator'] as string | undefined;
  const url = req.originalUrl || req.url;
  const remoteAddr = req.socket?.remoteAddress ?? '';
  const isLoopback = remoteAddr === '127.0.0.1' || remoteAddr === '::1' || remoteAddr === '::ffff:127.0.0.1';
  if (nexusOrch === '1' && isLoopback && !url.startsWith('/api/admin') && !url.startsWith('/api/orgs')) {
    return next();
  }

  // API clients (mobile apps, CLI tools) that authenticate via bearer token do
  // not use browser cookies, so CSRF double-submit protection does not apply.
  // CSRF attacks rely on the browser automatically attaching session cookies to
  // cross-origin requests; bearer tokens must be explicitly included and cannot
  // be forged this way. Requests that carry a bearer token are still subject to
  // full authMiddleware() + requireRole() checks in each route handler.
  const authHeader = req.headers.authorization as string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    return next();
  }

  if (SAFE_METHODS.has(req.method)) {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = generateToken();
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: CSRF_COOKIE_MAX_AGE_MS,
        path: '/',
      });
    }
    return next();
  }

  if (isExempt(req.path)) return next();

  if (isGraphQLPath(req.path)) {
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.startsWith('application/json')) {
      logger.warn(
        { path: req.path, method: req.method, contentType },
        'GraphQL request rejected: requires Content-Type: application/json',
      );
      sendError(
        res,
        'GraphQL requests must use Content-Type: application/json.',
        415,
        'UNSUPPORTED_MEDIA_TYPE',
      );
      return;
    }
    const customHeader =
      req.headers['x-requested-with'] ??
      req.headers['x-csrf-token'] ??
      req.headers['x-apollo-operation-name'];
    if (!customHeader) {
      logger.warn(
        { path: req.path, method: req.method },
        'GraphQL request rejected: missing required custom header',
      );
      sendError(
        res,
        'GraphQL requests must include X-Requested-With, X-CSRF-Token, or X-Apollo-Operation-Name header.',
        403,
        'CSRF_MISSING_HEADER',
      );
      return;
    }
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    logger.warn({ path: req.path, method: req.method }, 'CSRF token missing');
    sendError(
      res,
      'CSRF token missing. Fetch a token from GET /api/csrf-token and include it as X-CSRF-Token header.',
      403,
      'CSRF_TOKEN_MISSING',
    );
    return;
  }

  if (!timingSafeEqual(cookieToken, headerToken)) {
    logger.warn({ path: req.path, method: req.method }, 'CSRF token mismatch');
    sendError(res, 'CSRF token mismatch.', 403, 'CSRF_TOKEN_MISMATCH');
    return;
  }

  next();
}
