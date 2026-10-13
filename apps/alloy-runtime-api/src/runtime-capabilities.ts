import { isProductionRuntime as isPlatformProductionRuntime } from '@workspace/aef-contracts';
import type { NextFunction, Request, Response } from 'express';

export const UNWIRED_PRODUCTION_CAPABILITIES = [
  'task-planning-and-execution',
  'memory-fabric',
  'workflow-execution',
  'hybrid-search',
  'embedding',
  'reranking',
  'openai-embedding-compat',
  'index-rebuild',
  'index-verification',
  'evaluation-runner',
  'atelier',
  'ouroboros-integrations',
  'lutar-evaluation',
] as const;

export type UnwiredProductionCapability = (typeof UNWIRED_PRODUCTION_CAPABILITIES)[number];

export function isProductionRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return isPlatformProductionRuntime(env, ['ALLOY_RUNTIME_ENV']);
}

export function buildProductionRuntimeHold() {
  return {
    ready: false,
    status: 'HOLD',
    code: 'PRODUCTION_CAPABILITY_UNAVAILABLE',
    evidenceState: 'UNAVAILABLE',
    service: 'alloy-runtime-api',
    message:
      'Production execution is disabled until durable tenant stores, qualified execution backends, and a durable evidence ledger are wired and verified.',
    holds: [...UNWIRED_PRODUCTION_CAPABILITIES],
  } as const;
}

/** Stop authenticated production traffic before any process-local route runs. */
export function productionRuntimeHoldMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isProductionRuntime()) {
    next();
    return;
  }
  res.setHeader('X-Evidence-State', 'UNAVAILABLE');
  res.setHeader('Retry-After', '60');
  res.status(503).json(buildProductionRuntimeHold());
}

/**
 * Reject an advertised route whose execution backend is not wired in this
 * service release. Returning a 503 prevents stub envelopes from being mistaken
 * for completed work or healthy downstream state.
 */
export function rejectUnwiredProductionCapability(
  res: Response,
  capability: UnwiredProductionCapability,
): boolean {
  if (!isProductionRuntime()) return false;
  res.setHeader('X-Evidence-State', 'UNAVAILABLE');
  res.setHeader('Retry-After', '60');
  res.status(503).json({
    status: 'UNAVAILABLE',
    code: 'CAPABILITY_UNAVAILABLE',
    capability,
    evidenceState: 'UNAVAILABLE',
    message: 'The production execution backend is not wired; no work was accepted or executed.',
  });
  return true;
}
