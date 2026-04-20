import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import {
  CORRELATION_HEADER,
  REQUEST_ID_HEADER,
  TRACE_PARENT_HEADER,
  TENANT_ID_HEADER,
  WORKFLOW_ID_HEADER,
  SESSION_ID_HEADER,
  extractCorrelationId,
} from "../correlation/index.js";
import { runWithContext } from "../context/index.js";
import { getEnv } from "@szl-holdings/env";

export interface OtelMiddlewareOptions {
  recordSpans?: boolean;
  spanNameFn?: (req: Request) => string;
}

export function createCorrelationMiddleware() {
  return function correlationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const correlationId = extractCorrelationId(
      req.headers as Record<string, string | undefined>,
    );
    const requestId = randomUUID();
    const traceParent = req.headers[TRACE_PARENT_HEADER] as string | undefined;
    const tenantId = req.headers[TENANT_ID_HEADER] as string | undefined;
    const workflowId = req.headers[WORKFLOW_ID_HEADER] as string | undefined;
    const sessionId = req.headers[SESSION_ID_HEADER] as string | undefined;

    res.setHeader(CORRELATION_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, requestId);
    if (traceParent) res.setHeader(TRACE_PARENT_HEADER, traceParent);

    runWithContext(
      { correlationId, requestId, traceParent, tenantId, workflowId, sessionId },
      next,
    );
  };
}

export function createOtelSpanMiddleware(options: OtelMiddlewareOptions = {}) {
  const { spanNameFn } = options;

  return function otelSpanMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const start = process.hrtime.bigint();
    const spanName = spanNameFn
      ? spanNameFn(req)
      : `http.${req.method.toLowerCase()}.${req.path.replace(/\/\d+/g, "/:id")}`;

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

      if (getEnv().OTEL_CONSOLE_EXPORT) {
        console.info(
          JSON.stringify({
            span: spanName,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Math.round(durationMs),
            correlationId: res.getHeader(CORRELATION_HEADER),
          }),
        );
      }
    });

    next();
  };
}

export function createInstrumentationMiddleware(options: OtelMiddlewareOptions = {}) {
  const correlationFn = createCorrelationMiddleware();
  const spanFn = createOtelSpanMiddleware(options);

  return function instrumentationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    correlationFn(req, res, () => {
      spanFn(req, res, next);
    });
  };
}
