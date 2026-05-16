/**
 * Shared pino logger factory for the Temporal worker processes.
 *
 * Mirrors the api-server logger configuration so worker logs land in the
 * same structured pipeline (service / version / env base fields, log-level
 * env override, pino-pretty in development).
 *
 * Each entrypoint (start-worker, start-approval-worker, …) should create
 * its own logger via `createLogger(serviceName)` so the `service` base
 * field correctly identifies the process in the structured log stream.
 * `logger` is a default instance used by code paths that don't know which
 * entrypoint they're running under (e.g. the worker bootstrap default).
 */

import pino, { type Logger } from "pino";

const isProduction = process.env.NODE_ENV === "production";

export function createLogger(serviceName: string): Logger {
  const resolvedName = process.env.OTEL_SERVICE_NAME ?? serviceName;
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: {
      service: resolvedName,
      version: process.env.npm_package_version ?? "0.0.0",
      env: process.env.NODE_ENV ?? "development",
    },
    ...(isProduction
      ? {}
      : {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }),
  });
}

export const logger = createLogger("temporal-worker");

export type { Logger };
