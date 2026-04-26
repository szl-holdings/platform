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

/**
 * MCP calls that are allowed without authentication (public read-only subset).
 * Only schema discovery (tools/list) and the no-op keepalive (ping) are public.
 */
const PUBLIC_METHODS = new Set(['tools/list', 'ping']);

/**
 * HTTP GET paths that are allowed without a Bearer token.
 */
const PUBLIC_GET_PATHS = new Set(['/', '/health']);

export function resolveAuthContext(req: Request): {
  authenticated: boolean;
  actorId: string;
  apiKey: string | null;
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
