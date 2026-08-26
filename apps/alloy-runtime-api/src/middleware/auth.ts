/**
 * AEEP Runtime API — Authentication Middleware
 *
 * Guards mutation endpoints with API key authentication.
 * The ALLOY_API_KEY environment variable must be set in production.
 * Tenant isolation is enforced via the X-Tenant-Id header — all write
 * operations are scoped to the provided tenant.
 */
import type { NextFunction, Request, Response } from 'express';

export interface TenantContext {
  tenantId: string;
  apiKeyPrefix: string;
}

declare global {
  namespace Express {
    interface Request {
      tenantCtx?: TenantContext;
    }
  }
}

export function apiKeyGuard(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = process.env.ALLOY_API_KEY;

  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({
        error: 'Service misconfigured — ALLOY_API_KEY not set',
        code: 'MISSING_API_KEY_CONFIG',
      });
      return;
    }
    const tenantId = (req.headers['x-tenant-id'] as string | undefined) ?? 'default';
    req.tenantCtx = {
      tenantId,
      apiKeyPrefix: 'development-no-key',
    };
    next();
    return;
  }

  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== configuredKey) {
    res.status(401).json({
      error: 'Unauthorized — missing or invalid X-Api-Key header',
      code: 'INVALID_API_KEY',
    });
    return;
  }

  const tenantId = (req.headers['x-tenant-id'] as string | undefined) ?? 'default';
  req.tenantCtx = {
    tenantId,
    apiKeyPrefix: String(providedKey).slice(0, 8),
  };

  next();
}
