/**
 * AEEP Alloy Runtime API — Router
 *
 * Assembles the full v1 API surface. Authentication and tenant isolation are
 * enforced on all routes via the API key guard (X-Api-Key + X-Tenant-Id headers).
 * Tenant context is propagated to every store operation — no cross-tenant data
 * leakage is possible at the store layer.
 *
 *   GET  /health
 *   GET  /metrics            — runtime metrics (JSON)
 *   GET  /docs               — API surface summary
 *
 *   POST   /v1/tasks/plan              — decompose a goal into a workflow plan
 *   POST   /v1/tasks/execute           — dispatch a validated task plan as a run
 *
 *   POST   /v1/memory/write            — write an entry to the memory fabric
 *   POST   /v1/memory/query            — query entries by scope + key prefix
 *   DELETE /v1/memory/evict-stale      — evict expired entries
 *
 *   POST   /v1/workflows/start         — start a governed workflow run
 *   GET    /v1/workflows               — list tenant-scoped runs
 *   GET    /v1/workflows/:runId        — get a tenant-owned run + step trace
 *   POST   /v1/workflows/:runId/resume — resume a checkpointed run
 *   POST   /v1/workflows/:runId/approve — operator approval decision
 *   DELETE /v1/workflows/:runId        — cancel a run
 *
 *   POST   /v1/search/hybrid           — hybrid semantic + keyword search
 *
 *   POST   /v1/embed                   — generate dense embeddings
 *   POST   /v1/rerank                  — cross-encoder passage reranking
 *   POST   /v1/openai/embeddings       — OpenAI-compatible embedding shim
 *
 *   POST   /v1/index/rebuild           — trigger full index rebuild
 *   GET    /v1/index/verify            — verify index integrity + shard health
 *
 *   POST   /v1/evals/run               — run an evaluation suite
 */
import { Router } from 'express';
import { apiKeyGuard } from './middleware/auth.js';
import embedRouter from './routes/v1/embed.js';
import evalsRouter from './routes/v1/evals.js';
import indexRouter from './routes/v1/index.js';
import memoryRouter from './routes/v1/memory.js';
import searchRouter from './routes/v1/search.js';
import tasksRouter from './routes/v1/tasks.js';
import workflowsRouter from './routes/v1/workflows.js';

const V1_ENDPOINTS = {
  tasks: ['POST /v1/tasks/plan', 'POST /v1/tasks/execute'],
  memory: ['POST /v1/memory/write', 'POST /v1/memory/query', 'DELETE /v1/memory/evict-stale'],
  workflows: [
    'POST /v1/workflows/start',
    'GET /v1/workflows',
    'GET /v1/workflows/:runId',
    'POST /v1/workflows/:runId/resume',
    'POST /v1/workflows/:runId/approve',
    'DELETE /v1/workflows/:runId',
  ],
  search: ['POST /v1/search/hybrid'],
  embeddings: ['POST /v1/embed', 'POST /v1/rerank', 'POST /v1/openai/embeddings'],
  index: ['POST /v1/index/rebuild', 'GET /v1/index/verify'],
  evals: ['POST /v1/evals/run'],
};

const ALL_V1_ENDPOINTS = Object.values(V1_ENDPOINTS).flat();

export function createRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'alloy-runtime-api',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
      v1EndpointCount: ALL_V1_ENDPOINTS.length,
      endpoints: V1_ENDPOINTS,
    });
  });

  // Standard Kubernetes probe aliases
  router.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/readyz', (_req, res) => {
    res.status(200).json({ ready: true });
  });

  router.get('/metrics', (_req, res) => {
    res.status(200).json({
      service: 'alloy-runtime-api',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
      v1EndpointCount: ALL_V1_ENDPOINTS.length,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      note: 'Full Prometheus metrics scrape endpoint pending — connect cognitive-observability exporter.',
    });
  });

  router.get('/docs', (_req, res) => {
    res.status(200).json({
      service: 'alloy-runtime-api',
      version: '0.2.0',
      description: 'AEEP Alloy Execution and Evidence Platform — unified v1 runtime API',
      authentication: {
        method: 'API Key',
        header: 'X-Api-Key',
        tenantHeader: 'X-Tenant-Id',
        note: 'All mutation endpoints require a valid API key. Reads are also tenant-scoped.',
      },
      v1Endpoints: ALL_V1_ENDPOINTS,
      endpointsByGroup: V1_ENDPOINTS,
      platformFacts: '/docs redirects to platform-facts.md for full registry details.',
    });
  });

  router.use('/v1/tasks', apiKeyGuard, tasksRouter);
  router.use('/v1/memory', apiKeyGuard, memoryRouter);
  router.use('/v1/workflows', apiKeyGuard, workflowsRouter);
  router.use('/v1/search', apiKeyGuard, searchRouter);
  router.use('/v1', apiKeyGuard, embedRouter);
  router.use('/v1/index', apiKeyGuard, indexRouter);
  router.use('/v1/evals', apiKeyGuard, evalsRouter);

  return router;
}
