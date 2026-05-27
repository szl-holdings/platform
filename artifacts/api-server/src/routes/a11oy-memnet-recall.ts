/**
 * GET /api/a11oy/reliquary/recall?q=...&type=...&limit=...
 *
 * Memnet associative recall over the Reliquary catalog. See
 * `packages/a11oy-reliquary/src/memnet-recall.ts`.
 */
import { Router, type Request, type Response } from 'express';
import { memnetRecall, MEMNET_RECALL_VERSION } from '@workspace/a11oy-reliquary/memnet-recall';
import { logger } from '../lib/logger.js';

const router = Router();

router.get('/a11oy/reliquary/recall', async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (!q.trim()) {
    res.status(400).json({ ok: false, error: { message: 'query parameter q is required' } });
    return;
  }
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  try {
    const out = await memnetRecall({ query: q, artifactType: type, limit });
    res.json({
      ok: true,
      data: out,
      meta: {
        version: MEMNET_RECALL_VERSION,
        formula: 'recall = 0.55·lexical + 0.25·temporal + 0.20·outcome',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-memnet-recall] recall failed');
    res.status(500).json({ ok: false, error: { message: 'memnet recall failed' } });
  }
});

export default router;
