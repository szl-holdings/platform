/**
 * AEEP v1 Search Routes
 *
 * POST /v1/search/hybrid — hybrid semantic + keyword search across the retrieval index
 *
 * In production, this delegates to the retrieval-core hybrid search pipeline
 * (dense vector + BM25 fusion with cross-encoder reranking). This stub returns
 * a well-typed response envelope so downstream consumers can code against the
 * contract immediately.
 */

import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';

const router: IRouter = Router();

const HybridSearchSchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().max(100).default(10),
  filters: z.record(z.unknown()).optional(),
  profileId: z.string().optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
});

router.post('/hybrid', (req: Request, res: Response): void => {
  const parse = HybridSearchSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { query, topK, filters, profileId, scoreThreshold } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? 'default';

  res.status(200).json({
    query,
    tenantId,
    profileId: profileId ?? null,
    filters: filters ?? {},
    scoreThreshold: scoreThreshold ?? null,
    results: [],
    totalHits: 0,
    topK,
    latencyMs: 0,
    backend: 'retrieval-core/hybrid',
    note: 'Retrieval backend not yet wired — returns empty result set. Connect retrieval-core HybridSearchPipeline.',
  });
});

export default router;
