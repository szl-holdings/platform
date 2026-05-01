/**
 * AEEP v1 Embedding + Reranking Routes
 *
 * POST /v1/embed              — generate embeddings via the embed worker queue.
 *                               Default backend: 'dev-hash' (DevHashEmbeddingBackend —
 *                               deterministic, no external deps, no env vars).
 *                               Selectable via the `backend` request field:
 *                               'dev-hash' | 'cpu-local'.
 *                               Unsupported IDs are rejected with HTTP 400.
 *                               Outputs are persisted to the tenant-scoped memory
 *                               store under the `episodic` scope with key prefix
 *                               `embed:<requestId>`. A ring-buffer of the latest
 *                               EMBED_STORE_MAX (50) entries is maintained per tenant;
 *                               older keys are pruned on each write to bound memory.
 *
 * POST /v1/rerank             — cross-encoder reranking via rerankHits() from
 *                               @workspace/aef-retrieval-core (term-overlap
 *                               approximation; passages re-ordered by real score).
 *
 * POST /v1/openai/embeddings  — OpenAI-compatible shim backed by the same embed
 *                               worker queue (dev-hash backend) as /v1/embed.
 *
 * Tenant isolation: all memory persistence and tenant resolution use
 * `req.tenantCtx?.tenantId ?? 'default'` — never a hardcoded tenant string
 * on authenticated requests.
 */

import { randomUUID } from 'node:crypto';
import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';
import { getDefaultEmbedWorker } from '@workspace/alloy-embed-worker';
import { rerankHits } from '@workspace/aef-retrieval-core';
import type { NormalizedHit } from '@workspace/aef-retrieval-core';
import { getMemoryStore } from '../../store.js';

const router: IRouter = Router();

const EMBEDDING_PATH = [
  'normalize_input',
  'select_backend',
  'micro_batch',
  'l2_normalize',
] as const;

const RERANK_PATH = [
  'normalize_query',
  'score_passages',
  'sort_by_reranker_score',
  'trim_topN',
] as const;

const EMBED_STORE_MAX = 50;

const EmbedSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(512),
  model: z.string().optional(),
  backend: z.enum(['dev-hash', 'cpu-local']).optional(),
});

const RerankSchema = z.object({
  query: z.string().min(1),
  passages: z.array(z.string().min(1)).min(1).max(256),
  topN: z.number().int().positive().max(100).optional(),
  model: z.string().optional(),
});

const OpenAIEmbedSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string().default('text-embedding-ada-002'),
  encoding_format: z.enum(['float', 'base64']).optional(),
});

async function embedViaWorker(
  texts: string[],
  backendId: string,
  model: string,
): Promise<{ vectors: number[][]; model: string; dimensions: number }> {
  const { queue } = getDefaultEmbedWorker();
  const vectors = await new Promise<number[][]>((resolve, reject) => {
    queue.enqueue(backendId, { texts, model, pooling: 'mean', normalize: true, resolve, reject });
  });
  const dimensions = vectors[0]?.length ?? 0;
  return { vectors, model, dimensions };
}

function pruneEmbedStore(tenantId: string): void {
  const memoryStore = getMemoryStore(tenantId);
  const keys = memoryStore.keys('episodic').filter((k) => k.startsWith('embed:'));
  if (keys.length <= EMBED_STORE_MAX) return;
  const toEvict = keys.slice(0, keys.length - EMBED_STORE_MAX);
  for (const key of toEvict) {
    memoryStore.delete('episodic', key);
  }
}

router.post('/embed', async (req: Request, res: Response): Promise<void> => {
  const parse = EmbedSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { texts, model, backend } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const requestId = randomUUID();
  const traceId = randomUUID();
  const t0 = Date.now();

  const backendId = backend ?? 'dev-hash';
  const modelId = model ?? 'aef-dev-hash';

  const result = await embedViaWorker(texts, backendId, modelId);
  const processingMs = Date.now() - t0;

  const embeddings = texts.map((text, i) => ({
    text,
    vector: result.vectors[i] ?? [],
    dimensions: result.dimensions,
  }));

  const memoryStore = getMemoryStore(tenantId);
  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  memoryStore.set({
    memoryId,
    scope: 'episodic',
    key: `embed:${requestId}`,
    value: {
      requestId,
      traceId,
      model: result.model,
      backend: backendId,
      dimensions: result.dimensions,
      count: embeddings.length,
      embeddings,
      storedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    traceId,
  });

  pruneEmbedStore(tenantId);

  res.status(200).json({
    requestId,
    tenantId,
    traceId,
    model: result.model,
    backend: backendId,
    dimensions: result.dimensions,
    embeddings,
    embeddingPath: [...EMBEDDING_PATH],
    processingMs,
  });
});

router.post('/rerank', (req: Request, res: Response): void => {
  const parse = RerankSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { query, passages, topN, model } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const requestId = randomUUID();
  const traceId = randomUUID();
  const t0 = Date.now();

  const hits: NormalizedHit[] = passages.map((text, i) => ({
    chunkId: `passage_${i}`,
    sourceId: `passage_${i}`,
    fusedScore: 1.0,
    rank: i + 1,
    metadata: { text, originalRank: i + 1 },
    boostApplied: false,
    boostedScore: 1.0,
    normalizedScore: 1.0,
  }));

  const reranked = rerankHits(hits, query, topN);
  const processingMs = Date.now() - t0;

  res.status(200).json({
    requestId,
    tenantId,
    traceId,
    query,
    model: model ?? 'cpu-term-overlap-v1',
    reranked: reranked.map((h, idx) => ({
      rank: idx + 1,
      text: String(h.metadata['text'] ?? ''),
      originalRank: Number(h.metadata['originalRank'] ?? 0),
      rerankerScore: Number(h.metadata['rerankerScore'] ?? h.normalizedScore),
    })),
    rerankPath: [...RERANK_PATH],
    processingMs,
  });
});

router.post('/openai/embeddings', async (req: Request, res: Response): Promise<void> => {
  const parse = OpenAIEmbedSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { input, model } = parse.data;
  const texts = Array.isArray(input) ? input : [input];

  const result = await embedViaWorker(texts, 'dev-hash', 'aef-dev-hash');

  const promptTokens = texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);

  res.status(200).json({
    object: 'list',
    model,
    data: texts.map((_, i) => ({
      object: 'embedding',
      index: i,
      embedding: result.vectors[i] ?? [],
    })),
    usage: {
      prompt_tokens: promptTokens,
      total_tokens: promptTokens,
    },
  });
});

export default router;
