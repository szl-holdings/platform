import cors from 'cors';
import express from 'express';
import { conditionalAuth } from './middleware/auth.js';
import { logger, requestLogger } from './middleware/logger.js';
import { metricsHandler, metricsMiddleware } from './middleware/prometheus.js';
import { perTenantRateLimit } from './middleware/rate-limit.js';
import { tenantScoping } from './middleware/tenant.js';
import { requestTracing } from './middleware/tracing.js';
import { openApiSpec } from './openapi/spec.js';
import { embedRouter } from './routes/embed.js';
import { evalsRouter } from './routes/evals.js';
import { healthRouter } from './routes/health.js';
import { hybridSearchRouter } from './routes/hybrid-search.js';
import { indexOpsRouter } from './routes/index-ops.js';
import { ingestRouter } from './routes/ingest.js';
import { openaiCompatRouter } from './routes/openai-compat.js';
import { rerankRouter } from './routes/rerank.js';

const PORT = Number(process.env['PORT'] ?? 8766);
const BASE_PATH = process.env['BASE_PATH'] ?? '/alloy-embedding-api';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.use(requestTracing);
app.use(metricsMiddleware);
app.use(requestLogger);

app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'alloy-embedding-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});
app.get(`${BASE_PATH}/metrics`, metricsHandler);
app.get(`${BASE_PATH}/docs`, (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use(conditionalAuth);
app.use(tenantScoping);
app.use(perTenantRateLimit);

app.use(BASE_PATH, healthRouter);
app.use(BASE_PATH, embedRouter);
app.use(BASE_PATH, rerankRouter);
app.use(BASE_PATH, hybridSearchRouter);
app.use(BASE_PATH, ingestRouter);
app.use(BASE_PATH, indexOpsRouter);
app.use(BASE_PATH, evalsRouter);
app.use(BASE_PATH, openaiCompatRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ error: message }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error', detail: message });
  },
);

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT, basePath: BASE_PATH }, 'Alloy Embedding Fabric API started');
});

export default app;
