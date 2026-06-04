/**
 * Substrate MCP Gateway — Authentication
 *
 * Auth model:
 *   1. Enterprise Bearer token — token issued via /mcp/token (ID-JAG JWT-bearer exchange)
 *   2. API key Bearer token   — Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>
 *   3. No auth               — only for /health, tools/list, ping, and /token exchange
 *
 * SUBSTRATE_GATEWAY_API_KEY env var. In development, if the key is not set,
 * the gateway logs a prominent warning and accepts all requests (unauthenticated
 * development mode). In production the gateway refuses to start without the key.
 */

import type { NextFunction, Request, Response } from 'express';
import { resolveEnterpriseAuthContext } from './enterprise-auth.js';

/**
 * MCP calls that are allowed without authentication (public read-only subset).
 * Only schema discovery (tools/list) and the no-op keepalive (ping) are public.
 */
const PUBLIC_METHODS = new Set(['tools/list', 'ping']);

/**
 * HTTP GET paths that are allowed without a Bearer token (exact match).
 */
const PUBLIC_GET_PATHS = new Set(['/', '/health']);

/**
 * HTTP GET path prefixes that are allowed without a Bearer token
 * (matched against router-relative `req.path`, i.e. the portion AFTER
 * the mount point — so for `app.use('/mcp', router)`, `req.path` is
 * `/nexus/verify/:hash`, not `/mcp/nexus/verify/:hash`).
 *
 * /nexus/verify/ is intentionally public: it is a read-only, hash-gated
 * lookup. Callers can only retrieve proof metadata they already have the hash
 * for, so exempting it from auth does not expose sensitive data while enabling
 * external auditors to independently verify proof records without needing a
 * gateway API key.
 */
const PUBLIC_GET_PATH_PREFIXES: string[] = ['/nexus/verify/'];

/**
 * HTTP POST paths that are allowed without a Bearer token.
 * /token  — enterprise JWT-bearer exchange; callers present a corporate IdP JWT
 *           and do not have a gateway API key.
 * /revoke — revocation webhook called by IdPs or api-server using x-revocation-secret;
 *           no Bearer token is issued to the webhook caller.
 */
const PUBLIC_POST_PATHS = new Set(['/token', '/revoke']);

export function resolveAuthContext(req: Request): {
  authenticated: boolean;
  actorId: string;
  apiKey: string | null;
  enterprise?: boolean;
  enterpriseRole?: string;
  enterpriseScope?: string;
} {
  const apiKey = process.env.SUBSTRATE_GATEWAY_API_KEY;
  const isDev = process.env.NODE_ENV !== 'production';

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!apiKey && isDev) {
    return {
      authenticated: true,
      actorId: token ? `api-key:${token.slice(0, 8)}...` : 'anonymous:dev',
      apiKey: token,
    };
  }

  // Check enterprise bearer token first (tokens issued by /mcp/token via ID-JAG)
  if (token) {
    const enterpriseCtx = resolveEnterpriseAuthContext(token);
    if (enterpriseCtx) {
      return {
        authenticated: true,
        actorId: enterpriseCtx.actorId,
        apiKey: null,
        enterprise: true,
        enterpriseRole: enterpriseCtx.role,
        enterpriseScope: enterpriseCtx.scope,
      };
    }
  }

  if (token && token === apiKey) {
    return {
      authenticated: true,
      actorId: `api-key:${token.slice(0, 8)}...`,
      apiKey: token,
    };
  }

  return { authenticated: false, actorId: 'anonymous', apiKey: null };
}

/**
 * Express middleware that enforces auth for non-public MCP methods.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ctx = resolveAuthContext(req);
  (req as Request & { authCtx: typeof ctx }).authCtx = ctx;

  if (ctx.authenticated) {
    next();
    return;
  }

  if (req.method === 'GET' && PUBLIC_GET_PATHS.has(req.path)) {
    next();
    return;
  }

  if (req.method === 'GET' && PUBLIC_GET_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }

  if (req.method === 'POST' && PUBLIC_POST_PATHS.has(req.path)) {
    next();
    return;
  }

  const body = req.body as { method?: string } | undefined;
  const method = body?.method ?? '';
  if (PUBLIC_METHODS.has(method)) {
    next();
    return;
  }

  res.status(401).json({
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32000,
      message: 'PERMISSION_DENIED',
      data: {
        reason:
          'Missing or invalid Bearer token. ' +
          'Set Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY> or use the enterprise JWT-bearer token exchange at POST /mcp/token',
      },
    },
  });
}
