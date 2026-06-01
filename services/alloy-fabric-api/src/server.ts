import express from 'express';
import { seedBootData } from './context.js';
import { bearerAuthMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { tenantScopingMiddleware } from './middleware/tenant.js';
import { registerDocsRoute } from './routes/docs.js';
import { registerEmbedRoute } from './routes/embed.js';
import { registerEvalsRoute } from './routes/evals.js';
import { registerHealthRoute } from './routes/health.js';
import { registerIndexOpsRoutes } from './routes/index-ops.js';
import { registerIngestRoute } from './routes/ingest.js';
import { metricsInstrumentationMiddleware, registerMetricsRoute } from './routes/metrics.js';
import { registerOpenAICompatRoute } from './routes/openai-compat.js';
import { registerRerankRoute } from './routes/rerank.js';
import { registerSearchRoute } from './routes/search.js';

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(requestIdMiddleware);
app.use(metricsInstrumentationMiddleware());

registerHealthRoute(app);
registerMetricsRoute(app);
registerDocsRoute(app);

const v1 = express.Router();
v1.use(bearerAuthMiddleware);
v1.use(rateLimitMiddleware);
v1.use(tenantScopingMiddleware);

registerEmbedRoute(v1);
registerRerankRoute(v1);
registerSearchRoute(v1);
registerIngestRoute(v1);
registerIndexOpsRoutes(v1);
registerEvalsRoute(v1);
registerOpenAICompatRoute(v1);

app.use(v1);

app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred. Check server logs.',
  });
});

const PORT = Number(process.env.PORT ?? 4200);

// Seed boot data (smoke/dev tenants) before accepting traffic
seedBootData()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
    });
  })
  .catch((_err: Error) => {
    app.listen(PORT, '0.0.0.0', () => {
    });
  });

export default app;
