import { createOrchestratorRuntimeAdmissionMiddleware } from '@workspace/alloy-ingestion-orchestrator';
import cors from 'cors';
import express, { type Application, type ErrorRequestHandler, type RequestHandler } from 'express';
import { assertAuthConfiguration, conditionalAuth } from './middleware/auth.js';
import { isCorsOriginAllowed, resolveCorsAllowedOrigins } from './middleware/cors-policy.js';
import { logger, requestLogger } from './middleware/logger.js';
import { metricsHandler, metricsMiddleware } from './middleware/prometheus.js';
import { globalRateLimit, perTenantRateLimit } from './middleware/rate-limit.js';
import { enforceTenantRequestConsistency, tenantScoping } from './middleware/tenant.js';
import { requestTracing } from './middleware/tracing.js';
import { openApiSpec } from './openapi/spec.js';
import { createAefReadinessHandler } from './readiness-handler.js';
import { assertProductionRerankerConfiguration } from './rerank-runtime.js';
import { assertProductionEmbedderConfiguration } from './retrieval-store.js';
import { embedRouter } from './routes/embed.js';
import { evalsRouter } from './routes/evals.js';
import { healthRouter } from './routes/health.js';
import { hybridSearchRouter } from './routes/hybrid-search.js';
import { indexOpsRouter } from './routes/index-ops.js';
import { ingestRouter } from './routes/ingest.js';
import { multimodalEmbedRouter } from './routes/multimodal-embed.js';
import { openaiCompatRouter } from './routes/openai-compat.js';
import { rerankRouter } from './routes/rerank.js';

const PORT = Number(process.env.PORT ?? 8766);
const BASE_PATH = process.env.BASE_PATH ?? '/alloy-embedding-api';

// Authentication is a startup invariant. A missing production credential must
// stop the process before it can advertise healthy or accept arbitrary tokens.
assertAuthConfiguration();
// Production must also have the real embedding lane used by /v1/embed and
// /v1/hybrid-search. Development/test may intentionally use the dev-hash lane.
assertProductionEmbedderConfiguration();
// Production reranking is disabled by default. When explicitly enabled, it
// must be backed by a qualified immutable implementation before startup.
assertProductionRerankerConfiguration();

const app: Application = express();

app.set('trust proxy', 1);

// CORS: explicit allowlist via CORS_ALLOWED_ORIGINS (comma-separated).
// Defaults to no cross-origin access; set the env var in production deployments.
const CORS_ALLOWED_ORIGINS = resolveCorsAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser requests have no Origin header — allow them.
      if (!origin) return callback(null, true);
      if (isCorsOriginAllowed(origin, CORS_ALLOWED_ORIGINS)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

app.use(requestTracing as RequestHandler);
app.use(metricsMiddleware as RequestHandler);
app.use(requestLogger as RequestHandler);

// Defense-in-depth: IP-scoped global limiter before any auth.
// Protects unauthenticated public endpoints (health/metrics/docs) and
// caps per-IP request volume independent of tenant identity.
app.use(globalRateLimit as RequestHandler);

app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'alloy-embedding-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Standard Kubernetes probe aliases (no BASE_PATH prefix — standard probe paths)
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', createAefReadinessHandler());

app.get(`${BASE_PATH}/metrics`, metricsHandler as unknown as RequestHandler);
app.get(`${BASE_PATH}/docs`, (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use(conditionalAuth as RequestHandler);
app.use(tenantScoping as RequestHandler);
app.use(enforceTenantRequestConsistency as RequestHandler);
app.use(perTenantRateLimit as RequestHandler);

app.use(BASE_PATH, healthRouter);
app.use(BASE_PATH, embedRouter);
app.use(BASE_PATH, rerankRouter);
app.use(BASE_PATH, hybridSearchRouter);
app.use(BASE_PATH, multimodalEmbedRouter);
app.use(
  [`${BASE_PATH}/v1/ingest`, `${BASE_PATH}/v1/index`, `${BASE_PATH}/v1/evals`],
  createOrchestratorRuntimeAdmissionMiddleware(),
);
app.use(BASE_PATH, ingestRouter);
app.use(BASE_PATH, indexOpsRouter);
app.use(BASE_PATH, evalsRouter);
app.use(BASE_PATH, openaiCompatRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(((
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ error: message }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error', detail: message });
}) as ErrorRequestHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT, basePath: BASE_PATH }, 'Alloy Embedding Fabric API started');
});

export default app;
