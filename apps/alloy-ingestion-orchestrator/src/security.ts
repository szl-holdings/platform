/**
 * AEF Ingestion Orchestrator — HTTP security boundary.
 *
 * Operational routes require one explicitly configured bearer credential and
 * a non-empty tenant context. Production credentials are bound to one tenant;
 * development and tests may opt into a deliberate authentication bypass.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { isDevelopmentOrTestRuntime, isProductionRuntime } from '@workspace/aef-contracts';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const MAX_TENANT_ID_LENGTH = 128;

export interface OrchestratorAuthConfiguration {
  apiToken?: string;
  authorizedTenantId?: string;
  principal?: OrchestratorPrincipal;
  bypass: boolean;
}

export type OrchestratorRole = 'operator' | 'admin' | 'service';

export interface OrchestratorPrincipal {
  actorId: string;
  roles: readonly OrchestratorRole[];
}

declare global {
  namespace Express {
    interface Request {
      orchestratorTenantId?: string;
      orchestratorCredentialTenantId?: string;
      orchestratorPrincipal?: OrchestratorPrincipal;
    }
  }
}

function readBooleanFlag(value: string | undefined, name: string): boolean {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error(`${name} must be either "true" or "false" when set`);
}

function normalizeTenantId(value: string | undefined): string | undefined {
  const tenantId = value?.trim();
  if (!tenantId) return undefined;
  if (tenantId.length > MAX_TENANT_ID_LENGTH) {
    throw new Error(`tenant ID must be at most ${MAX_TENANT_ID_LENGTH} characters`);
  }
  return tenantId;
}

function resolvePrincipal(env: NodeJS.ProcessEnv): OrchestratorPrincipal | undefined {
  const actorId = env.ORCHESTRATOR_API_ACTOR_ID?.trim();
  const configuredRoles = env.ORCHESTRATOR_API_ROLES?.trim();
  if (!actorId && !configuredRoles) return undefined;
  if (!actorId) throw new Error('ORCHESTRATOR_API_ACTOR_ID is required when roles are configured');
  if (actorId.length > 128) {
    throw new Error('ORCHESTRATOR_API_ACTOR_ID must be at most 128 characters');
  }

  const allowedRoles = new Set<OrchestratorRole>(['operator', 'admin', 'service']);
  const roles = (configuredRoles ?? '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
  if (roles.length === 0) {
    throw new Error('ORCHESTRATOR_API_ROLES must contain at least one role');
  }
  for (const role of roles) {
    if (!allowedRoles.has(role as OrchestratorRole)) {
      throw new Error(`ORCHESTRATOR_API_ROLES contains unsupported role: ${role}`);
    }
  }
  return { actorId, roles: [...new Set(roles)] as OrchestratorRole[] };
}

export function resolveOrchestratorAuthConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): OrchestratorAuthConfiguration {
  const bypass = readBooleanFlag(env.ORCHESTRATOR_AUTH_BYPASS, 'ORCHESTRATOR_AUTH_BYPASS');
  const developmentMode = isDevelopmentOrTestRuntime(env, ['AEF_ENV', 'ORCHESTRATOR_ENV']);
  const production = isProductionRuntime(env, ['AEF_ENV', 'ORCHESTRATOR_ENV']);
  const apiToken = env.ORCHESTRATOR_API_TOKEN?.trim();
  const authorizedTenantId = normalizeTenantId(env.ORCHESTRATOR_API_TENANT_ID);
  const principal = resolvePrincipal(env);

  if (bypass && !developmentMode) {
    throw new Error(
      'ORCHESTRATOR_AUTH_BYPASS is permitted only when NODE_ENV is development or test',
    );
  }
  if (!bypass && !apiToken) {
    throw new Error(
      'ORCHESTRATOR_API_TOKEN is required unless the explicit development/test-only auth bypass is enabled',
    );
  }
  if (production && !authorizedTenantId) {
    throw new Error('ORCHESTRATOR_API_TENANT_ID is required when NODE_ENV is production');
  }
  if (production && !principal) {
    throw new Error(
      'ORCHESTRATOR_API_ACTOR_ID and ORCHESTRATOR_API_ROLES are required when NODE_ENV is production',
    );
  }

  return {
    ...(apiToken ? { apiToken } : {}),
    ...(authorizedTenantId ? { authorizedTenantId } : {}),
    ...(principal ? { principal } : {}),
    bypass,
  };
}

function credentialsMatch(provided: string, configured: string): boolean {
  // Hash both inputs first so timingSafeEqual always receives equal-length
  // buffers and the comparison does not disclose the configured token length.
  const providedDigest = createHash('sha256').update(provided).digest();
  const configuredDigest = createHash('sha256').update(configured).digest();
  return timingSafeEqual(providedDigest, configuredDigest);
}

function bearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  return match?.[1];
}

function sendUnauthorized(res: Response): void {
  res.setHeader('WWW-Authenticate', 'Bearer');
  res.status(401).json({ error: 'Unauthorized', code: 'INVALID_BEARER_TOKEN' });
}

export function createBearerAuthentication(config: OrchestratorAuthConfiguration): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.bypass) {
      next();
      return;
    }

    const token = bearerToken(req.headers.authorization);
    if (!token || !config.apiToken || !credentialsMatch(token, config.apiToken)) {
      sendUnauthorized(res);
      return;
    }

    if (config.authorizedTenantId) {
      req.orchestratorCredentialTenantId = config.authorizedTenantId;
    }
    if (config.principal) {
      req.orchestratorPrincipal = config.principal;
    }
    next();
  };
}

export function approvalPrincipal(req: Request): OrchestratorPrincipal | undefined {
  const principal = req.orchestratorPrincipal;
  if (!principal) return undefined;
  return principal.roles.some((role) => role === 'operator' || role === 'admin')
    ? principal
    : undefined;
}

export function requireTenantContext(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['x-tenant-id'];
  if (typeof header !== 'string') {
    res.status(400).json({ error: 'X-Tenant-Id header is required', code: 'TENANT_REQUIRED' });
    return;
  }

  let tenantId: string | undefined;
  try {
    tenantId = normalizeTenantId(header);
  } catch {
    res.status(400).json({ error: 'Invalid X-Tenant-Id header', code: 'INVALID_TENANT' });
    return;
  }
  if (!tenantId) {
    res.status(400).json({ error: 'X-Tenant-Id header is required', code: 'TENANT_REQUIRED' });
    return;
  }

  if (req.orchestratorCredentialTenantId && req.orchestratorCredentialTenantId !== tenantId) {
    res.status(403).json({ error: 'Forbidden', code: 'TENANT_SCOPE_MISMATCH' });
    return;
  }

  req.orchestratorTenantId = tenantId;
  next();
}

export function requestTenantId(req: Request): string {
  if (!req.orchestratorTenantId) {
    throw new Error('orchestrator tenant middleware was not applied');
  }
  return req.orchestratorTenantId;
}

export function resolveCorsAllowedOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const configured = env.ORCHESTRATOR_CORS_ALLOWED_ORIGINS?.trim();
  if (!configured) return new Set();

  const origins = new Set<string>();
  for (const candidate of configured.split(',').map((value) => value.trim())) {
    if (!candidate) continue;
    if (candidate === '*') {
      throw new Error('ORCHESTRATOR_CORS_ALLOWED_ORIGINS does not permit wildcard origins');
    }

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error(`Invalid origin in ORCHESTRATOR_CORS_ALLOWED_ORIGINS: ${candidate}`);
    }
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(`Invalid origin in ORCHESTRATOR_CORS_ALLOWED_ORIGINS: ${candidate}`);
    }
    origins.add(parsed.origin);
  }
  return origins;
}

export function createRestrictedCors(allowedOrigins: ReadonlySet<string>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'Cross-origin request denied', code: 'CORS_ORIGIN_DENIED' });
      return;
    }
    next();
  };
}
