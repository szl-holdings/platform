/**
 * Cognitive Telemetry Bootstrap
 *
 * Wires the cognitive-observability BatchingExporter to the globalCollector so
 * that agent-layer metrics (latency, cost, error rates, approval wait times,
 * step traces, etc.) are flushed to the configured OTEL Collector endpoint on a
 * periodic basis rather than accumulating in memory until process exit.
 *
 * Call `initCognitiveTelemetry()` once at server startup, before the HTTP
 * server begins accepting requests. The exporter honours the same
 * OTLP_ENDPOINT / OTEL_EXPORTER_OTLP_ENDPOINT environment variables already
 * checked by the rest of the OTEL stack, and falls back to console output when
 * no endpoint is configured (useful in development).
 *
 * The returned `shutdown` function drains the buffer and flushes any remaining
 * metrics — wire it into the SIGTERM handler to prevent data loss on graceful
 * shutdown.
 */

import {
  BatchingExporter,
  ConsoleOtelExporter,
  HttpOtelExporter,
  globalCollector,
  type OtelResourceAttributes,
} from '@workspace/cognitive-observability';
import { logger } from './logger.js';

let _started = false;
let _exporter: BatchingExporter | null = null;

const SERVICE_RESOURCE: OtelResourceAttributes = {
  'service.name': 'szl-api-server',
  'service.version': process.env.npm_package_version ?? '0.0.0',
  'deployment.environment': process.env.NODE_ENV ?? 'development',
};

/**
 * Start the cognitive observability export pipeline.
 *
 * @param flushIntervalMs - How often to flush metrics (default: 60 s).
 *   Reduce to 15 s in staging for faster dashboard refresh; keep at 60 s in
 *   production to avoid excessive OTEL Collector traffic.
 */
export function initCognitiveTelemetry(flushIntervalMs = 60_000): { shutdown: () => Promise<void> } {
  if (_started) {
    logger.warn('[cognitive-telemetry] initCognitiveTelemetry() called more than once — ignoring');
    return { shutdown: async () => {} };
  }
  _started = true;

  const endpoint =
    process.env.OTLP_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    process.env.OTEL_COGNITIVE_ENDPOINT;

  const inner = endpoint
    ? new HttpOtelExporter({ endpoint, resource: SERVICE_RESOURCE })
    : new ConsoleOtelExporter({ resource: SERVICE_RESOURCE });

  _exporter = new BatchingExporter(inner, globalCollector, flushIntervalMs);
  _exporter.start();

  logger.info(
    { endpoint: endpoint ?? 'console', flushIntervalMs },
    '[cognitive-telemetry] Cognitive observability pipeline started — agent metrics will be exported',
  );

  return {
    shutdown: async () => {
      if (_exporter) {
        await _exporter.shutdown();
        _exporter = null;
        _started = false;
        logger.info('[cognitive-telemetry] Cognitive observability pipeline shut down');
      }
    },
  };
}
