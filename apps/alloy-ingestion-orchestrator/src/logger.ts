/**
 * AEF Ingestion Orchestrator — Structured Logging
 *
 * Dependency-free structured JSON logger writing one line per event to stdout,
 * matching the convention used by the sibling apps/alloy-embedding-api service
 * (NDJSON, `timestamp`/`level`/`service` envelope). Keeping this dependency-free
 * avoids adding a logging runtime to a control-plane service whose other
 * runtime dependencies are limited to express and cors.
 *
 * Level is gated by LOG_LEVEL (trace<debug<info<warn<error<fatal), defaulting
 * to "info" to match the platform env schema (packages/env LOG_LEVEL).
 */
import type { NextFunction, Request, Response } from 'express';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface StructuredLogger {
  trace(data: Record<string, unknown>, msg?: string): void;
  debug(data: Record<string, unknown>, msg?: string): void;
  info(data: Record<string, unknown>, msg?: string): void;
  warn(data: Record<string, unknown>, msg?: string): void;
  error(data: Record<string, unknown>, msg?: string): void;
  fatal(data: Record<string, unknown>, msg?: string): void;
}

const SERVICE = 'alloy-ingestion-orchestrator';

const LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

function resolveThreshold(): number {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return LEVEL_ORDER[raw as LogLevel] ?? LEVEL_ORDER.info;
}

function emit(level: LogLevel, data: Record<string, unknown>, msg?: string): void {
  if (LEVEL_ORDER[level] < resolveThreshold()) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE,
    ...data,
    ...(msg ? { msg } : {}),
  };
  const stream = LEVEL_ORDER[level] >= LEVEL_ORDER.error ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(entry)}\n`);
}

export const logger: StructuredLogger = {
  trace: (data, msg) => emit('trace', data, msg),
  debug: (data, msg) => emit('debug', data, msg),
  info: (data, msg) => emit('info', data, msg),
  warn: (data, msg) => emit('warn', data, msg),
  error: (data, msg) => emit('error', data, msg),
  fatal: (data, msg) => emit('fatal', data, msg),
};

/**
 * Per-request access log. Reads the x-request-id header (set by the OTEL span
 * middleware when present, otherwise falls back to "unknown") and logs method,
 * path, status, and latency on response `finish`. Health/readiness probes are
 * logged at debug so they don't flood info-level logs.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const requestId = (res.getHeader('x-request-id') as string | undefined) ?? 'unknown';
    const isProbe = req.path === '/healthz' || req.path === '/readyz' || req.path === '/health';
    const line = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs: Date.now() - start,
    };
    if (isProbe) {
      logger.debug(line, 'request');
    } else {
      logger.info(line, 'request');
    }
  });
  next();
}
