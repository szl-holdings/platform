/**
 * Production Observability Configuration
 *
 * This module is the canonical entry point for all production observability
 * concerns: OpenTelemetry distributed tracing, Sentry error tracking, and
 * health endpoint exposure for external uptime monitors.
 *
 * Environment variables (set in production via Azure Key Vault / Replit Secrets):
 *
 * OpenTelemetry:
 *   OTEL_EXPORTER_OTLP_ENDPOINT      OTLP/gRPC or OTLP/HTTP endpoint URL
 *                                     e.g. https://otel.example.com:4317
 *   OTLP_ENDPOINT                     Alias for OTEL_EXPORTER_OTLP_ENDPOINT
 *   OTEL_SERVICE_NAME                 Service name tag (default: "szl-api")
 *   OTEL_CONSOLE_EXPORT               "true" to log spans to stdout (dev/debug)
 *   AZURE_APP_INSIGHTS_CONNECTION_STRING  Azure Application Insights export
 *   NEW_RELIC_LICENSE_KEY             New Relic OTLP export
 *
 * Sentry:
 *   SENTRY_DSN                        Sentry DSN for the szl-api project
 *   SENTRY_TRACES_SAMPLE_RATE         Trace sample rate 0–1 (default: 0.1)
 *   SENTRY_PROFILES_SAMPLE_RATE       Profile sample rate 0–1 (default: 0.1)
 *
 * Uptime Monitoring:
 *   Public health endpoint: GET /api/health
 *   Configure your external monitor (Betterstack, UptimeRobot, Datadog Synthetics,
 *   etc.) to poll GET /api/health every 60 seconds. The endpoint returns:
 *     200 { "status": "healthy" }  — all systems nominal
 *     503 { "status": "degraded" } — database unreachable
 *
 *   Recommended alert routing:
 *     - SEV1 pages: 2 consecutive failures (2-min window)
 *     - Notify: on-call engineer + stephen@szlholdings.com
 *     - Status page update: automatic via Betterstack / Instatus webhook
 */

import { logger } from "./logger";
import { initializeOpenTelemetry, getOtelConfig, isOtelInitialized } from "@szl-holdings/observability";
import { initServerSentry } from "./sentry";

export interface ObservabilityStatus {
  sentry: {
    enabled: boolean;
    dsn?: string;
  };
  otel: {
    initialized: boolean;
    serviceName: string;
    otlpEndpoint?: string;
    azureMonitor: boolean;
    newRelic: boolean;
    consoleExport: boolean;
  };
  uptime: {
    healthEndpoint: string;
    monitorConfigured: boolean;
  };
}

let bootstrapped = false;

/**
 * Bootstrap all production observability systems.
 *
 * Called once at server startup before any request handling begins.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function bootstrapObservability(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  initServerSentry();

  await initializeOpenTelemetry({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "szl-api",
    serviceVersion: process.env.npm_package_version ?? "1.0.0",
    otlpEndpoint: process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    exportToAzureMonitor: !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
    exportToNewRelic: !!process.env.NEW_RELIC_LICENSE_KEY,
    exportToConsole: process.env.OTEL_CONSOLE_EXPORT === "true",
  }).catch(err => {
    logger.warn({ err }, "[observability] OpenTelemetry initialization failed — continuing without OTel");
  });

  logObservabilityStatus();
}

/**
 * Return the current observability configuration status.
 * Used by /api/health/detailed and the startup log.
 */
export function getObservabilityStatus(): ObservabilityStatus {
  const otelCfg = getOtelConfig();
  const sentryDsn = process.env.SENTRY_DSN;
  const isProduction = process.env.NODE_ENV === "production";

  const healthHost = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : `http://localhost:${process.env.PORT ?? "3000"}`;

  return {
    sentry: {
      enabled: !!sentryDsn,
      dsn: sentryDsn ? sentryDsn.replace(/\/[^/]+$/, "/***") : undefined,
    },
    otel: {
      initialized: isOtelInitialized(),
      serviceName: otelCfg.serviceName,
      otlpEndpoint: otelCfg.otlpEndpoint,
      azureMonitor: otelCfg.azureMonitor,
      newRelic: otelCfg.newRelic,
      consoleExport: process.env.OTEL_CONSOLE_EXPORT === "true",
    },
    uptime: {
      healthEndpoint: `${healthHost}/api/health`,
      monitorConfigured: !!process.env.UPTIME_MONITOR_ID || isProduction,
    },
  };
}

/**
 * Validate that all required observability systems are configured for production.
 * Returns a list of warnings — callers may choose to log or fail-fast.
 */
export function validateProductionObservability(): string[] {
  const warnings: string[] = [];

  if (!process.env.SENTRY_DSN) {
    warnings.push("SENTRY_DSN is not set — error tracking is disabled in production");
  }

  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && !process.env.OTLP_ENDPOINT && !process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING) {
    warnings.push(
      "No OTEL exporter configured — set OTEL_EXPORTER_OTLP_ENDPOINT (or AZURE_APP_INSIGHTS_CONNECTION_STRING for Azure) to enable distributed tracing"
    );
  }

  return warnings;
}

function logObservabilityStatus(): void {
  const status = getObservabilityStatus();
  const isProduction = process.env.NODE_ENV === "production";

  logger.info({
    sentry: status.sentry.enabled ? "enabled" : "disabled (SENTRY_DSN not set)",
    otel: status.otel.initialized
      ? `enabled — endpoint=${status.otel.otlpEndpoint ?? "console-only"}`
      : "disabled",
    azureMonitor: status.otel.azureMonitor ? "enabled" : "disabled",
    newRelic: status.otel.newRelic ? "enabled" : "disabled",
    uptimeEndpoint: status.uptime.healthEndpoint,
  }, "[observability] Production observability status");

  if (isProduction) {
    const warnings = validateProductionObservability();
    for (const w of warnings) {
      logger.warn({ warning: w }, "[observability] Production observability gap");
    }
  }
}
