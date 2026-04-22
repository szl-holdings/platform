import { defaultTraceStore, TraceWriter } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const writer = new TraceWriter(defaultTraceStore);

const SKIP_PREFIXES = ['/health', '/api/health', '/api/apm', '/api/traces'];

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some((p) => path.startsWith(p));
}

export function traceEmitMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (shouldSkip(req.path)) {
    next();
    return;
  }

  const traceId = randomUUID();
  const requestId = (req as Request & { requestId?: string }).requestId ?? randomUUID();
  const correlationId = (req as Request & { correlationId?: string }).correlationId;
  const start = process.hrtime.bigint();

  (req as Request & { _traceId?: string })._traceId = traceId;

  try {
    writer.startTrace({
      traceId,
      requestId,
      sessionId: correlationId,
      metadata: {
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        domain: req.path.split('/')[2] ?? 'api',
      },
    });
  } catch {}

  res.on('finish', () => {
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
    try {
      writer.completeTrace(traceId, {
        status: res.statusCode >= 500 ? 'failed' : 'completed',
        latencyMs,
      });
      if (res.statusCode >= 400) {
        writer.recordError(
          traceId,
          `HTTP_${res.statusCode}`,
          `Request to ${req.method} ${req.path} returned ${res.statusCode}`,
        );
      }
    } catch {}
  });

  next();
}
