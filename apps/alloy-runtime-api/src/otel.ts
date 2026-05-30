/**
 * AEEP Alloy Runtime API — OpenTelemetry bootstrap (P1-A / KG009)
 *
 * Wires the canonical @szl-holdings/observability OTLP exporter into the API.
 * All backend selection is environment-driven so the same build can target
 * Grafana Cloud OR Azure Monitor (or any OTLP collector) at deploy time:
 *
 *   OTEL_SERVICE_NAME            — logical service name on emitted spans
 *   OTEL_EXPORTER_OTLP_ENDPOINT  — collector base URL (…/v1/traces appended)
 *   OTEL_EXPORTER_OTLP_HEADERS   — comma-separated key=value auth headers
 *                                  (e.g. Grafana Cloud "Authorization=Basic …"
 *                                   or an Azure Monitor ingestion key)
 *   OTEL_RESOURCE_ATTRIBUTES     — comma-separated key=value resource tags
 *
 * When no endpoint is configured the SDK still initializes with an in-memory
 * exporter in non-production, which the integration test asserts against.
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
 * Initialize the OpenTelemetry SDK from environment configuration.
 * Idempotent: a second call is a no-op. Returns the resolved exporter config.
 */
export async function initApiServerOtel(): Promise<ReturnType<typeof getOtelConfig>> {
  const env = parseEnv();
  if (!isOtelInitialized()) {
    await initializeOpenTelemetry({
      serviceName: env.OTEL_SERVICE_NAME,
      ...(env.BUILD_VERSION ? { serviceVersion: env.BUILD_VERSION } : {}),
      ...(env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.OTLP_ENDPOINT
        ? { otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.OTLP_ENDPOINT }
        : {}),
      // Headers (auth) are read from OTEL_EXPORTER_OTLP_HEADERS inside the SDK;
      // passing the parsed env value here keeps that single source of truth.
      ...(env.OTEL_EXPORTER_OTLP_HEADERS
        ? { otlpHeaders: env.OTEL_EXPORTER_OTLP_HEADERS }
        : {}),
    });
  }
  return getOtelConfig();
}

/**
 * Per-request span middleware. Emits one HTTP server span per request with the
 * route template, method, status code, and a generated request id. Ends the
 * span on response `finish` so latency and status are captured.
 */
export function otelRequestSpanMiddleware() {
  return function otelSpan(req: Request, res: Response, next: NextFunction): void {
    if (!isOtelInitialized()) {
      next();
      return;
    }
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    res.setHeader('x-request-id', requestId);
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
export async function shutdownApiServerOtel(): Promise<void> {
  await shutdownTracer();
}
