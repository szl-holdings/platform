/**
 * AEF Ingestion Orchestrator — Standalone Server
 *
 * Starts the orchestrator as an independent HTTP service. In the monorepo, the
 * orchestrator router is also mounted into the API gateway via createOrchestratorRouter.
 *
 * OpenTelemetry is initialized before the router is mounted so every request
 * emits an env-driven OTLP span (src/otel.ts); a dependency-free structured
 * access log is emitted on response finish (src/logger.ts). Exposed as an async
 * createApp() factory so tests can boot the same instrumented app.
 */

import cors from 'cors';
import express, { type Express } from 'express';
import { logger, requestLogger } from './logger.js';
import {
  initOrchestratorOtel,
  otelRequestSpanMiddleware,
  shutdownOrchestratorOtel,
} from './otel.js';
import { createOrchestratorRouter } from './router.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3003;

/**
 * Build the Express app with OTEL instrumentation and structured logging wired
 * in. The span middleware runs before the access log so the request id it sets
 * on the response is available to the logger for correlation.
 */
export async function createApp(): Promise<Express> {
  await initOrchestratorOtel();

  const app: Express = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(otelRequestSpanMiddleware());
  app.use(requestLogger);

  app.use('/orchestrator', createOrchestratorRouter());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'alloy-ingestion-orchestrator' });
  });

  // Standard Kubernetes probe aliases.
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/readyz', (_req, res) => {
    res.status(200).json({ ready: true });
  });

  return app;
}

async function main(): Promise<void> {
  const app = await createApp();
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, service: 'alloy-ingestion-orchestrator' }, 'listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => {
      void shutdownOrchestratorOtel().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start listening when run directly, but not when imported by tests.
if (process.env.NODE_ENV !== 'test') {
  void main();
}
