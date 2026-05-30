/**
 * AEEP Alloy Runtime API — Server Entry Point
 *
 * Unified v1 API surface for task planning, memory fabric,
 * and governed workflow execution.
 *
 * OpenTelemetry is initialized before the router is mounted (P1-A / KG009) so
 * every request emits a span via the env-driven OTLP exporter.
 */
import express, { type Express } from 'express';
import { createRouter } from './router.js';
import {
  initApiServerOtel,
  otelRequestSpanMiddleware,
  shutdownApiServerOtel,
} from './otel.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4010;

/**
 * Build the Express app with OTEL instrumentation wired in. Exported as an
 * async factory so tests can boot the same instrumented app the server uses.
 */
export async function createApp(): Promise<Express> {
  await initApiServerOtel();

  const app: Express = express();
  app.use(express.json({ limit: '4mb' }));
  app.use(otelRequestSpanMiddleware());
  app.use(createRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

async function main(): Promise<void> {
  const app = await createApp();
  const server = app.listen(PORT, () => {});

  const shutdown = async () => {
    server.close();
    await shutdownApiServerOtel();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Only start listening when run directly, not when imported by tests.
if (process.env.NODE_ENV !== 'test') {
  void main();
}
