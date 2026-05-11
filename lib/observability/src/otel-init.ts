/**
 * SZL Holdings — TypeScript OpenTelemetry SDK bootstrap
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
 *   OTEL_EXPORTER_OTLP_ENDPOINT — defaults to http://localhost:4317 in dev
 *   DEPLOYMENT_ENV          — development | staging | production
 *   OTEL_TRACES_SAMPLER     — parentbased_traceidratio (default), always_on, always_off
 *   OTEL_TRACES_SAMPLER_ARG — sampling ratio (0.0–1.0); default 1.0 in dev, 0.1 in prod
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { Resource } from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { CompositePropagator, W3CBaggagePropagator } from "@opentelemetry/core";
import { ParentBasedSampler, TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";

const serviceName = process.env.OTEL_SERVICE_NAME ?? "szl-unknown-service";
const serviceVersion = process.env.OTEL_SERVICE_VERSION ?? "0.0.0";
const deploymentEnv = process.env.DEPLOYMENT_ENV ?? "development";
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317";

// Sampling: 100% in dev/staging, 10% in production (configurable)
const samplerArg =
  process.env.OTEL_TRACES_SAMPLER_ARG !== undefined
    ? parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG)
    : deploymentEnv === "production"
      ? 0.1
      : 1.0;

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: deploymentEnv,
    "szl.platform": "szl-holdings",
  })
);

const traceExporter = new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` });

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
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        // Suppress health probe noise
        ignoreIncomingRequestHook: (req) => {
          const url = req.url ?? "";
          return url === "/health" || url === "/ready" || url === "/metrics";
        },
      },
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-pg": { enabled: true },
      "@opentelemetry/instrumentation-ioredis": { enabled: true },
      "@opentelemetry/instrumentation-fetch": { enabled: true },
      "@opentelemetry/instrumentation-fs": { enabled: false }, // too noisy
    }),
  ],
  textMapPropagator: new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  }),
});

sdk.start();

process.on("SIGTERM", async () => {
  await sdk.shutdown();
  process.exit(0);
});

export {};
