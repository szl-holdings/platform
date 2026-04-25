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
  // Newsletter subscription — public anonymous marketing form embedded across portfolio
  // sites; no session or user state is modified, CSRF double-submit not applicable.
  '/api/newsletter/subscribe',
  // Shared action store — public PATCH endpoint that backs the Business
  // State / Enterprise State pages. Same exemption model as Carlota Jo time
  // tracking: anonymous demo surface, no per-user session state.
  '/api/action-store',
  // Demo reset — public POST endpoint called by the Demo Launchpad presenter
  // surface to clear in-memory scenario state without a browser session.
  // No per-user state modified; memory flush is safe without CSRF protection.
  '/api/demo/reset',
  // Agent Mesh telemetry rescan — public POST that re-reads local config files
  // and refreshes the resilience index for the demo. No per-user state mutated;
  // path is also in the unauthenticated PUBLIC_PREFIXES allowlist.
  '/api/agent-mesh/scan',
]);

// Risk evidence store — public POST/DELETE endpoints accept any
// /api/risk-evidence/<domain>[/<evidenceId>] path, so add a prefix-based
// CSRF exemption alongside the EXEMPT_PATHS set.

const GRAPHQL_PATHS = ['/api/graphql', '/graphql'];

function isExempt(path: string): boolean {
  if (EXEMPT_PATHS.has(path)) return true;
  if (path.startsWith('/api/webhooks/')) return true;
  if (path.startsWith('/api/risk-evidence/')) return true;
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
  if (path === '/api/mcp' || path.startsWith('/api/mcp/')) return true;
  if (path.match(/^\/api\/distribution-os\/linktree\/\d+\/click$/)) return true;
  // Non-production demo PIN verification — stateless read-only PIN check;
  // no session or user state is modified on the server side.
  if (process.env.NODE_ENV !== 'production' && path === '/api/pulse/demo/verify') return true;
  // Non-production demo PDF export — POST authenticated by the x-demo-token
  // header (PIN), which an attacker cannot forge cross-origin without the PIN.
  // No server state mutated; the route only renders a PDF response.
  if (process.env.NODE_ENV !== 'production' && path === '/api/pulse/demo/export/pdf') return true;
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
