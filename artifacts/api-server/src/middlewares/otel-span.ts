import type { Request, Response, NextFunction } from "express";
import * as api from "@opentelemetry/api";

const SKIP_PREFIXES = ["/health", "/api/health", "/api/apm", "/api/traces", "/favicon"];

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some((p) => path.startsWith(p));
}

const SZL_CORRELATION_HEADER = "x-szl-correlation-id";
const W3C_TRACEPARENT_HEADER = "traceparent";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_ID_RE = /\/\d+(?=\/|$)/g;
const SHORT_HEX_RE = /\/[0-9a-f]{12,}(?=\/|$)/gi;

function normalizePath(rawPath: string): string {
  return rawPath
    .replace(UUID_RE, ":id")
    .replace(NUMERIC_ID_RE, "/:id")
    .replace(SHORT_HEX_RE, "/:id");
}

const httpHeaderGetter: api.TextMapGetter<Record<string, string | string[] | undefined>> = {
  get(carrier, key) {
    const val = carrier[key.toLowerCase()];
    return Array.isArray(val) ? val[0] : val;
  },
  keys(carrier) {
    return Object.keys(carrier);
  },
};

export function otelSpanMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (shouldSkip(req.path)) {
    next();
    return;
  }

  const correlationId = (req as Request & { correlationId?: string }).correlationId;
  const requestId = (req as Request & { requestId?: string }).requestId;

  const parentCtx = api.propagation.extract(
    api.context.active(),
    req.headers as Record<string, string | string[] | undefined>,
    httpHeaderGetter,
  );

  const normalizedPath = normalizePath(req.path);
  const spanName = `HTTP ${req.method} ${normalizedPath}`;

  const nativeTracer = api.trace.getTracer("szl-api-server");
  const span = nativeTracer.startSpan(spanName, {
    kind: api.SpanKind.SERVER,
    attributes: {
      "http.method": req.method,
      "http.url": req.originalUrl,
      "http.route": normalizedPath,
      "http.user_agent": req.headers["user-agent"] ?? "",
      ...(correlationId ? { "szl.correlation.id": correlationId } : {}),
      ...(requestId ? { "szl.request.id": requestId } : {}),
      "szl.environment": process.env.NODE_ENV ?? "development",
    },
  }, parentCtx);

  const activeCtx = api.trace.setSpan(parentCtx, span);

  const spanCtx = span.spanContext();
  const traceParentOut = `00-${spanCtx.traceId}-${spanCtx.spanId}-${spanCtx.traceFlags.toString(16).padStart(2, "0")}`;
  res.setHeader(W3C_TRACEPARENT_HEADER, traceParentOut);

  const correlationHeaderOut = correlationId ?? `${spanCtx.traceId.slice(0, 8)}-${spanCtx.spanId}`;
  res.setHeader(SZL_CORRELATION_HEADER, correlationHeaderOut);

  const startMs = Date.now();

  const wrapped = api.context.bind(activeCtx, next);
  res.on("finish", () => {
    const durationMs = Date.now() - startMs;

    const routeTemplate = (req as Request & { route?: { path?: string } }).route?.path;
    if (routeTemplate) {
      span.setAttributes({ "http.route": routeTemplate });
    }

    span.setAttributes({
      "http.status_code": res.statusCode,
      "http.response_time_ms": durationMs,
    });

    if (res.statusCode >= 400) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: `HTTP ${res.statusCode}` });
    } else {
      span.setStatus({ code: api.SpanStatusCode.OK });
    }

    span.end();
  });

  wrapped();
}
