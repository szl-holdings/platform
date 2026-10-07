import { isProductionRuntime } from '@workspace/aef-contracts';
import type { NextFunction, Request, Response } from 'express';

export const FABRIC_PRODUCTION_HOLDS = [
  {
    capability: 'durable-tenant-storage',
    status: 'UNAVAILABLE',
    reason: 'The service is wired to InMemoryStorageBundle only.',
  },
  {
    capability: 'qualified-embedding-and-reranking',
    status: 'UNAVAILABLE',
    reason:
      'This service has no immutable promotion receipt binding its embedding and reranking artifacts.',
  },
  {
    capability: 'durable-evidence-ledger',
    status: 'UNAVAILABLE',
    reason:
      'The configured evidence ledger is process-local and ledger write failures are not transactional.',
  },
  {
    capability: 'authoritative-index-and-evaluation',
    status: 'UNAVAILABLE',
    reason:
      'Index and evaluation routes do not have a durable authoritative backend in this service.',
  },
] as const;

export function isFabricProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return isProductionRuntime(env, ['AEF_ENV', 'AEF_FABRIC_ENV']);
}

export function buildFabricProductionHold() {
  return {
    ready: false,
    status: 'HOLD',
    code: 'PRODUCTION_CAPABILITY_UNAVAILABLE',
    evidenceState: 'UNAVAILABLE',
    service: 'alloy-fabric-api',
    message:
      'Production traffic is disabled until durable storage, qualified model artifacts, and a durable evidence ledger are wired and verified.',
    holds: FABRIC_PRODUCTION_HOLDS,
  } as const;
}

/** Fail before a route can execute any process-local or deterministic fallback. */
export function productionCapabilityHoldMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isFabricProduction()) {
    next();
    return;
  }
  res.setHeader('X-Evidence-State', 'UNAVAILABLE');
  res.setHeader('Retry-After', '60');
  res.status(503).json(buildFabricProductionHold());
}
