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

import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { getRevocationSyncReadiness, resolveEnterpriseAuthContext } from './enterprise-auth.js';
import { resolveLocalOAuthToken } from './oauth-token-store.js';
import { getGatewayApiKey, getGatewayTenantId, isProductionRuntime } from './runtime-config.js';

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
 * No prefix-based GET exemption is currently safe. Governance receipt hashes
 * are identifiers, not authorization secrets, so receipt lookup requires the
 * same authenticated tenant context as every other tenant-scoped resource.
 */
const PUBLIC_GET_PATH_PREFIXES: string[] = [];

/**
 * HTTP POST paths that are allowed without a Bearer token.
 * /token  — enterprise JWT-bearer exchange; callers present a corporate IdP JWT
 *           and do not have a gateway API key.
 * /revoke — revocation webhook called by IdPs or api-server using x-revocation-secret;
 *           no Bearer token is issued to the webhook caller.
 */
const PUBLIC_POST_PATHS = new Set(['/token', '/revoke']);

export interface GatewayAuthContext {
  authenticated: boolean;
  actorId: string;
  tenantId?: string;
  apiKey: string | null;
  enterprise?: boolean;
  oauth?: boolean;
  enterpriseRole?: string;
  enterpriseScope?: string;
}

export function resolveAuthContext(req: Request): GatewayAuthContext {
  const apiKey = getGatewayApiKey();
  const gatewayTenantId = getGatewayTenantId();
  const isDev = !isProductionRuntime();

  const authHeader = req.headers.authorization ?? '';
  const token = /^Bearer ([^\s]+)$/i.exec(authHeader)?.[1] ?? null;

  if (!apiKey && isDev) {
    const tenantId = gatewayTenantId ?? 'substrate-gateway';
    return {
      authenticated: true,
      actorId: token ? `gateway-dev:${tenantId}` : 'anonymous:dev',
      tenantId,
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
        tenantId: enterpriseCtx.tenantId,
        apiKey: null,
        enterprise: true,
        enterpriseRole: enterpriseCtx.role,
        enterpriseScope: enterpriseCtx.scope,
      };
    }

    const oauthToken = resolveLocalOAuthToken(token);
    if (oauthToken) {
      return {
        authenticated: true,
        actorId: `oauth:${oauthToken.actorId}`,
        tenantId: oauthToken.tenantId,
        apiKey: null,
        oauth: true,
        enterpriseScope: oauthToken.scope,
      };
    }
  }

  if (token && apiKey && constantTimeTokenEqual(token, apiKey)) {
    const tenantId = gatewayTenantId ?? 'substrate-gateway';
    return {
      authenticated: true,
      actorId: `gateway:${tenantId}`,
      tenantId,
      apiKey: token,
    };
  }

  return { authenticated: false, actorId: 'anonymous', apiKey: null };
}

function constantTimeTokenEqual(candidate: string, expected: string): boolean {
  // These are opaque API tokens, compared directly rather than stored password hashes.
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return (
    candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes)
  );
}

/**
 * Express middleware that enforces auth for non-public MCP methods.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const revocationReadiness = getRevocationSyncReadiness();
  const ctx = resolveAuthContext(req);
  (req as Request & { authCtx: typeof ctx }).authCtx = ctx;

  const isReadinessDiagnostic =
    req.method === 'GET' && (req.path === '/' || req.path === '/health');
  const isRevocationWebhook = req.method === 'POST' && req.path === '/revoke';
  const isTokenExchange = req.method === 'POST' && req.path === '/token';
  if (
    !revocationReadiness.ready &&
    !isReadinessDiagnostic &&
    !isRevocationWebhook &&
    (ctx.authenticated || isTokenExchange)
  ) {
    res.status(503).json({
      error: 'SERVICE_NOT_READY',
      reason: 'Persisted enterprise revocation state is unavailable.',
    });
    return;
  }

  if (ctx.authenticated) {
    next();
    return;
  }

  if (req.method === 'GET' && PUBLIC_GET_PATHS.has(req.path)) {
    next();
    return;
  }

  if (
    req.method === 'GET' &&
    PUBLIC_GET_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix))
  ) {
    next();
    return;
  }

  if (req.method === 'POST' && PUBLIC_POST_PATHS.has(req.path)) {
    next();
    return;
  }

  const body = req.body as { method?: string } | undefined;
  const method = body?.method ?? '';
  // JSON-RPC method exemptions apply only to the MCP request endpoint. Never
  // let an attacker smuggle a public method name into the JSON body of a
  // privileged REST route such as /register.
  if (req.method === 'POST' && req.path === '/' && PUBLIC_METHODS.has(method)) {
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
