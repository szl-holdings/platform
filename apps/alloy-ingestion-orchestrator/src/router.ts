/**
 * AEF Ingestion Orchestrator — Router
 *
 * Assembles all routes under the orchestrator prefix:
 *   GET  /health
 *   POST /v1/runs               — submit a workflow run
 *   GET  /v1/runs               — list runs (with filters)
 *   GET  /v1/runs/:runId        — get run status
 *   DELETE /v1/runs/:runId      — cancel a run
 *   POST /v1/runs/:runId/approve — approve or reject a paused run
 */

import express, { type RequestHandler, Router } from 'express';
import { createApprovalsRouter } from './routes/approvals.js';
import { createRunsRouter } from './routes/runs.js';
import { createOrchestratorRuntimeAdmissionMiddleware } from './runtime-admission.js';
import { requireTenantContext } from './security.js';

export interface OrchestratorRouterOptions {
  /** Authentication middleware supplied by the hosting security boundary. */
  authenticate: RequestHandler;
  /** Explicit environment snapshot used for production durability admission. */
  env?: NodeJS.ProcessEnv;
}

export function createOrchestratorRouter(options: OrchestratorRouterOptions): Router {
  if (typeof options?.authenticate !== 'function') {
    throw new Error('createOrchestratorRouter requires authentication middleware');
  }

  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'alloy-ingestion-orchestrator',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      workflows: [
        'ingest_document',
        'rebuild_index',
        'verify_index_health',
        'run_retrieval_eval',
        'rotate_profile_version',
      ],
    });
  });

  router.use(
    '/v1/runs',
    options.authenticate,
    requireTenantContext,
    createOrchestratorRuntimeAdmissionMiddleware(options.env),
    express.json({ limit: '10mb' }),
    createRunsRouter(),
    createApprovalsRouter(),
  );

  return router;
}
