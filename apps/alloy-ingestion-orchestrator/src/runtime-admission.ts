import { isProductionRuntime } from '@workspace/aef-contracts';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const ORCHESTRATOR_DURABILITY_HOLD_CODE = 'DURABLE_ORCHESTRATOR_STATE_REQUIRED';

export interface OrchestratorRuntimeAdmission {
  ready: boolean;
  promotionState: 'DEVELOPMENT' | 'EVALUATION_HOLD';
  durableState: boolean;
  detail: string;
  blockers: readonly string[];
}

const DURABILITY_BLOCKERS = [
  'workflow runs and checkpoints are process-local',
  'pending approvals and audit events are process-local',
  'ingest requestId reservations and payload-fingerprint conflict checks are not durable',
] as const;

/**
 * The repository currently has no production implementation for the complete
 * orchestrator state boundary. Keep the development engine usable, but never
 * admit stateful workflow execution in production by relabelling memory maps.
 */
export function resolveOrchestratorRuntimeAdmission(
  env: NodeJS.ProcessEnv = process.env,
): OrchestratorRuntimeAdmission {
  if (isProductionRuntime(env, ['AEF_ENV', 'ORCHESTRATOR_ENV'])) {
    return {
      ready: false,
      promotionState: 'EVALUATION_HOLD',
      durableState: false,
      detail: 'Production workflow execution is held until durable orchestrator state exists',
      blockers: DURABILITY_BLOCKERS,
    };
  }
  return {
    ready: true,
    promotionState: 'DEVELOPMENT',
    durableState: false,
    detail: 'Development-only process-local orchestrator state',
    blockers: DURABILITY_BLOCKERS,
  };
}

export function createOrchestratorRuntimeAdmissionMiddleware(
  env: NodeJS.ProcessEnv = process.env,
): RequestHandler {
  const admission = resolveOrchestratorRuntimeAdmission(env);
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (admission.ready) {
      next();
      return;
    }
    res.status(503).json({
      error: admission.detail,
      code: ORCHESTRATOR_DURABILITY_HOLD_CODE,
      promotionState: admission.promotionState,
      durableState: admission.durableState,
      blockers: admission.blockers,
    });
  };
}
