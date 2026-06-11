/**
 * SZL Holdings — TypeScript OpenTelemetry SDK bootstrap (OpenTelemetry JS 2.x)
 *
 * Usage: import this module as the FIRST statement in your service entrypoint.
 *   import "./otel-init.js"; // must run before any other import
 *
 * Copy this file into your service as `src/otel-init.ts` or reference via
 * the golden-path template which scaffolds it automatically.
 *
 * Environment variables expected (see .env.example):
 *   OTEL_SERVICE_NAME       — required; matches package.json "name"
 *   OTEL_SERVICE_VERSION    — required; matches package.json "version"
 *   OTEL_EXPORTER_OTLP_ENDPOINT — defaults to http://localhost:4318 in dev
 *   DEPLOYMENT_ENV          — development | staging | production
 *   OTEL_TRACES_SAMPLER     — parentbased_traceidratio (default), always_on, always_off
 *   OTEL_TRACES_SAMPLER_ARG — sampling ratio (0.0–1.0); default 1.0 in dev, 0.1 in prod
 */

import type { IncomingMessage } from "node:http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  W3CTraceContextPropagator,
  CompositePropagator,
  W3CBaggagePropagator,
} from "@opentelemetry/core";
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "szl-unknown-service";
const serviceVersion = process.env.OTEL_SERVICE_VERSION ?? "0.0.0";
const deploymentEnv = process.env.DEPLOYMENT_ENV ?? "development";
// OTLP/HTTP default port is 4318 (gRPC is 4317).
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

// Sampling: 100% in dev/staging, 10% in production (configurable)
const samplerArg =
  process.env.OTEL_TRACES_SAMPLER_ARG !== undefined
    ? parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG)
    : deploymentEnv === "production"
      ? 0.1
      : 1.0;

// OTel JS 2.x: Resource is constructed via factory functions, not `new Resource()`.
const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    "deployment.environment.name": deploymentEnv,
    "szl.platform": "szl-holdings",
  }),
);

const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
});

const metricExporter =
  deploymentEnv === "development"
    ? new ConsoleMetricExporter()
    : new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` });

const logExporter = new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` });

const sdk = new NodeSDK({
  resource,
  traceExporter,
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(samplerArg),
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 30_000,
  }),
  logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        // Suppress health probe noise
        ignoreIncomingRequestHook: (req: IncomingMessage) => {
          const url = req.url ?? "";
          return url === "/health" || url === "/ready" || url === "/metrics";
        },
      },
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-pg": { enabled: true },
      "@opentelemetry/instrumentation-ioredis": { enabled: true },
      "@opentelemetry/instrumentation-fs": { enabled: false }, // too noisy
    }),
  ],
  textMapPropagator: new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
    ],
  }),
});

sdk.start();

process.on("SIGTERM", async () => {
  await sdk.shutdown();
  process.exit(0);
});

export {};
