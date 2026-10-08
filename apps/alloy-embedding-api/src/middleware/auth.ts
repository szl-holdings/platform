import { timingSafeEqual } from 'node:crypto';
import { isDevelopmentOrTestRuntime, isProductionRuntime } from '@workspace/aef-contracts';
import type { NextFunction, Request, Response } from 'express';

export interface AuthConfiguration {
  apiKey?: string;
  authorizedTenantId?: string;
  bypass: boolean;
}

declare global {
  namespace Express {
    interface Request {
      aefAuthContext?: { authorizedTenantId?: string };
    }
  }
}

export function resolveAuthConfiguration(env: NodeJS.ProcessEnv = process.env): AuthConfiguration {
  const apiKey = env.AEF_API_KEY?.trim();
  const bypass = env.AEF_AUTH_BYPASS === 'true';
  const developmentMode = isDevelopmentOrTestRuntime(env, ['AEF_ENV']);
  const production = isProductionRuntime(env, ['AEF_ENV']);
  const authorizedTenantId = env.AEF_API_TENANT_ID?.trim();

  if (bypass && !developmentMode) {
    throw new Error('AEF_AUTH_BYPASS is permitted only when NODE_ENV is development or test');
  }
  if (!bypass && !apiKey) {
    throw new Error(
      'AEF_API_KEY is required unless the explicit development/test-only auth bypass is enabled',
    );
  }
  if (production && !authorizedTenantId) {
    throw new Error('AEF_API_TENANT_ID is required when NODE_ENV is production');
  }

  return {
    ...(apiKey ? { apiKey } : {}),
    ...(authorizedTenantId ? { authorizedTenantId } : {}),
    bypass,
  };
}

export function assertAuthConfiguration(env: NodeJS.ProcessEnv = process.env): void {
  resolveAuthConfiguration(env);
}

export function bearerAuthenticationError(
  header: string | undefined,
  config: AuthConfiguration,
): string | undefined {
  if (config.bypass) return undefined;
  const match = header ? /^Bearer ([^\s]+)$/i.exec(header) : undefined;
  if (!match) {
    return 'Authorization header missing or not Bearer scheme';
  }

  const token = match[1];
  if (!token) return 'Bearer token is empty';
  if (!config.apiKey) return 'Bearer token is invalid';
  // Compare opaque API tokens directly; no password digest is persisted.
  const tokenBytes = Buffer.from(token, 'utf8');
  const configuredBytes = Buffer.from(config.apiKey, 'utf8');
  if (
    tokenBytes.length !== configuredBytes.length ||
    !timingSafeEqual(tokenBytes, configuredBytes)
  ) {
    return 'Bearer token is invalid';
  }
  return undefined;
}

function sendUnauthorized(res: Response): void {
  res.setHeader('WWW-Authenticate', 'Bearer');
  res.status(401).json({ error: 'Unauthorized', code: 'INVALID_BEARER_TOKEN' });
}

export function createBearerAuthentication(config: AuthConfiguration) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const error = bearerAuthenticationError(req.headers.authorization, config);
    if (error) {
      sendUnauthorized(res);
      return;
    }

    req.aefAuthContext = {
      ...(config.authorizedTenantId ? { authorizedTenantId: config.authorizedTenantId } : {}),
    };
    next();
  };
}

export function bearerAuth(req: Request, res: Response, next: NextFunction): void {
  createBearerAuthentication(resolveAuthConfiguration())(req, res, next);
}

export const HEALTH_PATHS = new Set(['/health', '/metrics']);

export function conditionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (HEALTH_PATHS.has(req.path)) {
    next();
    return;
  }
  bearerAuth(req, res, next);
}
