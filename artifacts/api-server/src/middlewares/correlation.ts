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

const VALID_ID_PATTERN = /^[\w\-.:]{1,128}$/;

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const inbound = req.headers[CORRELATION_HEADER] as string | undefined;
  const correlationId = inbound && VALID_ID_PATTERN.test(inbound) ? inbound : randomUUID();
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);
  next();
}
