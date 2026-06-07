/**
 * AEF Ingestion Orchestrator — Router
 *
 * Assembles all routes under the orchestrator prefix:
 *   GET  /v1/health
 *   POST /v1/runs               — submit a workflow run
 *   GET  /v1/runs               — list runs (with filters)
 *   GET  /v1/runs/:runId        — get run status
 *   DELETE /v1/runs/:runId      — cancel a run
 *   POST /v1/runs/:runId/approve — approve or reject a paused run
 */

import { Router } from 'express';
import { createApprovalsRouter } from './routes/approvals.js';
import { createRunsRouter } from './routes/runs.js';

export function createOrchestratorRouter(): Router {
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

  router.use('/v1/runs', createRunsRouter());
  router.use('/v1/runs', createApprovalsRouter());

  return router;
}
