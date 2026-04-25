/**
 * Retrieval Proof-Chain API
 *
 * POST /api/retrieval/proof-chain
 *
 * Runs the two-stage RetrievalSpecialist pipeline against the in-memory KB
 * corpus and returns the full RetrievalProofChain.  No external ML service
 * is required — the adapter uses CPU TF-IDF + cosine similarity.
 *
 * Request body:
 *   { query: string; strategy?: 'semantic'|'keyword'|'hybrid'; modalities?: string[]; topK?: number }
 *
 * Response:
 *   { proofChain: RetrievalProofChain; chunks: RetrievalChunk[] }
 */

import { RetrievalSpecialist } from '@szl-holdings/retrieval-core';
import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { kbEmbeddingAdapter } from '../lib/in-memory-kb-embedding-adapter';
import { logger } from '../lib/logger';

const router: IRouter = Router();

const requestSchema = z.object({
  query: z.string().min(1).max(2000),
  strategy: z.enum(['semantic', 'keyword', 'hybrid']).default('hybrid'),
  modalities: z
    .array(z.enum(['text', 'screenshot', 'diagram', 'audio_transcript']))
    .min(1)
    .default(['text']),
  topK: z.number().int().min(1).max(20).default(5),
});

const specialist = new RetrievalSpecialist({
  embeddingAdapter: kbEmbeddingAdapter,
  defaultTopK: 5,
  defaultMinScore: 0,
});

router.post('/', async (req: Request, res: Response) => {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(req.body);
  } catch (err) {
    sendBadRequest(res, 'Invalid request body');
    return;
  }

  try {
    const result = await specialist.retrieve({
      queryId: randomUUID(),
      text: body.query,
      strategy: body.strategy,
      modalities: body.modalities as ('text' | 'screenshot' | 'diagram' | 'audio_transcript')[],
      topK: body.topK,
    });

    logger.info(
      { queryId: result.queryId, strategy: body.strategy, hits: result.chunks.length },
      '[retrieval-proof-chain] query complete',
    );

    sendSuccess(res, {
      proofChain: result.proofChain,
      chunks: result.chunks,
    });
  } catch (err) {
    handleRouteError(res, err, '[retrieval-proof-chain] retrieve failed');
  }
});

export default router;
