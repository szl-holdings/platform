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
import { buildHealthReport, buildReadinessReport } from './health.js';
import { apiKeyGuard } from './middleware/auth.js';
import atelierRouter from './routes/v1/atelier.js';
import embedRouter from './routes/v1/embed.js';
import evalsRouter from './routes/v1/evals.js';
import indexRouter from './routes/v1/index.js';
import lutarRouter from './routes/v1/lutar.js';
import memoryRouter from './routes/v1/memory.js';
import ouroborosRouter from './routes/v1/ouroboros.js';
import searchRouter from './routes/v1/search.js';
import tasksRouter from './routes/v1/tasks.js';
import workflowsRouter from './routes/v1/workflows.js';

const V1_ENDPOINTS = {
  shellCompatibility: ['POST /api/omnia/adoption/beacon'],
  atelier: [
    'POST /api/a11oy/v1/atelier/ask',
    'GET /api/a11oy/v1/atelier/health',
    'GET /api/a11oy/v1/atelier/sessions/:sessionId',
  ],
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
  ouroboros: [
    'POST /v1/ouroboros/a11oy/reconcile-handoff',
    'POST /v1/ouroboros/a11oy/audit-fleet',
    'POST /v1/ouroboros/amaru/observe-metric',
    'POST /v1/ouroboros/amaru/audit-threshold',
    'POST /v1/ouroboros/sentra/anchor-event',
    'POST /v1/ouroboros/sentra/anchor-batch',
    'POST /v1/ouroboros/sentra/verify-trace',
    'GET /v1/ouroboros/sentra/anchor-state',
  ],
  lutar: [
    'POST /v1/ouroboros/lutar/v1',
    'POST /v1/ouroboros/lutar/v2',
    'POST /v1/ouroboros/lutar/v6',
    'POST /v1/ouroboros/lutar/v7',
    'POST /v1/ouroboros/lutar/v8',
    'POST /v1/ouroboros/lutar/v9',
    'POST /v1/ouroboros/lutar/v10',
    'POST /v1/ouroboros/lutar/evaluate-all',
  ],
};

const ALL_V1_ENDPOINTS = Object.values(V1_ENDPOINTS).flat();

export function createRouter(): Router {
  const router = Router();

  router.post('/api/omnia/adoption/beacon', (_req, res) => {
    res.setHeader('X-Evidence-State', 'UNAVAILABLE');
    res.status(204).end();
  });

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

  // Liveness probe: reports the running build (git SHA + version), boot time,
  // and uptime so a deployed container is self-identifying. See src/health.ts.
  router.get('/healthz', (_req, res) => {
    res.status(200).json(buildHealthReport());
  });

  // Readiness probe: runs real probes against the dependencies a request
  // traverses (memory store, run registry, workflow-runtime) and returns 503
  // when any probe fails so a load balancer pulls the instance.
  router.get('/readyz', (_req, res) => {
    const report = buildReadinessReport();
    res.status(report.ready ? 200 : 503).json(report);
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
      description: 'AEEP Counsel Execution and Evidence Platform — unified v1 runtime API',
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

  router.use('/api/a11oy/v1/atelier', apiKeyGuard, atelierRouter);
  router.use('/v1/tasks', apiKeyGuard, tasksRouter);
  router.use('/v1/memory', apiKeyGuard, memoryRouter);
  router.use('/v1/workflows', apiKeyGuard, workflowsRouter);
  router.use('/v1/search', apiKeyGuard, searchRouter);
  router.use('/v1', apiKeyGuard, embedRouter);
  router.use('/v1/index', apiKeyGuard, indexRouter);
  router.use('/v1/evals', apiKeyGuard, evalsRouter);
  router.use('/v1/ouroboros', apiKeyGuard, ouroborosRouter);
  router.use('/v1/ouroboros', apiKeyGuard, lutarRouter);

  return router;
}
