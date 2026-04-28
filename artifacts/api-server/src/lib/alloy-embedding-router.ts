import { Router } from 'express';

/**
 * Alloy Embedding Fabric (AEF) router.
 *
 * NOTE (Phase-12 hygiene): The original router was imported from
 * `@workspace/continuum-embedding-api` which no longer exists after the
 * Alloy → Continuum rebrand was partially reverted (Task #3255). This stub
 * preserves the mount-point registration so the server starts cleanly while
 * a dedicated follow-up restores the full embedding endpoint.
 *
 * TODO: Replace with the real AEF router once @workspace/alloy-embedding-api
 * is published (tracked in PLT-AEF-RESTORE).
 */
export function createAefRouter(): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.status(503).json({ status: 'unavailable', reason: 'aef-router-pending-restore' });
  });
  router.use((_req, res) => {
    res.status(503).json({ status: 'unavailable', reason: 'aef-router-pending-restore' });
  });
  return router;
}
