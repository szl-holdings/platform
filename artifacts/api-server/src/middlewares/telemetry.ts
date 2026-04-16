import type { Request, Response, NextFunction } from "express";
import { serverTelemetry, getTracer } from "@szl-holdings/observability";

const INSTRUMENTED_PREFIXES = [
  "/alloy/",
  "/signals",
  "/lyte/",
  "/vessels",
  "/connectors",
  "/terra",
  "/auth",
  "/users",
  "/services",
  "/graphql",
  "/organizations",
  "/apm",
];

function isInstrumented(path: string): boolean {
  return INSTRUMENTED_PREFIXES.some(p => path.startsWith(p));
}

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const instrumented = isInstrumented(req.path);
  const serStart = { current: 0n };

  if (instrumented) {
    const origJson = res.json.bind(res);
    res.json = function(body: unknown) {
      const s = process.hrtime.bigint();
      const result = origJson(body);
      serStart.current = process.hrtime.bigint() - s;
      return result;
    };
  }

  res.on("finish", () => {
    const totalMs = Number(process.hrtime.bigint() - start) / 1e6;
    const serializationMs = Number(serStart.current) / 1e6;
    const apmReq = req as Request & { _apmDbMs?: number; _apmExtMs?: number };
    const dbQueryMs = apmReq._apmDbMs ?? 0;
    const externalApiMs = apmReq._apmExtMs ?? 0;

    serverTelemetry.recordRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: totalMs,
      timestamp: Date.now(),
      requestId: req.correlationId,
      correlationId: req.correlationId,
    });

    if (instrumented) {
      serverTelemetry.recordApmSpan({
        route: req.path,
        method: req.method,
        statusCode: res.statusCode,
        totalMs,
        dbQueryMs,
        externalApiMs,
        serializationMs,
        timestamp: Date.now(),
        requestId: req.correlationId,
        correlationId: req.correlationId,
      });

      const tracer = getTracer();
      tracer.startSpan(`http.${req.method.toLowerCase()}.${req.path.replace(/\/\d+/g, "/:id")}`, {
        "http.method": req.method,
        "http.route": req.path,
        "http.status_code": res.statusCode,
        "duration_ms": Math.round(totalMs),
        "db_query_ms": Math.round(dbQueryMs),
        "external_api_ms": Math.round(externalApiMs),
        "serialization_ms": Math.round(serializationMs),
      }).end();
    }
  });

  next();
}

export function recordDbTime(req: Request, durationMs: number, query?: string): void {
  const apmReq = req as Request & { _apmDbMs?: number };
  apmReq._apmDbMs = (apmReq._apmDbMs ?? 0) + durationMs;
  serverTelemetry.recordDbQuery({ durationMs, query, timestamp: Date.now() });
}

export function recordExternalTime(req: Request, provider: string, durationMs: number): void {
  const apmReq = req as Request & { _apmExtMs?: number };
  apmReq._apmExtMs = (apmReq._apmExtMs ?? 0) + durationMs;
  serverTelemetry.recordExternalCall({ provider, durationMs, timestamp: Date.now() });
}

export async function withDbSpan<T>(req: Request, fn: () => Promise<T>, query?: string): Promise<T> {
  const tracer = getTracer();
  return tracer.withSpan(`db.query ${query ?? req.path}`, async (span) => {
    const start = process.hrtime.bigint();
    try {
      const result = await fn();
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      span.setAttributes({ "db.duration_ms": Math.round(durationMs), "db.query": query ?? req.path });
      recordDbTime(req, durationMs, query);
      return result;
    } catch (err) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      recordDbTime(req, durationMs, query);
      throw err;
    }
  });
}

export async function withExternalSpan<T>(req: Request, provider: string, fn: () => Promise<T>): Promise<T> {
  const tracer = getTracer();
  return tracer.withSpan(`external.${provider}`, async (span) => {
    const start = process.hrtime.bigint();
    try {
      const result = await fn();
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      span.setAttributes({ "external.provider": provider, "external.duration_ms": Math.round(durationMs) });
      recordExternalTime(req, provider, durationMs);
      return result;
    } catch (err) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      recordExternalTime(req, provider, durationMs);
      throw err;
    }
  });
}
