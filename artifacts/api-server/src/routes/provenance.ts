import { Router, type Request, type Response } from 'express';
import {
  getProvenanceByRunId,
  listRecentProvenance,
  getProvenanceStats,
} from '@szl-holdings/ai-engine/provenance';
import { authMiddleware } from '../middlewares/auth';
import { handleRouteError } from '../utils/error-handler.js';

const router = Router();

router.use(authMiddleware());

router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = getProvenanceStats();
    res.json(stats);
  } catch (err) {
    handleRouteError(res, err, 'Failed to retrieve provenance stats');
  }
});

router.get('/recent', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);
    const lineages = listRecentProvenance(limit);
    res.json({ lineages, total: lineages.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list recent provenance');
  }
});

router.get('/:runId', (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const lineage = getProvenanceByRunId(runId!);
    if (!lineage) {
      res.status(404).json({ error: 'Provenance record not found', runId });
      return;
    }
    res.json(lineage);
  } catch (err) {
    handleRouteError(res, err, 'Failed to retrieve provenance record');
  }
});

export default router;
