import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from '../lib/request-context';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      requestId?: string;
    }
  }
}

const SZL_CORRELATION_HEADER = 'x-szl-correlation-id';
const LEGACY_CORRELATION_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';
const TRACE_PARENT_HEADER = 'traceparent';

const VALID_ID_PATTERN = /^[\w\-.:]{1,128}$/;

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const inboundRequestId = req.headers[REQUEST_ID_HEADER] as string | undefined;

  const inboundSzlCorrelationId = req.headers[SZL_CORRELATION_HEADER] as string | undefined;
  const inboundLegacyCorrelationId = req.headers[LEGACY_CORRELATION_HEADER] as string | undefined;
  const traceParent = req.headers[TRACE_PARENT_HEADER] as string | undefined;

  const inboundCorrelation =
    inboundSzlCorrelationId || inboundLegacyCorrelationId || inboundRequestId;
  const correlationId =
    inboundCorrelation && VALID_ID_PATTERN.test(inboundCorrelation)
      ? inboundCorrelation
      : randomUUID();
  const requestId = randomUUID();

  req.correlationId = correlationId;
  req.requestId = requestId;

  res.setHeader(SZL_CORRELATION_HEADER, correlationId);
  res.setHeader(LEGACY_CORRELATION_HEADER, correlationId);
  res.setHeader(REQUEST_ID_HEADER, requestId);

  if (traceParent) {
    res.setHeader(TRACE_PARENT_HEADER, traceParent);
  }

  runWithRequestContext({ correlationId, requestId, traceParent }, next);
}
