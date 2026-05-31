/**
 * AEF Ingestion Orchestrator — OpenTelemetry bootstrap
 *
 * Wires the canonical @szl-holdings/observability OTLP exporter into the
 * orchestrator HTTP surface, following the same env-driven pattern already
 * shipped on apps/alloy-runtime-api (PR #250). Backend selection is entirely
 * environment-driven so the same build can target Grafana Cloud, Azure Monitor,
 * or any OTLP collector at deploy time without a code change:
 *
 *   OTEL_SERVICE_NAME            — logical service name on emitted spans
 *   OTEL_EXPORTER_OTLP_ENDPOINT  — collector base URL (…/v1/traces appended)
 *   OTEL_EXPORTER_OTLP_HEADERS   — comma-separated key=value auth headers
 *   OTEL_RESOURCE_ATTRIBUTES     — comma-separated key=value resource tags
 *
 * When no endpoint is configured the SDK initializes an in-memory exporter in
 * non-production, which the server test asserts against. This module wires the
 * exporter/span path; the structured access log (logger.ts) is separate.
 */
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { parseEnv } from '@szl-holdings/env';
import {
  getOtelConfig,
  getTracer,
  initializeOpenTelemetry,
  isOtelInitialized,
  shutdownTracer,
} from '@szl-holdings/observability';

/**
 * Initialize the OpenTelemetry SDK from environment configuration. Idempotent:
 * a second call is a no-op. Returns the resolved exporter config.
 */
export async function initOrchestratorOtel(): Promise<ReturnType<typeof getOtelConfig>> {
  const env = parseEnv();
  if (!isOtelInitialized()) {
    await initializeOpenTelemetry({
      serviceName: env.OTEL_SERVICE_NAME,
      ...(env.BUILD_VERSION ? { serviceVersion: env.BUILD_VERSION } : {}),
      ...(env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.OTLP_ENDPOINT
        ? { otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.OTLP_ENDPOINT }
        : {}),
      ...(env.OTEL_EXPORTER_OTLP_HEADERS
        ? { otlpHeaders: env.OTEL_EXPORTER_OTLP_HEADERS }
        : {}),
    });
  }
  return getOtelConfig();
}

/**
 * Per-request span middleware. Emits one HTTP server span per request carrying
 * the route template, method, path, status code, and a generated request id.
 * The request id is echoed on the `x-request-id` response header so the
 * structured access log (logger.ts) can correlate to the span. The span ends on
 * response `finish` so latency and final status are captured.
 */
export function otelRequestSpanMiddleware() {
  return function otelSpan(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    res.setHeader('x-request-id', requestId);

    if (!isOtelInitialized()) {
      next();
      return;
    }
    const routeTemplate = `${req.method} ${req.path.replace(/\/[0-9a-f-]{8,}/gi, '/:id')}`;
    const span = getTracer().startSpan(`http.server ${routeTemplate}`, {
      'http.request.method': req.method,
      'url.path': req.path,
      'szl.request.id': requestId,
    });
    res.on('finish', () => {
      span.setAttributes({ 'http.response.status_code': res.statusCode });
      span.setStatus(res.statusCode >= 500 ? 'error' : 'ok');
      span.end();
    });
    next();
  };
}

/** Flush and shut down the tracer provider during graceful shutdown. */
export async function shutdownOrchestratorOtel(): Promise<void> {
  await shutdownTracer();
}
