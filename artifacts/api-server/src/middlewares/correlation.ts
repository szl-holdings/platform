import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { runWithRequestContext } from "../lib/request-context";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      requestId?: string;
    }
  }
}

const CORRELATION_HEADER = "x-correlation-id";
const REQUEST_ID_HEADER = "x-request-id";
const TRACE_PARENT_HEADER = "traceparent";

const VALID_ID_PATTERN = /^[\w\-.:]{1,128}$/;

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const inboundRequestId = req.headers[REQUEST_ID_HEADER] as string | undefined;
  const inboundCorrelationId = req.headers[CORRELATION_HEADER] as string | undefined;
  const traceParent = req.headers[TRACE_PARENT_HEADER] as string | undefined;

  const inbound = inboundRequestId || inboundCorrelationId;
  const correlationId = inbound && VALID_ID_PATTERN.test(inbound) ? inbound : randomUUID();
  const requestId = randomUUID();

  req.correlationId = correlationId;
  req.requestId = requestId;

  res.setHeader(CORRELATION_HEADER, correlationId);
  res.setHeader(REQUEST_ID_HEADER, requestId);

  if (traceParent) {
    res.setHeader(TRACE_PARENT_HEADER, traceParent);
  }

  runWithRequestContext({ correlationId, requestId, traceParent }, next);
}
