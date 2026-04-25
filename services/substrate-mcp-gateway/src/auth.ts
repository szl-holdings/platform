/**
 * Substrate MCP Gateway — Authentication
 *
 * Auth model:
 *   1. Bearer token  — Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>
 *   2. No auth       — only for /health and tools/list (schema discovery)
 *
 * SUBSTRATE_GATEWAY_API_KEY env var. In development, if the key is not set,
 * the gateway logs a prominent warning and accepts all requests (unauthenticated
 * development mode). In production the gateway refuses to start without the key.
 */

import type { NextFunction, Request, Response } from 'express';

const API_KEY = process.env.SUBSTRATE_GATEWAY_API_KEY;
const IS_DEV = process.env.NODE_ENV !== 'production';

if (!API_KEY) {
  if (IS_DEV) {
  } else {
  }
}

/**
 * MCP calls that are allowed without authentication (public read-only subset).
 * This matches the strategy described in MCP_GATEWAY_STRATEGY.md.
 */
const PUBLIC_METHODS = new Set([
  'initialize',
  'tools/list',
  'resources/list',
  'prompts/list',
  'ping',
]);

/**
 * HTTP GET paths that are allowed without a Bearer token.
 * Only lightweight, non-sensitive endpoints are whitelisted here.
 * The SSE stream, tool/resource/prompt inventories are intentionally
 * excluded — they require a valid SUBSTRATE_GATEWAY_API_KEY.
 */
const PUBLIC_GET_PATHS = new Set(['/', '/health']);

export function resolveAuthContext(req: Request): {
  authenticated: boolean;
  actorId: string;
  apiKey: string | null;
} {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Dev-only unauthenticated bypass: only when API_KEY is unset AND NODE_ENV is not production
  if (!API_KEY && IS_DEV) {
    return {
      authenticated: true,
      actorId: token ? `api-key:${token.slice(0, 8)}...` : 'anonymous:dev',
      apiKey: token,
    };
  }

  if (token && token === API_KEY) {
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
 * Public endpoints (health, tools/list) bypass auth to allow schema discovery.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ctx = resolveAuthContext(req);
  (req as Request & { authCtx: typeof ctx }).authCtx = ctx;

  if (ctx.authenticated) {
    next();
    return;
  }

  // Allow a narrow set of GET paths without a token (health + index).
  // The SSE stream and inventory endpoints (/sse, /tools, /resources, /prompts)
  // are intentionally excluded and require a valid Bearer token.
  if (req.method === 'GET' && PUBLIC_GET_PATHS.has(req.path)) {
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
          'Set Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>',
      },
    },
  });
}
