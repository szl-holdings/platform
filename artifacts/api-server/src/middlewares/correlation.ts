import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

const CORRELATION_HEADER = "x-correlation-id";
const REQUEST_ID_HEADER = "x-request-id";

const VALID_ID_PATTERN = /^[\w\-.:]{1,128}$/;

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const inboundRequestId = req.headers[REQUEST_ID_HEADER] as string | undefined;
  const inboundCorrelationId = req.headers[CORRELATION_HEADER] as string | undefined;
  const inbound = inboundRequestId || inboundCorrelationId;
  const correlationId = inbound && VALID_ID_PATTERN.test(inbound) ? inbound : randomUUID();
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);
  res.setHeader(REQUEST_ID_HEADER, correlationId);
  next();
}
