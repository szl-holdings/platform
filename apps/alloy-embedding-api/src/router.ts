import { Router, type RequestHandler, type IRouter } from 'express';
import { createOrchestratorRouter } from '@workspace/alloy-ingestion-orchestrator';
import { conditionalAuth } from './middleware/auth.js';
import { requestLogger } from './middleware/logger.js';
import { metricsHandler, metricsMiddleware } from './middleware/prometheus.js';
import { globalRateLimit, perTenantRateLimit } from './middleware/rate-limit.js';
import { tenantScoping } from './middleware/tenant.js';
import { requestTracing } from './middleware/tracing.js';
import { openApiSpec } from './openapi/spec.js';
import { embedRouter } from './routes/embed.js';
import { evalsRouter } from './routes/evals.js';
import { hybridSearchRouter } from './routes/hybrid-search.js';
import { indexOpsRouter } from './routes/index-ops.js';
import { ingestRouter } from './routes/ingest.js';
import { multimodalEmbedRouter } from './routes/multimodal-embed.js';
import { openaiCompatRouter } from './routes/openai-compat.js';
import { rerankRouter } from './routes/rerank.js';

export function createAefRouter(): IRouter {
  const router: IRouter = Router();

  router.use(requestTracing as RequestHandler);
  router.use(metricsMiddleware as RequestHandler);
  router.use(requestLogger as RequestHandler);
  router.use(globalRateLimit as RequestHandler);

  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'alloy-embedding-api',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
    });
  });
  router.get('/metrics', metricsHandler as unknown as RequestHandler);
  router.get('/docs', (_req, res) => res.status(200).json(openApiSpec));

  router.use(conditionalAuth as RequestHandler);
  router.use(tenantScoping as RequestHandler);
  router.use(perTenantRateLimit as RequestHandler);

  router.use('/', embedRouter as unknown as RequestHandler);
  router.use('/', rerankRouter as unknown as RequestHandler);
  router.use('/', hybridSearchRouter as unknown as RequestHandler);
  router.use('/', multimodalEmbedRouter as unknown as RequestHandler);
  router.use('/', ingestRouter as unknown as RequestHandler);
  router.use('/', indexOpsRouter as unknown as RequestHandler);
  router.use('/', evalsRouter as unknown as RequestHandler);
  router.use('/', openaiCompatRouter as unknown as RequestHandler);
  router.use('/orchestrator', createOrchestratorRouter() as unknown as RequestHandler);

  return router;
}
