/**
 * AEEP Runtime API — Authentication Middleware
 *
 * Guards mutation endpoints with API key authentication.
 * The ALLOY_API_KEY environment variable must be set in production.
 * Tenant isolation is enforced via the X-Tenant-Id header — all write
 * operations are scoped to the provided tenant.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { isProductionRuntime } from '../runtime-capabilities.js';

export interface TenantContext {
  tenantId: string;
}

export function assertProductionAuthConfiguration(env: NodeJS.ProcessEnv = process.env): void {
  if (isProductionRuntime(env) && !env.ALLOY_API_KEY?.trim()) {
    throw new Error('ALLOY_API_KEY is required when NODE_ENV is production');
  }
  if (isProductionRuntime(env) && !env.ALLOY_API_TENANT_ID?.trim()) {
    throw new Error('ALLOY_API_TENANT_ID is required when NODE_ENV is production');
  }
}

function credentialsMatch(provided: string, configured: string): boolean {
  const providedDigest = createHash('sha256').update(provided).digest();
  const configuredDigest = createHash('sha256').update(configured).digest();
  return timingSafeEqual(providedDigest, configuredDigest);
}

declare global {
  namespace Express {
    interface Request {
      tenantCtx?: TenantContext;
    }
  }
}

export function apiKeyGuard(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = process.env.ALLOY_API_KEY?.trim();
  const configuredTenant = process.env.ALLOY_API_TENANT_ID?.trim();

  if (!configuredKey) {
    if (isProductionRuntime()) {
      res.status(503).json({
        error: 'Service misconfigured — ALLOY_API_KEY not set',
        code: 'MISSING_API_KEY_CONFIG',
      });
      return;
    }
    const requestedTenant = req.headers['x-tenant-id'];
    const tenantId = typeof requestedTenant === 'string' ? requestedTenant.trim() : '';
    req.tenantCtx = { tenantId: tenantId || 'default' };
    next();
    return;
  }

  if (isProductionRuntime() && !configuredTenant) {
    res.status(503).json({
      error: 'Service misconfigured — ALLOY_API_TENANT_ID not set',
      code: 'MISSING_TENANT_CONFIG',
    });
    return;
  }

  const providedKey = req.headers['x-api-key'];
  if (typeof providedKey !== 'string' || !credentialsMatch(providedKey, configuredKey)) {
    res.status(401).json({
      error: 'Unauthorized — missing or invalid X-Api-Key header',
      code: 'INVALID_API_KEY',
    });
    return;
  }

  const rawRequestedTenant = req.headers['x-tenant-id'];
  const requestedTenant =
    typeof rawRequestedTenant === 'string' ? rawRequestedTenant.trim() : undefined;
  if (configuredTenant && requestedTenant && requestedTenant !== configuredTenant) {
    res.status(403).json({
      error: 'Forbidden — credential is not authorized for the requested tenant',
      code: 'TENANT_SCOPE_MISMATCH',
    });
    return;
  }
  req.tenantCtx = { tenantId: configuredTenant ?? requestedTenant ?? 'default' };

  next();
}
