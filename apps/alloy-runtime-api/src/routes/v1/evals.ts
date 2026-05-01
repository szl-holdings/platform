/**
 * AEEP v1 Eval Routes
 *
 * POST /v1/evals/run          — run a retrieval eval suite against bundled golden
 *                               fixtures. Wired to runRetrievalEval() from
 *                               @workspace/aef-evals using an in-process BM25
 *                               adapter over the fixture corpus (same algorithm
 *                               as search.ts). suiteId is optional — when omitted
 *                               it defaults to legalFixtures.profileId. When
 *                               provided it is matched against fixture set
 *                               profileIds; falls back to the legal fixture set.
 *
 *                               Sync mode  (async: false): runs in-process and
 *                               returns real aggregate metrics.
 *                               Async mode (async: true, default): kicks off
 *                               harness in background, persists the run record
 *                               under governance scope key `eval_run:<evalRunId>`,
 *                               returns 202 with status URL immediately.
 *
 * GET /v1/evals/:evalRunId    — reads the persisted run from the tenant-scoped
 *                               memory store. Returns 404 if not found (existence
 *                               leak prevention — cross-tenant runs are treated
 *                               as not-found rather than forbidden).
 *
 * AEEP metric → harness metric mapping:
 *   context_recall      → recall@k
 *   context_precision   → precision@k
 *   faithfulness        → ndcg@k   (closest structural analog)
 *   answer_relevancy    → mrr
 *   hallucination_rate  → 1 − recall@k  (inverse; lower is better)
 *   policy_compliance   → exact_match_recovery
 *   citation_coverage   → mrr
 *
 * Tenant isolation: all memory persistence uses getMemoryStore(tenantId) with
 * tenantId resolved from req.tenantCtx?.tenantId — never a hardcoded default
 * on authenticated requests.
 */

import { randomUUID } from 'node:crypto';
import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  runRetrievalEval,
  ALL_FIXTURE_SETS,
  legalFixtures,
  type EvalHarnessResult,
  type EvalHarnessRequest,
} from '@workspace/aef-evals';
import type { RetrievedResult } from '@workspace/aef-evals';
import type { DomainProfile } from '@workspace/aef-domain-profiles/schema';

import { getMemoryStore } from '../../store.js';
import { buildAndSearchCorpus } from './search.js';

type HarnessRetrievalAdapter = EvalHarnessRequest['adapter'];

interface BM25GoldenQuery {
  queryId: string;
  query: string;
  relevantChunkIds: string[];
}

const router: IRouter = Router();

const EVAL_PATH = [
  'resolve_suite',
  'build_bm25_adapter',
  'run_search_lane',
  'aggregate_metrics',
  'map_aeep_metrics',
] as const;

const EvalRunSchema = z.object({
  suiteId: z.string().min(1).optional(),
  datasetId: z.string().optional(),
  modelId: z.string().optional(),
  pipelineId: z.string().optional(),
  metrics: z
    .array(
      z.enum([
        'faithfulness',
        'context_precision',
        'context_recall',
        'answer_relevancy',
        'hallucination_rate',
        'policy_compliance',
        'citation_coverage',
      ]),
    )
    .min(1),
  maxSamples: z.number().int().positive().max(10000).optional(),
  async: z.boolean().default(true),
});

type AEEPMetric =
  | 'faithfulness'
  | 'context_precision'
  | 'context_recall'
  | 'answer_relevancy'
  | 'hallucination_rate'
  | 'policy_compliance'
  | 'citation_coverage';

function buildBm25Adapter(
  corpus: { chunkId: string; text: string }[],
): HarnessRetrievalAdapter {
  const normalizedCorpus = corpus.map((chunk) => ({
    id: chunk.chunkId,
    parts: [chunk.text],
    metadata: {},
  }));

  return {
    async retrieve(query: string, _profileId: string, topK: number): Promise<RetrievedResult[]> {
      const results = buildAndSearchCorpus(normalizedCorpus, query, topK);
      return results.map((r) => ({ chunkId: r.id, score: r.score }));
    },
  };
}

function mapAEEPMetrics(
  requestedMetrics: AEEPMetric[],
  harnessResult: EvalHarnessResult,
): Record<string, number | null> {
  const agg = harnessResult.aggregateMetrics;
  const getMetric = (name: string): number | null => {
    const found = agg.find((m) => m.metric === name);
    return found != null ? Math.round(found.value * 10000) / 10000 : null;
  };

  const recall = getMetric('recall');
  const precision = getMetric('precision');
  const ndcg = getMetric('ndcg');
  const mrrVal = getMetric('mrr');
  const exactMatch = getMetric('exact_match_recovery');

  const scores: Record<string, number | null> = {};
  for (const m of requestedMetrics) {
    switch (m) {
      case 'context_recall':
        scores[m] = recall;
        break;
      case 'context_precision':
        scores[m] = precision;
        break;
      case 'faithfulness':
        scores[m] = ndcg;
        break;
      case 'answer_relevancy':
        scores[m] = mrrVal;
        break;
      case 'hallucination_rate':
        scores[m] = recall != null ? Math.round((1 - recall) * 10000) / 10000 : null;
        break;
      case 'policy_compliance':
        scores[m] = exactMatch;
        break;
      case 'citation_coverage':
        scores[m] = mrrVal;
        break;
      default:
        scores[m] = null;
    }
  }
  return scores;
}

async function runEval(
  suiteId: string,
  evalRunId: string,
  requestedMetrics: AEEPMetric[],
  maxSamples: number | undefined,
): Promise<{
  scores: Record<string, number | null>;
  sampleCount: number;
  perQuery: unknown[];
  completedAt: string;
  harnessResult: EvalHarnessResult;
}> {
  const fixtureSet =
    ALL_FIXTURE_SETS.find((f) => f.profileId === suiteId) ?? legalFixtures;

  const rawQueries: BM25GoldenQuery[] = fixtureSet.queries.map((q) => ({
    queryId: q.queryId,
    query: q.query,
    relevantChunkIds: q.relevantChunkIds,
  }));

  const queries = maxSamples != null ? rawQueries.slice(0, maxSamples) : rawQueries;

  const corpus = fixtureSet.corpus ?? [];
  const adapter = buildBm25Adapter(corpus);

  const synthProfile = {
    profileId: fixtureSet.profileId,
    version: '1.0.0',
    topK: 10,
  } as unknown as DomainProfile;

  const harnessReq: EvalHarnessRequest = {
    evalId: evalRunId,
    profile: synthProfile,
    queries,
    adapter,
    topK: 10,
  };

  const harnessResult = await runRetrievalEval(harnessReq);

  const scores = mapAEEPMetrics(requestedMetrics, harnessResult);

  const perQuery = harnessResult.perQuery.map((pq) => ({
    queryId: pq.queryId,
    query: pq.query,
    latencyMs: Math.round(pq.latencyMs * 100) / 100,
    metrics: Object.fromEntries(pq.metrics.map((m) => [`${m.metric}@${m.atK}`, m.value])),
    error: pq.error ?? null,
  }));

  return {
    scores,
    sampleCount: harnessResult.successCount,
    perQuery,
    completedAt: new Date().toISOString(),
    harnessResult,
  };
}

router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const parse = EvalRunSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const {
    suiteId = legalFixtures.profileId,
    datasetId,
    modelId,
    pipelineId,
    metrics,
    maxSamples,
    async: isAsync,
  } = parse.data;

  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const evalRunId = randomUUID();
  const traceId = randomUUID();
  const t0 = Date.now();
  const queuedAt = new Date().toISOString();

  if (!isAsync) {
    try {
      const { scores, sampleCount, perQuery } = await runEval(
        suiteId,
        evalRunId,
        metrics as AEEPMetric[],
        maxSamples,
      );
      const processingMs = Date.now() - t0;

      res.status(200).json({
        evalRunId,
        requestId: evalRunId,
        tenantId,
        traceId,
        suiteId,
        datasetId: datasetId ?? null,
        modelId: modelId ?? null,
        pipelineId: pipelineId ?? null,
        metrics,
        maxSamples: maxSamples ?? null,
        status: 'completed',
        queuedAt,
        results: {
          scores,
          sampleCount,
          perQuery,
          completedAt: new Date().toISOString(),
        },
        evalPath: [...EVAL_PATH],
        processingMs,
        statusUrl: `/v1/evals/${evalRunId}`,
      });
    } catch (err) {
      res.status(500).json({
        error: 'Eval failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  const memoryStore = getMemoryStore(tenantId);
  const runRecord = {
    evalRunId,
    tenantId,
    traceId,
    suiteId,
    datasetId: datasetId ?? null,
    modelId: modelId ?? null,
    pipelineId: pipelineId ?? null,
    metrics,
    maxSamples: maxSamples ?? null,
    status: 'queued' as 'queued' | 'running' | 'completed' | 'failed',
    queuedAt,
    results: null as unknown,
    evalPath: [...EVAL_PATH],
    processingMs: null as number | null,
    statusUrl: `/v1/evals/${evalRunId}`,
  };

  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  memoryStore.set({
    memoryId,
    scope: 'governance',
    key: `eval_run:${evalRunId}`,
    value: { ...runRecord },
    createdAt: queuedAt,
    traceId,
  });

  setImmediate(async () => {
    try {
      runRecord.status = 'running';
      memoryStore.set({
        memoryId,
        scope: 'governance',
        key: `eval_run:${evalRunId}`,
        value: { ...runRecord },
        createdAt: queuedAt,
        traceId,
      });

      const { scores, sampleCount, perQuery } = await runEval(
        suiteId,
        evalRunId,
        metrics as AEEPMetric[],
        maxSamples,
      );

      const processingMs = Date.now() - t0;
      runRecord.status = 'completed';
      runRecord.processingMs = processingMs;
      runRecord.results = {
        scores,
        sampleCount,
        perQuery,
        completedAt: new Date().toISOString(),
      };

      memoryStore.set({
        memoryId,
        scope: 'governance',
        key: `eval_run:${evalRunId}`,
        value: { ...runRecord },
        createdAt: queuedAt,
        traceId,
      });
    } catch (err) {
      runRecord.status = 'failed';
      (runRecord as Record<string, unknown>)['error'] =
        err instanceof Error ? err.message : String(err);
      memoryStore.set({
        memoryId,
        scope: 'governance',
        key: `eval_run:${evalRunId}`,
        value: { ...runRecord },
        createdAt: queuedAt,
        traceId,
      });
    }
  });

  res.status(202).json({
    evalRunId,
    requestId: evalRunId,
    tenantId,
    traceId,
    suiteId,
    datasetId: datasetId ?? null,
    modelId: modelId ?? null,
    pipelineId: pipelineId ?? null,
    metrics,
    maxSamples: maxSamples ?? null,
    status: 'queued',
    queuedAt,
    processingMs: Date.now() - t0,
    results: null,
    evalPath: [...EVAL_PATH],
    statusUrl: `/v1/evals/${evalRunId}`,
  });
});

router.get('/:evalRunId', (req: Request, res: Response): void => {
  const { evalRunId } = req.params as { evalRunId: string };
  const tenantId = req.tenantCtx?.tenantId ?? 'default';
  const memoryStore = getMemoryStore(tenantId);

  const entry = memoryStore.get('governance', `eval_run:${evalRunId}`);
  if (!entry) {
    res.status(404).json({ error: 'Eval run not found', evalRunId });
    return;
  }

  const record = entry.value as Record<string, unknown>;
  if (record['tenantId'] !== tenantId) {
    res.status(404).json({ error: 'Eval run not found', evalRunId });
    return;
  }

  res.status(200).json(record);
});

export default router;
